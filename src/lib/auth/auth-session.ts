const ACCESS_TOKEN_KEY = 'todo-plus.access-token';
const REFRESH_TOKEN_KEY = 'todo-plus.refresh-token';

/** Owns the browser session shared with Kitchen Plus credentials. */
export class AuthSession {
  get accessToken(): string | null {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get signedIn(): boolean {
    return Boolean(this.accessToken);
  }

  /** Reads the previous credential for one-time cookie migration. */
  readLegacyRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  save(accessToken: string): void {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  clear(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export const authSession = new AuthSession();
