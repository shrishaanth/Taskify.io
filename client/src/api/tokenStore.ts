/**
 * The access token lives in memory + localStorage (so a reload keeps you
 * signed in until it expires). The refresh token is an httpOnly cookie set by
 * the server — never touched by JS (PROJECT_RULES.md §4).
 */
const STORAGE_KEY = "taskify.accessToken";

let accessToken: string | null = readInitial();

function readInitial(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — in-memory only */
  }
}
