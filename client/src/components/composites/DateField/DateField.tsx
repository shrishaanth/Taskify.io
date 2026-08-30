import { useId } from "react";
import { Input } from "../../primitives/Input/Input";

export interface DateFieldProps {
  /** ISO date-time or date string. */
  value?: string;
  onChange: (value: string | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 6.5h12M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// Due dates are date-only; anchor everything at UTC midnight so the calendar
// day never drifts across timezones.
function toDateInput(value: string | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function DateField({
  value,
  onChange,
  label = "Due date",
  disabled = false,
  className,
}: DateFieldProps) {
  const id = useId();
  return (
    <Input
      id={id}
      type="date"
      aria-label={label}
      leadingIcon={<CalendarIcon />}
      value={toDateInput(value)}
      disabled={disabled}
      {...(className ? { wrapperClassName: className } : {})}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v ? new Date(`${v}T00:00:00.000Z`).toISOString() : null);
      }}
    />
  );
}
