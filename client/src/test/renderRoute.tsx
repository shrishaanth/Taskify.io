import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { ToastProvider } from "../components/primitives/Toast/ToastProvider";
import { AppRoutes } from "../AppRoutes";
import { resetMockData } from "../stores/mockDataStore";
import { useSession } from "../stores/sessionStore";

/** Render the full route tree at `path` with fresh mock data + a signed-in session. */
export function renderRoute(path: string) {
  resetMockData();
  useSession.setState({ isAuthenticated: true });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </MemoryRouter>,
  );
}

/** Wrap arbitrary UI in the same providers (for isolated component-in-router tests). */
export function withProviders(ui: ReactNode, path = "/") {
  resetMockData();
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>,
  );
}
