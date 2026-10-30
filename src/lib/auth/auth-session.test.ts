// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { authSession } from './auth-session';

describe('AuthSession', () => {
  beforeEach(() => window.localStorage.clear());

  it('keeps only the short-lived bearer token in browser-readable storage', () => {
    window.localStorage.setItem('todo-plus.refresh-token', 'legacy-secret');

    authSession.save('access-token');

    expect(authSession.accessToken).toBe('access-token');
    expect(authSession.signedIn).toBe(true);
    expect(window.localStorage.getItem('todo-plus.refresh-token')).toBeNull();
  });

  it('retains the legacy credential until cookie migration succeeds', () => {
    window.localStorage.setItem('todo-plus.refresh-token', 'legacy-secret');

    expect(authSession.readLegacyRefreshToken()).toBe('legacy-secret');
    expect(authSession.readLegacyRefreshToken()).toBe('legacy-secret');

    authSession.save('access-new');
    expect(authSession.readLegacyRefreshToken()).toBeNull();
  });
});
