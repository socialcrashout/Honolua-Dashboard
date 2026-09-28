"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Plus, Save, Trash2, RefreshCw, CircleHelp } from 'lucide-react';
import { toast } from 'sonner';

// Edit this copy object to change the visible labels or emojis in the Binds section.
const COPY = {
  eyebrow: 'SYSTEM / ROLE ROUTING',
  title: 'Binds',
  intro: 'Connect Roblox group ranks and Honolua departments to Discord roles.',
  rankTitle: '01 — Group ranks',
  rankHelp: 'Enter the Roblox group rank name exactly as it appears in the group.',
  deptTitle: '02 — Departments',
  deptHelp: 'Each active department can map to its own Discord role.',
  roleLabel: 'Discord role',
  emptyRole: 'Choose a Discord role',
  save: 'Save binds',
  commandsTitle: 'Cesar commands',
  commands: ['/get roles  —  preview your current bindings', '/update  —  refresh your Roblox and department roles'],
  saved: 'Binds saved. Cesar will use these mappings on the next role update.',
};

const EASE = [0.16, 1, 0.3, 1];
const inputClass = 'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500';
const selectClass = 'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500';

function SectionHeader({ number, title, help, action }) {
  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="font-mono text-[11px] tracking-[0.16em] text-neutral-400">{number}</div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{help}</p>
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
  const [error, setError] = useState('');

  const rolesById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bindsResponse, rolesResponse] = await Promise.all([
        fetch(`/api/ranking/binds?guildId=${encodeURIComponent(guildId)}`),
        fetch(`/api/guilds/${guildId}/roles`),
      ]);
      const [binds, roleData] = await Promise.all([bindsResponse.json(), rolesResponse.json()]);
      if (!bindsResponse.ok) throw new Error(binds.error || 'Could not load binds.');
      if (!rolesResponse.ok) throw new Error(roleData.error || 'Could not load Discord roles.');
      setRoles(roleData.roles || []);
      setRankBindings(binds.rankBindings || []);
      setDepartments(binds.departments || []);
      setDepartmentBindings(binds.departmentBindings || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load bind settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [guildId]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateRank(index, key, value) {
    setRankBindings((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }

  function updateDepartment(department, roleId) {
    setDepartmentBindings((current) => {
      const rest = current.filter((row) => row.departmentId !== department.id);
      return roleId ? [...rest, { departmentId: department.id, roleId }] : rest;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch('/api/ranking/binds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, rankBindings, departmentBindings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save binds.');
      toast.success(COPY.saved);
      await load();
    } catch (saveError) {
      toast.error(saveError.message || 'Could not save binds.');
    } finally {
      setSaving(false);
    }
  }

  const activeDepartments = departments;

  return (
    <main className="min-h-screen bg-[#f5f5f3] px-4 pb-16 pt-10 text-neutral-950 sm:px-8 md:px-12 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="grid gap-8 border-b border-neutral-300 pb-10 md:grid-cols-[1fr_280px] md:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-neutral-500"><Link2 size={14} />{COPY.eyebrow}</div>
            <h1 className="mt-4 text-6xl font-semibold tracking-[-0.08em] sm:text-8xl">{COPY.title}<span className="align-top text-3xl">⌁</span></h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-500">{COPY.intro}</p>
          </div>
          <div className="border-l border-neutral-300 pl-5 text-sm leading-6 text-neutral-500">
            <div className="font-mono text-[10px] tracking-[0.16em] text-neutral-400">AUTOMATION</div>
            <p className="mt-2">Cesar reads these binds when a member runs <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-800">/update</code> or completes Honolua verification.</p>
          </div>
        </motion.header>

        {error && <div className="mt-6 border border-neutral-300 bg-white p-4 text-sm text-neutral-700">{error}</div>}
        {loading ? <div className="py-16 font-mono text-sm text-neutral-400">Loading bind settings…</div> : (
          <div className="grid gap-10 py-10 lg:grid-cols-[1fr_280px]">
            <div className="space-y-12">
              <section>
                <SectionHeader number="01 / RANK → ROLE" title={COPY.rankTitle} help={COPY.rankHelp} action={<button onClick={() => setRankBindings((rows) => [...rows, { rankName: '', roleId: '' }])} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100"><Plus size={16} /> Add rank</button>} />
                <div className="divide-y divide-neutral-200">
                  {rankBindings.map((row, index) => (
                    <motion.div layout key={`rank-${index}`} className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr_42px] sm:items-center">
                      <input className={inputClass} value={row.rankName || ''} onChange={(event) => updateRank(index, 'rankName', event.target.value)} placeholder="Roblox rank name" aria-label="Roblox rank name" />
                      <RolePicker value={row.roleId} roles={roles} onChange={(value) => updateRank(index, 'roleId', value)} />
                      <button onClick={() => setRankBindings((rows) => rows.filter((_, i) => i !== index))} className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-900" aria-label="Remove rank bind"><Trash2 size={16} /></button>
                    </motion.div>
                  ))}
                  {!rankBindings.length && <div className="py-7 text-sm text-neutral-400">No rank binds yet. Add one to sync a Roblox group rank.</div>}
                </div>
              </section>

              <section>
                <SectionHeader number="02 / DEPARTMENT → ROLE" title={COPY.deptTitle} help={COPY.deptHelp} action={<span className="font-mono text-xs text-neutral-400">{activeDepartments.length} ACTIVE</span>} />
                <div className="divide-y divide-neutral-200">
                  {activeDepartments.map((department, index) => {
                    const saved = departmentBindings.find((row) => row.departmentId === department.id);
                    return (
                      <motion.div layout key={department.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(index * 0.025, 0.25) }} className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr] sm:items-center">
                        <div className="flex items-center gap-3 text-sm font-medium"><span className="font-mono text-xs text-neutral-400">{String(index + 1).padStart(2, '0')}</span>{department.name}</div>
                        <RolePicker value={saved?.roleId || ''} roles={roles} onChange={(value) => updateDepartment(department, value)} />
                      </motion.div>
                    );
                  })}
                  {!activeDepartments.length && <div className="py-7 text-sm text-neutral-400">Add active departments before creating department binds.</div>}
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-neutral-300 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-lg text-xs leading-5 text-neutral-400"><CircleHelp className="mr-1 inline-block" size={13} /> Removed mappings remain tracked so Cesar can clear their old roles on the next update.</p>
                <button disabled={saving} onClick={save} className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"><Save size={15} />{saving ? 'Saving…' : COPY.save}</button>
              </div>
            </div>

            <aside className="h-fit border border-neutral-300 bg-white p-5 lg:sticky lg:top-8">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4"><h2 className="font-semibold">{COPY.commandsTitle}</h2><button onClick={load} className="text-neutral-400 transition hover:text-neutral-900" aria-label="Refresh bind data"><RefreshCw size={15} /></button></div>
              <div className="mt-4 space-y-3 font-mono text-xs leading-5 text-neutral-600">{COPY.commands.map((line) => <p key={line} className="border-l-2 border-neutral-300 pl-3">{line}</p>)}</div>
              <div className="mt-6 border-t border-neutral-200 pt-4 text-xs leading-5 text-neutral-400">Discord roles are selected from the connected Honolua server. Unmapped ranks and departments don’t grant a role.</div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
