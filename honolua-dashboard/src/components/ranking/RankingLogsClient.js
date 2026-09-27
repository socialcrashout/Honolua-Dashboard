'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, RefreshCw, Repeat2, Search, Settings2, ShieldCheck, UsersRound, ChevronLeft, ChevronRight } from 'lucide-react';
import RankLogEntry from './RankLogEntry';
import LogChannelModal from './LogChannelModal';
import HierarchyModal from './HierarchyModal';

const PAGE_SIZE = 12;
const EMPTY_STATS = { total: 0, promotions: 0, demotions: 0, rankChanges: 0 };

function SummaryCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-[0_8px_24px_rgba(89,50,20,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-stone-500">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 flex items-baseline gap-2"><span className="text-3xl font-semibold tracking-tight text-slate-900">{value}</span><span className="text-xs text-stone-400">{hint}</span></div>
    </div>
  );
}

export default function RankingLogsClient({ guildId }) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [logChannelId, setLogChannelId] = useState(null);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    async function load() {
      try {
        const params = new URLSearchParams({ guildId, page: String(page), limit: String(PAGE_SIZE), ...(query.trim() ? { q: query.trim() } : {}), ...(type !== 'all' ? { type } : {}) });
        const responses = await Promise.all([
          fetch(`/api/ranking/stats?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/ranking/logs?${params}`),
          fetch(`/api/ranking/config?guildId=${encodeURIComponent(guildId)}`),
        ]);
        const payloads = await Promise.all(responses.map((response) => response.json().catch(() => ({}))));
        const failed = responses.findIndex((response) => !response.ok);
        if (failed !== -1) throw new Error(payloads[failed]?.error || 'Could not load ranking activity.');
        if (!current) return;
        const [nextStats, nextLogs, config] = payloads;
        setStats({ ...EMPTY_STATS, ...nextStats });
        setLogs(nextLogs.logs || []);
        setPagination({ page: nextLogs.page || 1, pages: nextLogs.pages || 1, total: nextLogs.total || 0 });
        setLogChannelId(config.logChannelId || null);
        setError('');
      } catch (loadError) {
        if (current) setError(loadError.message || 'Could not load ranking activity.');
      } finally {
        if (current) setLoading(false);
      }
    }
    load();
    return () => { current = false; };
  }, [guildId, page, query, type, reloadKey]);

  const refresh = () => { setLoading(true); setError(''); setReloadKey((key) => key + 1); };

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-5 border-b border-orange-100 pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700"><Activity className="h-3.5 w-3.5" /> Staff activity</div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Ranking history</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">A clear record of who changed a rank, who it affected, and what changed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setHierarchyModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"><UsersRound className="h-4 w-4 text-orange-700" /> Rank setup</button>
          <button onClick={() => setChannelModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"><Settings2 className="h-4 w-4" /> Discord logs</button>
        </div>
      </header>

      <section aria-label="Ranking totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Activity} label="All activity" value={stats.total} hint="recorded" />
        <SummaryCard icon={ArrowUpRight} label="Promotions" value={stats.promotions} hint="moves up" />
        <SummaryCard icon={ArrowDownRight} label="Demotions" value={stats.demotions} hint="moves down" />
        <SummaryCard icon={Repeat2} label="Role changes" value={stats.rankChanges} hint="manual updates" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-[0_14px_40px_rgba(89,50,20,0.05)]">
        <div className="flex flex-col gap-4 border-b border-orange-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="font-semibold text-slate-900">Activity feed</h2><p className="mt-1 text-sm text-stone-500">{pagination.total} {pagination.total === 1 ? 'entry' : 'entries'}{query ? ` matching “${query}”` : ''}</p></div>
          <button onClick={refresh} disabled={loading} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-50 sm:self-auto"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>

        <div className="grid gap-3 border-b border-orange-50 bg-orange-50/30 p-4 sm:grid-cols-[minmax(0,1fr)_190px] sm:px-6">
          <label className="relative block"><span className="sr-only">Search ranking activity</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setLoading(true); }} placeholder="Search people, roles, or departments" className="w-full rounded-xl border border-orange-100 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-stone-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100" /></label>
          <label><span className="sr-only">Filter activity type</span><select value={type} onChange={(event) => { setType(event.target.value); setPage(1); setLoading(true); }} className="w-full rounded-xl border border-orange-100 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"><option value="all">Every change</option><option value="promote">Promotions</option><option value="demote">Demotions</option><option value="changerank">Role changes</option></select></label>
        </div>

        {error ? <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error} <button onClick={refresh} className="ml-2 font-semibold underline">Try again</button></div> : null}
        {loading && !logs.length ? <div className="grid min-h-56 place-items-center text-sm text-stone-400">Loading ranking activity…</div> : logs.length ? <div className="divide-y divide-orange-50">{logs.map((log) => <RankLogEntry key={String(log._id || log.id)} log={log} />)}</div> : !error ? <div className="grid min-h-56 place-items-center px-6 text-center"><div><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"><ShieldCheck className="h-5 w-5" /></span><h3 className="mt-3 font-semibold text-slate-800">No ranking activity found</h3><p className="mt-1 text-sm text-stone-500">Try a different search or filter. Bot rank changes will appear here.</p></div></div> : null}

        {pagination.pages > 1 ? <footer className="flex items-center justify-between border-t border-orange-50 px-5 py-4 sm:px-6"><span className="text-sm text-stone-500">Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button aria-label="Previous page" onClick={() => { setPage((current) => Math.max(1, current - 1)); setLoading(true); }} disabled={pagination.page <= 1 || loading} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button aria-label="Next page" onClick={() => { setPage((current) => Math.min(pagination.pages, current + 1)); setLoading(true); }} disabled={pagination.page >= pagination.pages || loading} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer> : null}
      </section>

      <LogChannelModal guildId={guildId} open={channelModalOpen} onClose={() => setChannelModalOpen(false)} currentChannelId={logChannelId} onSaved={setLogChannelId} />
      <HierarchyModal guildId={guildId} open={hierarchyModalOpen} onClose={() => setHierarchyModalOpen(false)} onSaved={refresh} />
    </main>
  );
}
