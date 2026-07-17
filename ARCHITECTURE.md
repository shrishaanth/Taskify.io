# Taskify — Scaled Architecture

This implements the architecture diagram:

```
                 ┌──────────────────┐
                 │  Browser client  │
                 └────────┬─────────┘
            ┌─────────────┴──────────────┐
            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│ Static hosting / CDN │    │    Load balancer     │
│ Compiled frontend    │    │ nginx, sticky (ip_   │
│ build (nginx / CDN)  │    │ hash) for Socket.IO  │
└──────────────────────┘    └──────────┬───────────┘
                                       ▼
                     ┌───────────────────────────────┐
                     │  App server pool (stateless)  │
                     │  Node/Express + Socket.IO     │
                     │  api-1, api-2, ... api-N      │
                     └──────┬─────────────────┬──────┘
                            ▼                 ▼
              ┌──────────────────┐  ┌─────────────────────────┐
              │     MongoDB      │  │          Redis          │
              │ tasks / users /  │  │ socket pub-sub adapter, │
              │ activity log     │  │ cache, presence, locks  │
              └──────────────────┘  └─────────────────────────┘
```

## Why each piece exists

### Real-time sync — Socket.IO (kept, as requested)
Socket.IO stays as the real-time transport. Every task/user mutation emits
an event, so two people looking at the same board see each other's changes
instantly — no refresh:

- `task:upsert` / `task:removed` — board updates live
- `user:changed` / `user:self-changed` / `user:deleted` — directory + session updates
- `activity:new` — live activity feed entries
- `notify` — targeted toasts ("New task assigned to you")
- `presence:update` — who's online

**Authorization carries over to sockets.** A socket authenticates with the
same JWT as the REST API and joins only `user:<own id>` (+ `admins` if
admin). Events are emitted *to rooms*, never broadcast, so a Member's
browser physically never receives another member's task data.

*Considered alternative:* Server-Sent Events (SSE) would be simpler (plain
HTTP, no sticky sessions needed) and is a fine choice if the app stays
server→client only. Socket.IO was kept because it was already in the code,
gives presence/rooms for free, and supports future client→server events
(typing indicators, live cursors).

### Load balancer — nginx with `ip_hash`
Multiple identical app instances sit behind nginx. Sticky sessions
(`ip_hash`) are required because a Socket.IO handshake spans multiple HTTP
requests that must hit the same instance. Scale = add a line to the
`upstream` block (or bump compose replicas).

### The pool is only *possible* because of Redis
A socket event emitted on `api-1` must reach a user connected to `api-2`.
The `@socket.io/redis-adapter` publishes every emit through Redis pub/sub
so all instances deliver it. Redis also provides:

- **Cache** — dashboard stats cached ~10s, invalidated on every mutation
- **Presence** — shared online-users hash across instances
- **Job lock** — the hourly "due soon" reminder sweep runs on exactly ONE
  instance per tick (`SET NX` lock), not once per replica

**Everything degrades gracefully**: without `REDIS_URL` the app runs
single-instance with in-memory presence, no cache, and local sockets.

### Statelessness rules
App instances hold no session state: auth is a JWT verified per request
(with a fresh role check from Mongo, so demotions apply instantly), and all
shared state lives in Mongo or Redis. Any instance can serve any request —
that's what lets the pool scale horizontally and lets deploys drain
gracefully (SIGTERM → stop accepting → clients reconnect to healthy
instances).

### Health endpoints for the LB
- `GET /api/health` — liveness + which instance answered (watch the LB round-robin)
- `GET /api/ready` — readiness: 503 if Mongo is unreachable so the LB stops
  routing to a broken instance. Redis down ≠ not ready (features degrade,
  requests still succeed).

## New product ideas included

| Feature | What it does |
|---|---|
| **Live board sync** | Task create/edit/move/delete appears on every entitled screen instantly |
| **Toast notifications** | Assignee gets "New task assigned to you"; role changes notify the user |
| **Presence** | Green dot next to online users (Users page), cluster-wide via Redis |
| **Activity feed** | Live, role-scoped audit trail on the dashboard (30-day TTL, survives task/user deletion via denormalized names) |
| **Due-soon reminders** | Hourly sweep pushes a warning toast for tasks due within 24h (cluster-safe via Redis lock) |
| **Forced logout** | Deleting a user kills their live session immediately |
| **Live connection indicator** | Sidebar shows Live/Offline; on reconnect the client refetches so nothing stays stale |

## Hardening added

- `helmet` security headers, gzip `compression`, JSON body size limit
- Rate limiting on `/api/auth/*` (brute-force protection), LB-aware via `trust proxy`
- Graceful shutdown on SIGTERM (deploys/scale-downs don't drop requests)
- Mongo indexes on the hot task queries; TTL index caps the activity log

## Running the scaled stack

```bash
docker compose up --build
# open http://localhost:8080
```

Dev mode (no Docker, single instance, no Redis needed):

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev   # http://localhost:5173
```

Optional dev Redis (to test multi-instance):

```bash
docker run -p 6379:6379 redis:7-alpine
# then in server/.env: REDIS_URL=redis://localhost:6379
# run two servers: PORT=5000 npm run dev  /  PORT=5001 npm run dev
```

## Scaling further (not implemented, by design)

- **MongoDB read replicas** — the diagram's "primary + read replicas" is a
  MongoDB Atlas/replica-set concern; point `DATABASE_URL` at a replica set
  URI and set `readPreference=secondaryPreferred` for the list endpoints.
- **CDN** — put the `client/dist` build on any CDN (Vercel/CloudFront);
  set `VITE_API_URL`/`VITE_SOCKET_URL` to the LB origin.
- **More instances** — add `api-3...N` to compose + the nginx upstream.
