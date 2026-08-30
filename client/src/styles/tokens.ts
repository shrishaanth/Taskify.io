/**
 * Taskify design tokens — typed constants.
 *
 * This is the JS/TS mirror of tokens.css. Both files are generated from the
 * Figma "Design System & Reference Sheet" and MUST stay in exact sync —
 * tokens.test.ts cross-checks every value against tokens.css and fails on drift.
 *
 * Use `tokens.*` in TS where a raw value is needed (deterministic color maps in
 * Chip/Avatar, canvas math, tests). In component styling prefer the CSS custom
 * properties via `cssVar(...)` so theming stays in one place.
 */

/* ------------------------------------------------------------------------- */
/* Primitive color ramps                                                     */
/* ------------------------------------------------------------------------- */
export const color = {
  white: "#ffffff",
  black: "#000000",

  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
  },
} as const;

/* ------------------------------------------------------------------------- */
/* Typography                                                                */
/* ------------------------------------------------------------------------- */
export const fontFamily = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
} as const;

export const fontSize = {
  xs: "0.75rem", // 12 — Caption
  sm: "0.875rem", // 14
  md: "1rem", // 16 — Body
  lg: "1.125rem", // 18
  xl: "1.25rem", // 20
  "2xl": "1.5rem", // 24 — H2
  "3xl": "2rem", // 32
  "4xl": "2.5rem", // 40 — H1
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: "1.15",
  snug: "1.3",
  normal: "1.5",
  relaxed: "1.65",
} as const;

export const letterSpacing = {
  tight: "-0.02em",
  normal: "0em",
  wide: "0.04em",
} as const;

/**
 * The four type roles named explicitly in the Figma sheet:
 *   H1  Inter Bold 40px   ·   H2  Inter Bold 24px
 *   Body Inter Regular 16px   ·   Caption Inter Semibold 12px
 */
export const textStyle = {
  h1: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.wide,
  },
} as const;

/* ------------------------------------------------------------------------- */
/* Spacing — 4px base grid                                                   */
/* ------------------------------------------------------------------------- */
export const space = {
  "0": "0",
  px: "1px",
  "0.5": "0.125rem",
  "1": "0.25rem",
  "1.5": "0.375rem",
  "2": "0.5rem",
  "2.5": "0.625rem",
  "3": "0.75rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "8": "2rem",
  "10": "2.5rem",
  "12": "3rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
} as const;

/* ------------------------------------------------------------------------- */
/* Radius                                                                    */
/* ------------------------------------------------------------------------- */
export const radius = {
  none: "0",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px", // modal shell — the one radius named in the Figma sheet
  "2xl": "20px",
  full: "9999px",
} as const;

/* ------------------------------------------------------------------------- */
/* Elevation                                                                 */
/* ------------------------------------------------------------------------- */
export const shadow = {
  xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
  sm: "0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
  md: "0 4px 12px -2px rgb(15 23 42 / 0.1), 0 2px 6px -2px rgb(15 23 42 / 0.06)",
  lg: "0 12px 28px -6px rgb(15 23 42 / 0.14), 0 6px 12px -6px rgb(15 23 42 / 0.08)",
  modal:
    "0 24px 60px -12px rgb(15 23 42 / 0.28), 0 10px 24px -8px rgb(15 23 42 / 0.16)",
  dragging:
    "0 18px 40px -8px rgb(2 132 199 / 0.28), 0 6px 14px -6px rgb(15 23 42 / 0.12)",
  focus: "0 0 0 3px rgb(14 165 233 / 0.35)",
} as const;

/* ------------------------------------------------------------------------- */
/* Z-index                                                                   */
/* ------------------------------------------------------------------------- */
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 1000,
  sticky: 1010,
  header: 1020,
  backdrop: 1030,
  modal: 1040,
  popover: 1050,
  toast: 1060,
  tooltip: 1070,
} as const;

