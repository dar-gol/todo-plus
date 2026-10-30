'use client';

import { Bold, Eraser, Italic, List, ListChecks, ListOrdered, Redo2, Undo2 } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import { useMemo, useState } from 'react';
import { todoNoteHighlightColors, todoNoteTextColors } from './todo-note-colors';
import { normalizeTodoNoteDocument } from './todo-note-document';
import { todoNoteExtensions } from './todo-note-extensions';

export function TodoNoteEditor({ document, legacyText }: { document?: unknown | null; legacyText?: string | null }) {
  const initialDocument = useMemo(() => normalizeTodoNoteDocument(document, legacyText), [document, legacyText]);
  const [serializedDocument, setSerializedDocument] = useState(() => JSON.stringify(initialDocument));
  const [plainText, setPlainText] = useState(legacyText ?? '');
  const editor = useEditor({
    extensions: todoNoteExtensions,
    content: initialDocument,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setSerializedDocument(JSON.stringify(currentEditor.getJSON()));
      setPlainText(currentEditor.getText({ blockSeparator: '\n' }).trim());
    }
  });

  return (
    <div className="note-editor-shell">
      <input type="hidden" name="noteDocument" value={serializedDocument} />
      <input type="hidden" name="notes" value={plainText} />
      <div className="note-toolbar" role="toolbar" aria-label="Formatowanie notatki">
        <ToolbarButton label="Pogrubienie" active={editor?.isActive('bold')} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Kursywa" active={editor?.isActive('italic')} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Lista punktowana" active={editor?.isActive('bulletList')} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Lista numerowana" active={editor?.isActive('orderedList')} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Lista z checkboxami" active={editor?.isActive('taskList')} disabled={!editor} onClick={() => editor?.chain().focus().toggleTaskList().run()}><ListChecks aria-hidden="true" /></ToolbarButton>
        <span className="toolbar-divider" aria-hidden="true" />
        <div className="color-tools" aria-label="Kolor tekstu">
          {todoNoteTextColors.map(({ color, label }) => <button key={color} type="button" className="color-button" onClick={() => editor?.chain().focus().setColor(color).run()} aria-label={label} title={label}><span style={{ backgroundColor: color }} /></button>)}
        </div>
        <div className="color-tools highlight-tools" aria-label="Podświetlenie">
          {todoNoteHighlightColors.map(({ color, label }) => <button key={color} type="button" className="color-button" onClick={() => editor?.chain().focus().toggleHighlight({ color }).run()} aria-label={label} title={label}><span style={{ backgroundColor: color }} /></button>)}
        </div>
        <ToolbarButton label="Wyczyść kolory" disabled={!editor} onClick={() => editor?.chain().focus().unsetColor().unsetHighlight().run()}><Eraser aria-hidden="true" /></ToolbarButton>
        <span className="toolbar-spacer" />
        <ToolbarButton label="Cofnij" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Ponów" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 aria-hidden="true" /></ToolbarButton>
      </div>
      <EditorContent editor={editor} className="todo-note-editor" aria-label="Treść notatki" />
    </div>
  );
}

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <button type="button" className={`toolbar-button ${active ? 'active' : ''}`} disabled={disabled} onClick={onClick} aria-label={label} title={label}>{children}</button>;
}
