import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/primitives/Toast/ToastProvider";
import { useToast } from "./components/primitives/Toast/useToast";
import { makeQueryClient } from "./features/queryClient";
import { AppRoutes } from "./AppRoutes";

/** Sits inside the toast provider so failed mutations can be reported. */
function QueryLayer({ children }: { children: ReactNode }) {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const queryClient = useMemo(
    () =>
      makeQueryClient({
        onMutationError: (message) =>
          toastRef.current.show({ tone: "error", title: message }),
      }),
    [],
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <QueryLayer>
          <AppRoutes />
        </QueryLayer>
      </ToastProvider>
    </BrowserRouter>
  );
}
