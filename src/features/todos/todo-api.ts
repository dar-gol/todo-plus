import type { components, operations } from '../../lib/api/generated';
import { apiClient } from '../../lib/api/api-client';

export type TodoTask = components['schemas']['TodoTaskResponseDto'];
export type TodoScope = TodoTask['scope'];
type TodoDeleteQuery = NonNullable<operations['TodosController_remove']['parameters']['query']>;
export type TodoDeleteMode = NonNullable<TodoDeleteQuery['mode']>;
type TodoTaskList = components['schemas']['TodoTaskListResponseDto'];

/** Exposes the Todo Plus task contract without leaking transport into views. */
export class TodoApi {
  async list(scope: TodoScope): Promise<TodoTask[]> {
    const result = await apiClient.request<TodoTaskList>(`/todos?scope=${scope}`);
    return result.items;
  }

  create(input: components['schemas']['CreateTodoTaskDto']): Promise<TodoTask> {
    return apiClient.request('/todos', { method: 'POST', body: JSON.stringify(input) });
  }

  update(taskId: string, input: components['schemas']['UpdateTodoTaskDto']): Promise<TodoTask> {
    return apiClient.request(`/todos/${taskId}`, { method: 'PATCH', body: JSON.stringify(input) });
  }

  reorder(input: components['schemas']['ReorderTodoTasksDto']): Promise<TodoTask[]> {
    return apiClient
      .request<TodoTaskList>('/todos/order', { method: 'PATCH', body: JSON.stringify(input) })
      .then(({ items }) => items);
  }

  remove(taskId: string, mode: TodoDeleteMode = 'series', mutationId?: string): Promise<void> {
    const query = new URLSearchParams({ mode });
    if (mutationId) query.set('mutationId', mutationId);
    return apiClient.request(`/todos/${taskId}?${query.toString()}`, { method: 'DELETE' });
  }
}

export const todoApi = new TodoApi();
