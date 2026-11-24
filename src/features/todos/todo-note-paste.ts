import { Extension, type JSONContent } from '@tiptap/core';
import { Fragment, Slice, type Mark, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
import { todoNoteHighlightColors, todoNoteTextColors } from './todo-note-colors';
import { normalizeTodoNoteLinkHref } from './todo-note-link';

const textColors = new Set<string>(todoNoteTextColors.map(({ color }) => color));
const highlightColors = new Set<string>(todoNoteHighlightColors.map(({ color }) => color));
const bulletPattern = /^\s*[-*•]\s+(.+?)\s*$/u;
const orderedPattern = /^\s*(\d+)[.)]\s+(.+?)\s*$/u;

export const todoNotePasteExtension = Extension.create({
  name: 'todoNotePaste',
  priority: 110,

  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        transformPasted: sanitizePastedSlice,
        handlePaste: (view, event) => {
          if (event.clipboardData?.getData('text/html')?.trim()) return false;
          const list = parseTodoNotePlainTextList(event.clipboardData?.getData('text/plain') ?? '');
          if (!list) return false;

          try {
            const listNode = view.state.schema.nodeFromJSON(list);
            view.dispatch(view.state.tr.replaceSelectionWith(listNode).scrollIntoView());
            return true;
          } catch {
            return false;
          }
        }
      }
    })];
  }
});

export function parseTodoNotePlainTextList(value: string): JSONContent | null {
  const lines = value.replace(/\r\n?/g, '\n').split('\n').filter((line) => line.trim());
  if (lines.length === 0) return null;

  const bullets = lines.map((line) => line.match(bulletPattern));
  if (bullets.every(Boolean)) return listDocument('bulletList', bullets.map((match) => match![1]));

  const ordered = lines.map((line) => line.match(orderedPattern));
  if (!ordered.every(Boolean)) return null;
  const numbers = ordered.map((match) => Number(match![1]));
  if (numbers.some((number, index) => number !== numbers[0] + index)) return null;

  return listDocument('orderedList', ordered.map((match) => match![2]), numbers[0]);
}

function listDocument(type: 'bulletList' | 'orderedList', values: string[], start?: number): JSONContent {
  return {
    type,
    ...(type === 'orderedList' ? { attrs: { start } } : {}),
    content: values.map((text) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
    }))
  };
}

function sanitizePastedSlice(slice: Slice): Slice {
  return new Slice(sanitizeFragment(slice.content), slice.openStart, slice.openEnd);
}

function sanitizeFragment(fragment: Fragment): Fragment {
  const nodes: ProseMirrorNode[] = [];
  fragment.forEach((node) => nodes.push(sanitizeNode(node)));
  return Fragment.fromArray(nodes);
}

function sanitizeNode(node: ProseMirrorNode): ProseMirrorNode {
  if (node.isText) return node.mark(node.marks.map(sanitizeMark).filter((mark): mark is Mark => mark !== null));
  return node.copy(sanitizeFragment(node.content));
}

function sanitizeMark(mark: Mark): Mark | null {
  if (mark.type.name === 'bold' || mark.type.name === 'italic') return mark.type.create();
  if (mark.type.name === 'link') {
    const href = normalizeTodoNoteLinkHref(mark.attrs.href);
    return href ? mark.type.create({ href }) : null;
  }

  const color = typeof mark.attrs.color === 'string' ? mark.attrs.color.toLowerCase() : '';
  if (mark.type.name === 'textStyle' && textColors.has(color)) return mark.type.create({ color });
  if (mark.type.name === 'highlight' && highlightColors.has(color)) return mark.type.create({ color });
  return null;
}
