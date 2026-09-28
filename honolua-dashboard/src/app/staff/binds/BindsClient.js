"use client";

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Tag, Users, ShoppingCart, Search, Plus, X, RefreshCw, Check, Trash2, Pencil, Link2, LoaderCircle } from 'lucide-react';

// Copy and symbols are kept together so this page is quick to customize.
const COPY = {
  title: 'Role Bindings',
  subtitle: 'Connect Roblox group ranks and Honolua departments to Discord roles.',
  infoTitle: 'How Binds Work',
  info: 'When members sync their roles, Cesar checks their Roblox group rank and Honolua department, then adds every Discord role attached to those sources.',
  create: 'Create Bind',
  createRole: 'Create role bind',
  emptyTitle: 'No role binds yet',
  emptyText: 'Map Roblox group ranks to one or more Discord roles.',
  rank: 'Roblox Rank',
  discordRoles: 'Discord Roles',
  nick: 'Nickname Template (Optional)',
  enabled: 'Enabled',
  rolePlaceholder: 'Select Discord roles…',
  rankPlaceholder: 'Select rank…',
  bulk: 'Bulk Create Mode',
  saved: 'Bindings saved.',
  noRoles: 'No Discord roles found. Make sure Cesar is in the server and can view roles.',
};

const TYPES = [
  { id: 'role', label: 'Role Binds', icon: Crown },
  { id: 'team', label: 'Team Binds', icon: Tag },
  { id: 'group', label: 'Group Binds', icon: Users, unavailable: true },
  { id: 'catalog', label: 'Catalog Binds', icon: ShoppingCart, unavailable: true },
];
const EASE = [0.16, 1, 0.3, 1];

