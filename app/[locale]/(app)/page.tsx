import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import KanbanBoard from '@/components/ui/KanbanBoard';
import type { Task } from '@/types';

export default async function HomePage() {
  const t = await getTranslations('tasks');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  const query = supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(id, full_name, avatar_url), notes:task_notes(id)')
    .order('created_at', { ascending: false });

  if (!isAdmin) query.eq('assigned_to', user!.id);

  const { data: tasks } = await query;

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

      <KanbanBoard initialTasks={(tasks ?? []) as Task[]} />
    </div>
  );
}
