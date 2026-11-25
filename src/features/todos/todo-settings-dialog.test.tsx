// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { TodoSettingsDialog } from './todo-settings-dialog';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', ''); };
});

afterEach(cleanup);

describe('TodoSettingsDialog', () => {
  it('lets the user change the calendar color assigned to a creator', () => {
    const onCreatorColorChange = vi.fn();
    render(<TodoSettingsDialog
      open
      defaultView="list"
      currentUser={{ id: 'user-1', email: 'ada@example.com', name: 'Ada', locale: 'pl', calendarColor: 'blue' }}
      colorPending={false}
      colorError={null}
      onChange={vi.fn()}
      onCreatorColorChange={onCreatorColorChange}
      onClose={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('radio', { name: 'Różowy' }));

    expect(onCreatorColorChange).toHaveBeenCalledWith('pink');
  });
});
