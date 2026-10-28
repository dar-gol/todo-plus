import type { components } from '@/lib/api/generated';
import { apiClient } from '@/lib/api/api-client';
import { authSession } from '@/lib/auth/auth-session';

type AuthTokenResponse = components['schemas']['AuthTokenResponseDto'];

/** Authenticates Todo Plus against the shared Kitchen Plus account boundary. */
export class AuthApi {
  async login(email: string, password: string): Promise<void> {
    const tokens = await apiClient.request<AuthTokenResponse>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    authSession.save(tokens.accessToken, tokens.refreshToken);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const tokens = await apiClient.request<AuthTokenResponse>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, name, locale: 'pl' })
    });
    authSession.save(tokens.accessToken, tokens.refreshToken);
  }
}

export const authApi = new AuthApi();
