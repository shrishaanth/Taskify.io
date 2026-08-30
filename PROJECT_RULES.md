# Taskify — Project Rules

**Read this file at the start of every session in this repo, before writing or
changing any code.** It is the distilled, in-my-own-words contract derived from
the six SRS documents in `srs/`. If anything here disagrees with `srs/*.md`, the
SRS wins — fix this file.

The SRS docs, in reading order:
`01-vision.md`, `02-requirements.md`, `03-use-cases.md`, `04-software-spec.md`,
`05-data-model.md`, `06-api-contract.md`, plus `srs/Taskify_UI_Mockups.pdf`.

---

## 0. The one rule that overrides convenience

**Never create a second parallel implementation of something that already
exists.** If a component, model, route module, helper, hook, type, or store for
a concern is already in the tree, **extend or refactor it** — do not write a new
version beside it.

Concretely, this repo must never again contain:
- two component sets (`components/` **and** `Components/` **and**
  `v2components/`), two page dirs, two primitives folders;
- two model sets (a legacy flat `Task`/`User` system next to the real
  `Organization`/`Project`/… set);
- legacy `routes/` + `controllers/` next to `modules/`;
- unversioned routes next to `/api/v1` routes;
- two validation libraries.

The previous repo failed exactly this way; the rebuild exists to not repeat it.
If you think a parallel version is justified, stop and ask first.

---

## 1. Tech stack (software-spec §1)

- **Frontend:** React + Vite + TypeScript.
- **Backend:** Node.js + Express + TypeScript.
- **DB:** MongoDB via Mongoose.
- **Real-time:** Socket.IO + `@socket.io/redis-adapter` for multi-instance
  fan-out.
- **Redis:** socket adapter, cache, presence, locks.
- **Auth:** short-lived JWT access tokens + server-tracked, rotatable,
  revocable refresh tokens.
- **Validation:** exactly **one** schema library (Zod), used identically on
  every route. Never add a second.
- **Tests:** Vitest everywhere. Frontend: Vitest + React Testing Library.
  Backend: Vitest + supertest (Jest acceptable only if a blocker forces it —
  prefer Vitest for one runner).
- App servers are **stateless**; all shared state is in MongoDB or Redis so any
  instance serves any request. nginx load-balances with sticky `ip_hash` for
  Socket.IO handshakes.

---

## 2. RBAC model

Two independent role layers. **A user must belong to the Organization that owns
a Project before they can hold any Project role at all.**

### 2.1 Organization roles — `owner` | `admin` | `member`
Stored on **`OrgMembership { organizationId, userId, role }`**, compound-unique
on `(organizationId, userId)`. This is the *single source of truth* for org
membership + role.

| Capability | Owner | Admin | Member |
|---|---|---|---|
| View org, list members | ✔ | ✔ | ✔ |
| Update org name/settings | ✔ | ✔ | ✘ |
| Invite users (any role ≤ Admin) | ✔ | ✔ | ✘ (403) |
| Change a member's org role | ✔ | ✔ | ✘ |
| Remove a member | ✔ | ✔ | ✘ |
| Create a Project | ✔ | ✔ | ✔ (any org member — UC-3) |
| Override **any** Project's membership (add/remove Heads/Members) without being on that project | ✔ | ✔ | ✘ |

- **FR-1.6:** an Organization can never be left with zero Owners — block the
  last-owner removal/demotion.
- A user may belong to **zero, one, or many** organizations. Signup creates a
  User with **no** `OrgMembership`. Creating an org (UC-1a) or accepting an
  invite (UC-2) is what creates one. Creating an org makes the caller `owner`;
  it can be done any number of times.

### 2.2 Project roles — `head` | `member`
Stored on **`ProjectMembership { projectId, userId, role }`**, compound-unique
on `(projectId, userId)`. This is the *single source of truth* for "can this
user see / open this project at all". No row → the user cannot open it (but may
still see its **name** in the org project list — FR-2.3).

| Capability | Head | Member |
|---|---|---|
| Open project, see boards/cards/members | ✔ | ✔ |
| Create / edit / move / delete **cards**, comment, subtasks, attachments | ✔ | ✔ |
| Create / rename / delete **boards** and columns | ✔ | ✔ |
| Add/remove Project Members and other Heads | ✔ | ✘ (403) |
| Edit / delete the Project itself | ✔ | ✘ |

- **Heads and Members have identical board/card permissions.** The *only*
  difference is project-level administration (membership, project edit/delete).
- **Multiple Heads** per project are allowed and normal.
- **Org Owner/Admin override:** may change any project's membership even with no
  `ProjectMembership` of their own — intentional safety net (a Head leaves the
  company). This override does **not** grant them card/board editing without a
  `ProjectMembership`; it's scoped to membership management (UC-9 alt flow).

