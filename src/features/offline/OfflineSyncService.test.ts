// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { QueryClient } from '@tanstack/react-query';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TodoTask } from '../todos/todo-api';
import { todoApi } from '../todos/todo-api';
import { OfflineDatabase } from './OfflineDatabase';
import type { OfflineMutation } from './OfflineMutation';
import { OfflineQueryPersistence } from './OfflineQueryPersistence';
import { OfflineRepository } from './OfflineRepository';
import { OfflineSyncService } from './OfflineSyncService';

vi.mock('../todos/todo-api', () => ({
  todoApi: {
    create: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
    update: vi.fn()
  }
}));
vi.mock('../shopping/shopping-list-api', () => ({
  shoppingListApi: {
    add: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
    update: vi.fn()
  }
}));
vi.mock('../auth/auth-api', () => ({
  authApi: { updateCalendarColor: vi.fn() }
}));

const localTask: TodoTask = {
  alarmReminders: [],
  calendarColor: null,
  completedAt: null,
  createdAt: '2026-11-25T10:00:00.000Z',
  createdByColor: 'blue',
  createdByName: 'Ada',
  createdByUserId: 'user-1',
  description: null,
  dueAt: null,
  dueAtAlarmEnabled: false,
  endAt: null,
  id: 'local:create-1',
  noteDocument: null,
  notes: null,
  recurrence: null,
  reminders: [],
  scope: 'personal',
  section: 'standard',
  title: 'Offline task',
  updatedAt: '2026-11-25T10:00:00.000Z'
};

let database: OfflineDatabase;
let repository: OfflineRepository;

beforeEach(() => {
  database = new OfflineDatabase(`todo-plus-test-${crypto.randomUUID()}`);
  repository = new OfflineRepository(database);
  vi.clearAllMocks();
});

afterEach(async () => {
  database.close();
  await Dexie.delete(database.name);
});

describe('Offline Todo synchronization', () => {
  it('restores cached data and reapplies a queued local change on cold start', async () => {
    const persistence = new OfflineQueryPersistence(repository);
    const queryClient = new QueryClient();
    await repository.saveSnapshot('user-1', ['todos', 'personal'], [], Date.now());
    await repository.enqueue(createMutation());

    await persistence.hydrate(queryClient, 'user-1');

    expect(queryClient.getQueryData(['todos', 'personal'])).toEqual([localTask]);
  });

  it('maps a local id before replaying later edits and empties the durable queue', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['todos', 'personal'], [localTask]);
    await repository.enqueue(createMutation());
    await repository.enqueue({
      createdAt: '2026-11-25T10:01:00.000Z',
      id: '00000000-0000-4000-8000-000000000002',
      input: { mutationId: '00000000-0000-4000-8000-000000000002', title: 'Updated offline' },
      kind: 'todo-update',
      scope: 'personal',
      state: 'pending',
      taskId: localTask.id,
      userId: 'user-1'
    });
    const serverTask = { ...localTask, id: 'task-1' };
    vi.mocked(todoApi.create).mockResolvedValue(serverTask);
    vi.mocked(todoApi.update).mockResolvedValue({ ...serverTask, title: 'Updated offline' });

    const result = await new OfflineSyncService(repository).sync('user-1', queryClient);

    expect(todoApi.update).toHaveBeenCalledWith('task-1', expect.objectContaining({ title: 'Updated offline' }));
    expect(await repository.listMutations('user-1')).toEqual([]);
    expect(result).toEqual({ error: null, pendingCount: 0, transientFailure: false });
    expect(queryClient.getQueryData<TodoTask[]>(['todos', 'personal'])?.[0]).toMatchObject({
      id: 'task-1',
      title: 'Updated offline'
    });
  });

  it('keeps a change pending after an unavailable API so a later VPN reconnect can retry it', async () => {
    const queryClient = new QueryClient();
    const mutation: OfflineMutation = {
      createdAt: '2026-11-25T10:01:00.000Z',
      id: '00000000-0000-4000-8000-000000000003',
      input: { completed: true, mutationId: '00000000-0000-4000-8000-000000000003' },
      kind: 'todo-update',
      scope: 'personal',
      state: 'pending',
      taskId: 'task-1',
      userId: 'user-1'
    };
    await repository.enqueue(mutation);
    vi.mocked(todoApi.update).mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await new OfflineSyncService(repository).sync('user-1', queryClient);

    expect(result.transientFailure).toBe(true);
    expect(await repository.listMutations('user-1')).toEqual([expect.objectContaining({ id: mutation.id, state: 'pending' })]);
  });
});

function createMutation(): OfflineMutation {
  return {
    createdAt: '2026-11-25T10:00:00.000Z',
    id: '00000000-0000-4000-8000-000000000001',
    input: {
      mutationId: '00000000-0000-4000-8000-000000000001',
      scope: 'personal',
      title: localTask.title
    },
    kind: 'todo-create',
    localTask,
    state: 'pending',
    userId: 'user-1'
  };
}
