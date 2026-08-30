import { Badge } from "../../primitives/Badge/Badge";
import { priorityTone } from "../../../styles/tokens";
import type { Priority } from "../../../types/domain";

const LABELS: Record<Priority, string> = {
  low: "Low Priority",
  medium: "Medium Priority",
  high: "High Priority",
  urgent: "Urgent",
};

export interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md";
  className?: string;
}

export function PriorityBadge({
  priority,
  size = "md",
  className,
}: PriorityBadgeProps) {
  return (
    <Badge tone={priorityTone[priority]} size={size} className={className}>
      {LABELS[priority]}
    </Badge>
  );
}
