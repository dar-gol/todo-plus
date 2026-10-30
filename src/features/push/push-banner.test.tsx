// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PushBanner } from './push-banner';

const { permission } = vi.hoisted(() => ({ permission: vi.fn() }));

vi.mock('./push-notifications', () => ({
  pushNotifications: { permission, enable: vi.fn() }
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  permission.mockReset();
});

describe('PushBanner', () => {
  it('stays hidden when notifications are already enabled', async () => {
    permission.mockReturnValue('granted');

    const { container } = render(<PushBanner />);

    await waitFor(() => expect(container.innerHTML).toBe(''));
  });
});
