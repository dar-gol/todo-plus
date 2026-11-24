import { ChevronDown, ListFilter } from 'lucide-react';
import type { TodoTaskFilter } from './todo-task-filter';
import { isTodoTaskFilter, todoTaskFilters } from './todo-task-filter';

/** Keeps task filtering compact enough for one-handed use on a phone. */
export function TodoTaskFilterControl({ value, onChange }: { value: TodoTaskFilter; onChange: (filter: TodoTaskFilter) => void }) {
  function updateFilter(value: string) {
    if (isTodoTaskFilter(value)) onChange(value);
  }

  return (
    <label className="task-filter-control">
      <ListFilter aria-hidden="true" />
      <select aria-label="Filtr zadań" value={value} onChange={(event) => updateFilter(event.target.value)}>
        {Object.entries(todoTaskFilters).map(([filter, label]) => <option key={filter} value={filter}>{label}</option>)}
      </select>
      <ChevronDown className="task-filter-chevron" aria-hidden="true" />
    </label>
  );
}
