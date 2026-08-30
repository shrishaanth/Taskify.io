import { createContext } from "react";
import type { ToastTone } from "./Toast";

export interface ToastOptions {
  tone?: ToastTone;
  title: string;
  description?: string;
  /** ms before auto-dismiss; 0 disables auto-dismiss. Default 5000. */
  duration?: number;
}

export interface ToastRecord extends ToastOptions {
  id: string;
}

export interface ToastContextValue {
  toasts: ToastRecord[];
  show: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
