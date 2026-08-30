export const ORG_ROLES = ["owner", "admin", "member"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PROJECT_ROLES = ["head", "member"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const NOTIFICATION_TYPES = [
  "card_assigned",
  "comment_mention",
  "role_changed",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
