'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Send, Trash2, Pencil, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Note {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: { full_name: string | null } | null;
}

export default function TaskNotesPanel({ taskId }: { taskId: string }) {
  const t = useTranslations('tasks');
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  async function loadNotes() {
    setLoading(true);
    const supabase = createClient();
    const [{ data }, { data: { user } }] = await Promise.all([
      supabase
        .from('task_notes')
        .select('id, content, created_at, author_id, author:profiles!author_id(full_name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
      supabase.auth.getUser(),
    ]);
    setNotes((data ?? []) as unknown as Note[]);
    if (user) setCurrentUserId(user.id);
    setLoading(false);
  }

  useEffect(() => {
    if (open) loadNotes();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('task_notes')
      .insert({ task_id: taskId, author_id: currentUserId, content: text.trim() })
      .select('id, content, created_at, author_id, author:profiles!author_id(full_name)')
      .single();
    if (err) setError(err.message);
    else if (data) { setNotes(prev => [...prev, data as unknown as Note]); setText(''); }
    setSubmitting(false);
  }

  async function handleDelete(noteId: string) {
    const supabase = createClient();
    await supabase.from('task_notes').delete().eq('id', noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }

  async function handleEdit(noteId: string) {
    if (!editText.trim()) return;
    const supabase = createClient();
    const { error: err } = await supabase
      .from('task_notes')
      .update({ content: editText.trim() })
      .eq('id', noteId);
    if (!err) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: editText.trim() } : n));
      setEditingId(null);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <MessageSquare size={12} />
        {t('notes')}
        {notes.length > 0 && !open && (
          <span className="text-gray-300 dark:text-gray-600">({notes.length})</span>
        )}
      </button>

      {open && (
        <div className="mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
          {loading ? (
            <p className="text-xs text-gray-400 py-2">...</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-600 py-1">{t('addNote')}</p>
          ) : (
            <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto">
              {notes.map(note => (
                <div key={note.id} className="group text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {note.author?.full_name ?? '?'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-300 dark:text-gray-600">{note.created_at.slice(0, 10)}</span>
                      {note.author_id === currentUserId && editingId !== note.id && (
                        <>
                          <button
                            onClick={() => { setEditingId(note.id); setEditText(note.content); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-500 transition-all ms-1"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === note.id ? (
                    <div className="flex gap-1 mt-1">
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(note.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="flex-1 text-xs px-1.5 py-0.5 border border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                      />
                      <button onClick={() => handleEdit(note.id)} className="text-green-500 hover:text-green-600">
                        <Check size={11} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{note.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
          <form onSubmit={handleSubmit} className="flex gap-1.5 mt-1">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t('addNote')}
              className="flex-1 text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-colors"
            >
              <Send size={11} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
