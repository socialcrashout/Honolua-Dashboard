'use client';

import { ArrowDownRight, ArrowRight, ArrowUpRight, Repeat2 } from 'lucide-react';

const ACTIONS = {
  promote: { label: 'Promoted', icon: ArrowUpRight, style: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  demote: { label: 'Demoted', icon: ArrowDownRight, style: 'bg-orange-50 text-orange-800 ring-orange-200' },
  changerank: { label: 'Roles updated', icon: Repeat2, style: 'bg-stone-100 text-stone-700 ring-stone-200' },
};

function Avatar({ url, name }) {
  const initial = (name || '?').replace(/^@/, '').charAt(0).toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" loading="lazy" className="h-10 w-10 rounded-full border border-orange-100 bg-orange-50 object-cover" />
  ) : <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-orange-100 bg-orange-50 text-sm font-semibold text-orange-800">{initial}</span>;
}

function Role({ children, subdued = false }) {
  return <span className={`inline-flex max-w-full items-center rounded-lg px-2.5 py-1 text-sm ${subdued ? 'border border-stone-200 bg-stone-50 text-stone-500' : 'border border-orange-100 bg-orange-50/70 font-medium text-slate-800'}`}><span className="truncate">{children}</span></span>;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: 'Unknown time', iso: undefined };
  return { label: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date), iso: date.toISOString() };
}

export default function RankLogEntry({ log }) {
  const action = ACTIONS[log.type] || ACTIONS.changerank;
  const Icon = action.icon;
  const time = formatDate(log.createdAt || log.updatedAt);
  const previousRoles = Array.isArray(log.oldRoles) ? log.oldRoles : [];
  const nextRoles = Array.isArray(log.newRoles) ? log.newRoles : [];

  return (
    <article className="px-5 py-5 transition-colors hover:bg-orange-50/20 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <Avatar url={log.targetAvatar} name={log.targetTag} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${action.style}`}><Icon className="h-3.5 w-3.5" />{action.label}</span>
              {log.department ? <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">{log.department}</span> : null}
            </div>
            <h3 className="mt-2 truncate font-semibold text-slate-900">{log.targetTag || 'Unknown member'}</h3>
            <p className="mt-0.5 text-sm text-stone-500">Changed by <span className="font-medium text-stone-700">{log.actorTag || 'Unknown staff member'}</span></p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 pl-[54px] lg:max-w-[52%] lg:justify-end lg:pl-0">
          {previousRoles.length ? previousRoles.map((role, index) => <Role key={`old-${index}`} subdued>{role}</Role>) : <Role subdued>No previous rank</Role>}
          <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-orange-500" />
          {nextRoles.length ? nextRoles.map((role, index) => <Role key={`new-${index}`}>{role}</Role>) : <Role>Removed</Role>}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 pl-[54px] text-sm sm:flex-row sm:items-start sm:justify-between">
        {log.reason && log.reason !== 'No reason provided.' ? <p className="min-w-0 break-words text-stone-600"><span className="font-medium text-stone-500">Reason:</span> {log.reason}</p> : <span className="text-stone-400">No reason provided</span>}
        <time dateTime={time.iso} title={time.iso ? new Date(time.iso).toLocaleString() : undefined} className="shrink-0 text-xs text-stone-400">{time.label}</time>
      </div>
    </article>
  );
}
