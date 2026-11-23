import { ChevronDown, ListFilter } from 'lucide-react';
import type { TodoTaskFilter } from './todo-task-filter';

/** Keeps task filtering compact enough for one-handed use on a phone. */
export function TodoTaskFilterControl({ value, onChange }: { value: TodoTaskFilter; onChange: (filter: TodoTaskFilter) => void }) {
  function updateFilter(value: string) {
    if (value === 'all' || value === 'dated' || value === 'undated' || value === 'month') onChange(value);
  }

  return (
    <label className="task-filter-control">
      <ListFilter aria-hidden="true" />
      <select aria-label="Filtr zadań" value={value} onChange={(event) => updateFilter(event.target.value)}>
        <option value="all">Wszystkie</option>
        <option value="dated">Z terminem</option>
        <option value="undated">Bez terminu</option>
        <option value="month">Ten miesiąc</option>
      </select>
      <ChevronDown className="task-filter-chevron" aria-hidden="true" />
    </label>
  );
}
