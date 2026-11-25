import type { components } from '../api/generated';

const ACCESS_TOKEN_KEY = 'todo-plus.access-token';
const REFRESH_TOKEN_KEY = 'todo-plus.refresh-token';
const USER_PROFILE_KEY = 'todo-plus.user-profile';

/** Owns the browser session shared with Kitchen Plus credentials. */
export class AuthSession {
  get accessToken(): string | null {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get signedIn(): boolean {
    return Boolean(this.accessToken);
  }

  get cachedUser(): components['schemas']['UserProfileResponseDto'] | null {
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(USER_PROFILE_KEY);
    if (!value) return null;

    try {
      const profile = JSON.parse(value) as unknown;
      if (!this.isUserProfile(profile)) {
        window.localStorage.removeItem(USER_PROFILE_KEY);
        return null;
      }
      return profile;
    } catch {
      window.localStorage.removeItem(USER_PROFILE_KEY);
      return null;
    }
  }

  /** Reads the previous credential for one-time cookie migration. */
  readLegacyRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  save(accessToken: string, profile?: components['schemas']['UserProfileResponseDto']): void {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (profile) this.saveUser(profile);
  }

  saveUser(profile: components['schemas']['UserProfileResponseDto']): void {
    window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  }

  clear(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_PROFILE_KEY);
  }

  private isUserProfile(value: unknown): value is components['schemas']['UserProfileResponseDto'] {
    if (!value || typeof value !== 'object') return false;
    const colors = new Set(['blue', 'purple', 'pink', 'orange', 'cyan', 'green', 'yellow', 'red']);
    return 'id' in value && typeof value.id === 'string'
      && 'email' in value && typeof value.email === 'string'
      && 'locale' in value && typeof value.locale === 'string'
      && 'calendarColor' in value && typeof value.calendarColor === 'string' && colors.has(value.calendarColor)
      && (!('name' in value) || value.name === null || typeof value.name === 'string');
  }
}

export const authSession = new AuthSession();
