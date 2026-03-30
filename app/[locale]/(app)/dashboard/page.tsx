import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import AdminUserRow from '@/components/ui/AdminUserRow';
import type { Profile } from '@/types';

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('admin');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();

  if (profile?.role !== 'admin') redirect(`/${locale}/`);

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const pending = (users ?? []).filter(u => u.status === 'pending');
  const approved = (users ?? []).filter(u => u.status === 'approved');
  const blocked = (users ?? []).filter(u => u.status === 'blocked');

  const stats = [
    { label: 'Total users', value: users?.length ?? 0, color: 'text-gray-900 dark:text-white' },
    { label: 'Pending approval', value: pending.length, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Approved', value: approved.length, color: 'text-green-600 dark:text-green-400' },
    { label: 'Blocked', value: blocked.length, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals first */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            Pending approval ({pending.length})
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {(pending as Profile[]).map(u => <AdminUserRow key={u.id} user={u} currentUserId={user!.id} />)}
          </div>
        </div>
      )}

      {/* All users */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('users')}</h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {(approved as Profile[]).map(u => <AdminUserRow key={u.id} user={u} currentUserId={user!.id} />)}
          {(blocked as Profile[]).map(u => <AdminUserRow key={u.id} user={u} currentUserId={user!.id} />)}
        </div>
      </div>
    </div>
  );
}
