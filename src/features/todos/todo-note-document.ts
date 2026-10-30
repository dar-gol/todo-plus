import type { JSONContent } from '@tiptap/core';
import { todoNoteHighlightColors, todoNoteTextColors } from './todo-note-colors';

const nodeTypes = new Set(['doc', 'paragraph', 'bulletList', 'orderedList', 'listItem', 'taskList', 'taskItem', 'text', 'hardBreak']);
const markTypes = new Set(['bold', 'italic', 'textStyle', 'highlight']);
const textColors = new Set<string>(todoNoteTextColors.map(({ color }) => color));
const highlightColors = new Set<string>(todoNoteHighlightColors.map(({ color }) => color));

export function normalizeTodoNoteDocument(value: unknown, legacyText?: string | null): JSONContent {
  const document = normalizeNode(value);
  if (document?.type === 'doc') return document;

  const paragraphs = (legacyText ?? '').split(/\r?\n/).map((line) => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : undefined
  }));

  return { type: 'doc', content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph' }] };
}

export function parseTodoNoteDocumentField(value: FormDataEntryValue | null): Record<string, unknown> | null {
  if (typeof value !== 'string' || !value) return null;
  const parsed: unknown = JSON.parse(value);
  return isRecord(parsed) ? parsed : null;
}

export function toggleTodoNoteTaskItem(value: unknown, path: readonly number[]): Record<string, unknown> {
  return cloneNode(normalizeTodoNoteDocument(value), path);
}

function cloneNode(node: JSONContent, path: readonly number[] | null): Record<string, unknown> {
  const target = path?.length === 0 && node.type === 'taskItem';
  const attributes = node.attrs
    ? { ...node.attrs, ...(target ? { checked: node.attrs.checked !== true } : {}) }
    : target ? { checked: true } : undefined;
  const content = node.content?.map((child, index) => cloneNode(
    child,
    path && path.length > 0 && path[0] === index ? path.slice(1) : null
  ));

  return {
    ...(node.type ? { type: node.type } : {}),
    ...(node.text !== undefined ? { text: node.text } : {}),
    ...(attributes ? { attrs: attributes } : {}),
    ...(node.marks ? { marks: node.marks.map((mark) => cloneNode(mark, null)) } : {}),
    ...(content ? { content } : {})
  };
}

function normalizeNode(value: unknown): JSONContent | null {
  if (!isRecord(value) || typeof value.type !== 'string' || !nodeTypes.has(value.type)) return null;
  const node: JSONContent = { type: value.type };

  if (value.type === 'text') {
    if (typeof value.text !== 'string') return null;
    node.text = value.text;
    if (Array.isArray(value.marks)) node.marks = value.marks.map(normalizeMark).filter((mark): mark is { type: string; attrs?: Record<string, unknown> } => mark !== null);
    return node;
  }

  if (value.type === 'taskItem') node.attrs = { checked: isRecord(value.attrs) && value.attrs.checked === true };

  if (Array.isArray(value.content)) node.content = value.content.map(normalizeNode).filter((child): child is JSONContent => Boolean(child));
  return node;
}

function normalizeMark(value: unknown): { type: string; attrs?: Record<string, unknown> } | null {
  if (!isRecord(value) || typeof value.type !== 'string' || !markTypes.has(value.type)) return null;
  if (value.type === 'bold' || value.type === 'italic') return { type: value.type };
  if (!isRecord(value.attrs) || typeof value.attrs.color !== 'string') return null;
  const color = value.attrs.color.toLowerCase();
  const allowed = value.type === 'textStyle' ? textColors.has(color) : highlightColors.has(color);
  return allowed ? { type: value.type, attrs: { color } } : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