function RoleBindModal({ groupRoles, discordRoles, initialBind, onClose, onSave }) {
  const [bulk, setBulk] = useState(false);
  const [rankId, setRankId] = useState(initialBind?.rankId || '');
  const [rankIds, setRankIds] = useState(initialBind ? [initialBind.rankId] : []);
  const [roleIds, setRoleIds] = useState(initialBind?.roleIds || (initialBind?.roleId ? [initialBind.roleId] : []));
  const [nicknameTemplate, setNicknameTemplate] = useState(initialBind?.nicknameTemplate || '');
  const [enabled, setEnabled] = useState(initialBind?.enabled !== false);
  const [searchRoles, setSearchRoles] = useState('');
  const [saving, setSaving] = useState(false);
  const rankById = useMemo(() => new Map(groupRoles.map((rank) => [rank.id, rank])), [groupRoles]);
  const filteredDiscordRoles = discordRoles.filter((role) => role.name.toLowerCase().includes(searchRoles.toLowerCase()));

  function toggleRank(id) {
    setRankIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function toggleRole(id) {
    setRoleIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  const [saveError, setSaveError] = useState('');
  async function submit(event) {
    event.preventDefault();
    const chosenRanks = bulk ? rankIds : (rankId ? [rankId] : []);
    if (!chosenRanks.length || !roleIds.length) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSave(chosenRanks.map((id) => ({ ...rankById.get(id), roleIds, nicknameTemplate, enabled })));
    } catch (error) {
      setSaveError(error.message || 'Could not save this bind.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2, ease: EASE }} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#101012] p-5 text-white shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-300"><Crown className="h-5 w-5" /></span><div><h2 className="text-2xl font-semibold">{initialBind ? 'Edit Role Bind' : 'Create Role Bind'}</h2><p className="mt-1 text-sm text-zinc-400">Map one or more Roblox group ranks to Discord roles.</p></div></div>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>

          <button type="button" onClick={() => setBulk((value) => !value)} className="mt-7 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20">
            <span><span className="block font-medium">{COPY.bulk}</span><span className="mt-1 block text-sm text-zinc-500">Create binds for multiple ranks at once</span></span>
            <span className={`relative h-7 w-12 rounded-full p-1 transition ${bulk ? 'bg-fuchsia-500/50' : 'bg-zinc-700'}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${bulk ? 'translate-x-5' : ''}`} /></span>
          </button>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-zinc-300">{COPY.rank}</label>
            {bulk ? (
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                {groupRoles.map((rank) => <label key={rank.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5"><input type="checkbox" checked={rankIds.includes(rank.id)} onChange={() => toggleRank(rank.id)} className="accent-fuchsia-400" /><span className="w-10 font-mono text-xs text-zinc-500">{rank.rank}</span><span>{rank.name}</span></label>)}
                {!groupRoles.length && <p className="p-4 text-sm text-zinc-500">Roblox group ranks are unavailable.</p>}
              </div>
            ) : (
              <select value={rankId} onChange={(event) => setRankId(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-[#09090b] px-4 text-sm text-zinc-100 outline-none focus:border-fuchsia-400/50" required>
                <option value="">{COPY.rankPlaceholder}</option>
                {groupRoles.map((rank) => <option key={rank.id} value={rank.id}>{rank.rank}　{rank.name}</option>)}
              </select>
            )}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between"><label className="text-sm font-medium text-zinc-300">{COPY.discordRoles} <span className="text-zinc-500">({roleIds.length} selected)</span></label><span className="text-xs text-zinc-500">Select more than one</span></div>
            <input value={searchRoles} onChange={(event) => setSearchRoles(event.target.value)} placeholder="Filter Discord roles…" className="mb-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-400/40" />
            <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2 sm:grid-cols-2">
              {filteredDiscordRoles.map((role) => <label key={role.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5"><input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} className="accent-fuchsia-400" /><span className="truncate">@{role.name}</span></label>)}
              {!filteredDiscordRoles.length && <p className="col-span-full p-3 text-sm text-zinc-500">{COPY.noRoles}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-zinc-300">{COPY.nick}</label>
            <input value={nicknameTemplate} onChange={(event) => setNicknameTemplate(event.target.value)} maxLength={80} placeholder="{username} | {displayName}" className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-400/40" />
            <p className="mt-2 text-xs text-zinc-500">Variables: {'{username}'}, {'{displayName}'}, {'{userId}'}</p>
          </div>

          <button type="button" onClick={() => setEnabled((value) => !value)} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-left"><span><span className="block font-medium">{COPY.enabled}</span><span className="mt-1 block text-sm text-zinc-500">Disabled binds won’t be applied to members</span></span><span className={`relative h-7 w-12 rounded-full p-1 transition ${enabled ? 'bg-fuchsia-500/50' : 'bg-zinc-700'}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`} /></span></button>

          {saveError && <p role="alert" className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{saveError}</p>}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5">Cancel</button><button type="submit" disabled={saving || !roleIds.length || !(bulk ? rankIds.length : rankId)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-6 py-3 text-sm font-semibold text-fuchsia-200 transition hover:bg-fuchsia-400/15 disabled:cursor-not-allowed disabled:opacity-40">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{initialBind ? 'Save Bind' : 'Create Bind'}</button></div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BindsClient({ guildId }) {
  const [roles, setRoles] = useState([]);
  const [groupRoles, setGroupRoles] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [rankBindings, setRankBindings] = useState([]);
  const [departmentBindings, setDepartmentBindings] = useState([]);
  const [activeType, setActiveType] = useState('role');
  const [search, setSearch] = useState('');
  const [modalBind, setModalBind] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [groupRolesError, setGroupRolesError] = useState('');
  const [saved, setSaved] = useState(false);

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const filteredBindings = rankBindings.filter((binding) => {
    const boundRoles = (binding.roleIds || (binding.roleId ? [binding.roleId] : [])).map((id) => roleById.get(id)?.name || '').join(' ');
    return `${binding.rankName} ${binding.rank} ${boundRoles}`.toLowerCase().includes(search.toLowerCase());
  });

  async function load() {
    setLoading(true);
    setError('');
    setGroupRolesError('');
    try {
      const [bindsResponse, rolesResponse] = await Promise.all([
        fetch(`/api/ranking/binds?guildId=${encodeURIComponent(guildId)}`, { cache: 'no-store' }),
        fetch(`/api/guilds/${guildId}/roles`, { cache: 'no-store' }),
      ]);
      const [binds, roleData] = await Promise.all([bindsResponse.json(), rolesResponse.json()]);
      if (!bindsResponse.ok) throw new Error(binds.error || 'Could not load bindings.');
      if (!rolesResponse.ok) throw new Error(roleData.error || 'Could not load Discord roles.');
      setRoles(roleData.roles || []);
      setGroupRoles(binds.groupRoles || []);
      setGroupId(binds.groupId || '');
      setGroupRolesError(binds.groupRolesError || '');
      setRankBindings(binds.rankBindings || []);
      setDepartments(binds.departments || []);
      setDepartmentBindings(binds.departmentBindings || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load role binds.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [guildId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function persist(nextRankBindings = rankBindings, nextDepartmentBindings = departmentBindings) {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await fetch('/api/ranking/binds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, rankBindings: nextRankBindings, departmentBindings: nextDepartmentBindings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save role binds.');
      setRankBindings(nextRankBindings);
      setDepartmentBindings(nextDepartmentBindings);
      setSaved(true);
      setModalBind(undefined);
    } catch (saveError) {
      setError(saveError.message || 'Could not save role binds.');
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  async function saveRoleBinds(rows) {
    const updated = [...rankBindings];
    for (const row of rows) {
      const index = updated.findIndex((binding) => binding.rankId === row.id);
      const value = { rankId: row.id, rank: row.rank, rankName: row.name, roleIds: row.roleIds, nicknameTemplate: row.nicknameTemplate, enabled: row.enabled };
      if (index === -1) updated.push(value); else updated[index] = value;
    }
    await persist(updated, departmentBindings);
  }

  async function deleteRankBind(rankId) {
    await persist(rankBindings.filter((binding) => binding.rankId !== rankId), departmentBindings);
  }

  async function updateDepartment(department, roleId) {
    const next = departmentBindings.filter((row) => row.departmentId !== department.id);
    if (roleId) next.push({ departmentId: department.id, roleId });
    await persist(rankBindings, next);
  }

  const counts = { role: rankBindings.length, team: departmentBindings.length, group: 0, catalog: 0 };
  const activeTypeData = TYPES.find((type) => type.id === activeType);
  const ActiveTypeIcon = activeTypeData?.icon;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] px-4 py-8 text-zinc-100 sm:px-7 lg:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '68px 68px', maskImage: 'linear-gradient(to bottom, black, transparent 80%)' }} />
      <div aria-hidden className="pointer-events-none absolute -right-52 -top-56 h-[600px] w-[600px] rounded-full bg-fuchsia-500/[0.08] blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="mb-7 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/[0.08] text-fuchsia-300"><Link2 className="h-6 w-6" /></span>
          <div><h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{COPY.title}</h1><p className="mt-1 text-sm text-zinc-400 sm:text-base">{COPY.subtitle}</p></div>
        </motion.header>

        <section className="mb-7 rounded-2xl border border-blue-400/20 bg-blue-500/[0.035] p-5 sm:p-6">
          <div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-blue-300">i</span><div><h2 className="font-semibold text-blue-200">{COPY.infoTitle}</h2><p className="mt-1 max-w-6xl text-sm leading-6 text-blue-100/65">{COPY.info} <span className="text-blue-200/80">Ranks are loaded from Roblox group {groupId || '…'}.</span></p></div></div>
        </section>

        {error && <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{error}<button type="button" onClick={load} className="shrink-0 underline">Retry</button></div>}

        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.025] p-1.5">
            {TYPES.map(({ id, label, icon: Icon, unavailable }) => <button key={id} type="button" disabled={unavailable} onClick={() => setActiveType(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeType === id ? 'border border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-300' : unavailable ? 'cursor-not-allowed text-zinc-700' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'}`} title={unavailable ? 'Not connected yet' : label}><Icon className="h-4 w-4" />{label}<span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-400">{counts[id]}</span></button>)}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search binds…" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.025] pl-11 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/20" /></div>
            {activeType === 'role' && <button type="button" onClick={() => setModalBind(null)} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/[0.08] px-4 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-400/[0.13]"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{COPY.create}</span><span className="sm:hidden">Create</span></button>}
            {activeType === 'team' && <button type="button" onClick={load} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] px-4 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]"><RefreshCw className="h-4 w-4" />Refresh</button>}
          </div>
        </div>

        <section className="min-h-[390px] rounded-[26px] border border-white/10 bg-white/[0.018] p-5 sm:p-8">
          {loading ? <div className="flex min-h-[340px] items-center justify-center gap-3 text-sm text-zinc-500"><LoaderCircle className="h-5 w-5 animate-spin" />Loading binds…</div> : activeType === 'role' ? (
            <>
              {groupRolesError && <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 text-sm text-amber-100/80">Could not fetch Roblox ranks: {groupRolesError}</div>}
              {filteredBindings.length ? <div className="grid gap-3 md:grid-cols-2">{filteredBindings.map((binding) => <motion.article layout key={binding.rankId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20">
                <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white/[0.07] px-2 font-mono text-sm text-zinc-400">{binding.rank}</span><div className="min-w-0"><h3 className="truncate font-semibold text-white">{binding.rankName}</h3><p className="mt-0.5 text-xs text-zinc-500">Roblox rank · {binding.enabled === false ? 'Disabled' : 'Enabled'}</p></div></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => setModalBind(binding)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white" aria-label={`Edit ${binding.rankName}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => deleteRankBind(binding.rankId)} className="rounded-lg p-2 text-zinc-400 hover:bg-rose-400/10 hover:text-rose-200" aria-label={`Delete ${binding.rankName}`}><Trash2 className="h-4 w-4" /></button></div></div>
                <div className="mt-4 flex flex-wrap gap-2">{(binding.roleIds || (binding.roleId ? [binding.roleId] : [])).map((id) => <span key={id} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-300">@{roleById.get(id)?.name || id}</span>)}</div>
                {binding.nicknameTemplate && <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">Nickname: <span className="text-zinc-300">{binding.nicknameTemplate}</span></div>}
              </motion.article>)}</div> : <div className="flex min-h-[340px] flex-col items-center justify-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.07] text-zinc-400"><Crown className="h-8 w-8" /></span><h2 className="mt-5 text-lg font-semibold text-zinc-200">{search ? 'No matching role binds' : COPY.emptyTitle}</h2><p className="mt-2 text-sm text-zinc-500">{COPY.emptyText}</p>{!search && <button type="button" onClick={() => setModalBind(null)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/[0.08] px-5 py-3 text-sm font-semibold text-fuchsia-300 hover:bg-fuchsia-400/[0.13]"><Plus className="h-4 w-4" />{COPY.createRole}</button>}</div>}
            </>
          ) : activeType === 'team' ? (
            <div><div className="mb-5"><h2 className="text-lg font-semibold text-white">Team Binds</h2><p className="mt-1 text-sm text-zinc-500">Map each Honolua department to a Discord role.</p></div><div className="divide-y divide-white/[0.08]">{departments.filter((department) => department.name.toLowerCase().includes(search.toLowerCase())).map((department) => <div key={department.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_320px] sm:items-center"><span className="font-medium text-zinc-200">{department.name}</span><select value={departmentBindings.find((row) => row.departmentId === department.id)?.roleId || ''} onChange={(event) => updateDepartment(department, event.target.value)} disabled={saving} className="h-11 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 text-sm text-zinc-200 outline-none focus:border-fuchsia-400/40"><option value="">No Discord role</option>{roles.map((role) => <option key={role.id} value={role.id}>@{role.name}</option>)}</select></div>)}{!departments.length && <div className="py-12 text-center text-sm text-zinc-500">Create departments on the Honolua Departments page first.</div>}</div></div>
          ) : <div className="flex min-h-[340px] flex-col items-center justify-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.07] text-zinc-500">{ActiveTypeIcon && <ActiveTypeIcon className="h-8 w-8" />}</span><h2 className="mt-5 text-lg font-semibold text-zinc-200">{activeTypeData?.label}</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">This bind source is not connected to Honolua yet. Role Binds and Team Binds are ready now.</p></div>}
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500"><span>Roblox group: <a className="text-zinc-300 underline decoration-zinc-700 underline-offset-4" href={`https://www.roblox.com/communities/${groupId}`} target="_blank" rel="noreferrer">{groupId || 'Loading…'}</a></span><span className="flex items-center gap-2">{saved && <><Check className="h-3.5 w-3.5 text-emerald-300" /> Saved</>}<button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-white/5 hover:text-zinc-200"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></span></div>
      </div>

      {modalBind !== undefined && <RoleBindModal key={modalBind?.rankId || 'new'} groupRoles={groupRoles} discordRoles={roles} initialBind={modalBind} onClose={() => setModalBind(undefined)} onSave={saveRoleBinds} />}
    </main>
  );
}
