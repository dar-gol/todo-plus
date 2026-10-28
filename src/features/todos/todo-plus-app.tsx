'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ListTodo, LogOut, Plus, RefreshCw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthScreen } from '@/features/auth/auth-screen';
import { PushBanner } from '@/features/push/push-banner';
import { authSession } from '@/lib/auth/auth-session';
import { TodoEditor } from './todo-editor';
import { todoApi, TodoScope } from './todo-api';
import { TodoTaskItem } from './todo-task-item';

export function TodoPlusApp() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [scope, setScope] = useState<TodoScope>('personal');
  const [editorOpen, setEditorOpen] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    queueMicrotask(() => setSignedIn(authSession.signedIn));
  }, []);

  const tasks = useQuery({
    queryKey: ['todos', scope],
    queryFn: () => todoApi.list(scope),
    enabled: signedIn === true
  });
  const createTask = useMutation({
    mutationFn: (input: { title: string; notes: string | null; dueAt: string | null }) => todoApi.create({ ...input, scope }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', scope] })
  });
  const updateTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => todoApi.update(id, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', scope] })
  });
  const removeTask = useMutation({
    mutationFn: (id: string) => todoApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', scope] })
  });

  if (signedIn === null) return <main className="loading-screen"><CheckCircle2 aria-hidden="true" /><span>Otwieram Todo Plus…</span></main>;
  if (!signedIn) return <AuthScreen onSignedIn={() => setSignedIn(true)} />;

  const openTasks = tasks.data?.filter((task) => !task.completedAt) ?? [];
  const completedTasks = tasks.data?.filter((task) => task.completedAt) ?? [];

  function logout() {
    authSession.clear();
    queryClient.clear();
    setSignedIn(false);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark small"><CheckCircle2 aria-hidden="true" /></span><div><strong>Todo Plus</strong><span>Małe kroki, spokojniejszy dzień</span></div></div>
        <button className="icon-button" onClick={logout} aria-label="Wyloguj się"><LogOut aria-hidden="true" /></button>
      </header>

      <div className="app-content">
        <PushBanner />
        <nav className="list-tabs" aria-label="Wybierz listę">
          <button className={scope === 'personal' ? 'active' : ''} onClick={() => setScope('personal')}><ListTodo aria-hidden="true" />Moja lista</button>
          <button className={scope === 'family' ? 'active' : ''} onClick={() => setScope('family')}><Users aria-hidden="true" />Rodzina</button>
        </nav>

        <section className="tasks-section" aria-labelledby="tasks-title">
          <div className="section-heading"><div><p className="eyebrow">{scope === 'family' ? 'WSPÓLNIE' : 'TYLKO DLA CIEBIE'}</p><h1 id="tasks-title">{scope === 'family' ? 'Rodzinna lista' : 'Moja lista'}</h1></div><span className="task-count">{openTasks.length}</span></div>
          {tasks.isLoading && <div className="state-card"><RefreshCw className="spin" aria-hidden="true" />Wczytuję zadania…</div>}
          {tasks.isError && <div className="state-card error-state"><p>{tasks.error.message}</p><button onClick={() => tasks.refetch()}>Spróbuj ponownie</button></div>}
          {!tasks.isLoading && !tasks.isError && openTasks.length === 0 && <div className="empty-state"><CheckCircle2 aria-hidden="true" /><h2>Wszystko zrobione</h2><p>{scope === 'family' ? 'Rodzinna lista jest teraz pusta.' : 'Dodaj pierwszą rzecz, o której chcesz pamiętać.'}</p></div>}
          {openTasks.length > 0 && <ul className="task-list">{openTasks.map((task) => <TodoTaskItem key={task.id} task={task} pending={updateTask.isPending || removeTask.isPending} onToggle={() => updateTask.mutate({ id: task.id, completed: true })} onRemove={() => removeTask.mutate(task.id)} />)}</ul>}
          {completedTasks.length > 0 && <details className="completed-group"><summary>Ukończone <span>{completedTasks.length}</span></summary><ul className="task-list">{completedTasks.map((task) => <TodoTaskItem key={task.id} task={task} pending={updateTask.isPending || removeTask.isPending} onToggle={() => updateTask.mutate({ id: task.id, completed: false })} onRemove={() => removeTask.mutate(task.id)} />)}</ul></details>}
        </section>
      </div>

      <button className="add-button" onClick={() => setEditorOpen(true)}><Plus aria-hidden="true" /><span>Dodaj zadanie</span></button>
      <TodoEditor open={editorOpen} scope={scope} pending={createTask.isPending} onClose={() => setEditorOpen(false)} onCreate={(input) => createTask.mutateAsync(input).then(() => undefined)} />
    </main>
  );
}
