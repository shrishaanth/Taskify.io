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

export function labelToneFor(label: string): Tone {
  return TONES[hash(label) % TONES.length];
}

export function boardColorKeyFor(boardId: string): BoardColorKey {
  return BOARD_COLORS[hash(boardId) % BOARD_COLORS.length];
}
