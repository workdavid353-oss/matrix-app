'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus } from '@/types';
import clsx from 'clsx';

const statusStyle: Record<string, string> = {
  todo: 'border-s-gray-300 dark:border-s-gray-600',
  in_progress: 'border-s-blue-400 dark:border-s-blue-500',
  done: 'border-s-green-400 dark:border-s-green-500',
};

const statusBadge: Record<string, string> = {
  todo: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

export default function TaskCard({ task }: { task: Task }) {
  const t = useTranslations('tasks');
  const { locale } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus>(task.status);

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    const newStatus = e.target.value as TaskStatus;
    setStatus(newStatus);
    const supabase = createClient();
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    router.refresh();
  }

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-s-4 p-4 hover:shadow-sm transition-shadow',
      statusStyle[status]
    )}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <Link
          href={`/${locale}/projects/${task.project_id}?task=${task.id}`}
          className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:underline"
        >
          {task.title}
        </Link>
        <select
          value={status}
          onChange={handleStatusChange}
          onClick={e => e.stopPropagation()}
          className={clsx(
            'text-xs px-1.5 py-0.5 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-400 flex-shrink-0',
            statusBadge[status]
          )}
        >
          <option value="todo">{t('status.todo')}</option>
          <option value="in_progress">{t('status.in_progress')}</option>
          <option value="done">{t('status.done')}</option>
        </select>
      </div>
      {task.project && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{task.project.title}</p>
      )}
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
  );
}
