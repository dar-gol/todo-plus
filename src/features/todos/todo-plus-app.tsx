'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ListTodo, LogOut, Plus, RefreshCw, Search, Settings, ShoppingBasket, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthScreen } from '@/features/auth/auth-screen';
import { authApi } from '@/features/auth/auth-api';
import type { AuthUserProfile } from '@/features/auth/auth-user-profile';
import { householdApi } from '@/features/households/household-api';
import { PushBanner } from '@/features/push/push-banner';
import { OfflineSyncIndicator } from '@/features/offline/OfflineSyncIndicator';
import { offlineRepository } from '@/features/offline/offline-runtime';
import { overlayTodoTasks } from '@/features/offline/offline-query-updates';
import { useOfflineTodoActions } from '@/features/offline/use-offline-todo-actions';
import { christianHolidayApi } from './christian-holiday-api';
import { nameDayApi } from './name-day-api';
import { publicHolidayApi } from './public-holiday-api';
import { TodoCalendar } from './todo-calendar';
import { TodoEditor } from './todo-editor';
import { todoApi, TodoScope } from './todo-api';
import { TodoTaskDetails } from './todo-task-details';
import { TodoTaskBoard } from './todo-task-board';
import { TodoTaskItem } from './todo-task-item';
import { TodoTaskSearchDialog } from './todo-task-search-dialog';
import type { TodoTaskOrder } from './todo-task-order';
import type { TodoDeleteMode, TodoTask } from './todo-api';
import type { TodoDefaultView } from './todo-default-view';
import { TodoRecurrenceDeleteDialog } from './todo-recurrence-delete-dialog';
import { TodoSettingsDialog } from './todo-settings-dialog';
import { todoViewPreferences } from './todo-view-preferences';
import { TodoShoppingList } from '@/features/shopping/todo-shopping-list';
import type { TodoTaskFilter } from './todo-task-filter';
import { TodoTaskFilterControl } from './todo-task-filter-control';
import { filterTodoTasks } from './todo-task-filter-model';
import { todoTaskFilterPreferences } from './todo-task-filter-preferences';
import { useTodoEditorLaunch } from './use-todo-editor-launch';

