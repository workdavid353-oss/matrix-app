'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import type { Profile } from '@/types';

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  blocked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export default function AdminUserRow({ user, currentUserId }: { user: Profile; currentUserId: string }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState(user.status);
  const [currentRole, setCurrentRole] = useState(user.role);
  const isSelf = user.id === currentUserId;

  async function updateStatus(status: 'approved' | 'blocked') {
    setCurrentStatus(status);
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles').update({ status }).eq('id', user.id);
    if (err) {
      setError(err.message);
      setCurrentStatus(user.status);
    } else if (status === 'approved') {
      fetch('/api/notify-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName: user.full_name }),
      }).catch(() => {});
    }
    setLoading(false);
  }

  async function updateRole(role: 'admin' | 'member') {
    setCurrentRole(role);
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('profiles').update({ role }).eq('id', user.id);
    setLoading(false);
    if (err) { setError(err.message); setCurrentRole(user.role); }
  }

  return (
    <div className="flex flex-col px-4 py-3">
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-800/30 flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-brand-800 dark:text-brand-200 font-medium">
          {user.full_name?.[0]?.toUpperCase() ?? '?'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {user.full_name ?? 'Unknown'}
          {isSelf && <span className="text-xs text-gray-400 ms-2">(you)</span>}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {user.created_at.slice(0, 10)}
        </p>
      </div>

      {/* Status badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[currentStatus]}`}>
        {currentStatus}
      </span>

      {/* Role select */}
      {!isSelf && currentStatus === 'approved' && (
        <select
          value={currentRole}
          onChange={e => updateRole(e.target.value as 'admin' | 'member')}
          disabled={loading}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      )}

      {/* Actions */}
      {!isSelf && (
        <div className="flex gap-2">
          {currentStatus !== 'approved' && (
            <button
              onClick={() => updateStatus('approved')}
              disabled={loading}
              className="text-xs px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {t('approve')}
            </button>
          )}
          {currentStatus !== 'blocked' && (
            <button
              onClick={() => updateStatus('blocked')}
              disabled={loading}
              className="text-xs px-2.5 py-1 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {t('block')}
            </button>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
