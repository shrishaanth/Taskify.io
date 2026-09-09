import { getAccessToken, setAccessToken } from "./tokenStore";

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type OnAuthLost = () => void;
let onAuthLost: OnAuthLost = () => {};
export function setOnAuthLost(fn: OnAuthLost) {
  onAuthLost = fn;
}

/**
 * Lets the socket layer tell the API layer which connection this tab owns.
 * The id travels as `x-socket-id` so the server can skip echoing a change back
 * to the tab that made it — that tab already has the result in its response.
 * Registered by `api/socket.ts`, which imports from here (no cycle).
 */
type SocketIdProvider = () => string | undefined;
let socketIdProvider: SocketIdProvider = () => undefined;
export function setSocketIdProvider(fn: SocketIdProvider) {
  socketIdProvider = fn;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  noRetry?: boolean;
}

async function parse(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken?: string };
      if (!data.accessToken) return false;
      setAccessToken(data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal, noRetry = false } = opts;

  const doFetch = () => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const socketId = socketIdProvider();
    if (socketId) headers["x-socket-id"] = socketId;
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !noRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await doFetch();
    } else {
      onAuthLost();
    }
  }

  if (!res.ok) {
    const payload = (await parse(res)) as
      | { message?: string; code?: string; details?: unknown }
      | undefined;
    throw new ApiError(
      res.status,
      payload?.code ?? "UNKNOWN",
      payload?.message ?? res.statusText,
      payload?.details,
    );
  }

  return (await parse(res)) as T;
}
