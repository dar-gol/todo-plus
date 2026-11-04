import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TodoNotePreview } from './todo-note-preview';
import { TodoTaskDetails } from './todo-task-details';
import { TodoTaskItem } from './todo-task-item';

const task = {
  completedAt: null,
  createdAt: '2026-10-28T10:15:00.000Z',
  createdByName: 'Ada',
  createdByUserId: 'user-1',
  description: 'Zabrać ze sobą książeczkę zdrowia.',
  dueAt: '2026-11-05T08:00:00.000Z',
  id: 'task-1',
  notes: 'Gabinet na drugim piętrze.',
  reminders: ['2026-11-04T18:30:00.000Z'],
  section: 'standard' as const,
  scope: 'family' as const,
  title: 'Umówić wizytę',
  updatedAt: '2026-10-28T10:15:00.000Z'
};

describe('Todo task presentation', () => {
  it('shows the description on the list without exposing private notes', () => {
    const html = renderToStaticMarkup(<TodoTaskItem task={task} pending={false} onOpen={vi.fn()} onRemove={vi.fn()} onToggle={vi.fn()} />);

    expect(html).toContain(task.description);
    expect(html).not.toContain(task.notes);
  });

  it('shows notes and creation information in preview mode', () => {
    const html = renderToStaticMarkup(<TodoTaskDetails task={task} pending={false} onClose={vi.fn()} onUpdate={vi.fn()} />);

    expect(html).toContain('aria-label="Edytuj zadanie"');
    expect(html).not.toContain('>Podgląd<');
    expect(html).toContain('Utworzono');
    expect(html).toContain(task.notes);
  });

  it('renders checklist state as read-only in preview mode', () => {
    const html = renderToStaticMarkup(<TodoNotePreview onTaskItemToggle={vi.fn()} document={{
      type: 'doc',
      content: [{
        type: 'taskList',
        content: [{
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gotowe' }] }]
        }]
      }]
    }} />);

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('Gotowe');
  });
});
