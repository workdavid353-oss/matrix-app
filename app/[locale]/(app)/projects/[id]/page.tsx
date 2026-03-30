import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import KanbanBoard from '@/components/ui/KanbanBoard';
import NewTaskButton from '@/components/ui/NewTaskButton';
import EditProjectButton from '@/components/ui/EditProjectButton';
import type { Task } from '@/types';

export default async function ProjectPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const t = await getTranslations('tasks');
  const tp = await getTranslations('projects');
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: project } = await supabase
    .from('projects')
    .select('*, owner:profiles!owner_id(id, full_name)')
    .eq('id', id)
    .single();

  if (!project) notFound();

  const isOwner = project.owner_id === user!.id;
  const canEdit = isAdmin || isOwner;

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(id, full_name, avatar_url), notes:task_notes(id)')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{project.title}</h1>
            {project.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {project.owner?.full_name}
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <EditProjectButton
                projectId={id}
                initialTitle={project.title}
                initialDescription={project.description}
                initialStatus={project.status}
              />
              <NewTaskButton projectId={id} locale={locale} />
            </div>
          )}
        </div>
      </div>

      <KanbanBoard initialTasks={(tasks ?? []) as Task[]} />
    </div>
  );
}
