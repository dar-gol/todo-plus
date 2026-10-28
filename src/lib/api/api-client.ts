import type { components } from './generated';
import { authSession } from '../auth/auth-session';

type AuthTokenResponse = components['schemas']['AuthTokenResponseDto'];

/** Centralizes API URL, bearer authentication, refresh rotation, and safe errors. */
export class ApiClient {
  private readonly baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  async request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    if (authSession.accessToken) headers.set('Authorization', `Bearer ${authSession.accessToken}`);
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

    if (response.status === 401 && retry && authSession.refreshToken && !path.startsWith('/auth/')) {
      const refreshed = await this.refresh();
      if (refreshed) return this.request<T>(path, init, false);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(body?.message ?? 'Nie udało się wykonać operacji. Spróbuj ponownie.');
    }

    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  }

  private async refresh(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: authSession.refreshToken })
    });
    if (!response.ok) {
      authSession.clear();
      return false;
    }
    const tokens = await response.json() as AuthTokenResponse;
    authSession.save(tokens.accessToken, tokens.refreshToken);
    return true;
  }
}

export const apiClient = new ApiClient();
