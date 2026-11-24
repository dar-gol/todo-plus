import type { components } from '@/lib/api/generated';

export type TodoTaskOrder = Omit<components['schemas']['ReorderTodoTasksDto'], 'scope'>;
