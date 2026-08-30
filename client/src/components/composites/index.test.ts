import { describe, it, expect } from "vitest";
import * as composites from "./index";

describe("composites barrel", () => {
  it("exports every Phase 3 composite", () => {
    const expected = [
      "RoleBadge",
      "PriorityBadge",
      "ConnectionStatus",
      "DueDateChip",
      "DateField",
      "AddTile",
      "BoardColorPicker",
      "BoardTile",
      "ProjectTile",
      "EmptyState",
      "DangerZone",
      "PageHeader",
      "Popover",
      "SearchInput",
      "OrgSwitcher",
      "NotificationItem",
      "NotificationPanel",
      "NotificationBell",
      "UserMenu",
      "TopNavBar",
      "ProjectHeader",
      "BoardHeader",
      "KanbanCard",
      "KanbanColumn",
      "BoardCanvas",
      "MembersTable",
      "MemberRow",
      "InviteForm",
      "RichTextToolbar",
      "SubtaskItem",
      "SubtaskChecklist",
      "CommentComposer",
      "CommentItem",
      "CommentList",
      "AttachmentItem",
      "AttachmentList",
      "LabelPicker",
      "AssigneePicker",
      "CardDetailModal",
      "CreateOrganizationModal",
      "CreateProjectModal",
      "CreateBoardModal",
      "InviteMemberModal",
    ];
    for (const name of expected) {
      expect(composites, name).toHaveProperty(name);
      const value = (composites as Record<string, unknown>)[name];
      expect(["function", "object"], name).toContain(typeof value);
      expect(value, name).toBeTruthy();
    }
  });
});
