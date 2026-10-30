import type { components } from './generated';
import { authSession } from '../auth/auth-session';
import { ApiRequestError } from './api-request-error';

type AuthTokenResponse = components['schemas']['AuthTokenResponseDto'];

/** Centralizes API URL, bearer authentication, refresh rotation, and safe errors. */
export class ApiClient {
  private readonly baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  private refreshInFlight: Promise<boolean> | null = null;

  async request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    if (authSession.accessToken) headers.set('Authorization', `Bearer ${authSession.accessToken}`);
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers
    });

    if (response.status === 401 && retry && !path.startsWith('/auth/')) {
      const refreshed = await this.refresh();
      if (refreshed) return this.request<T>(path, init, false);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new ApiRequestError(
        response.status,
        body?.message ?? 'Nie udało się wykonać operacji. Spróbuj ponownie.'
      );
    }

    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  }

  private async refresh(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = this.performRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async performRefresh(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      authSession.clear();
      return false;
    }
    const tokens = await response.json() as AuthTokenResponse;
    authSession.save(tokens.accessToken);
    return true;
  }
}

export const apiClient = new ApiClient();
