# Taskify — Task Management App

A role-based task management app built with the MERN stack
(MongoDB, Express, React, Node.js). Two roles — **Admin** and **Member** —
with correct, server-enforced access control, **real-time sync over
Socket.IO**, and a horizontally scalable deployment (nginx load balancer →
stateless app pool → MongoDB + Redis). See **[ARCHITECTURE.md](ARCHITECTURE.md)**
for the full design.

---

## What's new in this version

- **Real-time everything (Socket.IO kept, as before, now first-class).**
  Task created/edited/moved/deleted → every entitled screen updates
  instantly. Socket auth uses the same JWT as the API, and events are
  emitted to per-user rooms — a Member's browser never even receives
  another member's task data.
- **Load-balancer-ready.** Multiple stateless app instances behind nginx
  (sticky `ip_hash` for the Socket.IO handshake). The
  `@socket.io/redis-adapter` broadcasts events across instances, so it
  doesn't matter which instance a user is connected to.
- **Redis (optional).** Enables the multi-instance socket adapter, a 10s
  dashboard-stats cache with invalidation on every mutation, cluster-wide
  presence, and a distributed lock so scheduled jobs run once per cluster.
  Without `REDIS_URL` everything still works on a single instance.
- **New features:** live activity feed (role-scoped, 30-day TTL), toast
  notifications ("New task assigned to you"), online presence dots on the
  Users page, hourly due-soon reminder sweeps, forced logout of deleted
  users, and a Live/Offline indicator that refetches on reconnect.
- **Hardening:** helmet, compression, auth rate limiting, JSON body limit,
  `/api/health` + `/api/ready` endpoints for the LB, graceful SIGTERM
  shutdown.

Run the whole scaled stack with one command:

```bash
docker compose up --build   # then open http://localhost:8080
```

---

## What changed in the previous rewrite

The previous version let anyone choose "Admin" or "Member" at registration,
stored a global `role` directly on the `User` model with no real access
control, and let any logged-in user fetch every task in the database. This
version fixes that:

- **No role picker at registration.** The **first person to ever register
  becomes Admin automatically**. Registration is then closed — from then on,
  only an Admin can create Member accounts (`Users` page).
- **Two collections only** — `User` and `Task` — no workspaces, organizations,
  or projects. That complexity isn't needed for this app's scope.
- **Every task query is scoped by role on the server**, not filtered on the
  client: `GET /api/tasks` returns *all* tasks for an Admin, but returns
  *only tasks assigned to the caller* for a Member. There is no code path
  where a Member's request can return someone else's tasks.
- **Real RBAC middleware.** `requireAuth` re-checks the user's current role
  from the database on every request (so a demotion/deletion takes effect
  immediately instead of waiting for the JWT to expire), and `requireAdmin`
  gates every write that should be Admin-only.
- **Members can only update the status of tasks assigned to them** (via a
  dedicated `PATCH /api/tasks/:id/status` route) — they cannot edit other
  fields, reassign, or delete any task, and cannot see or touch tasks that
  aren't theirs.

---

## Project Structure

```
taskify/
├── client/     # React + Vite frontend
└── server/     # Node.js + Express + MongoDB backend
    └── src/
        ├── controllers/   # auth, user (admin member-mgmt + profile), task
        ├── models/        # User, Task
        ├── routes/        # auth, users, tasks
        └── middleware/    # requireAuth, requireAdmin, validation, error
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on port `27017` (or update `DATABASE_URL` in `server/.env`)

---

## Setup & Run

### 1. Backend

```bash
cd server
npm install
# Edit .env if needed (MongoDB URI, JWT secret, port)
npm run dev
```

Server runs on **http://localhost:5000**

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs on **http://localhost:5173**

---

## First-Time Use

1. Open **http://localhost:5173**
2. You'll be redirected to the **Login** page. Since no account exists yet,
   a **Register** tab is shown — the account you create here becomes Admin.
3. Once logged in as Admin, go to **Users** and create Member accounts
   (with a temporary password they can change later in **Profile**).
4. Go to **Tasks** to create and assign tasks to Members via the Kanban
   board.
5. When a Member logs in, they only see **Dashboard**, **My Tasks**, and
   **Profile** — they see only tasks assigned to them and can drag cards
   between columns to update status.

---

## Roles & Permissions

| Action | Admin | Member |
|---|---|---|
| View all tasks | ✅ | ❌ (only their own) |
| Create / assign tasks | ✅ | ❌ |
| Edit any task field | ✅ | ❌ |
| Update status of their own task | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
| Create / edit / delete Members | ✅ | ❌ |
| View dashboard stats | System-wide | Own tasks only |

---

## Environment Variables (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | `mongodb://localhost:27017/taskify` | MongoDB connection string |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `NODE_ENV` | `development` | Environment |

---

## API Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/registration-status` | No | Whether public registration is still open (only until the first user exists) |
| POST | `/register` | No | Register — only works while no user exists yet; that user becomes Admin |
| POST | `/login` | No | Login |
| GET | `/me` | Yes | Get current user |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| PUT | `/me` | Yes | Update your own name/avatar |
| PUT | `/me/password` | Yes | Change your own password |
| GET | `/` | Admin | List all users |
| POST | `/` | Admin | Create a Member (or Admin) account |
| PUT | `/:id` | Admin | Update a user's name/role |
| POST | `/:id/reset-password` | Admin | Reset a user's password |
| DELETE | `/:id` | Admin | Delete a user (can't delete yourself or the last Admin) |

### Tasks (`/api/tasks`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Yes | Role-aware dashboard numbers |
| GET | `/` | Yes | Admin: all tasks. Member: only tasks assigned to them |
| GET | `/:id` | Yes | Get a task (Member: only if it's theirs) |
| POST | `/` | Admin | Create (and assign) a task |
| PUT | `/:id` | Admin | Full edit of any task |
| PATCH | `/:id/status` | Yes | Member: update status of their own task |
| DELETE | `/:id` | Admin | Delete a task |
