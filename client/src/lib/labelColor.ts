import type { Tone } from "../styles/tokens";

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

/**
 * Deterministic chip colour for a free-form label string. `Card.labels` is
 * `[string]` in the data model — the colour is derived on the client, not
 * stored (COMPONENT_INVENTORY.md §1.10 note).
 */
export function labelToneFor(label: string): Tone {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return TONES[Math.abs(hash) % TONES.length];
}
