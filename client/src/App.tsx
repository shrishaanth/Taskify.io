import { useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/primitives/Toast/ToastProvider";
import { makeQueryClient } from "./features/queryClient";
import { AppRoutes } from "./AppRoutes";

export default function App() {
  const queryClient = useMemo(makeQueryClient, []);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
