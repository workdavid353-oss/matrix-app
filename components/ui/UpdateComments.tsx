'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Send, Trash2, Pencil, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: { full_name: string | null } | null;
}

export default function UpdateComments({ updateId, currentUserId }: { updateId: string; currentUserId: string }) {
  const t = useTranslations('updates');
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  async function loadComments() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('update_comments')
      .select('id, content, created_at, author_id, author:profiles!author_id(full_name)')
      .eq('update_id', updateId)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as unknown as Comment[]);
    setLoading(false);
  }

  useEffect(() => {
    if (open) loadComments();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('update_comments')
      .insert({ update_id: updateId, author_id: currentUserId, content: text.trim() })
      .select('id, content, created_at, author_id, author:profiles!author_id(full_name)')
      .single();
    if (err) { setError(err.message); }
    else if (data) { setComments(prev => [...prev, data as unknown as Comment]); setText(''); }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    const supabase = createClient();
    await supabase.from('update_comments').delete().eq('id', commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  async function handleEdit(commentId: string) {
    if (!editText.trim()) return;
    const supabase = createClient();
    const { error: err } = await supabase
      .from('update_comments')
      .update({ content: editText.trim() })
      .eq('id', commentId);
    if (!err) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editText.trim() } : c));
      setEditingId(null);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <MessageSquare size={13} />
        {t('comments')}
        {comments.length > 0 && !open && (
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full text-xs">
            {comments.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          {loading ? (
            <p className="text-xs text-gray-400 py-2">...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-600 mb-2">{t('noComments')}</p>
          ) : (
            <div className="space-y-2 mb-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-2 group">
                  <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-brand-800 dark:text-brand-100 font-medium">
                      {comment.author?.full_name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {comment.author?.full_name ?? '?'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-gray-600">{comment.created_at.slice(0, 10)}</span>
                        {comment.author_id === currentUserId && editingId !== comment.id && (
                          <>
                            <button
                              onClick={() => { setEditingId(comment.id); setEditText(comment.content); }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-500 transition-all"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div className="flex gap-1 mt-1">
                        <input
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleEdit(comment.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="flex-1 text-xs px-1.5 py-0.5 border border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                        />
                        <button onClick={() => handleEdit(comment.id)} className="text-green-500 hover:text-green-600">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">{comment.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t('addComment')}
              className="flex-1 text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
