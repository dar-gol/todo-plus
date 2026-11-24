import { Highlight } from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import { normalizeTodoNoteLinkHref } from './todo-note-link';
import { todoNotePasteExtension } from './todo-note-paste';

export const todoNoteExtensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: {
      autolink: true,
      defaultProtocol: 'https',
      linkOnPaste: true,
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      isAllowedUri: (href) => normalizeTodoNoteLinkHref(href) !== null
    }
  }),
  TextStyle,
  Color.configure({ types: ['textStyle'] }),
  Highlight.configure({ multicolor: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  todoNotePasteExtension
];
