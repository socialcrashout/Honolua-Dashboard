"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Plus, Save, Trash2, RefreshCw, CircleHelp, ShieldCheck, Tags, ChevronRight } from 'lucide-react';

// Edit this copy object to change the visible labels or emojis in the Binds section.
const COPY = {
  eyebrow: 'Honolua · Discord integration',
  title: 'Role binds',
  intro: 'Choose which Discord roles match Roblox group ranks and Honolua departments.',
  rankTitle: 'Roblox rank roles',
  rankHelp: 'Match the rank name from your Roblox group to a Discord role.',
  deptTitle: 'Department roles',
  deptHelp: 'Give each active department its own Discord role.',
  roleLabel: 'Discord role',
  emptyRole: 'Choose a Discord role',
  save: 'Save binds',
  commandsTitle: 'Cesar commands',
  commands: ['/get roles  —  sync and show role changes', '/update  —  refresh your Honolua roles'],
  saved: 'Role binds saved.',
};

const EASE = [0.16, 1, 0.3, 1];
const inputClass = 'w-full rounded-xl border border-orange-200 bg-[#fffaf2] px-3.5 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const selectClass = 'w-full rounded-xl border border-orange-200 bg-[#fffaf2] px-3.5 py-2.5 text-sm text-stone-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100';

function SectionHeader({ icon: Icon, title, help, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50/80 to-white px-5 py-5 sm:px-7">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 ring-1 ring-orange-200"><Icon className="h-4 w-4" /></span>
        <div><h2 className="font-semibold text-stone-800">{title}</h2><p className="mt-1 text-sm leading-5 text-stone-500">{help}</p></div>
      </div>
      {action}
    </div>
  );
}

function RolePicker({ value, roles, onChange }) {
  return (
    <select className={selectClass} value={value || ''} onChange={(event) => onChange(event.target.value)} aria-label={COPY.roleLabel}>
      <option value="">{COPY.emptyRole}</option>
      {roles.map((role) => <option key={role.id} value={role.id}>@{role.name}</option>)}
    </select>
  );
}

export default function BindsClient({ guildId }) {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rankBindings, setRankBindings] = useState([]);
  const [departmentBindings, setDepartmentBindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function load() {
    setLoading(true);
    setFeedback('');
    try {
      const [bindsResponse, rolesResponse] = await Promise.all([
        fetch(`/api/ranking/binds?guildId=${encodeURIComponent(guildId)}`, { cache: 'no-store' }),
        fetch(`/api/guilds/${guildId}/roles`, { cache: 'no-store' }),
      ]);
      const [binds, roleData] = await Promise.all([bindsResponse.json(), rolesResponse.json()]);
      if (!bindsResponse.ok) throw new Error(binds.error || 'Could not load role binds.');
      if (!rolesResponse.ok) throw new Error(roleData.error || 'Could not load Discord roles.');
      setRoles(roleData.roles || []);
      setRankBindings(binds.rankBindings || []);
      setDepartments(binds.departments || []);
      setDepartmentBindings(binds.departmentBindings || []);
    } catch (error) {
      setFeedback(error.message || 'Could not load role binds.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [guildId]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateRank(index, key, value) {
    setRankBindings((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
    setFeedback('');
  }

  function updateDepartment(department, roleId) {
    setDepartmentBindings((current) => {
      const rest = current.filter((row) => row.departmentId !== department.id);
      return roleId ? [...rest, { departmentId: department.id, roleId }] : rest;
    });
    setFeedback('');
  }

  async function save() {
    setSaving(true);
    setFeedback('');
    try {
      const response = await fetch('/api/ranking/binds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, rankBindings, departmentBindings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save role binds.');
      setFeedback(COPY.saved);
      await load();
      setFeedback(COPY.saved);
    } catch (error) {
      setFeedback(error.message || 'Could not save role binds.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] px-4 py-7 text-[#30291f] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="relative mb-7 overflow-hidden rounded-[28px] border border-orange-200/80 bg-white px-6 py-7 shadow-[0_14px_42px_rgba(178,103,38,0.08)] sm:px-8 sm:py-9">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-700"><Link2 className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">{COPY.eyebrow}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-reef-navy sm:text-4xl">{COPY.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{COPY.intro}</p>
              </div>
            </div>
            <a href="#binds-ranks" className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-[#fffaf2] px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-orange-400 hover:bg-orange-50">Configure roles <ChevronRight className="h-4 w-4" /></a>
          </div>
        </motion.header>

        {loading ? <div className="rounded-2xl border border-orange-200/80 bg-white px-6 py-12 text-sm text-stone-500">Loading role binds…</div> : (
          <div className="grid items-start gap-6 lg:grid-cols-[245px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-2xl border border-orange-200/80 bg-white p-3 shadow-sm">
                <div className="px-3 pb-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Role sources</div>
                <div className="space-y-1">
                  <a href="#binds-ranks" className="flex items-center gap-3 rounded-xl bg-orange-100/80 px-3 py-3 text-orange-900 ring-1 ring-orange-200"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-700 shadow-sm"><ShieldCheck className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">Roblox ranks</span><span className="block text-xs text-stone-500">Group membership</span></span></a>
                  <a href="#binds-departments" className="flex items-center gap-3 rounded-xl px-3 py-3 text-stone-600 transition hover:bg-orange-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-50 text-stone-500"><Tags className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">Departments</span><span className="block text-xs text-stone-500">Honolua assignments</span></span></a>
                </div>
                <div className="mt-4 rounded-xl bg-[#fff8eb] p-3 text-xs leading-5 text-stone-600"><CircleHelp className="mb-2 h-4 w-4 text-orange-600" />Cesar uses these settings to add and remove the matching Discord roles.</div>
              </div>
              <div className="rounded-2xl border border-orange-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3"><h2 className="text-sm font-semibold text-stone-800">{COPY.commandsTitle}</h2><button type="button" onClick={load} className="rounded-lg p-1.5 text-stone-400 transition hover:bg-orange-50 hover:text-orange-700" aria-label="Refresh role binds"><RefreshCw className="h-4 w-4" /></button></div>
                <div className="mt-3 space-y-3">{COPY.commands.map((line) => <p key={line} className="rounded-xl bg-[#fffaf2] px-3 py-2.5 font-mono text-xs leading-5 text-stone-600">{line}</p>)}</div>
              </div>
            </aside>

            <div className="min-w-0 space-y-5">
              {feedback && <p className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm text-stone-600" aria-live="polite">{feedback}</p>}
              <motion.section id="binds-ranks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }} className="scroll-mt-6 overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-[0_8px_28px_rgba(120,78,35,0.055)]">
                <SectionHeader icon={ShieldCheck} title={COPY.rankTitle} help={COPY.rankHelp} action={<button type="button" onClick={() => { setRankBindings((rows) => [...rows, { rankName: '', roleId: '' }]); setFeedback(''); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-orange-400 hover:bg-orange-50"><Plus className="h-4 w-4" />Add rank</button>} />
                <div className="divide-y divide-orange-100/80 px-5 sm:px-7">
                  {rankBindings.map((row, index) => <div key={`rank-${index}`} className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr_40px] sm:items-center">
                    <input className={inputClass} value={row.rankName || ''} onChange={(event) => updateRank(index, 'rankName', event.target.value)} placeholder="Roblox rank name" aria-label="Roblox rank name" />
                    <RolePicker value={row.roleId} roles={roles} onChange={(value) => updateRank(index, 'roleId', value)} />
                    <button type="button" onClick={() => { setRankBindings((rows) => rows.filter((_, i) => i !== index)); setFeedback(''); }} className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition hover:bg-orange-100 hover:text-orange-800" aria-label="Remove rank bind"><Trash2 className="h-4 w-4" /></button>
                  </div>)}
                  {!rankBindings.length && <div className="py-5 text-sm text-stone-500">No rank binds yet. Add a Roblox group rank to get started.</div>}
                </div>
              </motion.section>

              <motion.section id="binds-departments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3, ease: EASE }} className="scroll-mt-6 overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-[0_8px_28px_rgba(120,78,35,0.055)]">
                <SectionHeader icon={Tags} title={COPY.deptTitle} help={COPY.deptHelp} action={<span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800">{departments.length} active</span>} />
                <div className="divide-y divide-orange-100/80 px-5 sm:px-7">
                  {departments.map((department, index) => {
                    const saved = departmentBindings.find((row) => row.departmentId === department.id);
                    return <div key={department.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr] sm:items-center">
                      <div className="flex items-center gap-3 text-sm font-semibold text-stone-700"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-800">{String(index + 1).padStart(2, '0')}</span>{department.name}</div>
                      <RolePicker value={saved?.roleId || ''} roles={roles} onChange={(value) => updateDepartment(department, value)} />
                    </div>;
                  })}
                  {!departments.length && <div className="py-5 text-sm text-stone-500">Create an active department before assigning it a Discord role.</div>}
                </div>
                <div className="border-t border-orange-100 bg-[#fffaf2] px-5 py-3 text-xs leading-5 text-stone-500 sm:px-7">Department membership comes from the Honolua Departments page.</div>
              </motion.section>

              <footer className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-white/95 p-3 shadow-[0_12px_32px_rgba(120,78,35,0.12)] backdrop-blur">
                <p className="px-2 text-sm text-stone-500" aria-live="polite">{feedback || 'Changes apply the next time roles sync.'}</p>
                <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : COPY.save}</button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
