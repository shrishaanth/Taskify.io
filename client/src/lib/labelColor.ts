import type { BoardColorKey, Tone } from "../styles/tokens";

const TONES: Tone[] = [
  "sky",
  "violet",
  "green",
  "amber",
  "red",
  "purple",
  "pink",
  "slate",
];

const BOARD_COLORS: BoardColorKey[] = [
  "green",
  "purple",
  "red",
  "amber",
  "sky",
  "pink",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Deterministic chip colour for a free-form label string. `Card.labels` is
 * `[string]` in the data model — the colour is derived on the client, not
 * stored (COMPONENT_INVENTORY.md §1.10 note).
 */
export function labelToneFor(label: string): Tone {
  return TONES[hash(label) % TONES.length];
}

/**
 * Deterministic board tile colour. Board background colour is not stored
 * server-side (COMPONENT_INVENTORY.md §4 C1) — derived from the board id so it
 * stays stable across sessions.
 */
export function boardColorKeyFor(boardId: string): BoardColorKey {
  return BOARD_COLORS[hash(boardId) % BOARD_COLORS.length];
}
