import { cn } from "../../utils/cn";
import { IconButton } from "../../primitives/IconButton/IconButton";
import styles from "./RichTextToolbar.module.css";

export type RichTextCommand = "bold" | "italic" | "bulletList" | "link";

export interface RichTextToolbarProps {
  onCommand: (command: RichTextCommand) => void;
  disabled?: boolean;
  className?: string;
}

const BUTTONS: { command: RichTextCommand; label: string; glyph: string }[] = [
  { command: "bold", label: "Bold", glyph: "B" },
  { command: "italic", label: "Italic", glyph: "I" },
  { command: "bulletList", label: "Bulleted list", glyph: "☰" },
  { command: "link", label: "Insert link", glyph: "🔗" },
];

export function RichTextToolbar({
  onCommand,
  disabled = false,
  className,
}: RichTextToolbarProps) {
  return (
    <div className={cn(styles.root, className)} role="toolbar" aria-label="Text formatting">
      {BUTTONS.map((b) => (
        <IconButton
          key={b.command}
          label={b.label}
          size="sm"
          disabled={disabled}
          onClick={() => onCommand(b.command)}
          icon={<span aria-hidden="true">{b.glyph}</span>}
        />
      ))}
    </div>
  );
}