/* ------------------------------------------------------------------------- */
/* Motion                                                                    */
/* ------------------------------------------------------------------------- */
export const duration = {
  fast: "120ms",
  base: "180ms",
  slow: "260ms",
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  emphasized: "cubic-bezier(0.3, 0, 0, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/* ------------------------------------------------------------------------- */
/* Breakpoints                                                               */
/* ------------------------------------------------------------------------- */
export const breakpoint = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/* ======================================================================= */
/* Semantic tokens — reference primitives; components use these names       */
/* ======================================================================= */
export const semantic = {
  bg: {
    app: color.slate[50],
    surface: color.white,
    surfaceMuted: color.slate[100],
    subtle: color.slate[50],
    inverse: color.slate[900],
    overlay: "rgb(15 23 42 / 0.55)",
  },
  border: {
    subtle: color.slate[200],
    default: color.slate[200],
    strong: color.slate[300],
    focus: color.sky[500],
  },
  text: {
    primary: color.slate[900],
    secondary: color.slate[600],
    muted: color.slate[400],
    inverse: color.white,
    link: color.sky[600],
    onPrimary: color.white,
    onDanger: color.white,
  },
  primary: {
    default: color.sky[600],
    hover: color.sky[700],
    active: color.sky[800],
    subtle: color.sky[100],
    fg: color.white,
  },
  danger: {
    default: color.red[600],
    hover: color.red[700],
    active: color.red[800],
    subtle: color.red[100],
    fg: color.white,
  },
  success: {
    default: color.green[600],
    subtle: color.green[100],
    fg: color.white,
  },
  warning: {
    default: color.amber[500],
    subtle: color.amber[100],
    fg: color.slate[900],
  },
  status: {
    online: color.green[500],
    offline: color.slate[400],
  },
  focusRing: "rgb(14 165 233 / 0.35)",
} as const;

/* ------------------------------------------------------------------------- */
/* Label / badge tones                                                       */
/* ------------------------------------------------------------------------- */
export type Tone =
  | "sky"
  | "slate"
  | "red"
  | "amber"
  | "green"
  | "violet"
  | "purple"
  | "rose"
  | "pink";

type ToneSet = {
  soft: { bg: string; fg: string };
  solid: { bg: string; fg: string };
};

export const labelTone: Record<Tone, ToneSet> = {
  sky: {
    soft: { bg: color.sky[100], fg: color.sky[700] },
    solid: { bg: color.sky[600], fg: color.white },
  },
  slate: {
    soft: { bg: color.slate[100], fg: color.slate[700] },
    solid: { bg: color.slate[600], fg: color.white },
  },
  red: {
    soft: { bg: color.red[100], fg: color.red[700] },
    solid: { bg: color.red[600], fg: color.white },
  },
  amber: {
    soft: { bg: color.amber[100], fg: color.amber[700] },
    solid: { bg: color.amber[500], fg: color.slate[900] },
  },
  green: {
    soft: { bg: color.green[100], fg: color.green[700] },
    solid: { bg: color.green[600], fg: color.white },
  },
  violet: {
    soft: { bg: color.violet[100], fg: color.violet[700] },
    solid: { bg: color.violet[600], fg: color.white },
  },
  purple: {
    soft: { bg: color.purple[100], fg: color.purple[700] },
    solid: { bg: color.purple[600], fg: color.white },
  },
  rose: {
    soft: { bg: color.rose[100], fg: color.rose[700] },
    solid: { bg: color.rose[600], fg: color.white },
  },
  pink: {
    soft: { bg: color.pink[100], fg: color.pink[700] },
    solid: { bg: color.pink[600], fg: color.white },
  },
};

/* ------------------------------------------------------------------------- */
/* Board tile palette — the 6 options in the Create Board color picker.      */
/* `colorKey` is a client-only preference (COMPONENT_INVENTORY.md §4 C1).    */
/* ------------------------------------------------------------------------- */
export type BoardColorKey = "green" | "purple" | "red" | "amber" | "sky" | "pink";

export const boardPalette: Record<
  BoardColorKey,
  { bg: string; heading: string; link: string }
> = {
  green: { bg: color.green[100], heading: color.green[800], link: color.green[600] },
  purple: {
    bg: color.purple[100],
    heading: color.purple[800],
    link: color.purple[600],
  },
  red: { bg: color.red[100], heading: color.red[800], link: color.red[600] },
  amber: { bg: color.amber[100], heading: color.amber[800], link: color.amber[600] },
  sky: { bg: color.sky[100], heading: color.sky[800], link: color.sky[600] },
  pink: { bg: color.pink[100], heading: color.pink[800], link: color.pink[600] },
};

/* ------------------------------------------------------------------------- */
/* Semantic role → tone maps (single source of truth for RoleBadge etc.)    */
/* Derived from the badges drawn on the Figma design-system sheet.           */
/* ------------------------------------------------------------------------- */
export const orgRoleTone: Record<"owner" | "admin" | "member", Tone> = {
  owner: "rose",
  admin: "violet",
  member: "sky",
};

export const projectRoleTone: Record<"head" | "member", Tone> = {
  head: "sky",
  member: "green",
};

export const noAccessTone: Tone = "slate";

export const priorityTone: Record<
  "low" | "medium" | "high" | "urgent",
  Tone
> = {
  low: "slate",
  medium: "sky",
  high: "amber",
  urgent: "red",
};

/* ------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------- */

/** `cssVar("primary")` -> `"var(--primary)"`; `cssVar("--z-modal")` -> `"var(--z-modal)"`. */
export function cssVar(name: string): string {
  const trimmed = name.startsWith("--") ? name.slice(2) : name;
  return `var(--${trimmed})`;
}

/** Aggregate export for ergonomic `import { tokens }` usage. */
export const tokens = {
  color,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyle,
  space,
  radius,
  shadow,
  zIndex,
  duration,
  easing,
  breakpoint,
  semantic,
  labelTone,
  boardPalette,
  orgRoleTone,
  projectRoleTone,
  noAccessTone,
  priorityTone,
} as const;

export default tokens;
