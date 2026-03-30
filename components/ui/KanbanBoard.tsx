'use client';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus } from '@/types';
import clsx from 'clsx';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

const colStyle: Record<TaskStatus, string> = {
  todo: 'border-t-gray-300 dark:border-t-gray-600',
  in_progress: 'border-t-blue-400 dark:border-t-blue-500',
  done: 'border-t-green-400 dark:border-t-green-500',
};

const cardBorder: Record<TaskStatus, string> = {
  todo: 'border-s-gray-300 dark:border-s-gray-600',
  in_progress: 'border-s-blue-400 dark:border-s-blue-500',
  done: 'border-s-green-400 dark:border-s-green-500',
};

const statusBadge: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

export default function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const t = useTranslations('tasks');
  const { locale } = useParams();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const draggingId = useRef<string | null>(null);

  function moveTask(taskId: string, newStatus: TaskStatus) {
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    );
    const supabase = createClient();
    supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
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

  function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    moveTask(taskId, newStatus);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              'rounded-xl border-t-2 p-3 min-h-32 transition-colors',
              colStyle[status],
              isOver
                ? 'bg-gray-100 dark:bg-gray-800/60'
                : 'bg-gray-50 dark:bg-gray-900/30'
            )}
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
              {t(`status.${status}`)} · {group.length}
            </p>
            <div className="space-y-3">
              {group.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => onDragStart(task.id)}
                  onDragEnd={onDragEnd}
                  className={clsx(
                    'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-s-4 p-4 shadow-sm cursor-grab active:cursor-grabbing active:opacity-50 transition-opacity',
                    cardBorder[task.status]
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link
                      href={`/${locale}/projects/${task.project_id}?task=${task.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {task.title}
                    </Link>
                    <select
                      value={task.status}
                      onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      onClick={e => e.stopPropagation()}
                      className={clsx(
                        'text-xs px-1.5 py-0.5 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-400 flex-shrink-0',
                        statusBadge[task.status]
                      )}
                    >
                      <option value="todo">{t('status.todo')}</option>
                      <option value="in_progress">{t('status.in_progress')}</option>
                      <option value="done">{t('status.done')}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {task.assignee && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center">
                          <span className="text-xs text-brand-800 dark:text-brand-100 font-medium">
                            {task.assignee.full_name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{task.assignee.full_name}</span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ms-auto">
                        <Calendar size={11} />
                        {task.due_date.slice(0, 10)}
                      </div>
                    )}
                    {task.notes && task.notes.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <MessageSquare size={11} />
                        {task.notes.length}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {group.length === 0 && (
                <div className={clsx(
                  'rounded-lg border-2 border-dashed p-4 text-center text-xs text-gray-400 dark:text-gray-600 transition-colors',
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
