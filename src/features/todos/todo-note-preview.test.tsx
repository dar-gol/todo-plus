// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodoNotePreview } from './todo-note-preview';

afterEach(cleanup);

describe('TodoNotePreview', () => {
  it('lets the preview toggle a checklist item', () => {
    const onTaskItemToggle = vi.fn();
    render(<TodoNotePreview
      document={{
        type: 'doc',
        content: [{
          type: 'taskList',
          content: [{
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Spakuj torbę' }] }]
          }]
        }]
      }}
      onTaskItemToggle={onTaskItemToggle}
    />);

    fireEvent.click(screen.getByText('Spakuj torbę'));

    expect(onTaskItemToggle).toHaveBeenCalledWith(expect.objectContaining({
      content: [expect.objectContaining({
        content: [expect.objectContaining({ attrs: { checked: true } })]
      })]
    }));
  });

  it('disables checklist interaction while a save is pending', () => {
    render(<TodoNotePreview
      document={{
        type: 'doc',
        content: [{ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false } }] }]
      }}
      pending
      onTaskItemToggle={vi.fn()}
    />);

    expect(screen.getByRole('checkbox').hasAttribute('disabled')).toBe(true);
  });
});
