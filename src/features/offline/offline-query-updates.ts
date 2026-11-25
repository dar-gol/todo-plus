import type { QueryClient } from '@tanstack/react-query';
import type { ShoppingListItem } from '../shopping/shopping-list-api';
import type { TodoTask } from '../todos/todo-api';
import type { OfflineMutation } from './OfflineMutation';

export function applyOfflineMutation(queryClient: QueryClient, mutation: OfflineMutation): void {
  if (mutation.kind === 'todo-create') {
    queryClient.setQueryData<TodoTask[]>(['todos', mutation.localTask.scope], (tasks = []) => (
      tasks.some(({ id }) => id === mutation.localTask.id) ? tasks : [...tasks, mutation.localTask]
    ));
    return;
  }
  if (mutation.kind === 'todo-update') {
    queryClient.setQueryData<TodoTask[]>(['todos', mutation.scope], (tasks = []) => (
      tasks.map((task) => task.id === mutation.taskId ? updateTodoTask(task, mutation.input) : task)
    ));
    return;
  }
  if (mutation.kind === 'todo-delete') {
    queryClient.setQueryData<TodoTask[]>(['todos', mutation.scope], (tasks = []) => (
      tasks.filter(({ id }) => id !== mutation.taskId)
    ));
    return;
  }
  if (mutation.kind === 'todo-reorder') {
    queryClient.setQueryData<TodoTask[]>(['todos', mutation.input.scope], (tasks = []) => (
      applyTodoOrder(tasks, mutation.input)
    ));
    return;
  }
  if (mutation.kind === 'shopping-add') {
    queryClient.setQueryData<ShoppingListItem[]>(['shopping-list', mutation.householdId], (items = []) => (
      items.some(({ id }) => id === mutation.localItem.id) ? items : [...items, mutation.localItem]
    ));
    return;
  }
  if (mutation.kind === 'shopping-update') {
    queryClient.setQueryData<ShoppingListItem[]>(['shopping-list', mutation.householdId], (items = []) => (
      items.map((item) => item.id === mutation.itemId ? updateShoppingItem(item, mutation.input) : item)
    ));
    return;
  }
  if (mutation.kind === 'shopping-delete') {
    queryClient.setQueryData<ShoppingListItem[]>(['shopping-list', mutation.householdId], (items = []) => (
      items.filter(({ id }) => id !== mutation.itemId)
    ));
  }
}

export function overlayTodoTasks(
  tasks: TodoTask[],
  mutations: OfflineMutation[],
  scope: TodoTask['scope']
): TodoTask[] {
  let orderedTasks = tasks;
  for (const mutation of mutations) {
    if (mutation.kind === 'todo-create' && mutation.localTask.scope === scope) {
      orderedTasks = [...orderedTasks.filter(({ id }) => id !== mutation.localTask.id), mutation.localTask];
    } else if (mutation.kind === 'todo-update' && mutation.scope === scope) {
      orderedTasks = orderedTasks.map((task) => task.id === mutation.taskId ? updateTodoTask(task, mutation.input) : task);
    } else if (mutation.kind === 'todo-delete' && mutation.scope === scope) {
      orderedTasks = orderedTasks.filter(({ id }) => id !== mutation.taskId);
    } else if (mutation.kind === 'todo-reorder' && mutation.input.scope === scope) {
      orderedTasks = applyTodoOrder(orderedTasks, mutation.input);
    }
  }
  return orderedTasks;
}

export function overlayShoppingItems(
  items: ShoppingListItem[],
  mutations: OfflineMutation[],
  householdId: string
): ShoppingListItem[] {
  let result = items;
  for (const mutation of mutations) {
    if (mutation.kind === 'shopping-add' && mutation.householdId === householdId) {
      result = result.some(({ id }) => id === mutation.localItem.id) ? result : [...result, mutation.localItem];
    } else if (mutation.kind === 'shopping-update' && mutation.householdId === householdId) {
      result = result.map((item) => item.id === mutation.itemId ? updateShoppingItem(item, mutation.input) : item);
    } else if (mutation.kind === 'shopping-delete' && mutation.householdId === householdId) {
      result = result.filter(({ id }) => id !== mutation.itemId);
    }
  }
  return result;
}

export function replaceTodoTask(queryClient: QueryClient, localId: string, task: TodoTask): void {
  queryClient.setQueryData<TodoTask[]>(['todos', task.scope], (tasks = []) => (
    tasks.map((current) => current.id === localId || current.id === task.id ? task : current)
  ));
}

export function replaceShoppingItem(
  queryClient: QueryClient,
  householdId: string,
  localId: string,
  item: ShoppingListItem
): void {
  queryClient.setQueryData<ShoppingListItem[]>(['shopping-list', householdId], (items = []) => (
    items.map((current) => current.id === localId || current.id === item.id ? item : current)
  ));
}

function updateTodoTask(task: TodoTask, input: Parameters<import('../todos/todo-api').TodoApi['update']>[1]): TodoTask {
  const now = new Date().toISOString();
  return {
    ...task,
    ...(input.alarmReminders === undefined ? {} : { alarmReminders: input.alarmReminders }),
    ...(input.calendarColor === undefined ? {} : { calendarColor: input.calendarColor }),
    ...(input.completed === undefined ? {} : { completedAt: input.completed ? now : null }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.dueAt === undefined ? {} : { dueAt: input.dueAt }),
    ...(input.dueAt === null ? { endAt: null } : input.endAt === undefined ? {} : { endAt: input.endAt }),
    ...(input.dueAtAlarmEnabled === undefined ? {} : { dueAtAlarmEnabled: input.dueAtAlarmEnabled }),
    ...(input.noteDocument === undefined ? {} : { noteDocument: input.noteDocument }),
    ...(input.notes === undefined ? {} : { notes: input.notes }),
    ...(input.recurrence === undefined ? {} : { recurrence: input.recurrence }),
    ...(input.reminders === undefined ? {} : { reminders: input.reminders }),
    ...(input.title === undefined ? {} : { title: input.title.trim() }),
    updatedAt: now
  };
}

function updateShoppingItem(
  item: ShoppingListItem,
  input: Parameters<import('../shopping/shopping-list-api').ShoppingListApi['update']>[2]
): ShoppingListItem {
  return {
    ...item,
    ...(input.checked === undefined ? {} : { checkedAt: input.checked ? new Date().toISOString() : null }),
    ...(input.label === undefined ? {} : { label: input.label }),
    ...(input.productId === undefined ? {} : { productId: input.productId }),
    ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
    ...(input.unit === undefined ? {} : { unit: input.unit }),
    updatedAt: new Date().toISOString(),
    version: item.version + 1
  };
}

function applyTodoOrder(
  tasks: TodoTask[],
  input: Parameters<import('../todos/todo-api').TodoApi['reorder']>[0]
): TodoTask[] {
  const openTasks = new Map(tasks.filter((task) => !task.completedAt).map((task) => [task.id, task]));
  const ordered: TodoTask[] = [];
  const append = (ids: string[], section: TodoTask['section']) => {
    for (const id of ids) {
      const task = openTasks.get(id);
      if (!task) continue;
      ordered.push({ ...task, section, updatedAt: new Date().toISOString() });
      openTasks.delete(id);
    }
  };
  append(input.pinnedTaskIds, 'pinned');
  append(input.standardTaskIds, 'standard');
  append(input.laterTaskIds, 'later');
  return [...ordered, ...openTasks.values(), ...tasks.filter((task) => Boolean(task.completedAt))];
}
