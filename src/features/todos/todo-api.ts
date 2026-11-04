import type { components } from '@/lib/api/generated';
import { apiClient } from '@/lib/api/api-client';

export type TodoTask = components['schemas']['TodoTaskResponseDto'];
export type TodoScope = TodoTask['scope'];
type TodoTaskList = components['schemas']['TodoTaskListResponseDto'];

/** Exposes the Todo Plus task contract without leaking transport into views. */
export class TodoApi {
  async list(scope: TodoScope): Promise<TodoTask[]> {
    const result = await apiClient.request<TodoTaskList>(`/todos?scope=${scope}`);
    return result.items;
  }

  create(input: { scope: TodoScope; title: string; description?: string | null; notes?: string | null; noteDocument?: Record<string, unknown> | null; dueAt?: string | null; reminders?: string[] }): Promise<TodoTask> {
    return apiClient.request('/todos', { method: 'POST', body: JSON.stringify(input) });
  }

  update(taskId: string, input: { title?: string; description?: string | null; notes?: string | null; noteDocument?: Record<string, unknown> | null; dueAt?: string | null; reminders?: string[]; completed?: boolean }): Promise<TodoTask> {
    return apiClient.request(`/todos/${taskId}`, { method: 'PATCH', body: JSON.stringify(input) });
  }

  reorder(input: components['schemas']['ReorderTodoTasksDto']): Promise<TodoTask[]> {
    return apiClient
      .request<TodoTaskList>('/todos/order', { method: 'PATCH', body: JSON.stringify(input) })
      .then(({ items }) => items);
  }

  remove(taskId: string): Promise<void> {
    return apiClient.request(`/todos/${taskId}`, { method: 'DELETE' });
  }
}

export const todoApi = new TodoApi();
