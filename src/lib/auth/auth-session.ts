const ACCESS_TOKEN_KEY = 'todo-plus.access-token';
const REFRESH_TOKEN_KEY = 'todo-plus.refresh-token';

/** Owns the browser session shared with Kitchen Plus credentials. */
export class AuthSession {
  get accessToken(): string | null {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  get signedIn(): boolean {
    return Boolean(this.accessToken && this.refreshToken);
  }

  save(accessToken: string, refreshToken: string): void {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  clear(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export const authSession = new AuthSession();
