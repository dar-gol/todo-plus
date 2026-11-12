import type { TodoTask } from './todo-api';

export const todoCreatorColorOptions: ReadonlyArray<{
  value: TodoTask['createdByColor'];
  css: string;
}> = [
  { value: 'blue', css: '#2563eb' },
  { value: 'purple', css: '#7c3aed' },
  { value: 'pink', css: '#db2777' },
  { value: 'orange', css: '#ea580c' },
  { value: 'cyan', css: '#0891b2' },
  { value: 'green', css: '#16a34a' },
  { value: 'yellow', css: '#ca8a04' },
  { value: 'red', css: '#dc2626' }
];

export function todoCreatorColorCss(color: TodoTask['createdByColor']): string {
  return todoCreatorColorOptions.find((option) => option.value === color)?.css ?? '#2563eb';
}
