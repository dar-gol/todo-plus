import { arrayMove } from '@dnd-kit/sortable';
import type { TodoTask } from './todo-api';
import type { TodoTaskOrder } from './todo-task-order';

export const todoTaskSections = ['pinned', 'standard', 'later'] as const satisfies readonly TodoTask['section'][];

export function groupTodoTasks(tasks: TodoTask[]) {
  return {
    pinned: tasks.filter((task) => task.section === 'pinned'),
    standard: tasks.filter((task) => task.section === 'standard'),
    later: tasks.filter((task) => task.section === 'later')
  };
}

/** Builds the API's full order from a move among visible cards, leaving hidden cards in their lanes. */
export function planTodoTaskOrder(
  tasks: TodoTask[], visibleTasks: TodoTask[], draggedId: string, overId: string
): TodoTaskOrder | null {
  const dragged = visibleTasks.find(({ id }) => id === draggedId);
  const over = visibleTasks.find(({ id }) => id === overId);
  const target = over?.section ?? todoTaskSections.find((section) => section === overId);
  if (!dragged || !target || draggedId === overId) return null;

  const source = dragged.section;
  const groups = groupTodoTasks(tasks);
  if (source === target) {
    if (!over) return null;
    const visible = visibleTasks.filter((task) => task.section === source);
    const visibleSet = new Set(visible.map(({ id }) => id));
    const nextVisible = arrayMove(visible, visible.indexOf(dragged), visible.indexOf(over));
    let index = 0;
    groups[source] = groups[source].map((task) => visibleSet.has(task.id) ? nextVisible[index++] : task);
  } else {
    if (target === 'pinned' && groups.pinned.length >= 3) return null;
    const targetIndex = over ? groups[target].findIndex(({ id }) => id === overId) : groups[target].length;
    groups[source] = groups[source].filter(({ id }) => id !== draggedId);
    groups[target].splice(targetIndex, 0, dragged);
  }

  return {
    pinnedTaskIds: groups.pinned.map(({ id }) => id),
    standardTaskIds: groups.standard.map(({ id }) => id),
    laterTaskIds: groups.later.map(({ id }) => id)
  };
}
