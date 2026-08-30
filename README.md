# Taskify

A multi-tenant, enterprise-oriented Kanban project-management tool — Trello-style
boards and cards on top of Jira-grade access control, tenant isolation, and
real-time collaboration.

<p>
  <a href="https://taskify-io.vercel.app"><img alt="Live demo" src="https://img.shields.io/badge/demo-live-brightgreen"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-%E2%89%A520.12-5FA04E?logo=nodedotjs&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white">
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-655_passing-success">
</p>

**[▶ Live demo](https://taskify-io.vercel.app)** — SPA on Vercel, API + Socket.IO
on Render ([`taskify-io.onrender.com`](https://taskify-io.onrender.com/api/health)),
MongoDB Atlas. The API is on Render's free tier, so the first request after a
period of inactivity cold-starts (~30–50s); reload once and it's responsive.

---

## Overview

Most task tools force a trade-off: Trello is simple but weak on structure and
access control; Jira is powerful but heavy. Taskify keeps the card-based
simplicity teams touch every day and puts the plumbing a growing company
actually needs underneath it:

- **Multi-tenancy** — one deployment serves many customer companies
  (Organizations); no tenant can read or mutate another's data, enforced at the
  database query layer.
- **Two-layer RBAC** — independent Organization roles (`owner` / `admin` /
  `member`) and Project roles (`head` / `member`), re-checked from the database
  on every request so a demotion takes effect immediately.
- **Real-time by default** — board, card, membership and notification changes
  propagate over Socket.IO to exactly the rooms that should see them, never a
  global broadcast.
- **Horizontally scalable** — stateless app instances behind an nginx load
  balancer, with a runnable local multi-instance topology in [`deploy/`](deploy/).

The full engineering contract this codebase is built against lives in
[`PROJECT_RULES.md`](PROJECT_RULES.md); the component catalog is in
[`COMPONENT_INVENTORY.md`](COMPONENT_INVENTORY.md).

---

## Features

| Area | What's implemented |
|---|---|
| **Auth** | Email/password signup & login, short-lived JWT access tokens, server-tracked **rotating + revocable** refresh tokens, `logout` / `logout-all`, bcrypt hashing, password-strength policy |
| **Organizations** | Create (any user, any number of times), rename, members list, role changes, member removal with last-owner protection, cascade delete |
| **Invites** | Invite by email (existing or brand-new user), accept flow that creates the account on first login, pending-invite lists for both admin and invitee, revoke |
| **Projects** | Create (creator becomes Head), name-only visibility for non-members, Head-only edit/delete, member management with Org Owner/Admin override |
| **Boards & Cards** | Boards with embedded user-defined columns, cards with labels, priority, due dates, assignees, description (markdown), subtasks, comments |
| **Kanban UX** | Hand-rolled HTML5 drag-and-drop, optimistic card moves, FLIP-animated reordering that plays exactly once when the confirming socket event lands |
| **Notifications** | `card_assigned`, `comment_mention`, `role_changed`, `invite_accepted`; live bell via `notification:new`, mark-one / mark-all read |
| **Real-time** | `card:*`, `comment:new`, `board:*`, `project:member*`, `org:memberChanged`, `notification:new` — room-scoped, membership-derived room joins |
| **Tenant isolation** | Denormalized `organizationId` on every org-scoped model; one shared scoped-query helper; dedicated cross-tenant test suite returning `404` (never confirming a foreign resource exists) |
| **Ops** | `/api/health` (liveness + instance id), `/api/ready` (Mongo readiness), nginx LB config, docker-compose app pool |

---

## Architecture

```
                         ┌─────────────────────────────┐
  browser  ────────────► │  nginx  (LB + static SPA)    │
   React SPA             │  ip_hash sticky sessions     │
                         └───────┬─────────────┬────────┘
                                 │ /api/*      │ /socket.io/*
                        ┌────────▼───┐   ┌─────▼──────┐
                        │  app 1      │  │  app 2      │   … stateless, N wide
                        │ Express +   │  │ Express +   │
                        │ Socket.IO   │  │ Socket.IO   │
                        └────────┬────┘  └────┬────────┘
                                 └─────┬──────┘
                                 ┌─────▼──────┐
                                 │  MongoDB    │  single source of shared state
                                 └────────────┘
```

App servers hold no session state — any instance serves any request. Socket.IO
handshakes are pinned per-client with `ip_hash` so each browser receives the
events emitted by its instance. (Cross-instance fan-out via
`@socket.io/redis-adapter` is intentionally deferred — see
[`deploy/README.md`](deploy/README.md).)

### Repository layout

```
Taskify.io/
├── client/                 React 18 + Vite 6 + TypeScript SPA
│   └── src/
│       ├── api/            typed fetch client, one file per resource + socket
│       ├── features/       domain logic & hooks (auth, orgs, projects, boards, cards, realtime)
│       ├── components/     shared primitives + composites (no page logic)
│       ├── pages/          route-level screens
│       ├── stores/         zustand — auth / current context / UI
│       └── styles/         design tokens
├── server/                 Node + Express 4 + TypeScript + Mongoose 8
│   └── src/
│       ├── models/         Organization, OrgMembership, Project, ProjectMembership,
│       │                   Board (columns embedded), Card, Subtask, Comment,
│       │                   Attachment, User, RefreshToken, Notification
│       ├── modules/        auth · orgs · projects · boards · cards · notifications
│       │                   (each: *.routes / *.controller / *.service / *.schema)
│       ├── middleware/     requireAuth, requireOrgRole, requireProjectRole, validate
│       ├── realtime/       io.ts (auth + room joins) · emit.ts (room-scoped emitters)
│       ├── lib/            scoped queries, tokens, serializers, notify
│       └── config/         Zod-validated environment
└── deploy/                 nginx.conf · docker-compose.yml · deploy README
```

---

## Tech stack

**Frontend** — React 18, Vite 6, TypeScript (`exactOptionalPropertyTypes`),
TanStack Query 5, Zustand 5, React Router 7, `socket.io-client` 4.
Tests: Vitest + React Testing Library + MSW.

**Backend** — Node.js (≥ 20.12), Express 4, TypeScript run directly via `tsx`
(no build step), Mongoose 8, Zod for every request schema, Socket.IO 4,
`jsonwebtoken`, `bcryptjs`.
Tests: Vitest + supertest + `mongodb-memory-server`.

**Infra** — nginx (load balancer + static host), Docker Compose.

---

## Getting started

### Prerequisites

- Node.js **≥ 20.12** (the server uses the built-in `process.loadEnvFile`)
- A MongoDB instance — local `mongod`, Docker, or a free Atlas cluster
- npm

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # then edit MONGODB_URI + the JWT secrets
npm run dev               # http://localhost:4000  (tsx watch)
```

Environment (`server/.env` — see [`server/.env.example`](server/.env.example)):

| Var | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `4000` | |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/taskify` | Atlas or local |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev values | use long random strings outside dev |
| `ACCESS_TOKEN_TTL` | `15m` | |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin for the SPA |

### 2. Frontend

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

The client defaults to `http://localhost:4000/api/v1`. Override with
`VITE_API_URL` (and `VITE_WS_URL` for the socket origin) if the API runs
elsewhere.

### 3. Multi-instance topology (optional)

A runnable mirror of the production shape — nginx in front of two app instances
and MongoDB, all in Docker:

```bash
docker compose -f deploy/docker-compose.yml up --build
```

Open **http://localhost:8080**, then open the same board in two browsers and
move a card — it updates live in the other. Details in
[`deploy/README.md`](deploy/README.md).

---

## Deployment

The [live demo](https://taskify-io.vercel.app) runs on managed platforms:

| Piece | Host | Notes |
|---|---|---|
| SPA (`client/`) | **Vercel** | root dir `client`, Vite preset, `VITE_API_URL` → the Render origin + `/api/v1` |
| API + Socket.IO (`server/`) | **Render** web service | root dir `server`, start `npm start` (`tsx src/index.ts`), `NODE_ENV=production`, health check `/api/health` |
| Database | **MongoDB Atlas** | free M0; Render's free tier has no static egress IP, so Atlas network access is open |

Two deployment-specific details:

- The refresh-token cookie is `SameSite=None; Secure` in production (the SPA and
  API are on different domains, so a `Lax` cookie would never be sent on the
  cross-site `/auth/refresh` call).
- `CLIENT_ORIGIN` on the API must be the exact Vercel production URL — it feeds
  both the CORS allow-list and the Socket.IO CORS config.

The Docker + nginx stack in [`deploy/`](deploy/) is a **separate** target — the
self-hosted, load-balanced topology from the spec. It isn't used by the managed
deploy above; run it locally with `docker compose` to exercise the app pool and
sticky Socket.IO sessions.

---

## Testing

```bash
# backend — Vitest + supertest, in-memory MongoDB
cd server && npm test

# frontend — Vitest + RTL + MSW
cd client && npm test

# type-check / lint — run inside client/ or server/
npm run typecheck
npm run lint
```

Current status: **202** server tests (20 files) + **453** client tests (70
files), all green; both packages type-check and lint clean.

Test priorities, enforced per [`PROJECT_RULES.md`](PROJECT_RULES.md) §7:

- **Tenant isolation** is the highest-priority suite — every org-scoped endpoint
  has a test proving an Org-A user gets `404` (not `403`) for any Org-B
  resource, with the deliberate `403` contrast case for an in-org non-member.
- **Auth middleware** — a user demoted or removed is rejected on their *very
  next request* (role re-read from the DB, not the token).
- **Real-time** — events are asserted to reach only the intended room, via a
  real Socket.IO client against an ephemeral server.

---

## Access-control model

Two independent role layers. A user must belong to the Organization that owns a
Project before they can hold any Project role at all.

| | Owner | Admin | Member |
|---|:--:|:--:|:--:|
| View org / list members | ✔ | ✔ | ✔ |
| Update org, invite, change roles, remove members | ✔ | ✔ | — |
| Create a project | ✔ | ✔ | ✔ |
| Override any project's membership | ✔ | ✔ | — |
| Delete the organization | ✔ | — | — |

| | Project Head | Project Member |
|---|:--:|:--:|
| Open project, view boards/cards/members | ✔ | ✔ |
| Create / edit / move / delete cards, comments, subtasks | ✔ | ✔ |
| Create / rename / delete boards & columns | ✔ | ✔ |
| Add / remove project members and other Heads | ✔ | — |
| Edit / delete the project itself | ✔ | — |

Heads and Members have **identical board/card permissions** — the only
difference is project administration. Boards carry no access list of their own;
access is entirely inherited from the parent Project.

Status codes are deliberate: **404** = resource belongs to another Organization
(never confirmed to exist), **403** = right Organization but insufficient
Project/Org permission, **401** = missing/invalid token, **400** = failed Zod
validation.

---

## API surface

All routes are under `/api/v1`. Error responses are always
`{ message, code, details? }`. List endpoints take `?page=&limit=`.

<details>
<summary><b>Endpoint reference</b></summary>

**Auth** — `/api/v1/auth`
```
POST   /signup            create a User (no organization)
POST   /login             access token + refresh cookie
POST   /refresh           rotate refresh token, issue new access token
POST   /logout            revoke current refresh token
POST   /logout-all        revoke all of the user's refresh tokens
GET    /me                current user + org memberships
```

**Organizations** — `/api/v1/orgs`
```
POST   /                          create org (caller becomes Owner)
GET    /:orgId                    org details
PATCH  /:orgId                    update name/settings           (Owner/Admin)
DELETE /:orgId                    cascade delete                 (Owner)
GET    /:orgId/members            list members + roles
PATCH  /:orgId/members/:userId    change org role                (Owner/Admin)
DELETE /:orgId/members/:userId    remove member (last-owner safe)(Owner/Admin)
POST   /:orgId/invites            invite by email + role         (Owner/Admin)
GET    /:orgId/invites            list pending invites           (Owner/Admin)
DELETE /:orgId/invites/:inviteId  revoke an invite               (Owner/Admin)
GET    /invites/mine              my pending invites
POST   /invites/:inviteToken/accept   accept (creates account if new)
```

**Projects** — `/api/v1/orgs/:orgId/projects`
```
GET    /                          list (name-only where no membership)
POST   /                          create (creator becomes Head)
GET    /:projectId                full detail | 403 if no membership
PATCH  /:projectId                update name/description        (Head)
DELETE /:projectId                cascade delete                 (Head)
GET    /:projectId/members        list members + roles
PUT    /:projectId/members/:userId   set project role            (Head / Org Owner-Admin)
DELETE /:projectId/members/:userId   remove project access       (Head / Org Owner-Admin)
```

**Boards** — `/api/v1/projects/:projectId/boards` · **Cards** — `/api/v1/boards/:boardId/cards`
```
GET|POST /                        list / create boards
GET|PATCH|DELETE /:boardId        get / rename+columns / cascade delete
GET|POST /                        list / create cards
GET|PATCH|DELETE /:cardId         get / edit / cascade delete
PATCH  /:cardId/move              { columnId, order }
```
Cards also nest `/subtasks`, `/comments`, `/attachments`.

**Notifications** — `/api/v1/notifications`
```
GET    /                 list (self only, unread count + pagination)
PATCH  /:id/read         mark one read
PATCH  /read-all         mark all read
```

**Ops**
```
GET    /api/health       liveness + instance id
GET    /api/ready        readiness (Mongo connectivity)
```

</details>

### Real-time events

Rooms: `user:<id>`, `org:<id>`, `project:<id>`, `board:<id>` — never a global
broadcast. `user` / `org` / `project` rooms are joined on connect from the
caller's memberships; `board` is joined on demand via `subscribe:board` after an
access check.

| Event | Room | Payload |
|---|---|---|
| `card:created` / `card:updated` / `card:deleted` | `board:<id>` | card (or id) |
| `card:moved` | `board:<id>` | `{ id, columnId, order }` |
| `comment:new` | `board:<id>` | `{ cardId, comment }` |
| `board:created` / `board:updated` / `board:deleted` | `project:<id>` | board dto (or id) |
| `project:memberChanged` / `project:memberRemoved` | `project:<id>` | `{ userId, role }` / `{ userId }` |
| `org:memberChanged` | `org:<id>` | `{ userId, role }` |
| `notification:new` | `user:<id>` | notification object |

The client never trusts a payload to be complete — each event just nudges
TanStack Query to refetch the affected slice. Card moves are optimistic with the
event acting as confirmation.

---

## Design decisions worth calling out

- **`tsx` at runtime, no server build** — TypeScript is executed directly in
  every environment including production (`npm start`), keeping one toolchain.
- **Denormalized `organizationId`** on every org-scoped document so each
  isolation check is a single indexed equality filter, not a 3-hop parent walk
  that's easy to forget under pressure.
- **Roles are never trusted from the JWT** — the access token carries only
  `userId`; membership and role are resolved from the database once per request.
- **Explicit, tested cascade deletes** per parent type — no reliance on implicit
  Mongo behaviour, no soft-delete layer.
- **One validation library (Zod), one pattern** — every route validates
  params/body the same way through a single `validate` middleware.
- **FLIP animation keyed off measured DOM position** — the optimistic move and
  the confirming socket event resolve to the same layout, so a moved card
  animates exactly once.
