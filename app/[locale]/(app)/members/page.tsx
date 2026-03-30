import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Users } from 'lucide-react';
import type { Profile } from '@/types';

export default async function MembersPage() {
  const t = await getTranslations('members');
  const supabase = await createClient();

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, created_at')
    .eq('status', 'approved')
    .order('full_name', { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <span className="text-sm text-gray-400 dark:text-gray-500">{members?.length ?? 0} {t('count')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(members as Profile[] ?? []).map(member => (
          <div
            key={member.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-800/40 flex items-center justify-center flex-shrink-0">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name ?? ''} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-brand-700 dark:text-brand-300 font-semibold text-sm">
                  {member.full_name?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {member.full_name ?? t('unnamed')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {member.role === 'admin' ? t('roleAdmin') : t('roleMember')}
              </p>
            </div>
          </div>
        ))}

        {(!members || members.length === 0) && (
          <div className="col-span-3 text-center py-16 text-gray-400 dark:text-gray-600">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
