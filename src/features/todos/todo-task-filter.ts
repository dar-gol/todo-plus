export const todoTaskFilters = {
  all: 'Wszystkie',
  dated: 'Z terminem',
  undated: 'Bez terminu',
  month: 'Ten miesiąc',
  archive: 'Archiwum'
} as const;

export type TodoTaskFilter = keyof typeof todoTaskFilters;

export function isTodoTaskFilter(value: string | null): value is TodoTaskFilter {
  return value !== null && Object.hasOwn(todoTaskFilters, value);
}
