// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authSession } from '../auth/auth-session';
import { apiClient } from './api-client';

describe('ApiClient shared session recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
    authSession.save('access-old');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renews an expired bearer token through the HttpOnly cookie and retries once', async () => {
    const user = { id: 'user-1', email: 'ada@example.com', name: 'Ada', locale: 'pl' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        accessToken: 'access-new',
        tokenType: 'Bearer',
        user
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'task-1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.request<{ id: string }>('/todos?scope=family')).resolves.toEqual({ id: 'task-1' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:4000/auth/refresh',
      expect.objectContaining({
        body: '{}',
        credentials: 'include',
        method: 'POST'
      })
    );
    expect(authSession.accessToken).toBe('access-new');
    expect(window.localStorage.getItem('todo-plus.refresh-token')).toBeNull();
    const retriedHeaders = fetchMock.mock.calls[2]?.[1]?.headers as Headers;
    expect(retriedHeaders.get('Authorization')).toBe('Bearer access-new');
  });
});
