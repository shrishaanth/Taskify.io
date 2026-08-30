import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ToastProvider } from "../components/primitives/Toast/ToastProvider";
import { makeQueryClient } from "../features/queryClient";
import { AppRoutes } from "../AppRoutes";
import { setAccessToken } from "../api/tokenStore";
import { useSession } from "../stores/sessionStore";
import { resetDb } from "./fakeApi";

/**
 * Render the full route tree at `path`. By default the caller is "u-alex" with
 * a valid fake token; pass `{ anonymous: true }` for logged-out flows.
 */
export function renderRoute(
  path: string,
  opts: { as?: string; anonymous?: boolean } = {},
) {
  resetDb();
  const client = makeQueryClient();

  if (opts.anonymous) {
    setAccessToken(null);
    useSession.setState({
      status: "anonymous",
      isAuthenticated: false,
      session: null,
    });
  } else {
    setAccessToken(`test:${opts.as ?? "u-alex"}`);
    useSession.setState({ status: "loading", isAuthenticated: false, session: null });
  }

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export function withProviders(ui: ReactNode, path = "/") {
  resetDb();
  const client = makeQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ToastProvider>{ui}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
