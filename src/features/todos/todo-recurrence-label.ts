import type { TodoTask } from './todo-api';

export function todoRecurrenceLabel(recurrence: TodoTask['recurrence']): string | null {
  if (recurrence === 'daily') return 'Codziennie';
  if (recurrence === 'weekly') return 'Co tydzień';
  if (recurrence === 'monthly') return 'Co miesiąc';
  if (recurrence === 'yearly') return 'Co rok';
  return null;
}
