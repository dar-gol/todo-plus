'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ListTodo, LogOut, Plus, RefreshCw, Search, Settings, ShoppingBasket, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthScreen } from '@/features/auth/auth-screen';
import { authApi } from '@/features/auth/auth-api';
import type { AuthUserProfile } from '@/features/auth/auth-user-profile';
import { householdApi } from '@/features/households/household-api';
import { PushBanner } from '@/features/push/push-banner';
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

export function TodoPlusApp() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [scope, setScope] = useState<TodoScope>('family');
  const [taskFilter, setTaskFilter] = useState<TodoTaskFilter>(() => todoTaskFilterPreferences.load('family'));
  const [calendarOpen, setCalendarOpen] = useState(() => todoViewPreferences.load() === 'calendar');
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDate, setEditorDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [defaultView, setDefaultView] = useState<TodoDefaultView>(() => todoViewPreferences.load());
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [recurringTaskToDelete, setRecurringTaskToDelete] = useState<TodoTask | null>(null);
  const queryClient = useQueryClient();
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
    queryFn: () => todoApi.list('personal'),
    enabled: signedIn === true && (searchOpen || calendarOpen || (!shoppingOpen && scope === 'personal'))
  });
  const familyTasks = useQuery({
    queryKey: ['todos', 'family'],
    queryFn: () => todoApi.list('family'),
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
    mutationFn: (input: { scope: TodoScope; title: string; description: string | null; notes: string | null; noteDocument: Record<string, unknown> | null; dueAt: string | null; dueAtAlarmEnabled: boolean; recurrence: TodoTask['recurrence']; reminders: string[]; alarmReminders: string[] }) => todoApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
  const updateTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => todoApi.update(id, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
  });
  const reorderTasks = useMutation({
    mutationFn: (input: TodoTaskOrder & { scope: TodoScope }) => todoApi.reorder(input),
    onSuccess: (updated, input) => queryClient.setQueryData(['todos', input.scope], updated),
    onError: (_error, input) => queryClient.invalidateQueries({ queryKey: ['todos', input.scope] })
  });
  const editTask = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { title: string; description: string | null; notes: string | null; noteDocument: Record<string, unknown> | null; dueAt: string | null; dueAtAlarmEnabled: boolean; recurrence: TodoTask['recurrence']; reminders: string[]; alarmReminders: string[] } }) => todoApi.update(id, input),
    onSuccess: (updated) => {
      setSelectedTask(updated);
      return queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
  const removeTask = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: TodoDeleteMode }) => todoApi.remove(id, mode),
    onSuccess: () => {
      setRecurringTaskToDelete(null);
      return queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
  const updateCalendarColor = useMutation({
    mutationFn: (color: AuthUserProfile['calendarColor']) => authApi.updateCalendarColor(color),
    onSuccess: (profile) => {
      setCurrentUser(profile);
      void queryClient.invalidateQueries({ queryKey: ['todos'] });
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
  const activeTasks = tasks.data?.filter((task) => !task.completedAt) ?? [];
  const visibleTasks = filterTodoTasks(tasks.data ?? [], taskFilter);
  const taskActionsPending = updateTask.isPending || removeTask.isPending || reorderTasks.isPending;
  const calendarError = personalTasks.error ?? familyTasks.error;
  const householdName = household.data?.name ?? 'Rodzina';

  async function logout() {
    await authApi.logout();
    queryClient.clear();
    setCurrentUser(null);
    setSignedIn(false);
  }

  function requestTaskRemoval(task: TodoTask) {
    if (task.recurrence) {
      removeTask.reset();
      setRecurringTaskToDelete(task);
      return;
    }
    removeTask.mutate({ id: task.id, mode: 'series' });
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
        <PushBanner />
        {calendarOpen ? (
          <TodoCalendar
            tasks={allTasks}
            holidays={publicHolidays.data ?? []}
            christianHolidays={christianHolidays.data ?? []}
            nameDays={nameDays.data ?? []}
            observancesLoading={publicHolidays.isLoading || christianHolidays.isLoading || nameDays.isLoading}
            observancesError={publicHolidays.error ?? christianHolidays.error ?? nameDays.error}
            loading={personalTasks.isLoading || familyTasks.isLoading}
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
              {tasks.isLoading && <div className="state-card"><RefreshCw className="spin" aria-hidden="true" />Wczytuję zadania…</div>}
              {tasks.isError && <div className="state-card error-state"><p>{tasks.error.message}</p><button onClick={() => tasks.refetch()}>Spróbuj ponownie</button></div>}
              {!tasks.isLoading && !tasks.isError && visibleTasks.length === 0 && <div className="empty-state">
                <CheckCircle2 aria-hidden="true" />
                <h2>{archiveOpen ? 'Archiwum jest puste' : taskFilter === 'all' ? 'Wszystko zrobione' : 'Brak pasujących zadań'}</h2>
                <p>{archiveOpen ? 'Tutaj znajdziesz ukończone zadania z tej listy.' : taskFilter === 'all' ? (scope === 'family' ? `Lista „${householdName}” jest teraz pusta.` : 'Dodaj pierwszą rzecz, o której chcesz pamiętać.') : 'Zmień filtr, aby zobaczyć pozostałe zadania.'}</p>
              </div>}
              {visibleTasks.length > 0 && (archiveOpen ? (
                <ul className="task-list" aria-label="Archiwum zadań">
                  {visibleTasks.map((task) => <TodoTaskItem key={task.id} task={task} pending={taskActionsPending} onToggle={() => updateTask.mutate({ id: task.id, completed: false })} onRemove={() => requestTaskRemoval(task)} onOpen={() => setSelectedTask(task)} />)}
                </ul>
              ) : (
                <TodoTaskBoard
                  key={scope}
                  tasks={activeTasks}
                  visibleTasks={visibleTasks}
                  scope={scope}
                  pending={taskActionsPending}
                  onToggle={(task) => updateTask.mutate({ id: task.id, completed: true })}
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
        key={editorOpen ? editorDate ?? 'list' : 'closed'}
        open={editorOpen}
        scope={editorDate ? 'family' : scope}
        allowScopeSelection={Boolean(editorDate)}
        initialDate={editorDate ?? ''}
        pending={createTask.isPending}
        onClose={() => setEditorOpen(false)}
        onCreate={(input) => createTask.mutateAsync(input).then(() => undefined)}
      />
      {searchOpen && <TodoTaskSearchDialog
        tasks={allTasks}
        loading={personalTasks.isLoading || familyTasks.isLoading}
        hasError={personalTasks.isError || familyTasks.isError}
        onRetry={() => { void personalTasks.refetch(); void familyTasks.refetch(); }}
        onClose={() => setSearchOpen(false)}
        onOpen={(task) => { setSearchOpen(false); setSelectedTask(task); }}
      />}
      {selectedTask && <TodoTaskDetails key={selectedTask.id} task={selectedTask} pending={editTask.isPending} onClose={() => setSelectedTask(null)} onUpdate={(input) => editTask.mutateAsync({ id: selectedTask.id, input })} />}
      {recurringTaskToDelete && <TodoRecurrenceDeleteDialog
        task={recurringTaskToDelete}
        pending={removeTask.isPending}
        error={removeTask.error}
        onClose={() => { if (!removeTask.isPending) setRecurringTaskToDelete(null); }}
        onDelete={(mode) => removeTask.mutate({ id: recurringTaskToDelete.id, mode })}
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
