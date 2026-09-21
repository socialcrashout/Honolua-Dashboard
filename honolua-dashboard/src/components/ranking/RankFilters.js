'use client';

import { Search, RefreshCw } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All commands' },
  { value: 'promote', label: 'Promotions' },
  { value: 'demote', label: 'Demotions' },
  { value: 'changerank', label: 'Rank changes' },
];

export default function RankFilters({ query, onQueryChange, type, onTypeChange, onRefresh, refreshing }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search username, rank..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-400/50"
        />
      </div>

      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-neutral-900">
            {opt.label}
          </option>
        ))}
      </select>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.07] disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
}