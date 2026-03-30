import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import TaskCard from '@/components/ui/TaskCard';
import type { Task } from '@/types';

export default async function HomePage() {
  const t = await getTranslations('tasks');
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  const query = supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(id, full_name, avatar_url), project:projects(id, title)')
    .order('created_at', { ascending: false });

  if (!isAdmin) query.eq('assigned_to', user!.id);

  const { data: tasks } = await query;

  const grouped = {
    todo: (tasks ?? []).filter(t => t.status === 'todo'),
    in_progress: (tasks ?? []).filter(t => t.status === 'in_progress'),
    done: (tasks ?? []).filter(t => t.status === 'done'),
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isAdmin ? t('allTasks') : t('myTasks')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('total', { count: (tasks ?? []).length })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {(['todo', 'in_progress', 'done'] as const).map(status => (
          <div key={status}>
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${statusColors[status]}`}>
              {t(`status.${status}`)}
              <span className="font-bold">{grouped[status].length}</span>
            </div>
            <div className="space-y-3">
              {grouped[status].map(task => (
                <TaskCard key={task.id} task={task as Task} />
              ))}
              {grouped[status].length === 0 && (
                <div className="text-sm text-gray-400 dark:text-gray-600 py-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  —
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
