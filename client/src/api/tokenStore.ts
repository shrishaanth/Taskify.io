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

/**
 * Each tab holds its own copy, so a token another tab just obtained has to be
 * picked up from storage or this tab would go on to spend a refresh token
 * that has already been rotated.
 */
export function syncAccessTokenFromStorage(): string | null {
  accessToken = readInitial();
  return accessToken;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) accessToken = e.newValue;
  });
}
