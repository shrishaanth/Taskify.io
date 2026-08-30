import { describe, it, expect } from "vitest";
import cssText from "./tokens.css?raw";
import {
  color,
  fontFamily,
  fontSize,
  fontWeight,
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
  priorityTone,
  cssVar,
  tokens,
  type Tone,
} from "./tokens";

/* ----------------------------------------------------------------------- */
/* Parse tokens.css into a resolved name -> value map                       */
/* ----------------------------------------------------------------------- */
function parseCustomProperties(src: string): {
  raw: Map<string, string>;
  duplicates: string[];
} {
  const raw = new Map<string, string>();
  const duplicates: string[] = [];
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const name = m[1].trim();
    const value = m[2].replace(/\s+/g, " ").trim();
    if (raw.has(name)) duplicates.push(name);
    raw.set(name, value);
  }
  return { raw, duplicates };
}

const { raw: cssVars, duplicates } = parseCustomProperties(cssText);

/** Resolve `var(--x)` references (with fallbacks) down to a concrete value. */
function resolve(value: string, seen = new Set<string>()): string {
  const varRe = /var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)/;
  let out = value;
  let guard = 0;
  while (varRe.test(out)) {
    if (guard++ > 50) throw new Error(`var() resolution loop in: ${value}`);
    out = out.replace(varRe, (_all, name: string, fallback?: string) => {
      if (seen.has(name)) return fallback?.trim() ?? "";
      const next = cssVars.get(name);
      if (next === undefined) return fallback?.trim() ?? `__MISSING(${name})__`;
      seen.add(name);
      return resolve(next, seen);
    });
  }
  return out.trim();
}

const cssResolved = new Map(
  [...cssVars.keys()].map((k) => [k, resolve(cssVars.get(k)!)]),
);

/* ----------------------------------------------------------------------- */

describe("tokens.css structural integrity", () => {
  it("declares no custom property twice", () => {
    expect(duplicates).toEqual([]);
  });

  it("has no unresolved var() references", () => {
    const broken = [...cssResolved.entries()].filter(([, v]) =>
      v.includes("__MISSING("),
    );
    expect(broken).toEqual([]);
  });

  it("parsed a sensible number of tokens", () => {
    expect(cssVars.size).toBeGreaterThan(120);
  });
});

describe("Figma anchor values (the three named swatches)", () => {
  it("Primary Sky = #0284c7 in both files", () => {
    expect(color.sky[600]).toBe("#0284c7");
    expect(cssVars.get("color-sky-600")).toBe("#0284c7");
    expect(cssResolved.get("primary")).toBe("#0284c7");
  });

  it("Ink Slate = #0f172a in both files", () => {
    expect(color.slate[900]).toBe("#0f172a");
    expect(cssVars.get("color-slate-900")).toBe("#0f172a");
    expect(cssResolved.get("text-primary")).toBe("#0f172a");
  });

  it("Cool BG = #f8fafc in both files", () => {
    expect(color.slate[50]).toBe("#f8fafc");
    expect(cssVars.get("color-slate-50")).toBe("#f8fafc");
    expect(cssResolved.get("bg-app")).toBe("#f8fafc");
  });
});

