const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

let accessToken: string | null = null;
let refreshTokenVal: string | null = null;
let refreshPromise: Promise<void> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshTokenVal = refresh;
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshTokenVal = null;
  localStorage.removeItem('refreshToken');
}

// Restore on load
const stored = localStorage.getItem('refreshToken');
if (stored) refreshTokenVal = stored;

async function refreshAccessToken(): Promise<void> {
  if (!refreshTokenVal) throw new Error('No refresh token');
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenVal }),
  });
  if (!res.ok) { clearTokens(); throw new Error('Session expired'); }
  const data = await res.json();
  accessToken = data.accessToken;
  refreshTokenVal = data.refreshToken;
  localStorage.setItem('refreshToken', data.refreshToken);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });

  // Auto-refresh on 401
  if (res.status === 401 && refreshTokenVal) {
    if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
    await refreshPromise;
    headers['Authorization'] = `Bearer ${accessToken}`;
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
