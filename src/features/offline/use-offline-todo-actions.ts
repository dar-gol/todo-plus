'use client';

import { useQueryClient } from '@tanstack/react-query';
import { authSession } from '../../lib/auth/auth-session';
import type { AuthUserProfile } from '../auth/auth-user-profile';
import type { TodoApi, TodoDeleteMode, TodoScope, TodoTask } from '../todos/todo-api';
import type { TodoTaskOrder } from '../todos/todo-task-order';
import type { OfflineMutation } from './OfflineMutation';
import { applyOfflineMutation } from './offline-query-updates';
import { useOfflineSync } from './OfflineSyncProvider';

/** Applies Todo changes locally first and durably queues their server replay. */
export function useOfflineTodoActions(currentUser: AuthUserProfile | null) {
  const queryClient = useQueryClient();
  const { enqueue } = useOfflineSync();

  async function create(input: Parameters<TodoApi['create']>[0]): Promise<TodoTask> {
    const user = requireCurrentUser();
    const mutationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const localTask: TodoTask = {
      alarmReminders: input.alarmReminders ?? [],
      calendarColor: input.calendarColor ?? null,
      completedAt: null,
      createdAt: now,
      createdByColor: user.calendarColor,
      createdByName: user.name ?? null,
      createdByUserId: user.id,
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
      dueAtAlarmEnabled: input.dueAtAlarmEnabled ?? false,
      endAt: input.endAt ?? null,
      id: `local:${mutationId}`,
      noteDocument: input.noteDocument ?? null,
      notes: input.notes ?? null,
      recurrence: input.recurrence ?? null,
      reminders: input.reminders ?? [],
      scope: input.scope,
      section: 'standard',
      title: input.title.trim(),
      updatedAt: now
    };
    const mutation: OfflineMutation = {
      createdAt: now,
      id: mutationId,
      input: { ...input, mutationId },
      kind: 'todo-create',
      localTask,
      state: 'pending',
      userId: user.id
    };
    await enqueue(mutation);
    applyOfflineMutation(queryClient, mutation);
    return localTask;
  }

  async function update(task: TodoTask, input: Parameters<TodoApi['update']>[1]): Promise<TodoTask> {
    const user = requireCurrentUser();
    const mutationId = crypto.randomUUID();
    const mutation: OfflineMutation = {
      createdAt: new Date().toISOString(),
      id: mutationId,
      input: { ...input, mutationId },
      kind: 'todo-update',
      scope: task.scope,
      state: 'pending',
      taskId: task.id,
      userId: user.id
    };
    await enqueue(mutation);
    applyOfflineMutation(queryClient, mutation);
    return queryClient.getQueryData<TodoTask[]>(['todos', task.scope])?.find(({ id }) => id === task.id) ?? task;
  }

  async function reorder(scope: TodoScope, order: TodoTaskOrder): Promise<TodoTask[]> {
    const user = requireCurrentUser();
    const mutationId = crypto.randomUUID();
    const mutation: OfflineMutation = {
      createdAt: new Date().toISOString(),
      id: mutationId,
      input: { ...order, mutationId, scope },
      kind: 'todo-reorder',
      state: 'pending',
      userId: user.id
    };
    await enqueue(mutation);
    applyOfflineMutation(queryClient, mutation);
    return queryClient.getQueryData<TodoTask[]>(['todos', scope]) ?? [];
  }

  async function remove(task: TodoTask, mode: TodoDeleteMode): Promise<void> {
    const user = requireCurrentUser();
    const mutation: OfflineMutation = {
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      kind: 'todo-delete',
      mode,
      scope: task.scope,
      state: 'pending',
      taskId: task.id,
      userId: user.id
    };
    await enqueue(mutation);
    applyOfflineMutation(queryClient, mutation);
  }

  async function updateCalendarColor(calendarColor: AuthUserProfile['calendarColor']): Promise<AuthUserProfile> {
    const user = requireCurrentUser();
    const mutation: OfflineMutation = {
      calendarColor,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      kind: 'profile-color',
      state: 'pending',
      userId: user.id
    };
    await enqueue(mutation);
    const profile = { ...user, calendarColor };
    authSession.saveUser(profile);
    return profile;
  }

  return { create, remove, reorder, update, updateCalendarColor };

  function requireCurrentUser(): AuthUserProfile {
    if (!currentUser) throw new Error('Zaloguj się ponownie, aby zapisać zmianę.');
    return currentUser;
  }
}
