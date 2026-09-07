import { randomBytes } from "node:crypto";
import slugify from "slugify";

export async function uniqueSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base =
    slugify(name, { lower: true, strict: true, trim: true }).slice(0, 60) ||
    "org";

  if (!(await exists(base))) return base;
  for (let n = 2; n <= 50; n++) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${base}-${randomBytes(3).toString("hex")}`;
}
