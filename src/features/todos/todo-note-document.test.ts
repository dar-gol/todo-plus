import { describe, expect, it } from 'vitest';
import { normalizeTodoNoteDocument, parseTodoNoteDocumentField, toggleTodoNoteTaskItem } from './todo-note-document';

describe('todo note document', () => {
  it('converts an existing plain note into paragraphs', () => {
    expect(normalizeTodoNoteDocument(null, 'Pierwsza linia\nDruga linia')).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Pierwsza linia' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Druga linia' }] }
      ]
    });
  });

  it('keeps supported formatting and removes unsupported marks and nodes', () => {
    const document = normalizeTodoNoteDocument({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'Kolorowa treść',
          marks: [
            { type: 'bold' },
            { type: 'textStyle', attrs: { color: '#2F7D5A' } },
            { type: 'highlight', attrs: { color: '#000000' } },
            { type: 'link', attrs: { href: 'https://example.com' } }
          ]
        }]
      }, { type: 'image', attrs: { src: 'invalid' } }]
    });

    expect(document).toEqual({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'Kolorowa treść',
          marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color: '#2f7d5a' } }]
        }]
      }]
    });
  });

  it('parses the hidden form field', () => {
    expect(parseTodoNoteDocumentField('{"type":"doc"}')).toEqual({ type: 'doc' });
  });

  it('keeps checklist state', () => {
    expect(normalizeTodoNoteDocument({
      type: 'doc',
      content: [{
        type: 'taskList',
        content: [{
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gotowe' }] }]
        }]
      }]
    })).toEqual({
      type: 'doc',
      content: [{
        type: 'taskList',
        content: [{
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gotowe' }] }]
        }]
      }]
    });
  });

  it('toggles only the selected checklist item', () => {
    const document = {
      type: 'doc',
      content: [{
        type: 'taskList',
        content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pierwszy' }] }] },
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drugi' }] }] }
        ]
      }]
    };

    expect(toggleTodoNoteTaskItem(document, [0, 1])).toEqual({
      type: 'doc',
      content: [{
        type: 'taskList',
        content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pierwszy' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drugi' }] }] }
        ]
      }]
    });
  });
});
