import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}

/**
 * `const { confirm, dialog } = useConfirm()` — render `dialog` once, then
 * `if (await confirm({ title })) doIt()`. Resolves false on cancel or Escape.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    // A second request while one is open cancels the first.
    resolver.current?.(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const dialog = (
    <ConfirmDialog
      open={options !== null}
      title={options?.title ?? ""}
      {...(options?.confirmLabel ? { confirmLabel: options.confirmLabel } : {})}
      {...(options?.tone ? { tone: options.tone } : {})}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    >
      {options?.message}
    </ConfirmDialog>
  );

  return { confirm, dialog };
}