### 2.3 Boards have no roles
**FR-3.1:** a Board belongs to one Project and has **no access list of its
own**. Board (and card/subtask/comment/attachment) access is *entirely
inherited* from the caller's `ProjectMembership` on the parent Project. There is
no board-level invite, no per-board role. Do not add one. (The mockup set's
board header was explicitly corrected to remove a stray "+ Invite" button.)

### 2.4 403 vs 404 — the distinction is deliberate (software-spec §8, UC-10)
- **404** — the resource ID belongs to a **different Organization** than the
  caller (or genuinely doesn't exist). Never confirm cross-tenant resources
  exist. Applies regardless of the caller's role.
- **403** — the caller **is** in the right Organization, the resource exists and
  is even name-listed to them (FR-2.3), but they lack the Project-level (or
  Org-level) permission for this action. Example: an org member with no
  `ProjectMembership` calling `GET /orgs/:o/projects/:p`.
- **401** — missing / invalid / expired access token.
- **400** — body/params failed Zod validation.

---

## 3. Tenant isolation (software-spec §3 — the most important rule)

**Every query that returns or mutates Org-scoped data filters by the requesting
user's Organization membership at the database query layer, server-side.** Never
filter client-side. Never trust an org id from the request body/URL without
checking it against the caller's `OrgMembership`.

### 3.1 Denormalized `organizationId` everywhere
Every model below Organization carries its **own** `organizationId`, even though
it could be derived by walking parents:
`Project`, `Board`, `Card` (and by extension the cascade children when queried
directly). This denormalization exists **specifically** so every isolation
check is a single indexed equality filter instead of a 3-hop parent walk that
is easy to skip under pressure.

- When creating a child doc, copy `organizationId` from its parent explicitly.
- Moving a doc between orgs is out of scope; if ever added, the denormalized
  field must be updated explicitly.

### 3.2 One shared query helper — not per-controller ad hoc
- `requireAuth` middleware resolves `req.user` and their `OrgMembership` set
  **once per request** (from the DB, not the token).
- Every controller that touches org-scoped data must go through a shared
  **repository / scoped-query helper** that injects
  `{ organizationId: { $in: req.user.orgIds } }` (or the single resolved
  `orgId` for a URL-scoped route) into every `find` / `findOne` / `update` /
  `delete`. Do not re-implement this filter by hand in each controller.
- The cross-tenant test suite (see §7) is the single highest-priority suite in
  the project and must exist for **every** endpoint that returns org-scoped
  data.

---

## 4. Authentication (software-spec §5, NFR-1.x)

1. **Login** issues:
   - access token — signed JWT, ~15 min expiry, payload contains **`userId`
     only**. No role claims are ever trusted for authorization.
   - refresh token — random, stored **hashed** server-side
     (`RefreshToken { userId, tokenHash, deviceInfo?, expiresAt (TTL), revokedAt? }`),
     ~30 day expiry, with a device/session id.
2. `POST /auth/refresh` — validates the refresh token is not revoked/expired,
   issues a new access token and **rotates** the refresh token.
3. `POST /auth/logout` revokes the current refresh token; `POST /auth/logout-all`
   revokes all of the user's refresh tokens. Revocation is immediate,
   server-side.
4. **Every request re-reads role/membership from the DB.** A demotion or removal
   takes effect on the user's **very next request**, not at token expiry. There
   is a test for exactly this.
5. Socket.IO authenticates with the current access token at handshake time and
   must re-authenticate if it expires mid-session (UC-11).
6. Passwords hashed with **bcrypt** (or argon2). Never stored or logged in
   plaintext. Password strength policy enforced at signup (400 on failure, no
   account created).
7. No MFA/2FA in this build.

---

## 5. Approved folder structure

Only these. No parallel trees (§0).

### 5.1 `client/src/` (software-spec §9)
```
client/src/
├── api/          # typed API client fns, one file per resource (auth, orgs,
│                 # projects, boards, cards, subtasks, comments, attachments,
│                 # notifications). Wraps one fetch/axios client.
├── features/     # one folder per domain: auth, orgs, projects, boards, cards
│                 # (feature-local components, hooks, logic)
├── components/   # shared, reusable UI ONLY — no page-specific logic
│                 # (the primitives + composites from COMPONENT_INVENTORY.md)
├── stores/       # client state (auth, current org/project context, ui)
├── pages/        # route-level components, composed from features/
└── (supporting: styles/tokens, lib/, types/, test/)
```
Retired for good: `Pages/` + `Components/` + `v2components/` + a second
`features/`. One casing, one location per concern.

### 5.2 `server/src/` (software-spec §10)
```
server/src/
├── models/       # Organization, OrgMembership, Project, ProjectMembership,
│                 # Board, Card, Subtask, Comment, Attachment, User,
│                 # RefreshToken, Notification.  (Columns are EMBEDDED in Board,
│                 # not a model.)  ONE models dir.
├── modules/      # auth/ orgs/ projects/ boards/ cards/  — each: *.routes.ts,
│                 # *.controller.ts, *.service.ts, *.schema.ts (Zod)
├── middleware/   # requireAuth, requireOrgRole, requireProjectRole, validate
│                 # (single Zod validator), error handler, pagination
├── realtime/     # socket.ts — auth, room join, emit helpers
└── services/     # redis.ts, event-bus.ts, (mailer, etc.)
```
Retired for good: legacy `routes/`, `controllers/`, `jobs/`, and the
`Task`/`Issue`/`Epic`/`Sprint`/`Workspace` models. The **Workspace** layer is
collapsed away — there is no layer between Organization and Project.

Shared types/schemas may live in a `packages/shared` workspace **if** it stays a
single source; do not fork schema definitions between client and server.

---

## 6. API & real-time conventions

- **Every** route is under **`/api/v1/...`**. No unversioned routes, ever.
- Health endpoints are the two exceptions by design: `GET /api/health`
  (liveness + instance id), `GET /api/ready` (readiness — checks Mongo).
- Error responses (all non-2xx) use exactly: `{ message, code, details? }`.
- List endpoints accept `?page=&limit=` unless the contract says otherwise.
- Auth: every route except `POST /auth/signup`, `POST /auth/login`,
  `POST /auth/refresh`, and `POST /orgs/invites/:token/accept` requires
  `Authorization: Bearer <access token>`.
- Route surface is **exactly** `srs/06-api-contract.md` — no extra endpoints,
  no missing ones, paths and methods verbatim. Nesting per the contract
  (`/orgs/:orgId/projects`, `/projects/:projectId/boards`,
  `/boards/:boardId/cards`, `/cards/:cardId/subtasks|comments|attachments`,
  `/notifications`).
- **Cascade deletes** (Project → Boards → Cards → subtasks/comments/attachments)
  are **explicit, tested operations per parent type**. Never rely on implicit
  Mongo `ref` behaviour. No soft-delete / trash in this scope.

### 6.1 Real-time event catalog (software-spec §6)
Rooms: `org:<id>`, `board:<id>`, `user:<id>` — **never a global broadcast**.

| Event | Room | Payload |
|---|---|---|
| `card:created` | `board:<id>` | full card |
| `card:updated` | `board:<id>` | changed fields + card id |
| `card:moved` | `board:<id>` | card id, new columnId, new order |
| `card:deleted` | `board:<id>` | card id |
| `comment:new` | `board:<id>` | comment + card id |
| `notification:new` | `user:<id>` | notification object |
| `presence:update` | `board:<id>` | user id, online/offline |

A user is only ever joined to rooms for boards/orgs they can access (FR-5.2).
Board mutations are optimistic on the client with the event as confirmation
(NFR-4.2); a failed server-side move pushes a correction and the client reverts
(UC-6).

---

## 7. Testing rules (the brief's Step 4 — do this per component, unprompted)

Immediately after writing **any** component / model / middleware / route, in the
same step:
1. Write its tests (never defer to a later pass).
2. Run them.
3. Run `tsc --noEmit` and the linter.
4. Fix anything failing and re-run before moving on. Nothing is "done" with
   failing tests, type errors, or lint errors.
5. Log what was built + pass/fail, then continue to the next item in the phase
   without waiting.

Coverage expectations:
- **Primitives:** every visual variant renders; every interaction fires
  (`onClick`, `onChange`, close-on-backdrop, close-on-Esc, focus trap).
- **Composites:** permission-driven rendering (actions shown/hidden by the
  viewer's Project/Org role) + edge-case props (overdue card, empty subtask
  list, no assignee, no-access project tile, last-owner row).
- **Auth middleware, in isolation:** `requireProjectRole('head')` rejects a
  Member (403); `requireOrgRole('admin')` rejects a Member; a user **demoted or
  removed** is rejected on their **very next request** (role re-read from DB,
  not token).
- **Tenant isolation (highest priority, per UC-10):** a dedicated suite proving
  a user from Org A cannot **read, list, or modify** any resource of Org B via
  **any** endpoint — expect **404**, not 403. Plus the contrast case: an Org-A
  user with no `ProjectMembership` on an Org-A project gets **403** (name is
  legitimately listed).

---

## 8. Phase / checkpoint workflow

Build bottom-up in the brief's phase order:
1 tokens → 2 primitives → 3 composites → 4 screens on mock data →
5 backend models + auth middleware → 6 backend routes module-by-module →
7 wire frontend to real backend.

Work autonomously **within** a phase (self-verify per §7, don't ask between
components). At the **end** of each phase: summarise files built, test
pass/fail counts, lint/type-check status, and any SRS deviations/ambiguities,
then output the exact line **"Phase complete — safe to commit to git."** and
**stop** until told "continue". Do not start the next phase unprompted.

Pause mid-phase only if something is genuinely ambiguous or contradicts the
SRS (log it, don't guess).

---

## 9. Do-not-invent list

Do not add features, routes, fields, models, roles, or enum values that are not
in the SRS. Known temptations from the mockups that are **not** backed by the
SRS (full detail + resolutions in `COMPONENT_INVENTORY.md` §4):

- Board background **color** — not a `Board` field. Client-only, now auto-picked
  from the board id (the colour-picker UI was removed on request).
- Project tile **progress bar / percent / category** — no such `Project`
  fields. Decorative only.
- **Request Access** button on the 403 screen — no endpoint. Not wired.
- Project-level invite that **creates an account** — project invite only sets a
  role for an existing **org member** (`PUT .../members/:userId`); resolve email
  → org member first, else inline error.
- Notification types beyond `card_assigned | comment_mention | role_changed`
  (`due_soon` was removed on request — nothing generated it).
- Rich-text description is stored in the plain `Card.description: string`
  (markdown), not a new field. The B/I/list/link toolbar was removed on request.

### 9.1 Deliberate additions beyond the API contract

Kept minimal, each required to make a *documented* use case usable without an
email service (which is out of scope):

- `GET /orgs/:orgId/invites` (Owner/Admin) — list outstanding invites so the
  UI has something to show; the contract only has POST invite + POST accept.
- `DELETE /orgs/:orgId/invites/:inviteId` (Owner/Admin) — revoke a pending
  invite from that list.
- Client route `/invite/:token` (`AcceptInvitePage`) — UC-2's accept flow;
  calls the contracted `POST /orgs/invites/:inviteToken/accept`. Since no email
  is sent, the inviter copies the link from the Members page.
- `GET /orgs/invites/mine` (any authed user) — pending invites for the caller's
  own email, so the Welcome page can surface them.
- `DELETE /orgs/:orgId` (Owner-only) — the SRS §4 has no soft-delete, but the
  UI's Danger Zone needs a real cascade delete (projects → boards → cards →
  subtasks/comments/attachments, plus memberships + invites). Added on request.
- `invite_accepted` notification type — added to `NOTIFICATION_TYPES`; on
  `acceptInvite` the **inviter** (`invite.invitedById`) gets one, nobody else.
- Server DTO enrichment (`orgInviteDto`, plus the Phase 7 `cardDto`/`boardDto`
  extras, and `notification.title`) — the contract does not specify response
  bodies.

### 9.2 Real-time layer (`server/src/realtime/`)

Socket.IO shares the HTTP listener. Auth = the same access token; rooms
`user:<id>`, `org:<id>`, `board:<id>` (never a global broadcast; client joins a
board room via `subscribe:board` after an access check). Emits exactly the §6.1
catalog: `card:created` / `card:updated` / `card:moved` / `card:deleted` /
`comment:new` → `board:<id>` (from the card + comment + subtask controllers —
subtask changes re-broadcast the parent card since there is no `subtask:*`
event), and `notification:new` → `user:<id>` (from `lib/notify.ts`). The board
has no catalog event, so board name / column edits still need a refetch.

The client (`features/realtime.ts`) connects on login and, on each event, nudges
React Query to refetch the affected slice — it never trusts the payload to be
complete. Card moves are **optimistic** (`applyCardMove` in `features/cards.ts`)
and FLIP-animated (`BoardCanvas/useFlipCards.ts`, ~180ms ease-out); because FLIP
keys off the measured DOM position, the confirming event lands the card in the
same spot → it animates exactly once.

**No Redis adapter** (`@socket.io/redis-adapter`) — deliberately deferred; the
place to add it is commented in `realtime/io.ts`. Under the nginx load balancer,
`ip_hash` pins each client to one app instance so it receives that instance's
events; cross-instance fan-out needs the adapter. `deploy/` holds the nginx
config + a docker-compose (`web` nginx → `app1`/`app2` → `mongo`).

## 10. Out of scope (vision §"out of scope", requirements §3)

Epics / Sprints / Scrum ceremonies; multiple issue *types* with distinct
schemas; per-board roles; a Workspace layer; MFA/2FA; audit log; soft
deletes / trash; background job queue; idempotency keys; formal observability
stack; pluggable file-storage backend. Build so these *could* be added later
without a rewrite, but do not build them now.
