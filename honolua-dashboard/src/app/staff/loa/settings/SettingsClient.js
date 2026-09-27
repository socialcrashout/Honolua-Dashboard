'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronRight, CircleHelp, Clock3, Plus, Save, Settings2, ShieldCheck, Sparkles, X } from 'lucide-react';

const BUILT_IN_REASONS = [
    { id: 'vacation', label: 'Vacation' }, { id: 'school', label: 'School' },
    { id: 'exams', label: 'Exams' }, { id: 'hospital', label: 'Hospital or medical' },
    { id: 'family', label: 'Family' }, { id: 'work', label: 'Work' },
    { id: 'break', label: 'Taking a break' }, { id: 'other', label: 'Other' },
];

const NAV = [
    { id: 'requests', label: 'Request rules', detail: 'Availability and length', icon: Settings2 },
    { id: 'discord-role', label: 'Discord role', detail: 'Role during approved leave', icon: ShieldCheck },
    { id: 'reasons', label: 'Reason picker', detail: 'What staff can choose', icon: CalendarDays },
];

export default function LeaveSettingsClient({ initialSettings, guildId }) {
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [reasonName, setReasonName] = useState('');
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(Boolean(guildId));
    const [rolesError, setRolesError] = useState('');
    const [activeSection, setActiveSection] = useState('requests');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (!guildId) return;
        let cancelled = false;
        fetch(`/api/guilds/${guildId}/roles`, { cache: 'no-store' })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.ok) throw new Error(data.error || 'Could not load Discord roles.');
                if (!cancelled) setRoles(data.roles || []);
            })
            .catch((error) => { if (!cancelled) setRolesError(error.message || 'Could not load Discord roles.'); })
            .finally(() => { if (!cancelled) setRolesLoading(false); });
        return () => { cancelled = true; };
    }, [guildId]);

    function update(key, value) {
        setSettings((current) => ({ ...current, [key]: value }));
        setFeedback('');
    }

    function addReason(event) {
        event.preventDefault();
        const label = reasonName.trim();
        if (!label) return;
        if (settings.customReasons.length >= 8) {
            setFeedback('You can add up to 8 custom reasons.');
            return;
        }
        const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'custom';
        let id = base;
        let suffix = 2;
        while (BUILT_IN_REASONS.some((item) => item.id === id) || settings.customReasons.some((item) => item.id === id)) {
            id = `${base}-${suffix++}`;
        }
        update('customReasons', [...settings.customReasons, { id, label: label.slice(0, 40) }]);
        setReasonName('');
    }

    async function save() {
        setSaving(true);
        setFeedback('');
        try {
            const response = await fetch('/api/loa-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Could not save leave settings.');
            setSettings(data.settings);
            setFeedback('Your leave settings are saved.');
            router.refresh();
        } catch (error) {
            setFeedback(error.message || 'Could not save leave settings.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#fffaf2] px-4 py-7 text-[#30291f] sm:px-7 lg:px-10">
            <div className="mx-auto max-w-6xl">
                <header className="relative mb-7 overflow-hidden rounded-[28px] border border-orange-200/80 bg-white px-6 py-7 shadow-[0_14px_42px_rgba(178,103,38,0.08)] sm:px-8 sm:py-9">
                    <div aria-hidden className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />
                    <div className="relative flex flex-wrap items-end justify-between gap-5">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-700"><CalendarDays className="h-5 w-5" /></span>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Honolua · People operations</p>
                                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Leave settings</h1>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Set the ground rules for time away. Requests stay in Manage Leaves for review.</p>
                            </div>
                        </div>
                        <Link href="/staff/loa" className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-[#fffaf2] px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-orange-400 hover:bg-orange-50">Manage Leaves <ChevronRight className="h-4 w-4" /></Link>
                    </div>
                </header>

                <div className="grid items-start gap-6 lg:grid-cols-[245px_minmax(0,1fr)]">
                    <aside className="rounded-2xl border border-orange-200/80 bg-white p-3 shadow-sm lg:sticky lg:top-6">
                        <div className="px-3 pb-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Settings menu</div>
                        <nav aria-label="Leave settings sections" className="flex gap-2 overflow-x-auto lg:flex-col">
                            {NAV.map(({ id, label, detail, icon: Icon }) => (
                                <button key={id} type="button" onClick={() => { setActiveSection(id); document.getElementById(`loa-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:w-full ${activeSection === id ? 'bg-orange-100/80 text-orange-900 ring-1 ring-orange-200' : 'text-stone-600 hover:bg-orange-50'}`}>
                                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${activeSection === id ? 'bg-white text-orange-700 shadow-sm' : 'bg-stone-50 text-stone-500'}`}><Icon className="h-4 w-4" /></span>
                                    <span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 hidden text-xs text-stone-500 lg:block">{detail}</span></span>
                                </button>
                            ))}
                        </nav>
                        <div className="mt-4 hidden rounded-xl bg-[#fff8eb] p-3 text-xs leading-5 text-stone-600 lg:block"><CircleHelp className="mb-2 h-4 w-4 text-orange-600" />Changes apply to new requests. Existing leave records keep the reason they were submitted with.</div>
                    </aside>

                    <div className="min-w-0 space-y-5">
                        <section id="loa-requests" onMouseEnter={() => setActiveSection('requests')} className="scroll-mt-6 overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-[0_8px_28px_rgba(120,78,35,0.055)]">
                            <div className="flex items-start gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50/80 to-white px-5 py-5 sm:px-7">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 ring-1 ring-orange-200"><Settings2 className="h-4 w-4" /></span>
                                <div><h2 className="font-semibold">Request rules</h2><p className="mt-1 text-sm text-stone-500">Control when requests can come in and how long they may last.</p></div>
                            </div>
                            <div className="divide-y divide-orange-100/80">
                                <SettingRow title="Accept leave requests" description="When paused, staff can still see their leave history, but cannot submit a new request.">
                                    <Switch checked={settings.acceptingRequests} onChange={(value) => update('acceptingRequests', value)} label="Accept leave requests" />
                                </SettingRow>
                                <SettingRow title="Request length" description="Set the shortest and longest request people can submit.">
                                    <div className="flex items-center gap-2.5">
                                        <NumberInput label="Minimum days" value={settings.minDays} onChange={(value) => update('minDays', value)} />
                                        <span className="text-xs text-stone-400">to</span>
                                        <NumberInput label="Maximum days" value={settings.maxDays} onChange={(value) => update('maxDays', value)} />
                                        <span className="text-xs text-stone-500">days</span>
                                    </div>
                                </SettingRow>
                            </div>
                            <div className="flex items-start gap-2.5 bg-[#fffaf2] px-5 py-4 text-xs leading-5 text-stone-500 sm:px-7"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />The server validates these limits when each request is submitted.</div>
                        </section>

                        <section id="loa-discord-role" onMouseEnter={() => setActiveSection('discord-role')} className="scroll-mt-6 overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-[0_8px_28px_rgba(120,78,35,0.055)]">
                            <div className="flex items-start gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50/80 to-white px-5 py-5 sm:px-7">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 ring-1 ring-orange-200"><ShieldCheck className="h-4 w-4" /></span>
                                <div><h2 className="font-semibold">Discord leave role</h2><p className="mt-1 text-sm text-stone-500">The bot grants this role when approved leave begins and removes it when leave ends.</p></div>
                            </div>
                            <SettingRow title="Role during leave" description="The role is added only after approval and at the selected start time.">
                                <select aria-label="Discord role during leave" value={settings.discordRoleId || ''} onChange={(event) => update('discordRoleId', event.target.value)} disabled={rolesLoading || Boolean(rolesError)} className="min-w-52 rounded-xl border border-orange-200 bg-[#fffaf2] px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60">
                                    <option value="">No LOA role</option>
                                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                                    {settings.discordRoleId && !roles.some((role) => role.id === settings.discordRoleId) && <option value={settings.discordRoleId}>Saved role ({settings.discordRoleId})</option>}
                                </select>
                            </SettingRow>
                            <div className="flex items-start gap-2.5 bg-[#fffaf2] px-5 py-4 text-xs leading-5 text-stone-500 sm:px-7"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />The bot checks every 30 seconds. It needs Manage Roles, and this role must be below the bot’s highest role. It removes only a role it added for that leave.</div>
                            {rolesError && <p className="px-7 pb-4 text-xs text-orange-800">{rolesError}</p>}
                            {!guildId && <p className="px-7 pb-4 text-xs text-orange-800">Configure the Discord guild ID to load roles.</p>}
                        </section>

                        <section id="loa-reasons" onMouseEnter={() => setActiveSection('reasons')} className="scroll-mt-6 overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-[0_8px_28px_rgba(120,78,35,0.055)]">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50/80 to-white px-5 py-5 sm:px-7">
                                <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 ring-1 ring-orange-200"><Sparkles className="h-4 w-4" /></span><div><h2 className="font-semibold">Reason picker</h2><p className="mt-1 text-sm text-stone-500">Add Honolua-specific reasons alongside the built-in choices.</p></div></div>
                                <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-800">{settings.customReasons.length} / 8 added</span>
                            </div>
                            <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">Built in</p>
                                    <div className="flex flex-wrap gap-2">{BUILT_IN_REASONS.map((reason) => <span key={reason.id} className="rounded-full border border-stone-200 bg-[#fffdf9] px-3 py-1.5 text-xs text-stone-600">{reason.label}</span>)}</div>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">Your reasons</p>
                                    {settings.customReasons.length ? <div className="space-y-2">{settings.customReasons.map((reason) => <div key={reason.id} className="flex items-center justify-between rounded-xl border border-orange-100 bg-[#fffaf2] px-3.5 py-3"><span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-stone-700"><span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />{reason.label}</span><button type="button" aria-label={`Remove ${reason.label}`} onClick={() => update('customReasons', settings.customReasons.filter((item) => item.id !== reason.id))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-orange-100 hover:text-orange-800"><X className="h-4 w-4" /></button></div>)}</div> : <div className="rounded-xl border border-dashed border-orange-200 bg-[#fffaf2] px-4 py-5 text-sm text-stone-500">No custom reasons yet. Add one for a reason unique to your team.</div>}
                                </div>
                                <form onSubmit={addReason} className="flex flex-col gap-2 sm:flex-row">
                                    <input value={reasonName} onChange={(event) => setReasonName(event.target.value)} maxLength={40} placeholder="Name a custom reason" aria-label="Custom leave reason" className="min-w-0 flex-1 rounded-xl border border-orange-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                                    <button type="submit" disabled={!reasonName.trim() || settings.customReasons.length >= 8} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" />Add reason</button>
                                </form>
                            </div>
                            <div className="border-t border-orange-100 bg-[#fffaf2] px-5 py-4 text-xs leading-5 text-stone-500 sm:px-7">Removing a reason only removes it from the request form. Leave already filed under it keeps its saved name.</div>
                        </section>

                        <footer className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-white/95 p-3 shadow-[0_12px_32px_rgba(120,78,35,0.12)] backdrop-blur">
                            <p className={`px-2 text-sm ${feedback.includes('saved') ? 'text-emerald-700' : 'text-stone-500'}`} aria-live="polite">{feedback || 'Unsaved changes apply after you save.'}</p>
                            <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save settings'}</button>
                        </footer>
                    </div>
                </div>
            </div>
        </main>
    );
}

function SettingRow({ title, description, children }) {
    return <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="max-w-xl"><h3 className="text-sm font-semibold text-stone-800">{title}</h3><p className="mt-1 text-sm leading-5 text-stone-500">{description}</p></div><div className="sm:shrink-0">{children}</div></div>;
}

function Switch({ checked, onChange, label }) {
    return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${checked ? 'bg-orange-600' : 'bg-stone-300'}`}><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} /></button>;
}

function NumberInput({ label, value, onChange }) {
    return <input type="number" min="1" max="365" value={value} aria-label={label} onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))} className="w-[76px] rounded-xl border border-orange-200 bg-[#fffaf2] px-3 py-2.5 text-center text-sm font-semibold outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />;
}
