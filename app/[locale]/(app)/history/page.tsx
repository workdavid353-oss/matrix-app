import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';

export default async function HistoryPage() {
  const t = await getTranslations('tasks');
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
  const isAdmin = profile?.role === 'admin';

  // Show recently completed/updated tasks as history
  const query = supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(id, full_name), project:projects(id, title)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!isAdmin) query.eq('assigned_to', user!.id);

  const { data: tasks } = await query;

  const statusDot: Record<string, string> = {
    todo: 'bg-gray-300 dark:bg-gray-600',
    in_progress: 'bg-blue-400',
    done: 'bg-green-400',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent task activity</p>
      </div>

      <div className="max-w-2xl">
        {(!tasks || tasks.length === 0) ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-16">No history yet</p>
        ) : (
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-1">
              {tasks.map(task => (
                <div key={task.id} className="flex gap-4 ps-9 py-3 relative">
                  <div className={`absolute left-2.5 top-4 w-2 h-2 rounded-full ${statusDot[task.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                        task.status === 'done' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {t(`status.${task.status}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {task.project && <span>{task.project.title}</span>}
                      {task.assignee && <><span>·</span><span>{task.assignee.full_name}</span></>}
                      <span>·</span>
                      <span>{task.created_at.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
