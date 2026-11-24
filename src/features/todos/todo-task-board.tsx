'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import type { TodoTask } from './todo-api';
import { TodoTaskItem } from './todo-task-item';
import type { TodoTaskOrder } from './todo-task-order';
import { groupTodoTasks, planTodoTaskOrder, todoTaskSections } from './todo-task-order-model';

const taskLaneCopy = {
  pinned: { title: 'Najważniejsze', empty: 'Upuść tutaj najważniejsze zadanie.' },
  standard: { title: 'Do zrobienia', empty: 'Upuść tutaj zadanie do zrobienia.' },
  later: { title: 'Na później', empty: 'Upuść tutaj zadanie na później.' }
};

function TaskLane({ section, tasks, pending, collapsed, dragging, canDrop, onCollapsedChange, onToggle, onRemove, onOpen }: {
  section: TodoTask['section'];
  tasks: TodoTask[];
  pending: boolean;
  collapsed: boolean;
  dragging: boolean;
  canDrop: boolean;
  onCollapsedChange: () => void;
  onToggle: (task: TodoTask) => void;
  onRemove: (task: TodoTask) => void;
  onOpen: (task: TodoTask) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: section, disabled: tasks.length > 0 || !canDrop });
  const copy = taskLaneCopy[section];
  const contentCollapsed = collapsed && !dragging;
  const className = `task-lane task-lane-${section}`;
  const content = !contentCollapsed && (
    <div ref={setNodeRef} className={`task-lane-dropzone${isOver ? ' task-lane-over' : ''}`}>
      <SortableContext items={tasks.map(({ id }) => id)} strategy={rectSortingStrategy}>
        {tasks.length > 0 ? (
          <ul className="task-list">
            {tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                pending={pending}
              canDrop={canDrop}
                onToggle={() => onToggle(task)}
                onRemove={() => onRemove(task)}
                onOpen={() => onOpen(task)}
              />
            ))}
          </ul>
        ) : <p className="task-lane-empty">{canDrop ? copy.empty : 'Są już trzy najważniejsze zadania.'}</p>}
      </SortableContext>
    </div>
  );

  if (section === 'later') {
    return (
      <details className={className} open={!contentCollapsed}>
        <summary onClick={(event) => {
          event.preventDefault();
          if (!dragging) onCollapsedChange();
        }}>
          {copy.title} <span>{tasks.length}</span>
        </summary>
        {content}
      </details>
    );
  }

  return (
    <section className={className} aria-label={copy.title}>
      {content}
    </section>
  );
}

function SortableTask({ task, pending, canDrop, onToggle, onRemove, onOpen }: {
  task: TodoTask;
  pending: boolean;
  canDrop: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const { attributes, isDragging, isOver, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    disabled: { draggable: pending, droppable: !canDrop }
  });

  return (
    <TodoTaskItem
      task={task}
      pending={pending}
      dragging={isDragging}
      dropTarget={isOver && !isDragging}
      itemRef={setNodeRef}
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
export function TodoTaskBoard({ tasks, visibleTasks = tasks, scope, pending, onToggle, onRemove, onOpen, onReorder }: {
  tasks: TodoTask[];
  visibleTasks?: TodoTask[];
  scope: TodoTask['scope'];
  pending: boolean;
  onToggle: (task: TodoTask) => void;
  onRemove: (task: TodoTask) => void;
  onOpen: (task: TodoTask) => void;
  onReorder: (order: TodoTaskOrder) => void;
}) {
  const groups = groupTodoTasks(visibleTasks);
  const [draggedSection, setDraggedSection] = useState<TodoTask['section'] | null>(null);
  const dragging = draggedSection !== null;
  const canDropIntoPinned = !dragging || draggedSection === 'pinned' || tasks.filter((task) => task.section === 'pinned').length < 3;
  const [laterCollapsed, setLaterCollapsed] = useState(true);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 260, tolerance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    let storedPreference = true;
    try {
      storedPreference = window.localStorage.getItem(`todo-plus:later-collapsed:${scope}:v1`) !== 'false';
    } catch {
      // The section starts collapsed when storage is unavailable.
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

  function finishDrag(event: DragEndEvent) {
    setDraggedSection(null);
    if (pending || !event.over) return;
    const order = planTodoTaskOrder(tasks, visibleTasks, String(event.active.id), String(event.over.id));
    if (order) onReorder(order);
  }

  const taskTitle = (id: string | number) => tasks.find((task) => task.id === String(id))?.title ?? 'Zadanie';

  return (
    <DndContext
      id={`todo-task-board-${scope}`}
      sensors={sensors}
      collisionDetection={(args) => args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={({ active }) => setDraggedSection(visibleTasks.find(({ id }) => id === active.id)?.section ?? null)}
      onDragEnd={finishDrag}
      onDragCancel={() => setDraggedSection(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'Aby przenieść zadanie, naciśnij Enter lub spację. Użyj strzałek, aby zmienić jego miejsce. Naciśnij ponownie Enter lub spację, aby zapisać, albo Escape, aby anulować.'
        },
        announcements: {
          onDragStart: ({ active }) => `Podniesiono zadanie ${taskTitle(active.id)}.`,
          onDragOver: ({ active, over }) => over ? `Zadanie ${taskTitle(active.id)} jest nad nowym miejscem.` : undefined,
          onDragEnd: ({ active }) => `Zakończono przenoszenie zadania ${taskTitle(active.id)}.`,
          onDragCancel: ({ active }) => `Anulowano przenoszenie zadania ${taskTitle(active.id)}.`
        }
      }}
    >
      <div className="task-board">
        {todoTaskSections.filter((section) => dragging || groups[section].length > 0).map((section) => (
          <TaskLane
            key={section}
            section={section}
            tasks={groups[section]}
            pending={pending}
            collapsed={section === 'later' && laterCollapsed}
            dragging={dragging}
            canDrop={section !== 'pinned' || canDropIntoPinned}
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
