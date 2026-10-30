import { useId, type ReactNode } from 'react';
import type { JSONContent } from '@tiptap/core';
import { normalizeTodoNoteDocument, toggleTodoNoteTaskItem } from './todo-note-document';
import { todoNoteHighlightColors, todoNoteTextColors } from './todo-note-colors';

const textColors = new Set<string>(todoNoteTextColors.map(({ color }) => color));
const highlightColors = new Set<string>(todoNoteHighlightColors.map(({ color }) => color));

export function TodoNotePreview({ document, legacyText, pending = false, onTaskItemToggle }: {
  document?: unknown | null;
  legacyText?: string | null;
  pending?: boolean;
  onTaskItemToggle?: (document: Record<string, unknown>) => void;
}) {
  const normalized = normalizeTodoNoteDocument(document, legacyText);
  const idPrefix = useId();
  return <div className="todo-note-preview">{normalized.content?.map((node, index) => renderNode(node, index, [index], normalized, idPrefix, pending, onTaskItemToggle))}</div>;
}

function renderNode(
  node: JSONContent,
  index: number,
  path: readonly number[],
  document: JSONContent,
  idPrefix: string,
  pending: boolean,
  onTaskItemToggle?: (document: Record<string, unknown>) => void
): ReactNode {
  if (node.type === 'taskItem') {
    const checked = node.attrs?.checked === true;
    const interactive = Boolean(onTaskItemToggle);
    const inputId = `${idPrefix}-${path.join('-')}`;
    const [paragraph, ...nestedNodes] = node.content ?? [];
    const labelContent = paragraph?.type === 'paragraph'
      ? paragraph.content?.map((child, childIndex) => renderNode(child, childIndex, [...path, 0, childIndex], document, idPrefix, pending, onTaskItemToggle))
      : null;
    const nestedContent = nestedNodes.map((child, childIndex) => renderNode(child, childIndex, [...path, childIndex + 1], document, idPrefix, pending, onTaskItemToggle));
    return <li key={index} className={checked ? 'checked' : ''}><input id={inputId} type="checkbox" checked={checked} readOnly disabled={!interactive || pending} aria-label={checked ? 'Oznacz element jako niewykonany' : 'Oznacz element jako wykonany'} onChange={() => onTaskItemToggle?.(toggleTodoNoteTaskItem(document, path))} /><div><label htmlFor={inputId} className="todo-checklist-label">{labelContent?.length ? labelContent : <br />}</label>{nestedContent}</div></li>;
  }

  const children = node.content?.map((child, childIndex) => renderNode(child, childIndex, [...path, childIndex], document, idPrefix, pending, onTaskItemToggle));
  if (node.type === 'paragraph') return <p key={index}>{children?.length ? children : <br />}</p>;
  if (node.type === 'bulletList') return <ul key={index}>{children}</ul>;
  if (node.type === 'orderedList') return <ol key={index}>{children}</ol>;
  if (node.type === 'listItem') return <li key={index}>{children}</li>;
  if (node.type === 'taskList') return <ul key={index} className="todo-checklist">{children}</ul>;
  if (node.type === 'hardBreak') return <br key={index} />;
  if (node.type === 'text') return <span key={index}>{applyMarks(node.text ?? '', node.marks ?? [])}</span>;
  return null;
}

function applyMarks(text: ReactNode, marks: JSONContent[]): ReactNode {
  return marks.reduce<ReactNode>((content, mark, index) => {
    if (mark.type === 'bold') return <strong key={index}>{content}</strong>;
    if (mark.type === 'italic') return <em key={index}>{content}</em>;
    const color = typeof mark.attrs?.color === 'string' ? mark.attrs.color.toLowerCase() : '';
    if (mark.type === 'textStyle' && textColors.has(color)) return <span key={index} style={{ color }}>{content}</span>;
    if (mark.type === 'highlight' && highlightColors.has(color)) return <mark key={index} style={{ backgroundColor: color }}>{content}</mark>;
    return content;
  }, text);
}
