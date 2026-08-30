/** Join truthy class-name parts with a space. No dependency on `clsx`. */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter((p): p is string => Boolean(p)).join(" ");
}
