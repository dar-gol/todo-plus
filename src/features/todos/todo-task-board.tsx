'use client';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, Pin, TimerReset } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TodoTask } from './todo-api';
import { TodoTaskItem } from './todo-task-item';

const sections = ['pinned', 'standard', 'later'] as const;

function groupTasks(tasks: TodoTask[]) {
  return {
    pinned: tasks.filter((task) => task.section === 'pinned'),
    standard: tasks.filter((task) => task.section === 'standard'),
    later: tasks.filter((task) => task.section === 'later')
  };
}

function findSection(groups: ReturnType<typeof groupTasks>, id: string) {
  return sections.find((section) => section === id || groups[section].some((task) => task.id === id));
}

function TaskLane({ section, tasks, pending, collapsed, dragging, onCollapsedChange, onToggle, onRemove, onOpen }: {
  section: (typeof sections)[number];
  tasks: TodoTask[];
  pending: boolean;
  collapsed: boolean;
  dragging: boolean;
  onCollapsedChange: () => void;
  onToggle: (task: TodoTask) => void;
  onRemove: (task: TodoTask) => void;
  onOpen: (task: TodoTask) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: section });
  const copy = {
    pinned: { title: 'Najważniejsze', empty: 'Upuść tutaj najważniejsze zadanie.', icon: <Pin aria-hidden="true" /> },
    standard: { title: 'Do zrobienia', empty: 'Upuść tutaj zadanie do zrobienia.', icon: null },
    later: { title: 'Na później', empty: 'Upuść tutaj zadanie na później.', icon: <TimerReset aria-hidden="true" /> }
  }[section];
  const contentCollapsed = collapsed && !dragging;

  return (
    <section className={`task-lane task-lane-${section} ${contentCollapsed ? 'task-lane-collapsed' : ''} ${isOver ? 'task-lane-over' : ''}`} aria-labelledby={`task-lane-${section}`}>
      <div className="task-lane-heading">
        <div>{copy.icon}<h2 id={`task-lane-${section}`}>{copy.title}</h2></div>
        {section === 'later' && (
          <button
            type="button"
            className="task-lane-collapse"
            onClick={onCollapsedChange}
            aria-expanded={!contentCollapsed}
            aria-controls="task-lane-later-content"
            aria-label={contentCollapsed ? 'Rozwiń zadania na później' : 'Zwiń zadania na później'}
          >
            <ChevronDown aria-hidden="true" />
          </button>
        )}
      </div>
      {!contentCollapsed && <div ref={setNodeRef} id={section === 'later' ? 'task-lane-later-content' : undefined} className="task-lane-dropzone">
        <SortableContext items={tasks.map(({ id }) => id)} strategy={rectSortingStrategy}>
          {tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  pending={pending}
                  onToggle={() => onToggle(task)}
                  onRemove={() => onRemove(task)}
                  onOpen={() => onOpen(task)}
                />
              ))}
            </ul>
          ) : <p className="task-lane-empty">{copy.empty}</p>}
        </SortableContext>
      </div>}
    </section>
  );
}

function SortableTask({ task, pending, onToggle, onRemove, onOpen }: {
  task: TodoTask;
  pending: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    disabled: pending,
    data: { section: task.section }
  });

  return (
    <TodoTaskItem
      task={task}
      pending={pending}
      dragging={isDragging}
      itemRef={(node) => setNodeRef(node)}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sortableAttributes={attributes}
      onDragKeyDown={(event) => listeners?.onKeyDown?.(event)}
      onDragMouseDown={(event) => listeners?.onMouseDown?.(event)}
      onDragTouchStart={(event) => listeners?.onTouchStart?.(event)}
      onToggle={onToggle}
      onRemove={onRemove}
      onOpen={onOpen}
    />
  );
}

