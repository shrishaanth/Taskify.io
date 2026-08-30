# Deploy — nginx load balancer + app pool

Runnable local mirror of the SRS §2 topology: an nginx load balancer in front of
a pool of stateless app instances, with Socket.IO handshakes pinned by
`ip_hash`.

```
browser ──► web (nginx :8080)
              ├─ /            → client bundle (static)
              ├─ /api/*       → ip_hash → app1:4000 / app2:4000
              └─ /socket.io/* → ip_hash → app1:4000 / app2:4000
                                              │
                                          mongo:27017
```

## Run

```bash
docker compose -f deploy/docker-compose.yml up --build
```

Open **http://localhost:8080**. Sign up, create an org/project/board, and try
the real-time flow: open the same board in two browsers → a card moved in one
appears in the other; assigning someone a card lights up their bell instantly.

Scale the pool:

```bash
# add app3, app4 … edit deploy/nginx.conf `upstream` and add services, or:
docker compose -f deploy/docker-compose.yml up --build --scale app1=1 --scale app2=1
```

## Files

| File | Purpose |
|---|---|
| `nginx.conf` | LB config — `upstream` pool, `ip_hash` sticky sessions, `/socket.io/` WebSocket upgrade, `/api/` proxy, SPA fallback |
| `docker-compose.yml` | nginx (`web`) + two app instances (`app1`, `app2`) + `mongo` |
| `../server/Dockerfile` | API image (runs `npm start` → `tsx src/index.ts`) |
| `../client/Dockerfile` | builds the client with `VITE_API_URL=/api/v1`, serves it from the `web` nginx |

## Not included (deliberately)

- **Redis / `@socket.io/redis-adapter`** — out of scope. With `ip_hash` each
  client stays pinned to one app instance, so it receives every event that
  instance emits. Two clients on *different* instances will not see each
  other's realtime updates until the Redis pub/sub adapter is added.
- **TLS** — this stack serves plain HTTP, so the app runs with
  `NODE_ENV=development` (non-`secure` refresh cookie). Production terminates
  HTTPS at nginx and sets `NODE_ENV=production`.
