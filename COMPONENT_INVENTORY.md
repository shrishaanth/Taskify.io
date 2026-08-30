# Taskify — Component Inventory

**Purpose:** every *reusable UI component* implied by the approved Figma mockups
(`srs/Taskify_UI_Mockups.pdf`) and the SRS. This is a catalogue of **components,
not screens**. Screens are listed only under "Used by".

Source of truth = the six SRS docs + the mockup set. Where a mockup shows
something the SRS data model / API contract does not support, it is called out
in **§4 Mockup ↔ SRS conflicts** and the component is still catalogued (the
unsupported prop is marked *decorative / not persisted*).

Build order maps to the phases in the brief:

| Tier | Phase | Contents |
|---|---|---|
| Design tokens | 1 | colors, spacing, radius, typography, shadow, z-index |
| Primitives | 2 | no business logic, no API awareness |
| Composites | 3 | built from primitives; may know about domain types + the user's role |

---

## 1. Primitives (Phase 2)

The brief names six headline primitives (**Button, Input, Avatar, Modal shell,
Badge, Chip**). The rest below are also logic-free atoms that appear across the
mockups and are needed before any composite can be built; they are in Phase 2
scope. (Flagged in §4 as a scope note.)

### 1.1 Button
- **Props:** `variant` `'primary' | 'secondary' | 'danger'`, `size` `'sm' | 'md'`,
  `leadingIcon?`, `trailingIcon?`, `fullWidth?`, `loading?`, `disabled?`,
  `type`, `onClick`, `children`.
