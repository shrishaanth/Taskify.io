import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Toast } from "./Toast";
import {
  ToastContext,
  type ToastOptions,
  type ToastRecord,
} from "./toastContext";
import styles from "./Toast.module.css";

let counter = 0;
const nextId = () => `toast-${++counter}`;

export interface ToastProviderProps {
  children: ReactNode;
  /** Default auto-dismiss delay in ms. */
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (opts: ToastOptions) => {
      const id = nextId();
      const record: ToastRecord = { id, ...opts };
      setToasts((list) => [...list, record]);
      const duration = opts.duration ?? defaultDuration;
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [defaultDuration, dismiss],
  );

  const clear = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setToasts([]);
  }, []);

  const value = useMemo(
    () => ({ toasts, show, dismiss, clear }),
    [toasts, show, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.region}
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            tone={t.tone ?? "info"}
            title={t.title}
            {...(t.description !== undefined ? { description: t.description } : {})}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
