# Taskify

Multi-tenant Kanban project management — Trello-style boards on top of
enterprise access control, tenant isolation, and real-time collaboration.

<p>
  <a href="https://taskify-io.vercel.app"><img alt="Live demo" src="https://img.shields.io/badge/demo-live-brightgreen"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-%E2%89%A520.12-5FA04E?logo=nodedotjs&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white">
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white">
</p>

**[▶ Live demo](https://taskify-io.vercel.app)** — SPA on Vercel, API on Render,
MongoDB Atlas. The API runs on Render's free tier, so the first request after a
period of inactivity cold-starts (~30–50s).

---

## Overview

One deployment serves many customer companies. Inside a company, work is
organised into projects → boards → cards, and every change appears live for
everyone viewing the same board.

- **Multi-tenancy** — Organizations are the tenant boundary. Every org-scoped
  document carries a denormalized `organizationId`, and every query filters on
  it at the database layer, so cross-tenant access is structurally impossible
  rather than policed by convention.
- **Two-layer RBAC** — independent Organization roles (`owner` / `admin` /
  `member`) and Project roles (`head` / `member`), both re-read from MongoDB on
  every request instead of trusted from the JWT, so a demotion takes effect
  immediately.
- **Real-time by default** — card, board, membership and notification changes
  propagate over Socket.IO to strictly room-scoped audiences, never a global
  broadcast.
- **Stateless API** — no server-side session store, so any instance can serve
  any request.

Engineering constraints are documented in
[`PROJECT_RULES.md`](PROJECT_RULES.md); the UI catalog in
[`COMPONENT_INVENTORY.md`](COMPONENT_INVENTORY.md).

---

## Features

| Area | Implemented |
|---|---|
| **Auth** | Email/password signup & login, short-lived JWT access tokens, server-tracked **rotating + revocable** refresh tokens (stored hashed), `logout` / `logout-all`, bcrypt |
| **Organizations** | Create, rename, members list, role changes, member removal with last-owner protection, cascade delete |
| **Invites** | Invite by email (existing or new user), accept flow that creates the account on first login, pending-invite lists, revoke |
| **Projects** | Creator becomes Head, name-only visibility for non-members, Head-only edit/delete, member management with Org Owner/Admin override |
| **Boards & Cards** | Embedded user-defined columns; cards with labels, priority, due dates, assignees, markdown description, subtasks, comments |
| **Kanban UX** | Native HTML5 drag-and-drop, optimistic card moves, FLIP-animated reordering that plays exactly once when the confirming event lands |
| **Notifications** | `card_assigned`, `comment_mention`, `role_changed`, `invite_accepted`; live bell, mark-one / mark-all read |
| **Real-time** | `card:*`, `comment:new`, `board:*`, `project:member*`, `org:memberChanged`, `notification:new` — membership-derived room joins |
| **Tenant isolation** | One shared scoped-query helper; dedicated cross-tenant suite asserting `404` (never confirming a foreign resource exists) |
| **Ops** | `/api/health` (liveness + instance id), `/api/ready` (Mongo readiness) |

---

## Architecture

```
  Browser                        Node process (stateless)          MongoDB
  ──────────────────────         ────────────────────────────      ──────────────
  React 18 + Vite 6              Express 4     → /api/v1/*         13 collections
  TanStack Query  ── HTTPS ──►   Socket.IO 4   → /socket.io   ──►  Atlas in prod
  Zustand         ◄── WSS ────   share one HTTP listener           in-memory in
  socket.io-client               Zod · JWT · bcrypt · Mongoose 8   tests
```

Socket.IO attaches to the same HTTP listener as Express, so the service exposes
a single port. All shared state lives in MongoDB.

### Repository layout

```
Taskify.io/
├── client/                 React 18 + Vite 6 + TypeScript SPA
│   └── src/
│       ├── api/            typed fetch client, one file per resource + socket
│       ├── features/       TanStack Query hooks per domain + realtime listeners
│       ├── components/     primitives (domain-blind) + composites (domain-aware)
│       ├── pages/          route-level screens
│       ├── stores/         zustand — session state
│       └── styles/         design tokens
└── server/                 Node + Express 4 + TypeScript + Mongoose 8
    └── src/
        ├── models/         Organization, OrgMembership, OrgInvite, Project,
        │                   ProjectMembership, Board (columns embedded), Card,
        │                   Subtask, Comment, Attachment, User, RefreshToken,
        │                   Notification
        ├── modules/        auth · orgs · projects · boards · cards · notifications
        │                   (each: *.routes / *.controller / *.service / *.schema)
        ├── middleware/     requireAuth, requireOrgRole, requireProjectRole,
        │                   resolveScope, validate, errorHandler
        ├── realtime/       io.ts (auth + room joins) · emit.ts (room-scoped emitters)
        ├── lib/            scoped queries, tokens, serializers, notify, cascade
        └── config/         Zod-validated environment
```

---

## Tech stack

**Frontend** — React 18, Vite 6, TypeScript (`exactOptionalPropertyTypes`),
TanStack Query 5, Zustand 5, React Router 7, `socket.io-client` 4.
Tests: Vitest + React Testing Library + MSW.

**Backend** — Node.js ≥ 20.12, Express 4, TypeScript run directly via `tsx`
(no build step), Mongoose 8, Zod, Socket.IO 4, `jsonwebtoken`, `bcryptjs`.
Tests: Vitest + supertest + `mongodb-memory-server`.

---

## Getting started

**Prerequisites:** Node.js ≥ 20.12 (the server uses `process.loadEnvFile`), a
MongoDB instance (local `mongod` or a free Atlas cluster), npm.

### Backend

```bash
cd server
npm install
cp .env.example .env      # set MONGODB_URI + the JWT secrets
npm run dev               # http://localhost:4000
```

| Var | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `4000` | |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/taskify` | Atlas or local |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev values | long random strings outside dev |
| `ACCESS_TOKEN_TTL` | `15m` | |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin for the SPA |

### Frontend

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

Defaults to `http://localhost:4000/api/v1`; override with `VITE_API_URL`.

---

## Deployment

| Piece | Host | Configuration |
|---|---|---|
| SPA (`client/`) | **Vercel** | root dir `client`, Vite preset, `VITE_API_URL` → the API origin + `/api/v1` |
| API + Socket.IO (`server/`) | **Render** | root dir `server`, start `npm start`, `NODE_ENV=production`, health check `/api/health` |
| Database | **MongoDB Atlas** | free M0 tier |

`CLIENT_ORIGIN` on the API must be the exact SPA production URL — it feeds both
the Express CORS allow-list and the Socket.IO CORS config. Vite bakes
`VITE_API_URL` in at build time, so changing it requires a redeploy.

---

## Testing

```bash
cd server && npm test     # Vitest + supertest against in-memory MongoDB
cd client && npm test     # Vitest + React Testing Library + MSW

npm run typecheck         # tsc --noEmit   (run inside client/ or server/)
npm run lint
```

**202** server tests (20 files) + **453** client tests (70 files), all green;
both packages type-check and lint clean.

Priorities, per [`PROJECT_RULES.md`](PROJECT_RULES.md) §7:

- **Tenant isolation** is the highest-priority suite — every org-scoped endpoint
  is asserted to return `404` (not `403`) for a foreign resource, with the
  deliberate `403` contrast case for an in-org non-member.
- **Auth middleware** — a demoted or removed user is rejected on their *very
  next request*, since roles are re-read from the database rather than the token.
- **Real-time** — events are asserted to reach only the intended room, using a
  real Socket.IO client against an ephemeral server.

---

## Access-control model

Two independent role layers. A user must belong to the Organization that owns a
Project before they can hold any Project role.

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

Heads and Members have **identical board and card permissions** — the only
difference is project administration. Boards carry no access list of their own;
access is inherited entirely from the parent Project.

Status codes are deliberate: **404** = the resource belongs to another
Organization (never confirmed to exist), **403** = correct Organization but
insufficient permission, **401** = missing/invalid token, **400** = failed
validation.

---

## API surface

All routes live under `/api/v1`. Errors are always `{ message, code, details? }`.
List endpoints accept `?page=&limit=`.

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

Rooms are `user:<id>`, `org:<id>`, `project:<id>` and `board:<id>` — never a
global broadcast. The first three are joined on connect from the caller's
memberships; `board:<id>` is joined on demand via `subscribe:board` after an
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

The client never treats a payload as complete state — each event nudges TanStack
Query to refetch the affected slice, so authorization and DTO shaping are
re-applied server-side. Card moves are optimistic, with the event as
confirmation.

---

## Design decisions

- **Roles are never trusted from the JWT** — the access token carries only
  `userId`; membership and role are resolved from the database once per request,
  so privilege changes apply immediately.
- **Denormalized `organizationId`** on every org-scoped document, so each
  isolation check is a single indexed equality filter rather than a three-hop
  parent walk that is easy to skip.
- **Short-lived access tokens + server-tracked refresh tokens** — the
  un-revokable credential is short-lived; the long-lived one is stored hashed,
  rotated on every use, and revocable.
- **Embedded columns, referenced cards** — columns are bounded and always read
  with their board; cards are unbounded and independently queried and moved.
- **Explicit, tested cascade deletes** per parent type, rather than relying on
  implicit database behaviour.
- **One validation library (Zod), one pattern** — every route validates
  params/body/query through a single `validate` middleware.
- **`tsx` at runtime, no server build** — TypeScript executes directly in every
  environment including production, keeping one toolchain.