/** Owns accessible drag-and-drop ordering across pinned, standard, and deferred task sections. */
export function TodoTaskBoard({ tasks, scope, pending, onToggle, onRemove, onOpen, onReorder }: {
  tasks: TodoTask[];
  scope: TodoTask['scope'];
  pending: boolean;
  onToggle: (task: TodoTask) => void;
  onRemove: (task: TodoTask) => void;
  onOpen: (task: TodoTask) => void;
  onReorder: (order: { pinnedTaskIds: string[]; standardTaskIds: string[]; laterTaskIds: string[] }) => void;
}) {
  const [groups, setGroups] = useState(() => groupTasks(tasks));
  const [dragging, setDragging] = useState(false);
  const [laterCollapsed, setLaterCollapsed] = useState(false);
  const dragSnapshot = useRef(groups);
  const activeId = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 260, tolerance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!activeId.current) setGroups(groupTasks(tasks));
  }, [tasks]);

  useEffect(() => {
    let storedPreference = false;
    try {
      storedPreference = window.localStorage.getItem(`todo-plus:later-collapsed:${scope}:v1`) === 'true';
    } catch {
      storedPreference = false;
    }
    const timeout = window.setTimeout(() => setLaterCollapsed(storedPreference), 0);
    return () => window.clearTimeout(timeout);
  }, [scope]);

  function toggleLaterCollapsed() {
    setLaterCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(`todo-plus:later-collapsed:${scope}:v1`, String(next));
      } catch {
        // The preference remains available for this session when storage is unavailable.
      }
      return next;
    });
  }

  function startDrag(event: DragStartEvent) {
    activeId.current = String(event.active.id);
    dragSnapshot.current = groups;
    setDragging(true);
  }

  function moveAcrossSections(event: DragOverEvent) {
    if (!event.over) return;
    const draggedId = String(event.active.id);
    const overId = String(event.over.id);
    const source = findSection(groups, draggedId);
    const target = findSection(groups, overId);
    if (!source || !target || source === target) return;
    if (target === 'pinned' && groups.pinned.length >= 3) return;

    setGroups((current) => {
      const task = current[source].find(({ id }) => id === draggedId);
      if (!task) return current;
      const targetIndex = current[target].findIndex(({ id }) => id === overId);
      const insertionIndex = targetIndex < 0 ? current[target].length : targetIndex;
      return {
        ...current,
        [source]: current[source].filter(({ id }) => id !== draggedId),
        [target]: [
          ...current[target].slice(0, insertionIndex),
          { ...task, section: target },
          ...current[target].slice(insertionIndex)
        ]
      };
    });
  }

  function finishDrag(event: DragEndEvent) {
    activeId.current = null;
    setDragging(false);
    if (!event.over) {
      setGroups(dragSnapshot.current);
      return;
    }

    const draggedId = String(event.active.id);
    const overId = String(event.over.id);
    const section = findSection(groups, draggedId);
    const overSection = findSection(groups, overId);
    let next = groups;

    if (section && section === overSection) {
      const from = groups[section].findIndex(({ id }) => id === draggedId);
      const to = groups[section].findIndex(({ id }) => id === overId);
      if (from >= 0 && to >= 0 && from !== to) next = { ...groups, [section]: arrayMove(groups[section], from, to) };
    }

    setGroups(next);
    onReorder({
      pinnedTaskIds: next.pinned.map(({ id }) => id),
      standardTaskIds: next.standard.map(({ id }) => id),
      laterTaskIds: next.later.map(({ id }) => id)
    });
  }

  const taskTitle = (id: string | number) => tasks.find((task) => task.id === String(id))?.title ?? 'Zadanie';

  return (
    <DndContext
      id={`todo-task-board-${scope}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={startDrag}
      onDragOver={moveAcrossSections}
      onDragEnd={finishDrag}
      onDragCancel={() => { activeId.current = null; setDragging(false); setGroups(dragSnapshot.current); }}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'Aby przenieść zadanie, naciśnij Enter lub spację. Użyj strzałek, aby zmienić jego miejsce. Naciśnij ponownie Enter lub spację, aby zapisać, albo Escape, aby anulować.'
        },
        announcements: {
          onDragStart: ({ active }) => `Podniesiono zadanie ${taskTitle(active.id)}.`,
          onDragOver: ({ active, over }) => over ? `Zadanie ${taskTitle(active.id)} jest nad nowym miejscem.` : undefined,
          onDragEnd: ({ active }) => `Zapisano nowe miejsce zadania ${taskTitle(active.id)}.`,
          onDragCancel: ({ active }) => `Anulowano przenoszenie zadania ${taskTitle(active.id)}.`
        }
      }}
    >
      <div className="task-board">
        {sections.filter((section) => dragging || groups[section].length > 0).map((section) => (
          <TaskLane
            key={section}
            section={section}
            tasks={groups[section]}
            pending={pending}
            collapsed={section === 'later' && laterCollapsed}
            dragging={dragging}
            onCollapsedChange={toggleLaterCollapsed}
            onToggle={onToggle}
            onRemove={onRemove}
            onOpen={onOpen}
          />
        ))}
      </div>
    </DndContext>
  );
}
