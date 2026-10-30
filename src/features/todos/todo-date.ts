export function dateAtNine(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 9, 0, 0).toISOString();
}

export function dateInputValue(date: string | null | undefined): string {
  if (!date) return '';
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateTimeInputValue(date: string): string {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function dateTimeAtIso(value: string): string {
  return new Date(value).toISOString();
}

export function formatTodoDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pl', options ?? { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
}
