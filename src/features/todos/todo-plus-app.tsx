'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, ListTodo, LogOut, Plus, RefreshCw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthScreen } from '@/features/auth/auth-screen';
import { authApi } from '@/features/auth/auth-api';
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
import type { TodoTask } from './todo-api';

export function TodoPlusApp() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [scope, setScope] = useState<TodoScope>('family');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    authApi.restore().then((restored) => {
      if (active) setSignedIn(restored);
    });
    return () => { active = false; };
  }, []);

  const personalTasks = useQuery({
    queryKey: ['todos', 'personal'],
    queryFn: () => todoApi.list('personal'),
    enabled: signedIn === true && (calendarOpen || scope === 'personal')
  });
  const familyTasks = useQuery({
    queryKey: ['todos', 'family'],
    queryFn: () => todoApi.list('family'),
    enabled: signedIn === true && (calendarOpen || scope === 'family')
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
    mutationFn: (input: { title: string; description: string | null; notes: string | null; noteDocument: Record<string, unknown> | null; dueAt: string | null; reminders: string[] }) => todoApi.create({ ...input, scope }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
  });
  const updateTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => todoApi.update(id, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
  });
  const reorderTasks = useMutation({
    mutationFn: (input: { scope: TodoScope; pinnedTaskIds: string[]; standardTaskIds: string[]; laterTaskIds: string[] }) => todoApi.reorder(input),
    onSuccess: (updated, input) => queryClient.setQueryData(['todos', input.scope], updated),
    onError: (_error, input) => queryClient.invalidateQueries({ queryKey: ['todos', input.scope] })
  });
  const editTask = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { title: string; description: string | null; notes: string | null; noteDocument: Record<string, unknown> | null; dueAt: string | null; reminders: string[] } }) => todoApi.update(id, input),
    onSuccess: (updated) => {
      setSelectedTask(updated);
      return queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
  const removeTask = useMutation({
    mutationFn: (id: string) => todoApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
  });

  if (signedIn === null) return <main className="loading-screen"><CheckCircle2 aria-hidden="true" /><span>Otwieram Todo Plus…</span></main>;
  if (!signedIn) return <AuthScreen onSignedIn={() => setSignedIn(true)} />;

  const tasks = scope === 'personal' ? personalTasks : familyTasks;
  const openTasks = tasks.data?.filter((task) => !task.completedAt) ?? [];
  const completedTasks = tasks.data?.filter((task) => task.completedAt) ?? [];
  const calendarTasks = [...(personalTasks.data ?? []), ...(familyTasks.data ?? [])];
  const calendarError = personalTasks.error ?? familyTasks.error;
  const householdName = household.data?.name ?? 'Rodzina';

  async function logout() {
    await authApi.logout();
    queryClient.clear();
    setSignedIn(false);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark small"><CheckCircle2 aria-hidden="true" /></span><div><strong>Todo Plus</strong><span>Małe kroki, spokojniejszy dzień</span></div></div>
        <div className="header-actions">
          <button
            className={`icon-button ${calendarOpen ? 'active' : ''}`}
            onClick={() => setCalendarOpen((open) => !open)}
            aria-label={calendarOpen ? 'Wróć do list zadań' : 'Pokaż kalendarz'}
            aria-pressed={calendarOpen}
            title={calendarOpen ? 'Listy zadań' : 'Kalendarz'}
          >{calendarOpen ? <ListTodo aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}</button>
          <button className="icon-button" onClick={logout} aria-label="Wyloguj się"><LogOut aria-hidden="true" /></button>
        </div>
      </header>

      <div className="app-content">
        <PushBanner />
        {calendarOpen ? (
          <TodoCalendar
            tasks={calendarTasks}
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
            onTaskOpen={setSelectedTask}
          />
        ) : (
          <>
            <nav className="list-tabs" aria-label="Wybierz listę">
              <button className={scope === 'personal' ? 'active' : ''} onClick={() => setScope('personal')}><ListTodo aria-hidden="true" />Moja lista</button>
              <button className={scope === 'family' ? 'active' : ''} onClick={() => setScope('family')}><Users aria-hidden="true" />{householdName}</button>
            </nav>

            <section className="tasks-section" aria-labelledby="tasks-title">
              <div className="section-heading"><div><p className="eyebrow">{scope === 'family' ? 'WSPÓLNIE' : 'TYLKO DLA CIEBIE'}</p><h1 id="tasks-title">{scope === 'family' ? householdName : 'Moja lista'}</h1></div><span className="task-count">{openTasks.length}</span></div>
              {tasks.isLoading && <div className="state-card"><RefreshCw className="spin" aria-hidden="true" />Wczytuję zadania…</div>}
              {tasks.isError && <div className="state-card error-state"><p>{tasks.error.message}</p><button onClick={() => tasks.refetch()}>Spróbuj ponownie</button></div>}
              {!tasks.isLoading && !tasks.isError && openTasks.length === 0 && <div className="empty-state"><CheckCircle2 aria-hidden="true" /><h2>Wszystko zrobione</h2><p>{scope === 'family' ? `Lista „${householdName}” jest teraz pusta.` : 'Dodaj pierwszą rzecz, o której chcesz pamiętać.'}</p></div>}
              {openTasks.length > 0 && (
                <>
                  <TodoTaskBoard
                    tasks={openTasks}
                    scope={scope}
                    pending={updateTask.isPending || removeTask.isPending || reorderTasks.isPending}
                    onToggle={(task) => updateTask.mutate({ id: task.id, completed: true })}
                    onRemove={(task) => removeTask.mutate(task.id)}
                    onOpen={setSelectedTask}
                    onReorder={(order) => reorderTasks.mutate({ scope, ...order })}
                  />
                  {reorderTasks.isError && <p className="task-order-error" role="alert">Nie udało się zapisać kolejności. Lista została odświeżona — spróbuj ponownie.</p>}
                </>
              )}
              {completedTasks.length > 0 && <details className="completed-group"><summary>Ukończone <span>{completedTasks.length}</span></summary><ul className="task-list">{completedTasks.map((task) => <TodoTaskItem key={task.id} task={task} pending={updateTask.isPending || removeTask.isPending} onToggle={() => updateTask.mutate({ id: task.id, completed: false })} onRemove={() => removeTask.mutate(task.id)} onOpen={() => setSelectedTask(task)} />)}</ul></details>}
            </section>
          </>
        )}
      </div>

      {!calendarOpen && <button className="add-button" onClick={() => setEditorOpen(true)}><Plus aria-hidden="true" /><span>Dodaj zadanie</span></button>}
      <TodoEditor open={editorOpen} scope={scope} pending={createTask.isPending} onClose={() => setEditorOpen(false)} onCreate={(input) => createTask.mutateAsync(input).then(() => undefined)} />
      {selectedTask && <TodoTaskDetails key={selectedTask.id} task={selectedTask} pending={editTask.isPending} onClose={() => setSelectedTask(null)} onUpdate={(input) => editTask.mutateAsync({ id: selectedTask.id, input })} />}
    </main>
  );
}
