import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import NewProjectButton from '@/components/ui/NewProjectButton';
import type { Project } from '@/types';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('projects');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
  const isAdmin = profile?.role === 'admin';

  const query = supabase
    .from('projects')
    .select('*, owner:profiles!owner_id(id, full_name)')
    .order('created_at', { ascending: false });

  if (!isAdmin) query.eq('owner_id', user!.id);

  const { data: projects } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <NewProjectButton locale={locale} />
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects as Project[]).map(project => (
            <Link
              key={project.id}
              href={`/${locale}/projects/${project.id}`}
              className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-800/20 flex items-center justify-center">
                  <FolderOpen size={16} className="text-brand-600 dark:text-brand-400" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  project.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {t(`status.${project.status}`)}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{project.title}</h3>
              {project.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{project.description}</p>
              )}
              {project.owner && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  {project.owner.full_name}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
