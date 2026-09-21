'use client';

import { TrendingUp, TrendingDown, Repeat, ArrowRight } from 'lucide-react';

const TYPE_META = {
  promote: { label: 'Promoted', icon: TrendingUp, badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  demote: { label: 'Demoted', icon: TrendingDown, badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  changerank: { label: 'Rank Changed', icon: Repeat, badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
};

function Avatar({ url, name }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className="h-10 w-10 rounded-full border border-white/10 object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-orange-500/20 text-sm font-semibold text-orange-200">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function Person({ label, tag, avatar }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <Avatar url={avatar} name={tag} />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{label}</div>
        <div className="truncate text-sm font-medium text-white">{tag}</div>
      </div>
    </div>
  );
}

function RoleChip({ children }) {
  return (
    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-white/90">
      {children}
    </span>
  );
}

export default function RankLogEntry({ log }) {
  const meta = TYPE_META[log.type] ?? TYPE_META.changerank;
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
        <span className="text-xs text-white/40">{new Date(log.createdAt).toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Person label="Ranker" tag={log.actorTag} avatar={log.actorAvatar} />
        <Person label="Rankee" tag={log.targetTag} avatar={log.targetAvatar} />
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
          {log.department ? `${log.department} \u2022 Rank Change` : 'Rank Change'}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(log.oldRoles?.length ? log.oldRoles : ['\u2014']).map((r) => (
            <RoleChip key={`old-${r}`}>{r}</RoleChip>
          ))}
          <ArrowRight className="h-4 w-4 text-orange-400" />
          {(log.newRoles?.length ? log.newRoles : ['\u2014']).map((r) => (
            <RoleChip key={`new-${r}`}>{r}</RoleChip>
          ))}
        </div>
        {log.reason && log.reason !== 'No reason provided.' && (
          <div className="mt-2 text-sm text-white/60">
            <span className="font-semibold text-white/40">Reason: </span>
            {log.reason}
          </div>
        )}
      </div>
    </div>
  );
}