export function TodoPlusApp() {
  const cachedUser = authApi.cachedUser;
  const [signedIn, setSignedIn] = useState<boolean | null>(() => cachedUser ? true : null);
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(cachedUser);
  const [scope, setScope] = useState<TodoScope>('family');
  const [taskFilter, setTaskFilter] = useState<TodoTaskFilter>(() => todoTaskFilterPreferences.load('family'));
  const [calendarOpen, setCalendarOpen] = useState(() => todoViewPreferences.load() === 'calendar');
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDate, setEditorDate] = useState<string | null>(null);
  const { launch: editorLaunch, closeLaunch: closeEditorLaunch } = useTodoEditorLaunch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [defaultView, setDefaultView] = useState<TodoDefaultView>(() => todoViewPreferences.load());
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [recurringTaskToDelete, setRecurringTaskToDelete] = useState<TodoTask | null>(null);
  const queryClient = useQueryClient();
  const todoActions = useOfflineTodoActions(currentUser);
  useEffect(() => {
    let active = true;
    authApi.restore().then((profile) => {
      if (active) {
        setCurrentUser(profile);
        setSignedIn(Boolean(profile));
      }
    });
    return () => { active = false; };
  }, []);

  const personalTasks = useQuery({
    queryKey: ['todos', 'personal'],
    queryFn: async () => {
      const tasks = await todoApi.list('personal');
      return currentUser
        ? overlayTodoTasks(tasks, await offlineRepository.listMutations(currentUser.id), 'personal')
        : tasks;
    },
    enabled: signedIn === true && (searchOpen || calendarOpen || (!shoppingOpen && scope === 'personal'))
  });
  const familyTasks = useQuery({
    queryKey: ['todos', 'family'],
    queryFn: async () => {
      const tasks = await todoApi.list('family');
      return currentUser
        ? overlayTodoTasks(tasks, await offlineRepository.listMutations(currentUser.id), 'family')
        : tasks;
    },
    enabled: signedIn === true && (searchOpen || calendarOpen || (!shoppingOpen && scope === 'family'))
  });
  const publicHolidays = useQuery({
    queryKey: ['public-holidays', 'PL', calendarYear],
    queryFn: () => publicHolidayApi.list(calendarYear),
    enabled: signedIn === true && calendarOpen,
    staleTime: 24 * 60 * 60 * 1000
  });
  const christianHolidays = useQuery({
    queryKey: ['christian-holidays', 'PL', calendarYear],
    queryFn: () => christianHolidayApi.list(calendarYear),
    enabled: signedIn === true && calendarOpen,
    staleTime: 24 * 60 * 60 * 1000
  });
  const nameDays = useQuery({
    queryKey: ['name-days', 'PL', calendarYear],
    queryFn: () => nameDayApi.list(calendarYear),
    enabled: signedIn === true && calendarOpen,
    staleTime: 24 * 60 * 60 * 1000
  });
  const household = useQuery({
    queryKey: ['household', 'current'],
    queryFn: () => householdApi.current(),
    enabled: signedIn === true
  });
  const createTask = useMutation({
    mutationFn: (input: Parameters<typeof todoApi.create>[0]) => todoActions.create(input)
  });
  const updateTask = useMutation({
    mutationFn: ({ task, completed }: { task: TodoTask; completed: boolean }) => todoActions.update(task, { completed })
  });
  const reorderTasks = useMutation({
    mutationFn: (input: TodoTaskOrder & { scope: TodoScope }) => todoActions.reorder(input.scope, input),
    onSuccess: (updated, input) => queryClient.setQueryData(['todos', input.scope], updated),
    onError: (_error, input) => queryClient.invalidateQueries({ queryKey: ['todos', input.scope] })
  });
  const editTask = useMutation({
    mutationFn: ({ task, input }: { task: TodoTask; input: Parameters<typeof todoApi.update>[1] }) => todoActions.update(task, input),
    onSuccess: (updated) => {
      setSelectedTask(updated);
    }
  });
  const removeTask = useMutation({
    mutationFn: ({ task, mode }: { task: TodoTask; mode: TodoDeleteMode }) => todoActions.remove(task, mode),
    onSuccess: () => {
      setRecurringTaskToDelete(null);
    }
  });
  const updateCalendarColor = useMutation({
    mutationFn: (color: AuthUserProfile['calendarColor']) => todoActions.updateCalendarColor(color),
    onSuccess: (profile) => {
      setCurrentUser(profile);
    }
  });

  const allTasks = useMemo(
    () => [...(personalTasks.data ?? []), ...(familyTasks.data ?? [])],
    [personalTasks.data, familyTasks.data]
  );

  if (signedIn === null) return <main className="loading-screen"><CheckCircle2 aria-hidden="true" /><span>Otwieram Todo Plus…</span></main>;
  if (!signedIn || !currentUser) return <AuthScreen onSignedIn={() => { setCurrentUser(authApi.currentUser); setSignedIn(true); }} />;

  const tasks = scope === 'personal' ? personalTasks : familyTasks;
  const archiveOpen = taskFilter === 'archive';
  const tasksHaveData = tasks.data !== undefined;
  const tasksInitiallyLoading = tasks.isLoading && !tasksHaveData;
  const tasksInitialError = tasks.isError && !tasksHaveData;
  const activeTasks = tasks.data?.filter((task) => !task.completedAt) ?? [];
  const visibleTasks = filterTodoTasks(tasks.data ?? [], taskFilter);
  const taskActionsPending = updateTask.isPending || removeTask.isPending || reorderTasks.isPending;
  const calendarError = personalTasks.data === undefined ? personalTasks.error : familyTasks.data === undefined ? familyTasks.error : null;
  const householdName = household.data?.name ?? 'Rodzina';

  async function logout() {
    if (currentUser) await offlineRepository.clearUser(currentUser.id);
    await authApi.logout();
    queryClient.clear();
    closeEditorLaunch();
    setEditorOpen(false);
    setCurrentUser(null);
    setSignedIn(false);
  }

  function requestTaskRemoval(task: TodoTask) {
    if (task.recurrence) {
      removeTask.reset();
      setRecurringTaskToDelete(task);
      return;
    }
    removeTask.mutate({ task, mode: 'series' });
  }

  function selectScope(nextScope: TodoScope) {
    setShoppingOpen(false);
    setScope(nextScope);
    setTaskFilter(todoTaskFilterPreferences.load(nextScope));
  }

  function changeTaskFilter(filter: TodoTaskFilter) {
    setTaskFilter(filter);
    todoTaskFilterPreferences.save(scope, filter);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark small"><CheckCircle2 aria-hidden="true" /></span><div><strong>Todo Plus</strong><span>Małe kroki, spokojniejszy dzień</span></div></div>
        <div className="header-actions">
          <button
            className={`icon-button ${calendarOpen ? 'active' : ''}`}
            onClick={() => { setShoppingOpen(false); setCalendarOpen((open) => !open); }}
            aria-label={calendarOpen ? 'Wróć do list zadań' : 'Pokaż kalendarz'}
            aria-pressed={calendarOpen}
            title={calendarOpen ? 'Listy zadań' : 'Kalendarz'}
          >{calendarOpen ? <ListTodo aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}</button>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Otwórz ustawienia"><Settings aria-hidden="true" /></button>
          <button className="icon-button" onClick={logout} aria-label="Wyloguj się"><LogOut aria-hidden="true" /></button>
        </div>
      </header>

      <div className="app-content">
        <OfflineSyncIndicator />
        <PushBanner />
        {calendarOpen ? (
          <TodoCalendar
            tasks={allTasks}
            holidays={publicHolidays.data ?? []}
            christianHolidays={christianHolidays.data ?? []}
            nameDays={nameDays.data ?? []}
            observancesLoading={
              publicHolidays.isLoading && publicHolidays.data === undefined
              || christianHolidays.isLoading && christianHolidays.data === undefined
              || nameDays.isLoading && nameDays.data === undefined
            }
            observancesError={
              publicHolidays.data === undefined ? publicHolidays.error
                : christianHolidays.data === undefined ? christianHolidays.error
                  : nameDays.data === undefined ? nameDays.error : null
            }
            loading={
              personalTasks.isLoading && personalTasks.data === undefined
              || familyTasks.isLoading && familyTasks.data === undefined
            }
            error={calendarError}
            onRetry={() => { void personalTasks.refetch(); void familyTasks.refetch(); }}
            onObservancesRetry={() => {
              void publicHolidays.refetch();
              void christianHolidays.refetch();
              void nameDays.refetch();
            }}
            onVisibleYearChange={setCalendarYear}
            onAddTask={(dateKey) => { setEditorDate(dateKey); setEditorOpen(true); }}
            onTaskOpen={setSelectedTask}
          />
        ) : (
          <>
            <nav className="list-tabs" aria-label="Wybierz listę">
              <button className={!shoppingOpen && scope === 'personal' ? 'active' : ''} onClick={() => selectScope('personal')}><ListTodo aria-hidden="true" />Moja lista</button>
              <button className={!shoppingOpen && scope === 'family' ? 'active' : ''} onClick={() => selectScope('family')}><Users aria-hidden="true" />{householdName}</button>
              <button className={shoppingOpen ? 'active' : ''} onClick={() => setShoppingOpen(true)}><ShoppingBasket aria-hidden="true" />Zakupy</button>
            </nav>
            {shoppingOpen ? (
              household.data ? <TodoShoppingList householdId={household.data.id} householdName={householdName} /> : household.isError ? (
                <div className="state-card error-state"><p>{household.error.message}</p><button onClick={() => household.refetch()}>Spróbuj ponownie</button></div>
              ) : <div className="state-card">{household.isLoading ? 'Wczytuję wspólny dom…' : 'Najpierw utwórz dom w Kitchen Plus.'}</div>
            ) : <section className="tasks-section" aria-labelledby="tasks-title">
              <div className="section-heading">
                <div><p className="eyebrow">{scope === 'family' ? 'WSPÓLNIE' : 'TYLKO DLA CIEBIE'}</p><h1 id="tasks-title">{scope === 'family' ? householdName : 'Moja lista'}</h1></div>
                <div className="task-list-actions">
                  <button type="button" className="icon-button task-search-button" aria-label="Szukaj zadań" title="Szukaj zadań" aria-haspopup="dialog" onClick={() => setSearchOpen(true)}><Search aria-hidden="true" /></button>
                  <TodoTaskFilterControl value={taskFilter} onChange={changeTaskFilter} />
                </div>
              </div>
              {tasksInitiallyLoading && <div className="state-card"><RefreshCw className="spin" aria-hidden="true" />Wczytuję zadania…</div>}
              {tasksInitialError && <div className="state-card error-state"><p>{tasks.error.message}</p><button onClick={() => tasks.refetch()}>Spróbuj ponownie</button></div>}
              {tasksHaveData && visibleTasks.length === 0 && <div className="empty-state">
                <CheckCircle2 aria-hidden="true" />
                <h2>{archiveOpen ? 'Archiwum jest puste' : taskFilter === 'all' ? 'Wszystko zrobione' : 'Brak pasujących zadań'}</h2>
                <p>{archiveOpen ? 'Tutaj znajdziesz ukończone zadania z tej listy.' : taskFilter === 'all' ? (scope === 'family' ? `Lista „${householdName}” jest teraz pusta.` : 'Dodaj pierwszą rzecz, o której chcesz pamiętać.') : 'Zmień filtr, aby zobaczyć pozostałe zadania.'}</p>
              </div>}
              {visibleTasks.length > 0 && (archiveOpen ? (
                <ul className="task-list" aria-label="Archiwum zadań">
                  {visibleTasks.map((task) => <TodoTaskItem key={task.id} task={task} pending={taskActionsPending} onToggle={() => updateTask.mutate({ task, completed: false })} onRemove={() => requestTaskRemoval(task)} onOpen={() => setSelectedTask(task)} />)}
                </ul>
              ) : (
                <TodoTaskBoard
                  key={scope}
                  tasks={activeTasks}
                  visibleTasks={visibleTasks}
                  scope={scope}
                  pending={taskActionsPending}
                  onToggle={(task) => updateTask.mutate({ task, completed: true })}
                  onRemove={requestTaskRemoval}
                  onOpen={setSelectedTask}
                  onReorder={(order) => reorderTasks.mutate({ scope, ...order })}
                />
              ))}
              {!archiveOpen && reorderTasks.isError && reorderTasks.variables?.scope === scope && <p className="task-order-error" role="alert">Nie udało się zapisać kolejności zadań. Spróbuj ponownie.</p>}
            </section>}
          </>
        )}
      </div>

      {!calendarOpen && !shoppingOpen && <button className="add-button" onClick={() => { setEditorDate(null); setEditorOpen(true); }}><Plus aria-hidden="true" /><span>Dodaj zadanie</span></button>}
      <TodoEditor
        key={editorLaunch ? `shortcut-${editorLaunch}` : editorOpen ? editorDate ?? 'list' : 'closed'}
        open={editorOpen || Boolean(editorLaunch)}
        scope={editorLaunch ? 'personal' : editorDate ? 'family' : scope}
        creatorColor={currentUser.calendarColor}
        allowScopeSelection={Boolean(editorLaunch || editorDate)}
        initialDate={editorLaunch ? '' : editorDate ?? ''}
        pending={createTask.isPending}
        onClose={() => { closeEditorLaunch(); setEditorOpen(false); }}
        onCreate={(input) => createTask.mutateAsync(input).then(() => undefined)}
      />
      {searchOpen && <TodoTaskSearchDialog
        tasks={allTasks}
        loading={personalTasks.isLoading && personalTasks.data === undefined || familyTasks.isLoading && familyTasks.data === undefined}
        hasError={personalTasks.isError && personalTasks.data === undefined || familyTasks.isError && familyTasks.data === undefined}
        onRetry={() => { void personalTasks.refetch(); void familyTasks.refetch(); }}
        onClose={() => setSearchOpen(false)}
        onOpen={(task) => { setSearchOpen(false); setSelectedTask(task); }}
      />}
      {selectedTask && <TodoTaskDetails key={selectedTask.id} task={selectedTask} pending={editTask.isPending} onClose={() => setSelectedTask(null)} onUpdate={(input) => editTask.mutateAsync({ task: selectedTask, input })} />}
      {recurringTaskToDelete && <TodoRecurrenceDeleteDialog
        task={recurringTaskToDelete}
        pending={removeTask.isPending}
        error={removeTask.error}
        onClose={() => { if (!removeTask.isPending) setRecurringTaskToDelete(null); }}
        onDelete={(mode) => removeTask.mutate({ task: recurringTaskToDelete, mode })}
      />}
      <TodoSettingsDialog
        open={settingsOpen}
        defaultView={defaultView}
        currentUser={currentUser}
        colorPending={updateCalendarColor.isPending}
        colorError={updateCalendarColor.error}
        onClose={() => setSettingsOpen(false)}
        onChange={(view) => { todoViewPreferences.save(view); setDefaultView(view); }}
        onCreatorColorChange={(color) => updateCalendarColor.mutate(color)}
      />
    </main>
  );
}
