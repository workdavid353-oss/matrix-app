'use client';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus } from '@/types';
import clsx from 'clsx';
import TaskNotesPanel from './TaskNotesPanel';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

const colHeader: Record<TaskStatus, string> = {
  todo: 'border-t-2 border-t-gray-400 bg-gray-50 dark:bg-gray-800/40',
  in_progress: 'border-t-2 border-t-blue-400 bg-blue-50/50 dark:bg-blue-900/10',
  done: 'border-t-2 border-t-green-400 bg-green-50/50 dark:bg-green-900/10',
};

const colDot: Record<TaskStatus, string> = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-400',
  done: 'bg-green-400',
};

const cardBorderLeft: Record<TaskStatus, string> = {
  todo: 'border-s-gray-400 dark:border-s-gray-500',
  in_progress: 'border-s-blue-400 dark:border-s-blue-500',
  done: 'border-s-green-400 dark:border-s-green-500',
};

const statusBadge: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

export default function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const t = useTranslations('tasks');
  const { locale } = useParams();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const draggingId = useRef<string | null>(null);

  async function moveTask(taskId: string, newStatus: TaskStatus) {
    const prevTasks = tasks;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const supabase = createClient();
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      setTasks(prevTasks);
    }
  }

  function onDragStart(taskId: string) {
    draggingId.current = taskId;
  }

  function onDragOver(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setDragOverCol(status);
  }

  function onDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    if (draggingId.current) {
      moveTask(draggingId.current, status);
      draggingId.current = null;
    }
    setDragOverCol(null);
  }

  function onDragEnd() {
    draggingId.current = null;
    setDragOverCol(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STATUSES.map(status => {
        const group = tasks.filter(t => t.status === status);
        const isOver = dragOverCol === status;

        return (
          <div
            key={status}
            onDragOver={e => onDragOver(e, status)}
            onDrop={e => onDrop(e, status)}
            onDragLeave={() => setDragOverCol(null)}
            className={clsx(
              'rounded-none border border-gray-200 dark:border-gray-700 transition-colors',
              colHeader[status],
              isOver && 'ring-2 ring-brand-400'
            )}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
              <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', colDot[status])} />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                {t(`status.${status}`)}
              </span>
              <span className="ms-auto text-xs text-gray-400 dark:text-gray-500 font-medium">{group.length}</span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-24">
              {group.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => onDragStart(task.id)}
                  onDragEnd={onDragEnd}
                  className={clsx(
                    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-s-8 p-3 cursor-grab active:cursor-grabbing active:opacity-50 transition-opacity',
                    task.status !== 'done' && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)
                      ? 'border-s-red-400 dark:border-s-red-500'
                      : cardBorderLeft[task.status]
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/${locale}/projects/${task.project_id}?task=${task.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {task.title}
                    </Link>
                    <select
                      value={task.status}
                      onChange={e => moveTask(task.id, e.target.value as TaskStatus)}
                      onClick={e => e.stopPropagation()}
                      className={clsx(
                        'text-xs px-1.5 py-0.5 rounded font-medium border-0 cursor-pointer focus:outline-none flex-shrink-0',
                        statusBadge[task.status]
                      )}
                    >
                      <option value="todo">{t('status.todo')}</option>
                      <option value="in_progress">{t('status.in_progress')}</option>
                      <option value="done">{t('status.done')}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    {task.assignee && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center">
                          <span className="text-xs text-brand-800 dark:text-brand-100 font-medium">
                            {task.assignee.full_name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.assignee.full_name}</span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className={clsx(
                        'flex items-center gap-1 text-xs ms-auto',
                        task.status !== 'done' && task.due_date < new Date().toISOString().slice(0, 10)
                          ? 'text-red-500 dark:text-red-400 font-medium'
                          : 'text-gray-400 dark:text-gray-500'
                      )}>
                        <Calendar size={11} />
                        {task.due_date.slice(0, 10)}
                      </div>
                    )}
                    {task.status !== 'in_progress' && task.notes && task.notes.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <MessageSquare size={11} />
                        {task.notes.length}
                      </div>
                    )}
                  </div>
                  {task.status === 'in_progress' && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <TaskNotesPanel taskId={task.id} />
                    </div>
                  )}
                </div>
              ))}

              {group.length === 0 && (
                <div className={clsx(
                  'border-2 border-dashed p-4 text-center text-xs text-gray-400 dark:text-gray-600 transition-colors',
                  isOver ? 'border-brand-400 text-brand-400' : 'border-gray-200 dark:border-gray-700'
                )}>
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