describe("colour ramps", () => {
  const families = [
    "slate",
    "sky",
    "red",
    "amber",
    "green",
    "violet",
    "purple",
    "rose",
    "pink",
  ] as const;

  it("every ramp value is a 6-digit lowercase hex", () => {
    for (const fam of families) {
      for (const [step, hex] of Object.entries(color[fam])) {
        expect(hex, `${fam}-${step}`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
    expect(color.white).toBe("#ffffff");
    expect(color.black).toBe("#000000");
  });

  it("every TS ramp value is mirrored in tokens.css", () => {
    for (const fam of families) {
      for (const [step, hex] of Object.entries(color[fam])) {
        expect(cssVars.get(`color-${fam}-${step}`), `color-${fam}-${step}`).toBe(
          hex,
        );
      }
    }
  });

  it("each ramp goes light -> dark (50 lighter than 900)", () => {
    const luminance = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
    };
    for (const fam of families) {
      expect(luminance(color[fam][50]), fam).toBeGreaterThan(
        luminance(color[fam][900]),
      );
    }
  });
});

describe("typography", () => {
  it("uses Inter as the primary family", () => {
    expect(fontFamily.sans).toContain("Inter");
    expect(cssVars.get("font-sans")).toContain("Inter");
  });

  it("matches the four named Figma type roles", () => {
    // H1 — Inter Bold 40px
    expect(textStyle.h1.fontSize).toBe("2.5rem");
    expect(textStyle.h1.fontWeight).toBe(700);
    // H2 — Inter Bold 24px
    expect(textStyle.h2.fontSize).toBe("1.5rem");
    expect(textStyle.h2.fontWeight).toBe(700);
    // Body — Inter Regular 16px
    expect(textStyle.body.fontSize).toBe("1rem");
    expect(textStyle.body.fontWeight).toBe(400);
    // Caption — Inter Semibold 12px
    expect(textStyle.caption.fontSize).toBe("0.75rem");
    expect(textStyle.caption.fontWeight).toBe(600);
  });

  it("mirrors the size scale + weights into tokens.css", () => {
    for (const [k, v] of Object.entries(fontSize)) {
      expect(cssVars.get(`font-size-${k}`), `font-size-${k}`).toBe(v);
    }
    for (const [k, v] of Object.entries(fontWeight)) {
      expect(cssVars.get(`font-weight-${k}`), `font-weight-${k}`).toBe(String(v));
    }
    expect(fontSize["4xl"]).toBe("2.5rem"); // 40px H1
    expect(fontSize["2xl"]).toBe("1.5rem"); // 24px H2
  });
});

describe("spacing, radius, motion, layering", () => {
  it("spacing scale is mirrored and starts at the 4px grid", () => {
    expect(space["1"]).toBe("0.25rem");
    for (const [k, v] of Object.entries(space)) {
      const cssName = `space-${k.replace(".", "-")}`;
      expect(cssVars.get(cssName), cssName).toBe(v);
    }
  });

  it("modal radius is 16px (the value named in the sheet)", () => {
    expect(radius.xl).toBe("16px");
    expect(cssVars.get("radius-xl")).toBe("16px");
  });

  it("radius scale is mirrored", () => {
    for (const [k, v] of Object.entries(radius)) {
      expect(cssVars.get(`radius-${k}`), `radius-${k}`).toBe(v);
    }
    expect(radius.full).toBe("9999px");
  });

  it("shadow, duration and easing are mirrored", () => {
    for (const [k, v] of Object.entries(shadow)) {
      expect(cssVars.get(`shadow-${k}`)?.replace(/\s+/g, " "), `shadow-${k}`).toBe(
        v.replace(/\s+/g, " "),
      );
    }
    for (const [k, v] of Object.entries(duration)) {
      expect(cssVars.get(`duration-${k}`), `duration-${k}`).toBe(v);
    }
    for (const [k, v] of Object.entries(easing)) {
      expect(cssVars.get(`ease-${k}`), `ease-${k}`).toBe(v);
    }
  });

  it("z-index scale is strictly ascending", () => {
    const values = Object.values(zIndex);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
    expect(zIndex.backdrop).toBeLessThan(zIndex.modal);
    expect(zIndex.modal).toBeLessThan(zIndex.popover);
    expect(zIndex.popover).toBeLessThan(zIndex.toast);
    for (const [k, v] of Object.entries(zIndex)) {
      expect(cssVars.get(`z-${k}`), `z-${k}`).toBe(String(v));
    }
  });

  it("breakpoints are mirrored and ascending", () => {
    const px = (s: string) => parseInt(s, 10);
    const vals = Object.values(breakpoint).map(px);
    expect(vals).toEqual([...vals].sort((a, b) => a - b));
    for (const [k, v] of Object.entries(breakpoint)) {
      expect(cssVars.get(`breakpoint-${k}`), `breakpoint-${k}`).toBe(v);
    }
  });
});

describe("semantic tokens", () => {
  const expectedSemanticVars = [
    "bg-app",
    "bg-surface",
    "bg-surface-muted",
    "bg-inverse",
    "bg-overlay",
    "border-subtle",
    "border-strong",
    "border-focus",
    "text-primary",
    "text-secondary",
    "text-muted",
    "text-inverse",
    "text-link",
    "text-on-primary",
    "primary",
    "primary-hover",
    "primary-active",
    "primary-subtle",
    "primary-fg",
    "danger",
    "danger-hover",
    "danger-subtle",
    "danger-fg",
    "success",
    "warning",
    "status-online",
    "status-offline",
    "focus-ring",
  ];

  it("every expected semantic var exists in tokens.css", () => {
    for (const name of expectedSemanticVars) {
      expect(cssVars.has(name), name).toBe(true);
    }
  });

  it("semantic TS values resolve to the same concrete colours as tokens.css", () => {
    expect(cssResolved.get("bg-surface")).toBe(semantic.bg.surface);
    expect(cssResolved.get("bg-surface")).toBe("#ffffff");
    expect(cssResolved.get("text-secondary")).toBe(semantic.text.secondary);
    expect(cssResolved.get("border-strong")).toBe(semantic.border.strong);
    expect(cssResolved.get("primary-hover")).toBe(semantic.primary.hover);
    expect(cssResolved.get("danger")).toBe(semantic.danger.default);
    expect(cssResolved.get("status-online")).toBe(semantic.status.online);
    expect(cssResolved.get("warning")).toBe(semantic.warning.default);
  });

  it("primary / danger / text pairs meet a basic contrast bar", () => {
    // crude WCAG-ish contrast; primary & danger fills carry white text.
    const rl = (hex: string) => {
      const c = [0, 1, 2].map((i) => {
        const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [rl(a), rl(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    expect(ratio(semantic.primary.default, "#ffffff")).toBeGreaterThan(3);
    expect(ratio(semantic.danger.default, "#ffffff")).toBeGreaterThan(3);
    expect(ratio(semantic.text.primary, semantic.bg.app)).toBeGreaterThan(12);
    expect(ratio(semantic.text.secondary, semantic.bg.surface)).toBeGreaterThan(4.5);
  });
});

describe("label / badge tones", () => {
  const tones: Tone[] = [
    "sky",
    "slate",
    "red",
    "amber",
    "green",
    "violet",
    "purple",
    "rose",
    "pink",
  ];

  it("defines all nine tones with soft + solid pairs", () => {
    expect(Object.keys(labelTone).sort()).toEqual([...tones].sort());
    for (const t of tones) {
      expect(labelTone[t].soft.bg).toMatch(/^#[0-9a-f]{6}$/);
      expect(labelTone[t].soft.fg).toMatch(/^#[0-9a-f]{6}$/);
      expect(labelTone[t].solid.bg).toMatch(/^#[0-9a-f]{6}$/);
      expect(labelTone[t].solid.fg).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("soft tone = family-100 bg / family-700 fg (per the sheet)", () => {
    expect(labelTone.purple.soft.bg).toBe(color.purple[100]); // #f3e8ff — sampled from the Figma chip
    expect(labelTone.red.soft.bg).toBe(color.red[100]); // #fee2e2 — sampled from the Figma chip
    expect(labelTone.sky.soft.fg).toBe(color.sky[700]);
    expect(labelTone.green.soft.fg).toBe(color.green[700]);
  });

  it("tones are mirrored into tokens.css (--tone-*)", () => {
    for (const t of tones) {
      expect(cssResolved.get(`tone-${t}-soft-bg`), `tone-${t}-soft-bg`).toBe(
        labelTone[t].soft.bg,
      );
      expect(cssResolved.get(`tone-${t}-soft-fg`), `tone-${t}-soft-fg`).toBe(
        labelTone[t].soft.fg,
      );
      expect(cssResolved.get(`tone-${t}-solid-bg`), `tone-${t}-solid-bg`).toBe(
        labelTone[t].solid.bg,
      );
      expect(cssResolved.get(`tone-${t}-solid-fg`), `tone-${t}-solid-fg`).toBe(
        labelTone[t].solid.fg,
      );
    }
  });
});

describe("board tile palette (Create Board colour picker)", () => {
  const keys = ["green", "purple", "red", "amber", "sky", "pink"] as const;

  it("has exactly the six options shown in the mockup", () => {
    expect(Object.keys(boardPalette).sort()).toEqual([...keys].sort());
  });

  it("is mirrored into tokens.css (--board-*)", () => {
    for (const k of keys) {
      expect(cssResolved.get(`board-${k}-bg`), `board-${k}-bg`).toBe(
        boardPalette[k].bg,
      );
      expect(cssResolved.get(`board-${k}-heading`), `board-${k}-heading`).toBe(
        boardPalette[k].heading,
      );
      expect(cssResolved.get(`board-${k}-link`), `board-${k}-link`).toBe(
        boardPalette[k].link,
      );
    }
  });
});

describe("semantic role -> tone maps", () => {
  it("cover every role/priority enum value from the data model", () => {
    expect(Object.keys(orgRoleTone).sort()).toEqual(["admin", "member", "owner"]);
    expect(Object.keys(projectRoleTone).sort()).toEqual(["head", "member"]);
    expect(Object.keys(priorityTone).sort()).toEqual([
      "high",
      "low",
      "medium",
      "urgent",
    ]);
  });

  it("maps to tones that exist in labelTone", () => {
    for (const t of [
      ...Object.values(orgRoleTone),
      ...Object.values(projectRoleTone),
      ...Object.values(priorityTone),
    ]) {
      expect(labelTone[t]).toBeDefined();
    }
  });

  it("matches the Figma badge colours (Owner rose, Admin violet, Head sky)", () => {
    expect(orgRoleTone.owner).toBe("rose");
    expect(orgRoleTone.admin).toBe("violet");
    expect(projectRoleTone.head).toBe("sky");
  });
});

describe("cssVar helper", () => {
  it("wraps a bare name", () => {
    expect(cssVar("primary")).toBe("var(--primary)");
  });
  it("accepts a name that already has the -- prefix", () => {
    expect(cssVar("--z-modal")).toBe("var(--z-modal)");
  });
  it("points at properties that actually exist", () => {
    for (const name of ["primary", "bg-app", "radius-xl", "z-modal", "shadow-modal"]) {
      const ref = cssVar(name).slice(6, -1); // strip `var(` .. `)`
      expect(cssVars.has(ref.replace(/^--/, "")), name).toBe(true);
    }
  });
});

describe("aggregate export", () => {
  it("exposes every token group", () => {
    expect(Object.keys(tokens).sort()).toEqual(
      [
        "boardPalette",
        "breakpoint",
        "color",
        "duration",
        "easing",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "labelTone",
        "letterSpacing",
        "lineHeight",
        "noAccessTone",
        "orgRoleTone",
        "priorityTone",
        "projectRoleTone",
        "radius",
        "semantic",
        "shadow",
        "space",
        "textStyle",
        "zIndex",
      ].sort(),
    );
  });
});
