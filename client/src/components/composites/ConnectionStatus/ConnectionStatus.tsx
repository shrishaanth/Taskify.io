import { Badge } from "../../primitives/Badge/Badge";

export interface ConnectionStatusProps {
  status: "live" | "offline";
  size?: "sm" | "md";
  className?: string;
}

/** The "● Live" / "● Offline" indicator shown next to a board title (UC-11). */
export function ConnectionStatus({
  status,
  size = "sm",
  className,
}: ConnectionStatusProps) {
  const isLive = status === "live";
  return (
    <Badge
      tone={isLive ? "green" : "slate"}
      size={size}
      leadingDot
      className={className}
      aria-live="polite"
    >
      {isLive ? "Live" : "Offline"}
    </Badge>
  );
}
