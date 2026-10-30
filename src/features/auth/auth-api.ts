import type { components } from '@/lib/api/generated';
import { apiClient } from '@/lib/api/api-client';
import { authSession } from '@/lib/auth/auth-session';
import { ApiRequestError } from '@/lib/api/api-request-error';

type AuthTokenResponse = components['schemas']['AuthTokenResponseDto'];

/** Authenticates Todo Plus against the shared Kitchen Plus account boundary. */
export class AuthApi {
  async login(email: string, password: string): Promise<void> {
    const tokens = await apiClient.request<AuthTokenResponse>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    authSession.save(tokens.accessToken);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const tokens = await apiClient.request<AuthTokenResponse>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, name, locale: 'pl' })
    });
    authSession.save(tokens.accessToken);
  }

  async restore(): Promise<boolean> {
    const legacyRefreshToken = authSession.readLegacyRefreshToken();
    try {
      const tokens = await apiClient.request<AuthTokenResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {})
      }, false);
      authSession.save(tokens.accessToken);
      return true;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) authSession.clear();
      return authSession.signedIn;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.request<void>('/auth/logout', { method: 'POST' }, false);
    } finally {
      authSession.clear();
    }
  }
}

export const authApi = new AuthApi();