- **Variants shown in mockups:**
  - `primary` — solid sky-blue fill, white text (design-system sheet "Primary
    Button"; "Log in", "Create account", "Create Organization", "New Project",
    "Send Invite", "Save Changes", "Comment", "Create Board").
  - `secondary` — white fill, slate border, slate text ("Secondary Button";
    "Cancel" in every modal; "Back to Projects"; "Invite Members" ghost on the
    empty-board mockup).
  - `danger` — solid red fill, white text ("Danger" swatch; "Delete
    Organization" — shown **disabled** in the Danger Zone).
  - `fullWidth` — auth forms, "Send Invite", card-detail "Comment".
  - `disabled` — "Awaiting workspace approval", "Delete Organization".
  - with `leadingIcon` — "+ New Project", "+ Create Project", "+ Invite Member",
    "+ Add your first card", "⤒ Upload file", "⚿ Request Access".
- **Used by:** every screen.

### 1.2 IconButton
- Single-icon button. **Props:** `icon`, `variant` `'ghost' | 'circle'`,
  `size`, `aria-label`, `onClick`.
- **Variants:** ghost square (column `⋯` menu, card-detail `⋯` menu, password
  eye toggle, nav bell); filled circle (modal close `⊗`, "New Board" / "New
  column" `+` circle, notification-item leading icon container).
- **Used by:** nav bar, modals, kanban column headers, card detail, auth
  password fields.
- *May be implemented as `Button` with an `iconOnly` flag — decide in Phase 2.*

### 1.3 Input
- **Props:** `value`, `onChange`, `placeholder`, `type`, `leadingIcon?`,
  `trailingIcon?` (or `trailingSlot` for the eye toggle), `state`
  `'default' | 'error'`, `errorText?`, `disabled?`, `name`, `id`.
- **Variants / states in mockups:**
  - default, hover, **focused** (sky ring + border — Create Board "Board Name").
  - `leadingIcon` — search icon ("Search projects…", "Search boards, tasks…"),
    mail icon ("colleague@acme.com", "Enter email address").
  - `trailingSlot` — password show/hide **eye** icon (login, signup).
  - `error` — inline validation message (UC-1: weak password, email in use).
- **Used by:** auth (login, signup), all create/invite modals, project invite
  panel, org settings, nav search.

### 1.4 Textarea
- Multi-line variant of Input. **Props:** `value`, `onChange`, `placeholder`,
  `rows`, `state`, `disabled?`.
- **Variants:** plain (Create Project "Project Description"); with a
  **RichTextToolbar** slot above it (card-detail Description — Bold / Italic /
  bullet-list / link buttons).
- **Used by:** Create Project modal, Card Detail modal.

### 1.5 Select
- Styled form dropdown (distinct from the behavioural Menu). **Props:**
  `value`, `onChange`, `options[]`, `leadingIcon?`, `renderValue?`
  (to show a RoleBadge inside), `disabled?`.
- **Variants:** plain chevron select; value rendered as a badge
  ("MEMBER ▾" in the org invite modal; "Member (Can view & edit) ▾" with a
  person icon in the project invite panel; inline role dropdown on each row of
  the Org Members table).
- **Used by:** Invite Member modal (Org Role), project Invite panel (Project
  Role), Org Members table (row role editor).

### 1.6 Checkbox
- **Props:** `checked`, `onChange`, `disabled?`, `size` `'sm' | 'md'`,
  `label?`.
- **Variants:** unchecked (slate outline square), **checked** (sky fill +
  white check), sm size for subtask rows.
- **Used by:** Card Detail subtask checklist.

### 1.7 Avatar
- **Props:** `src?`, `name` (for initials + deterministic color), `size`
  `'xs' | 'sm' | 'md' | 'lg'`, `showStatus?`, `status` `'online' | 'offline'`.
- **Variants shown:**
  - image avatar (most rows).
  - **initials fallback** — colored circle with 2 letters ("TW" on a board
    card, "SJ" / "AR" / "MB" / "JC" on subtask rows and the comment composer).
  - **status dot** — green online dot bottom-right (nav bar user, welcome
    screen, presence).
  - sizes: `xs` subtask/checklist assignee; `sm` card footer, comments;
    `md` nav bar, member table rows, comment author; `lg` — n/a yet.
- **Used by:** nav bar, board presence, kanban cards, card detail (assignees,
  comments, subtasks), members tables, notification items, welcome screen.

### 1.8 AvatarGroup
- Overlapping avatars with a "+N" overflow pill. **Props:** `users[]`, `max`,
  `size`, `onAdd?` (renders a trailing "+" IconButton when provided).
- **Variants:** display-only ("+3" on project tiles, "+4" on board presence);
  **editable** (trailing "+" — card-detail ASSIGNEES).
- **Used by:** nav/board presence, ProjectTile, KanbanCard footer, CardDetail
  assignees.
- *Small but reused 4×; built in Phase 2 alongside Avatar.*

### 1.9 Badge
- Small pill for a **fixed-vocabulary** status/role/count (contrast with Chip,
  which is a free-form user label).
- **Props:** `tone` `'sky' | 'violet' | 'purple' | 'green' | 'amber' | 'red' | 'slate'`,
  `variant` `'soft' | 'solid' | 'outline'`, `size`, `leadingDot?`, `children`.
- **Variants shown in mockups:**
  - role — `HEAD` / `Head` (sky), `MEMBER` / `Member` (blue or green),
    `OWNER` (pink/red), `ADMIN` (violet), `NO ACCESS` (slate + lock glyph).
  - status — `● Live` (green dot), `● Offline` (slate dot), `Active` (green),
    `No Access` (solid slate pill overlaid on the locked project card).
  - priority — `High Priority` (amber soft) → generalised to low/medium/high/urgent.
  - count — solid red circle with a number on the notification bell ("3").
  - category label on project tiles ("Web Development", "Marketing", "Finance"
    — muted slate text, borderless).
- **Used by:** nav bar, Projects list, members tables, board header, kanban
  card, card detail, notification bell.
- Thin domain wrappers over Badge, built in Phase 3: **RoleBadge**,
  **PriorityBadge**, **StatusBadge** (see §2).

### 1.10 Chip (label / tag)
- Free-form colored label — the mockup's "Vibrant Label Chips".
- **Props:** `color` `'red' | 'amber' | 'green' | 'blue' | 'violet' | 'purple' | 'pink' | 'slate'`,
  `removable?`, `onRemove?`, `children`; plus an **add** rendering (`+` chip).
- **Variants shown:** static color chip ("High Priority", "In Progress",
  "Under Review", "Completed", "Marketing", "Feature Request", "Design",
  "Development", "Bug", "Research", "Docs", "Tokens", "Q1"); **removable**
  (card-detail LABELS chips have an implied remove); **add** ("+" chip after
  the LABELS list).
- **Used by:** design-system sheet, KanbanCard, KanbanCard variant demo,
  CardDetail LABELS.
- **Note:** `Card.labels` is `[string]` in the data model — the chip *color* is
  a client-side deterministic mapping from the label string, not a stored
  field (see §4).

### 1.11 Modal (shell)
- **Props:** `open`, `onClose`, `size` `'sm' | 'lg'`, `title`, `titleIcon?`,
  `headerSlot?`, `footerSlot?`, `closeOnBackdrop = true`, `closeOnEsc = true`,
  `children`.
- **Structure:** backdrop (dim + optional blur) → centered panel, 16px radius,
  large drop shadow → header (icon + title + close `⊗`) → optional divider →
  body → footer (actions right-aligned).
- **Variants:**
  - `sm` — Create Organization, Create Project, Create Board, Invite Member.
  - `lg` — **Card Detail** (two-column, tall, internal scroll; header carries a
    breadcrumb eyebrow + `⋯` menu + close).
- **Interactions to test:** close on `⊗`, close on backdrop click, close on
  `Esc`, focus trap, body scroll lock.
- **Used by:** every modal + CardDetailModal.

### 1.12 Surface / Card
- White rounded container, subtle border + shadow; the base for tiles, table
  wrappers, the settings card, the invite panel, empty-state panels.
- **Props:** `padding`, `as`, `interactive?` (adds hover elevation + pointer),
  `muted?` (locked/no-access look — desaturated, no hover, `cursor: not-allowed`).
- **Used by:** ProjectTile, BoardTile, MembersTable wrapper, Org Settings card,
  InvitePanel, EmptyState panel, NotificationItem.

### 1.13 ProgressBar
- **Props:** `value` (0–100) or `current`/`total`, `tone` (default sky).
- **Variants:** card-detail subtasks ("3/5 completed", ~60% fill); project-card
  demo (70%).
- **Used by:** SubtaskChecklist; ProjectTile *(demo only — see §4)*.

### 1.14 Skeleton
- Gray pulsing placeholder. **Props:** `variant` `'line' | 'block' | 'circle'`,
  `width`, `height`, `count?`.
- **Used by:** loading state of the board view (page 6E) — breadcrumb, column
  headers, card blocks, avatar circles; reuse for Projects list + members
  tables while fetching.

### 1.15 Spinner
- Inline indeterminate loader for buttons (`Button loading`) and small async
  regions. Not explicitly drawn but required by NFR-4.2 (optimistic UI) and the
  loading conventions.

### 1.16 Menu / Popover (behavioural)
- Anchored floating panel with a trigger. **Props:** `trigger`, `items[]` or
  `children`, `placement`, `open`/`onOpenChange`.
- **Variants shown:** org switcher menu (nav), notification panel (nav),
  user menu (nav avatar), kanban **column `⋯`** menu (rename / reorder /
  delete column — FR-3.2), card-detail **`⋯`** menu (edit / delete card).
- **Used by:** TopNavBar, KanbanColumn, CardDetailModal.

### 1.17 Tabs
- **Props:** `tabs[] {id,label,icon}`, `activeId`, `onChange`.
- **Variant:** underline-active, icon + label ("▦ Boards" / "people Members" on
  the project detail screen).
- **Used by:** ProjectHeader.

### 1.18 Breadcrumbs
- **Props:** `items[] {label, href?}`; last item = current (non-link,
  colored/bold).
- **Variants:** "Acme Design Studio / E-Commerce Redesign",
  "… / E-Commerce Redesign / Sprint Backlog", "Acme Design Studio / Members",
  "Acme Design Studio / Settings".
- **Used by:** ProjectHeader, BoardHeader, Org Members, Org Settings.

### 1.19 Divider
- 1px slate hairline; modal header/body separators, Org Settings section split.

### 1.20 Toast
- Transient corner notification. **Props:** `tone` `'info' | 'success' | 'error'`,
  `title`, `description?`, `duration`, `onDismiss`.
- Required by **FR-6.2** (toast when the user is active) though not drawn in the
  mockups; styling inferred from the token set.
- **Used by:** global ToastProvider (card assigned, comment on watched card,
  role changed, generic save errors).

---

## 2. Composites (Phase 3)

Built from primitives. May import shared domain types and may branch on the
current user's **Project role / Org role** (permission-driven rendering — a
Phase 3 test requirement).

### 2.1 RoleBadge
- Maps a role → `Badge` tone + label. **Props:** `scope` `'org' | 'project'`,
  `role` (`owner|admin|member` or `head|member`) `| 'no-access'`,
  `editable?`, `onChange?` (renders as a `Select` when editable).
- **Variants:** static (`HEAD`, `MEMBER`, `Head`, `Member`); editable dropdown
  (`OWNER ▾`, `ADMIN ▾`, `MEMBER ▾` — Org Members table); `NO ACCESS` + lock.
- **Used by:** Projects list, Org Members table, Project Members table, project
  invite panel value.

### 2.2 PriorityBadge
- **Props:** `priority` `'low' | 'medium' | 'high' | 'urgent'`.
- Maps to tone (low = slate, medium = sky, high = amber, urgent = red) + label
  ("High Priority" shown).
- **Used by:** CardDetail PRIORITY; optionally KanbanCard.

### 2.3 StatusBadge / ConnectionStatus
- **ConnectionStatus** — `● Live` (green) / `● Offline` (slate) pair beside the
  board title; driven by socket state (UC-11).
- **Used by:** BoardHeader.

### 2.4 DueDateChip
- **Props:** `date`, `variant` auto-derived: `'default'` (slate, calendar
  glyph) vs `'overdue'` (red glyph + red text, `date < today` and card not in a
  "done" column) vs `'none'` (muted "No due date").
- **Used by:** KanbanCard footer, KanbanCard variant demo (A default, B
  overdue). Card detail uses **DateField** (editable) instead.

### 2.5 DateField
- Editable due date — calendar icon + formatted date, opens a date picker;
  clearable. **Props:** `value`, `onChange`.
- **Used by:** CardDetailModal DUE DATE.

### 2.6 KanbanCard
- **Props:** `card` (`{ id, title, labels[], assignees[], dueDate?, priority?,
  subtaskDone, subtaskTotal, commentCount }`), `isDragging?`, `onOpen`.
- **Composition:** Chip row (labels) → title → footer row: `DueDateChip` +
  subtask indicator (`▣ 3/5`) + comment indicator (`💬 2`) + trailing `Avatar`.
- **Variants (explicitly in the mockup "Card Component Variants"):**
  - **(A) default** — white surface, subtle shadow.
  - **(B) overdue** — identical layout, `DueDateChip` in the red/overdue style.
  - **(C) dragging** — slight rotation, sky border, elevated shadow, a dashed
    translucent drop-placeholder behind it.
  - edge: **0/4** subtasks (empty checklist), **no due date**, **no assignee**,
    **many labels** wrap.
- **Used by:** Board view, variant demo.

### 2.7 KanbanColumn
- **Props:** `column` (`{ id, name, order }`), `cards[]`, `onAddCard`,
  `onRename`, `onDelete`, `onReorder`, `isDropTarget?`.
- **Composition:** header (name + count `Badge` + `⋯` `Menu`) → droppable card
  list → "＋ Add a card" footer button.
- **Variants:** default, **empty** (no cards, just the add-card button),
  **add-column placeholder** (dashed border, `+` circle, "Add column").
- **Used by:** Board view.

### 2.8 BoardCanvas
- Horizontal scroll container laying out `KanbanColumn`s + the add-column
  placeholder; owns drag-and-drop context and optimistic move (UC-6, NFR-4.2).
- **Used by:** Board view; its empty state (no columns/cards) renders
  `EmptyState` "This board is empty".

### 2.9 ProjectTile
- **Props:** `project` (`{ id, name, description?, category? }`),
  `role` `'head' | 'member' | null`, `members[]`, `onOpen`.
- **Variants (mockups pages 2, 6C, 6-empty):**
  - **accessible** — `RoleBadge` top-left, muted category top-right, name,
    truncated description, divider, `AvatarGroup` + "Open Board →" link.
  - **no-access / locked** — `NO ACCESS` badge, name only (muted), "Private
    project board" + lock icon, **no** description / avatars / open link,
    `Surface muted` (no hover, `cursor: not-allowed`). This is the FR-2.3
    name-only visibility.
- **Used by:** Projects list, Projects empty-state screen, "Project Card
  States" demo.
- *Progress bar + due date on the page-6C demo tile are **decorative** — see §4.*

### 2.10 BoardTile
- **Props:** `board` (`{ id, name }`), `cardCount`, `colorKey`, `onOpen`.
- **Variants:**
  - colored tile — pastel background (green / purple / red / amber / blue /
    pink), matching-tint name + "Open Board →" link + "▣ N cards".
  - **add tile** — dashed sky border, `+` circle, "New Board".
- **Used by:** Project detail → Boards tab.
- *`colorKey` is **not** in the `Board` data model — see §4.*

### 2.11 AddTile
- Generic dashed "add" placeholder tile (`+` circle + label). Shared shape
  behind BoardTile's add variant and KanbanColumn's add-column placeholder.
- **Props:** `label`, `onClick`.

### 2.12 MembersTable + MemberRow
- **MemberRow props:** `member` (`{ user, email, role }`), `scope`
  `'org' | 'project'`, `canManage` (bool from viewer's role), `onChangeRole`,
  `onRemove`.
- **Columns:** avatar + name, email, `RoleBadge` (editable when `canManage`),
  actions (`trash` IconButton when `canManage`).
- **Permission-driven rendering (Phase 3 test):**
  - org scope — role editor + remove shown only to Org Owner/Admin.
  - project scope — shown only to Project Head **or** Org Owner/Admin.
  - the last Owner's remove/downgrade is disabled (FR-1.6).
- **Used by:** Org Members screen, Project detail → Members tab.

### 2.13 InviteForm
- **Props:** `scope` `'org' | 'project'`, `onSubmit({ email, role })`,
  `pending?`.
- **Variants:**
  - **org** (modal body) — Email `Input` + Org Role `Select` (Admin / Member)
    + "Send Invite".
  - **project** (sidebar `Surface` card "Invite Member") — "Search by Email
    Address" `Input` (mail icon) + "Assign Project Role" `Select`
    (Head / Member, shown as "Member (Can view & edit)") + full-width
    "Send Invite".
- **Used by:** InviteMemberModal (org), Project Members tab (project).

### 2.14 NotificationItem
- **Props:** `notification` (`{ type, payload, read, createdAt }`), `onClick`.
- **Type → leading icon** (`Notification.type` enum): `card_assigned` → document,
  `comment_mention` → chat bubble, `role_changed` → shield, `due_soon` → clock.
- **Variants:** **unread** (tinted `Surface`, colored icon, trailing blue dot);
  **read** (white `Surface`, slate icon, no dot).
- **Used by:** NotificationPanel.

### 2.15 NotificationPanel
- Popover: header ("Notifications" + "Mark all as read" link) → scrollable
  `NotificationItem` list → **empty state** ("✓ You're all caught up! / No new
  alerts. Enjoy your clean inbox.").
- **Props:** `notifications[]`, `onMarkAllRead`, `onItemClick`.
- **Used by:** NotificationBell in TopNavBar.

### 2.16 EmptyState
- **Props:** `icon`, `tone` `'sky' | 'red' | 'slate'`, `title`, `description`,
  `actions?` (0–2 Buttons).
- **Variants (mockups page 6):**
  - **no-projects** — sky clipboard-check icon, "No projects yet", "＋ Create
    Project".
  - **empty-board** — red board-columns icon, "This board is empty", "＋ Add
    your first card".
  - **access-denied** — red shield-`!` icon, "You don't have access to this
    project", actions "Request Access" (primary) + "Back to Projects"
    (secondary).  *(403 case, FR-2.3 / UC-10 contrast.)*
  - **notifications caught-up** — small slate check, no action.
- **Used by:** Projects list, BoardCanvas, project route guard, NotificationPanel.

### 2.17 DangerZone
- Red-tinted `Surface`: red heading + description + destructive `Button` +
  helper text ("Requires no other Owners").
- **Props:** `title`, `description`, `actionLabel`, `onAction`, `disabled?`,
  `helperText?`.
- **Used by:** Org Settings. *"Delete Organization" has no API endpoint in
  scope — see §4; button ships disabled, matching the mockup.*

### 2.18 PageHeader
- **Props:** `title`, `subtitle?`, `breadcrumbs?`, `action?` (right-aligned
  Button).
- **Variants:** "Projects" + "＋ New Project"; "Members" + "＋ Invite Member";
  "Organization Settings" (no action); project/board headers embed it.
- **Used by:** Projects, Org Members, Org Settings, Project/Board headers.

### 2.19 TopNavBar
- Composition: logo → `OrgSwitcher` → spacer → `SearchInput` →
  `NotificationBell` → `UserMenu`.
- **Props:** `orgs[]`, `currentOrg`, `onSwitchOrg`, `unreadCount`, `user`.
- **Used by:** every authenticated screen. (The welcome screen shows a reduced
  variant: logo + name + avatar only.)

### 2.20 OrgSwitcher
- Trigger: colored initial `Badge` + org name + chevron. `Menu`: list of the
  user's orgs + "Create Organization" action (opens CreateOrganizationModal).
- **Props:** `orgs[]`, `currentOrgId`, `onSwitch`, `onCreate`.

### 2.21 NotificationBell
- `IconButton` (bell) + count `Badge`; opens `NotificationPanel`.
- **Props:** `unreadCount`, `notifications[]`, handlers.

### 2.22 UserMenu
- `Avatar` (status dot) trigger → `Menu`: profile, "Log out" (POST
  `/auth/logout`), "Log out all devices" (POST `/auth/logout-all`).

### 2.23 SearchInput
- `Input` with a leading search icon; debounced `onSearch`. Placeholder varies
  by context ("Search projects…", "Search boards, tasks…").

### 2.24 ProjectHeader
- `Breadcrumbs` + project name (H1) + description + `Tabs` (Boards / Members).
- **Props:** `project`, `activeTab`, `onTabChange`.

### 2.25 BoardHeader
- `Breadcrumbs` + board name (H1) + `ConnectionStatus` + presence
  `AvatarGroup`.
- **NO invite control** — removed per the mockup-set correction note and
  FR-3.1 (boards have no membership of their own).
- **Props:** `board`, `connection` `'live' | 'offline'`, `presence[]`.

### 2.26 RichTextToolbar
- Bold / Italic / bullet-list / link `IconButton`s over the description
  `Textarea`. **Props:** `onCommand(cmd)`. Display vs edit mode.
- **Used by:** CardDetailModal Description.

### 2.27 SubtaskItem
- `Checkbox` + editable title (strike-through when done) + assignee `Avatar`
  (`xs`, initials) + remove `IconButton`.
- **Props:** `subtask` (`{ id, title, assigneeId?, done }`), `onToggle`,
  `onEdit`, `onAssign`, `onDelete`.
- **Used by:** SubtaskChecklist.

### 2.28 SubtaskChecklist
- Header ("Subtasks Checklist" + "n/m completed") → `ProgressBar` →
  `SubtaskItem` list → "＋ Add checklist subtask" link.
- **Props:** `subtasks[]`, handlers. Edge cases: empty list (0/0, no bar or
  0%), all done (100%).
- **Used by:** CardDetailModal.

### 2.29 CommentComposer
- `Avatar` + `Input` ("Write a comment or ask for feedback…") + "Comment"
  `Button`.
- **Props:** `currentUser`, `onSubmit(body)`, `pending?`.

### 2.30 CommentItem
- `Avatar` + author name + relative timestamp ("2 hours ago") + body; delete
  `IconButton` shown to the **author, a Project Head, or an Org Owner/Admin**
  (API contract, Comments DELETE).
- **Props:** `comment`, `canDelete`, `onDelete`.

### 2.31 CommentList
- `CommentComposer` + reverse-chronological `CommentItem`s.
- **Props:** `comments[]`, `currentUser`, handlers.

### 2.32 AttachmentItem
- File-type icon + filename + size + download / delete `IconButton` (delete
  shown to uploader / Project Head / Org Owner-Admin — API contract).
- **Props:** `attachment` (`{ id, fileName, fileUrl, mimeType, sizeBytes,
  uploadedById }`), `canDelete`, `onDelete`.

### 2.33 AttachmentList
- `AttachmentItem`s + "⤒ Upload file" dashed dropzone button.
- **Props:** `attachments[]`, `onUpload`, `permissions`.

### 2.34 LabelPicker
- Selected `Chip`s (removable) + "+" chip → popover to add/create a label
  string.
- **Props:** `labels[]` (strings), `onChange`.
- **Used by:** CardDetailModal LABELS.

### 2.35 AssigneePicker
- `AvatarGroup` with a trailing "+" → popover listing project members to
  toggle. Enforces UC-5 (assignee must have project access) at call sites.
- **Props:** `assignees[]`, `candidates[]`, `onChange`.

### 2.36 CardDetailModal
- `Modal size="lg"`. Header: breadcrumb eyebrow ("E-COMMERCE REDESIGN / SPRINT
  BACKLOG") + card title + `⋯` `Menu` + close.
  - **Left column:** "Description" (`RichTextToolbar` + body), `SubtaskChecklist`,
    "Activity Comments" (`CommentList`).
  - **Right sidebar:** ASSIGNEES (`AssigneePicker`), LABELS (`LabelPicker`),
    DUE DATE (`DateField`), PRIORITY (`PriorityBadge` / picker),
    ATTACHMENTS (`AttachmentList`).
- **Props:** `cardId`, `open`, `onClose`; loads full card detail.
- **Permission-driven:** read-only rendering if the viewer is not a Head/Member
  of the board's project (they shouldn't reach it, but guard anyway);
  card `⋯` delete hidden unless Head/Member.
- **Used by:** Board view (open a card).

### 2.37 Create*Modal family
Thin `Modal size="sm"` + form compositions. Each: title + icon, fields,
Cancel + primary action.
- **CreateOrganizationModal** — body copy + "Organization Name" `Input`
  ("e.g. Acme Design Studio") → "Create Workspace".  *(POST `/orgs`.)*
- **CreateProjectModal** — "Project Name" `Input` + "Project Description
  (Optional)" `Textarea` → "Create".  *(POST `/orgs/:orgId/projects`.)*
- **CreateBoardModal** — "Board Name" `Input` + **BoardColorPicker** →
  "Create Board".  *(POST `/projects/:projectId/boards`.)*
- **InviteMemberModal** — `InviteForm scope="org"` → "Send Invite".
  *(POST `/orgs/:orgId/invites`.)*

### 2.38 BoardColorPicker
- Row of 6 pastel swatch radio circles; selected = check + sky ring.
- **Props:** `value`, `onChange`.
- **Used by:** CreateBoardModal. *Client-only preference — see §4.*

### 2.39 RouteGuard / AccessBoundary
- Wraps project/board routes: resolves the viewer's membership, renders
  children, or the `EmptyState` **access-denied** variant on 403, or a
  not-found page on 404 (cross-tenant — UC-10). Not visual itself but the place
  the 403-vs-404 distinction is realised in the UI.

---

## 3. Screen → component map (reference, not built as components)

| Screen | Key components |
|---|---|
| Login / Signup | Surface, Input (+eye), Button(fullWidth), link |
| Post-signup welcome | TopNavBar(reduced), EmptyState-like choice cards, CreateOrganizationModal |
| Create Organization | CreateOrganizationModal |
| Projects list | TopNavBar, PageHeader, ProjectTile (accessible / no-access), EmptyState(no-projects), CreateProjectModal |
| Project detail — Boards | TopNavBar, ProjectHeader(Tabs), BoardTile (colored / add), CreateBoardModal, EmptyState |
| Project detail — Members | TopNavBar, ProjectHeader, MembersTable(project), InviteForm(project) |
| Board view | TopNavBar, BoardHeader(ConnectionStatus, presence), BoardCanvas → KanbanColumn → KanbanCard, EmptyState(empty-board), Skeleton(loading), CardDetailModal |
| Card detail | CardDetailModal and everything in §2.36 |
| Org Members (admin) | TopNavBar, PageHeader, MembersTable(org), InviteMemberModal |
| Org Settings | TopNavBar, PageHeader, Surface(name form), DangerZone |
| Notifications | NotificationBell → NotificationPanel → NotificationItem |
| 403 project | EmptyState(access-denied) via RouteGuard |
| Loading | Skeleton |

---

## 4. Mockup ↔ SRS conflicts & ambiguities

These are catalogued now so Phase 1–4 don't silently invent data. **Resolution
column = how the build will treat it unless you tell me otherwise.**

| # | Mockup shows | SRS says | Resolution |
|---|---|---|---|
| C1 | **Create Board** has a "Board Background Color" picker; Boards tab tiles are pastel-colored | `Board` model = `{ organizationId, projectId, name, columns[] }` — no color field | Build `BoardColorPicker` + `BoardTile.colorKey` as a **client-only** value: deterministic from board id/name, or persisted later. Not sent to the API. Flag for your call in Phase 3. |
| C2 | "Project Card States" demo tile (page 6C) has a **progress bar** + **due date** | No progress/percent or due-date field on `Project` | Treat as **decorative demo only**. Canonical `ProjectTile` = page 2 (no progress bar). Not built. |
| C3 | Org Settings **"Delete Organization"** button (Danger Zone) | No `DELETE /orgs/:orgId` in the API contract; "no soft delete / cascade infra" is explicitly deferred | Ship the `DangerZone` visually with the button **disabled** (as the mockup already shows). No client call, no route. |
| C4 | 403 screen **"Request Access"** button | No "request access" endpoint or notification type | Render the button but treat as **not wired** in this scope (disabled or hidden behind a flag). "Back to Projects" works. |
| C5 | Empty-board mockup (page 6B) still shows an **"Invite Members"** button in the board header | Mockup-set **correction note** + FR-3.1: boards have no membership; invite happens at project level only | `BoardHeader` has **no** invite control. The page-4 board header (authoritative) omits it. |
| C6 | Project **Invite Member** panel: "Search by Email Address" | API: `PUT /orgs/:orgId/projects/:projectId/members/:userId` sets a role by **userId**, and the user must already have an `OrgMembership` | `InviteForm(project)` resolves the email to an existing **org member**, then calls the PUT. If the email isn't an org member → inline error ("invite them to the organization first"). No cross-step account creation at project level. |
| C7 | Notification example "New task added to 'Q3 Marketing'" | `Notification.type` enum = `card_assigned | comment_mention | role_changed | due_soon` only | Only the four enum types exist. The "new task added" sample maps to nothing in scope and is ignored. |
| C8 | Design-system sheet shows only 3 named color tokens (`#0284c7`, `#0f172a`, `#f8fafc`) + 6 label-chip colors, no full ramp | Tokens must "match the Figma style guide" | Phase 1 anchors on the 3 named values and derives a small, consistent ramp (sky / slate families + red/amber/green/violet/purple/pink chip tints in the shown `-100 bg / -700 text` pattern). Exact chip hexes will be listed in Phase 1 for your review. |
| C9 | Brief's Phase 2 names 6 primitives; mockups require ~15 logic-free atoms (IconButton, Checkbox, Select, Menu, Tabs, Breadcrumbs, ProgressBar, Skeleton, Spinner, Divider, Toast, AvatarGroup) | — | All are in **Phase 2 scope** (no business logic). The 6 named ones are the headline set; the rest are supporting atoms. Called out here so the Phase 2 checkpoint isn't a surprise. |
| C10 | Card detail has a **rich-text** description toolbar (B / I / list / link) | `Card.description` is a plain `string` | Store markdown/plain text in the single `string` field; the toolbar emits markdown. No schema change. |
| C11 | "Category" text on project tiles ("Web Development", "Finance"…) | No `category`/`tag` field on `Project` | Treat as **decorative placeholder** in mock-data phase; drop from the real `ProjectTile` when wiring Phase 7 unless you add a field. |
| C12 | Board header "Active" badge (page 6B) | No board status/archived field in scope | Decorative; not built. Only `ConnectionStatus` (Live/Offline, socket-derived) is real. |

Nothing above is blocking for Phases 1–2. C1, C4, C6, C11 want a decision by
the phase that reaches them; each has a safe default above.
