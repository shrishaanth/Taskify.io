import type { AppNotification } from "../types/domain";

/**
 * The page a notification is about, or null when it carries too little to
 * build one (notifications created before the ids were recorded).
 */
export function notificationHref(n: AppNotification): string | null {
  const p = n.payload ?? {};
  const org = p.organizationId;
  if (!org) return null;

  switch (n.type) {
    case "card_assigned":
    case "comment_mention":
      return p.projectId && p.boardId && p.cardId
        ? `/orgs/${org}/projects/${p.projectId}/boards/${p.boardId}?card=${p.cardId}`
        : null;
    case "role_changed":
      return p.scope === "project" && p.projectId
        ? `/orgs/${org}/projects/${p.projectId}`
        : `/orgs/${org}/projects`;
    case "invite_accepted":
      return `/orgs/${org}/members`;
    default:
      return null;
  }
}
