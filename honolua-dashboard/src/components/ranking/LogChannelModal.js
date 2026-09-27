'use client';

import { useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';

/**
 * Reuses the same /api/guilds/[guildId]/channels endpoint your
 * TriggerEditor's channel picker already hits. If that endpoint
 * returns a different shape than `{ channels: [{ id, name, type }] }`,
 * adjust the `.then()` below to match.
 */
export default function LogChannelModal({ guildId, open, onClose, currentChannelId, onSaved }) {
  const [channels, setChannels] = useState([]);
  const [selected, setSelected] = useState(currentChannelId ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok === false) throw new Error(data.error || 'Could not load Discord channels.');
        setChannels(data.channels ?? data ?? []);
      })
      .catch((loadError) => { setChannels([]); setError(loadError.message || 'Could not load Discord channels.'); })
      .finally(() => setLoading(false));
  }, [open, guildId, currentChannelId]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/ranking/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, logChannelId: selected || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save the log channel.');
      onSaved?.(selected || null);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Could not save the log channel.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-700" />
            <h2 className="text-lg font-semibold text-slate-900">Ranking Log Channel</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-stone-500">
          Choose the Discord channel where ranking log entries will be posted automatically. Leave empty to disable
          Discord log messages (entries still appear here).
        </p>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-300"
        >
          <option value="">
            {loading ? 'Loading channels...' : 'No log channel (disabled)'}
          </option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>

        {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Channel'}
          </button>
        </div>
      </div>
    </div>
  );
}
