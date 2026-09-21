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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(currentChannelId ?? '');
    setLoading(true);
    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => res.json())
      .then((data) => setChannels(data.channels ?? data ?? []))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [open, guildId, currentChannelId]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/ranking/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, logChannelId: selected || null }),
      });
      onSaved?.(selected || null);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Ranking Log Channel</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-white/60">
          Choose the Discord channel where ranking log entries will be posted automatically. Leave empty to disable
          Discord log messages (entries still appear here).
        </p>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50"
        >
          <option value="" className="bg-neutral-900">
            {loading ? 'Loading channels...' : 'No log channel (disabled)'}
          </option>
          {channels.map((c) => (
            <option key={c.id} value={c.id} className="bg-neutral-900">
              #{c.name}
            </option>
          ))}
        </select>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.05]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Channel'}
          </button>
        </div>
      </div>
    </div>
  );
}