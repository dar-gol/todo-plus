// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TodoNoteEditor } from './todo-note-editor';

afterEach(cleanup);

describe('TodoNoteEditor paste', () => {
  it('converts a plain-text bullet list into structured list content', async () => {
    const { container } = render(<form><TodoNoteEditor /></form>);

    fireEvent.paste(editorElement(container), {
      clipboardData: clipboard({ text: '• Mleko\n• Chleb' })
    });

    await waitFor(() => expect(noteDocument(container)).toEqual(expect.objectContaining({
      content: expect.arrayContaining([expect.objectContaining({
        type: 'bulletList',
        content: [
          expect.objectContaining({ type: 'listItem' }),
          expect.objectContaining({ type: 'listItem' })
        ]
      })])
    })));
  });

  it('keeps a safe link in an HTML list while removing unsupported pasted styling', async () => {
    const { container } = render(<form><TodoNoteEditor /></form>);

    fireEvent.paste(editorElement(container), {
      clipboardData: clipboard({
        html: '<ul><li><a href="https://example.com/przepis"><u style="color: #ff0000">Przepis</u></a></li></ul>',
        text: 'Przepis'
      })
    });

    await waitFor(() => {
      const document = noteDocument(container);
      expect(document).toEqual(expect.objectContaining({
        content: expect.arrayContaining([expect.objectContaining({ type: 'bulletList' })])
      }));
      const serialized = JSON.stringify(document);
      expect(serialized).toContain('https://example.com/przepis');
      expect(serialized).not.toContain('underline');
      expect(serialized).not.toContain('#ff0000');
    });
  });
});

function editorElement(container: HTMLElement): HTMLElement {
  const editor = container.querySelector<HTMLElement>('.todo-note-editor .tiptap');
  if (!editor) throw new Error('Todo note editor was not rendered.');
  return editor;
}

function noteDocument(container: HTMLElement): unknown {
  const input = container.querySelector<HTMLInputElement>('input[name="noteDocument"]');
  if (!input) throw new Error('Todo note document field was not rendered.');
  return JSON.parse(input.value);
}

function clipboard({ html = '', text }: { html?: string; text: string }) {
  return {
    getData: (type: string) => type === 'text/html' ? html : type === 'text/plain' ? text : ''
  };
}
