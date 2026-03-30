import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import NewUpdateButton from '@/components/ui/NewUpdateButton';
import UpdateActions from '@/components/ui/UpdateActions';
import type { Update } from '@/types';

const categoryStyle: Record<string, string> = {
  general: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  important: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  news: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

export default async function UpdatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('updates');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: updates } = await supabase
    .from('updates')
    .select('*, author:profiles!author_id(id, full_name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        {isAdmin && <NewUpdateButton locale={locale} />}
      </div>

      <div className="max-w-2xl space-y-4">
        {(updates as Update[] ?? []).map(update => (
          <article key={update.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-medium text-gray-900 dark:text-white text-sm">{update.title}</h2>
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyle[update.category]}`}>
                {t(`category.${update.category}`)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{update.content}</p>
            <div className="flex items-center justify-between mt-4 text-xs text-gray-400 dark:text-gray-500">
              <span>{update.author?.full_name}</span>
              <div className="flex items-center gap-3">
                <span>{update.created_at.slice(0, 10)}</span>
                {isAdmin && <UpdateActions update={update} />}
              </div>
            </div>
          </article>
        ))}
        {(!updates || updates.length === 0) && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600 text-sm">No updates yet</div>
        )}
      </div>
    </div>
  );
}
