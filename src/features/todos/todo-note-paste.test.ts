import { describe, expect, it } from 'vitest';
import { parseTodoNotePlainTextList } from './todo-note-paste';

describe('Todo note plain-text paste', () => {
  it.each([
    ['dash bullets', '- Mleko\n- Chleb'],
    ['typographic bullets', '• Mleko\n• Chleb'],
    ['asterisk bullets', '* Mleko\n* Chleb']
  ])('converts %s into a bullet list', (_, value) => {
    expect(parseTodoNotePlainTextList(value)).toEqual({
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mleko' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Chleb' }] }] }
      ]
    });
  });

  it('keeps the first number of a sequential numbered list', () => {
    expect(parseTodoNotePlainTextList('4. Mleko\n5. Chleb')).toEqual({
      type: 'orderedList',
      attrs: { start: 4 },
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mleko' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Chleb' }] }] }
      ]
    });
  });

  it('leaves mixed or non-sequential text to the default paste behavior', () => {
    expect(parseTodoNotePlainTextList('- Mleko\nZwykły akapit')).toBeNull();
    expect(parseTodoNotePlainTextList('1. Mleko\n3. Chleb')).toBeNull();
  });
});
