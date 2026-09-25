'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Repeat, Settings, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import StatCard from './StatCard';
import RankFilters from './RankFilters';
import RankLogEntry from './RankLogEntry';
import LogChannelModal from './LogChannelModal';
import HierarchyModal from './HierarchyModal';

const PAGE_SIZE = 10;

export default function RankingLogsClient({ guildId }) {
  const [stats, setStats] = useState({ total: 0, promotions: 0, demotions: 0, rankChanges: 0 });
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);

  const [logChannelId, setLogChannelId] = useState(null);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const logsParams = new URLSearchParams({
        guildId,
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(query ? { q: query } : {}),
        ...(type !== 'all' ? { type } : {}),
      });

      const [statsRes, logsRes, configRes] = await Promise.all([
        fetch(`/api/ranking/stats?guildId=${guildId}`).then((r) => r.json()),
        fetch(`/api/ranking/logs?${logsParams.toString()}`).then((r) => r.json()),
        fetch(`/api/ranking/config?guildId=${guildId}`).then((r) => r.json()),
      ]);

      setStats(statsRes);
      setLogs(logsRes.logs ?? []);
      setPagination({ page: logsRes.page ?? 1, pages: logsRes.pages ?? 1, total: logsRes.total ?? 0 });
      setLogChannelId(configRes.logChannelId ?? null);
    } finally {
      setLoading(false);
    }
  }, [guildId, page, query, type]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [query, type]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-reef-navy">
            <span className="text-orange-400">🌺</span> Ranking Logs
          </h1>
          <p className="mt-1 text-sm text-lava/50">Full history of rank changes made through Honolua</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setHierarchyModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-lava/10 bg-lava/[0.03] px-3.5 py-2 text-sm font-medium text-reef-navy hover:bg-lava/[0.06]"
          >
            <Layers className="h-4 w-4" />
            Manage Hierarchy
          </button>
          <button
            onClick={() => setChannelModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-lava/10 bg-lava/[0.03] px-3.5 py-2 text-sm font-medium text-reef-navy hover:bg-lava/[0.06]"
          >
            <Settings className="h-4 w-4" />
            Log Channel {logChannelId ? <span className="text-[#B8862B]">#{logChannelId}</span> : null}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={BarChart3} label="Total Logs" value={stats.total} tone="orange" />
        <StatCard icon={TrendingUp} label="Promotions" value={stats.promotions} tone="emerald" />
        <StatCard icon={TrendingDown} label="Demotions" value={stats.demotions} tone="rose" />
        <StatCard icon={Repeat} label="Rank Changes" value={stats.rankChanges} tone="sky" />
      </div>

      <RankFilters query={query} onQueryChange={setQuery} type={type} onTypeChange={setType} onRefresh={load} refreshing={loading} />

      <div className="rounded-2xl border border-lava/10 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-reef-navy">Rank Change History</h2>
            <p className="text-sm text-lava/45">All promote, demote, and rank change actions</p>
          </div>
          <span className="rounded-full border border-[#F4B942]/30 bg-[#F4B942]/10 px-3 py-1 text-xs font-semibold text-[#B8862B]">
            {pagination.total} shown
          </span>
        </div>

        {loading && !logs.length ? (
          <div className="py-16 text-center text-sm text-lava/40">Loading...</div>
        ) : logs.length ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <RankLogEntry key={log._id} log={log} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-lava/40">No ranking activity yet.</div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-lg border border-lava/10 px-3 py-1.5 text-sm text-reef-navy/70 hover:bg-lava/[0.05] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm text-lava/40">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 rounded-lg border border-lava/10 px-3 py-1.5 text-sm text-reef-navy/70 hover:bg-lava/[0.05] disabled:opacity-30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <LogChannelModal
        guildId={guildId}
        open={channelModalOpen}
        onClose={() => setChannelModalOpen(false)}
        currentChannelId={logChannelId}
        onSaved={setLogChannelId}
      />
      <HierarchyModal guildId={guildId} open={hierarchyModalOpen} onClose={() => setHierarchyModalOpen(false)} onSaved={load} />
    </div>
  );
}