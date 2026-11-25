import type { components } from '../../lib/api/generated';
import { apiClient } from '../../lib/api/api-client';
import { authSession } from '../../lib/auth/auth-session';
import { ApiRequestError } from '../../lib/api/api-request-error';
import type { AuthUserProfile } from './auth-user-profile';

type AuthTokenResponse = components['schemas']['AuthTokenResponseDto'];

/** Authenticates Todo Plus against the shared Kitchen Plus account boundary. */
export class AuthApi {
  private profile: AuthUserProfile | null = null;

  get currentUser(): AuthUserProfile | null {
    return this.profile;
  }

  get cachedUser(): AuthUserProfile | null {
    const cached = authSession.cachedUser;
    this.profile ??= cached;
    return cached;
  }

  async login(email: string, password: string): Promise<void> {
    const tokens = await apiClient.request<AuthTokenResponse>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    this.saveSession(tokens);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const tokens = await apiClient.request<AuthTokenResponse>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, name, locale: 'pl' })
    });
    this.saveSession(tokens);
  }

  async restore(): Promise<AuthUserProfile | null> {
    const cached = this.cachedUser;
    const legacyRefreshToken = authSession.readLegacyRefreshToken();
    try {
      const tokens = await apiClient.request<AuthTokenResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {})
      }, false);
      this.saveSession(tokens);
      return tokens.user;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        authSession.clear();
        this.profile = null;
        return null;
      }
      this.profile = cached;
      return cached;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.request<void>('/auth/logout', { method: 'POST' }, false);
    } catch {
      // Local logout must remain available without a connection.
    } finally {
      authSession.clear();
      this.profile = null;
    }
  }

  async updateCalendarColor(calendarColor: AuthUserProfile['calendarColor']): Promise<AuthUserProfile> {
    const profile = await apiClient.request<AuthUserProfile>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ calendarColor })
    });
    this.profile = profile;
    authSession.saveUser(profile);
    return profile;
  }

  private saveSession(tokens: AuthTokenResponse): void {
    authSession.save(tokens.accessToken, tokens.user);
    this.profile = tokens.user;
  }
}

export const authApi = new AuthApi();
