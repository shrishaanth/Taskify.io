import { AvatarGroup } from "../../primitives/AvatarGroup/AvatarGroup";
import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import { IconButton } from "../../primitives/IconButton/IconButton";
import type { Id, UserRef } from "../../../types/domain";

export interface AssigneePickerProps {
  assignees: UserRef[];
  /** Users eligible to be assigned (project members — UC-5). */
  candidates: UserRef[];
  onChange: (userIds: Id[]) => void;
  canEdit?: boolean;
  className?: string;
}

export function AssigneePicker({
  assignees,
  candidates,
  onChange,
  canEdit = true,
  className,
}: AssigneePickerProps) {
  const assignedIds = new Set(assignees.map((a) => a.id));

  const toggle = (id: Id) => {
    const next = assignedIds.has(id)
      ? [...assignedIds].filter((x) => x !== id)
      : [...assignedIds, id];
    onChange(next);
  };

  const items: MenuItem[] = candidates.map((c) => ({
    id: c.id,
    label: `${assignedIds.has(c.id) ? "✓ " : ""}${c.name}`,
    onSelect: () => toggle(c.id),
  }));

  const group = (
    <AvatarGroup
      className={className}
      avatars={assignees.map((a) => ({
        name: a.name,
        ...(a.avatarUrl ? { src: a.avatarUrl } : {}),
      }))}
      max={5}
      size="sm"
    />
  );

  if (!canEdit) return group;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
      {group}
      <Menu
        menuLabel="Assign members"
        placement="bottom-start"
        trigger={
          <IconButton
            label="Add assignee"
            variant="circle"
            size="sm"
            icon={<span aria-hidden="true">+</span>}
          />
        }
        items={items}
      />
    </span>
  );
}
