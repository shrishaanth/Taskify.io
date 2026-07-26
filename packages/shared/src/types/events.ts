import type { AppEventType } from './permissions';
import type {
  Issue,
  Comment,
  Sprint,
  Membership,
} from './models';

// ── Typed Event Payloads ─────────────────────────────────────

export interface AppEventPayloadMap {
  'issue:created': { issue: Issue; actorId: string };
  'issue:updated': { issue: Issue; changes: Record<string, unknown>; actorId: string };
  'issue:deleted': { issueId: string; projectId: string; key: string; actorId: string };
  'issue:status_changed': { issue: Issue; from: string; to: string; actorId: string };
  'issue:assigned': { issue: Issue; previousAssignee: string | null; actorId: string };
  'comment:created': { comment: Comment; issueId: string; actorId: string };
  'comment:deleted': { commentId: string; issueId: string; actorId: string };
  'sprint:started': { sprint: Sprint; actorId: string };
  'sprint:completed': { sprint: Sprint; actorId: string };
  'membership:added': { membership: Membership; actorId: string };
  'membership:removed': { userId: string; scopeType: string; scopeId: string; actorId: string };
  'membership:role_changed': { userId: string; scopeType: string; scopeId: string; oldRole: string; newRole: string; actorId: string };
  'user:registered': { userId: string };
  'user:password_changed': { userId: string };
  'user:token_revoked': { userId: string };
}

export type AppEventHandler<E extends AppEventType> = (
  payload: AppEventPayloadMap[E],
) => void | Promise<void>;
