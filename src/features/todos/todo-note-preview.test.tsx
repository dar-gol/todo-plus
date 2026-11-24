// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodoNotePreview } from './todo-note-preview';

afterEach(cleanup);

describe('TodoNotePreview', () => {
  it('renders safe links as external links and keeps ordered-list numbering', () => {
    const html = renderToStaticMarkup(<TodoNotePreview document={{
      type: 'doc',
      content: [{
        type: 'orderedList',
        attrs: { start: 4 },
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Przepis',
              marks: [{ type: 'link', attrs: { href: 'https://example.com/przepis' } }]
            }]
          }]
        }]
      }]
    }} />);

    expect(html).toContain('<ol start="4">');
    expect(html).toContain('href="https://example.com/przepis"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('does not render an unsafe link target', () => {
    const html = renderToStaticMarkup(<TodoNotePreview document={{
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'Niebezpieczny',
          marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]
        }]
      }]
    }} />);

    expect(html).toContain('Niebezpieczny');
    expect(html).not.toContain('<a');
  });

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
