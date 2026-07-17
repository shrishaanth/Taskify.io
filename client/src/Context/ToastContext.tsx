import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, CheckCircle, AlertTriangle, X } from "lucide-react";

export type ToastKind = "info" | "success" | "warning";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastState>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

const KIND_STYLES: Record<ToastKind, { icon: React.ReactNode; ring: string }> = {
  info: {
    icon: <Info className="h-4 w-4 text-blue-500" />,
    ring: "border-blue-200 dark:border-blue-800",
  },
  success: {
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    ring: "border-green-200 dark:border-green-800",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    ring: "border-yellow-200 dark:border-yellow-800",
  },
};

let nextId = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-4), { id, message, kind }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={`flex items-start gap-2.5 rounded-lg border ${KIND_STYLES[t.kind].ring} bg-white dark:bg-gray-800 p-3 shadow-lg`}
            >
              <span className="mt-0.5 shrink-0">{KIND_STYLES[t.kind].icon}</span>
              <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
