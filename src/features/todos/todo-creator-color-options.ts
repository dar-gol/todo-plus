import type { TodoTask } from './todo-api';

const defaultCalendarColorCss = '#0d2659';

/** Uses different hues and lightness levels to keep small calendar markers readable. */
export const todoCreatorColorOptions: ReadonlyArray<{
  value: TodoTask['createdByColor'];
  css: string;
  label: string;
}> = [
  { value: 'blue', css: defaultCalendarColorCss, label: 'Niebieski' },
  { value: 'purple', css: '#581d98', label: 'Fioletowy' },
  { value: 'pink', css: '#d923ac', label: 'Różowy' },
  { value: 'orange', css: '#99350b', label: 'Pomarańczowy' },
  { value: 'cyan', css: '#0f6567', label: 'Turkusowy' },
  { value: 'green', css: '#308f61', label: 'Zielony' },
  { value: 'yellow', css: '#9d7203', label: 'Żółty' },
  { value: 'red', css: '#701921', label: 'Czerwony' }
];

export function todoCreatorColorCss(color: TodoTask['createdByColor']): string {
  return todoCreatorColorOptions.find((option) => option.value === color)?.css ?? defaultCalendarColorCss;
}

/** Stores an empty swatch value as inheritance of the creator's color. */
export function todoCalendarColorFromField(value: FormDataEntryValue | null): NonNullable<TodoTask['calendarColor']> | null {
  return todoCreatorColorOptions.find((option) => option.value === value)?.value ?? null;
}
