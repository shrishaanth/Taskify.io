import { useCallback, useEffect, useId, useRef } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { IconButton } from "../IconButton/IconButton";
import styles from "./Modal.module.css";

export type ModalSize = "sm" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: ReactNode;
  titleIcon?: ReactNode;
  headerSlot?: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  "aria-label"?: string;
  className?: string;
  children?: ReactNode;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Form fields, which are what a dialog usually wants focused on open. */
const PREFERRED_FOCUS =
  'input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled])';

/** Layers that sit above a modal and should absorb Escape before it does. */
const TRANSIENT_LAYER = '[role="menu"],[role="listbox"],[data-popover-open="true"]';

export function Modal({
  open,
  onClose,
  size = "sm",
  title,
  titleIcon,
  headerSlot,
  footer,
  closeOnBackdrop = true,
  closeOnEsc = true,
  "aria-label": ariaLabel,
  className,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    // Land on the first thing the user is meant to fill in. Falling straight
    // to the first focusable would park focus on the close button and make
    // every dialog start one Tab away from being usable.
    const target =
      panel?.querySelector<HTMLElement>(PREFERRED_FOCUS) ??
      panel?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    target?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // A menu or dropdown opened from inside the dialog owns Escape first;
      // dismissing the whole dialog would throw away unrelated work.
      if (document.querySelector(TRANSIENT_LAYER)) return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  const onKeyDownTrap = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
    if (focusables.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const onBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  const hasHeader = Boolean(headerSlot ?? title);

  return createPortal(
    <div
      className={styles.backdrop}
      data-testid="modal-backdrop"
      onClick={onBackdropClick}
    >
      <div
        ref={panelRef}
        className={cn(styles.panel, className)}
        data-size={size}
        role="dialog"
        aria-modal="true"
        {...(title ? { "aria-labelledby": titleId } : null)}
        {...(!title && ariaLabel ? { "aria-label": ariaLabel } : null)}
        tabIndex={-1}
        onKeyDown={onKeyDownTrap}
      >
        {hasHeader &&
          (headerSlot ?? (
            <>
              <div className={styles.header}>
                <div className={styles.titleWrap}>
                  {titleIcon && (
                    <span className={styles.titleIcon} aria-hidden="true">
                      {titleIcon}
                    </span>
                  )}
                  <h2 className={styles.title} id={titleId}>
                    {title}
                  </h2>
                </div>
                <IconButton
                  label="Close"
                  variant="circle"
                  size="sm"
                  onClick={onClose}
                  icon={<span aria-hidden="true">×</span>}
                />
              </div>
              <div className={styles.divider} />
            </>
          ))}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
