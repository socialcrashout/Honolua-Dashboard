'use client';

import { useEffect, useState } from 'react';
import { Layers, X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Lets staff build the department -> ordered role hierarchy that
 * /ranking promote, demote and changerank read from. Roles are picked
 * from your live Discord role list (reuses the same
 * /api/guilds/[guildId]/roles endpoint your TriggerEditor already
 * uses) so there's no manual role-ID copy/pasting.
 *
 * Order matters: index 0 = lowest rank, last = highest. That's what
 * "up"/"down" reorder inside a department.
 */
export default function HierarchyModal({ guildId, open, onClose, onSaved }) {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch(`/api/guilds/${guildId}/roles`).then((r) => r.json()).catch(() => ({ roles: [] })),
      fetch(`/api/ranking/hierarchy?guildId=${guildId}`).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Could not load the hierarchy.'); return data; }).catch((loadError) => { setError(loadError.message || 'Could not load the hierarchy.'); return { departments: [] }; }),
    ])
      .then(([rolesRes, hierarchyRes]) => {
        setRoles(rolesRes.roles ?? rolesRes ?? []);
        setDepartments(hierarchyRes.departments?.length ? hierarchyRes.departments : [{ name: '', emoji: '🌺', roles: [] }]);
      })
      .finally(() => setLoading(false));
  }, [open, guildId]);

  if (!open) return null;

  function updateDept(i, patch) {
    setDepartments((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function addDept() {
    setDepartments((prev) => [...prev, { name: '', emoji: '🌺', roles: [] }]);
  }

  function removeDept(i) {
    setDepartments((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRoleToDept(i, roleId) {
    if (!roleId) return;
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setDepartments((prev) =>
      prev.map((d, idx) =>
        idx === i
          ? { ...d, roles: d.roles.some((r) => r.roleId === roleId) ? d.roles : [...d.roles, { roleId, name: role.name }] }
          : d,
      ),
    );
  }

  function removeRole(i, roleId) {
    setDepartments((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, roles: d.roles.filter((r) => r.roleId !== roleId) } : d)),
    );
  }

  function moveRole(i, roleIndex, dir) {
    setDepartments((prev) =>
      prev.map((d, idx) => {
        if (idx !== i) return d;
        const roles = [...d.roles];
        const swapWith = roleIndex + dir;
        if (swapWith < 0 || swapWith >= roles.length) return d;
        [roles[roleIndex], roles[swapWith]] = [roles[swapWith], roles[roleIndex]];
        return { ...d, roles };
      }),
    );
  }

  async function save() {
    setSaving(true);
    try {
      const clean = departments.filter((d) => d.name.trim());
      const response = await fetch('/api/ranking/hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, departments: clean }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save the hierarchy.');
      onSaved?.(clean);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Could not save the hierarchy.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-700" />
            <h2 className="text-lg font-semibold text-slate-900">Manage Rank Hierarchy</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-stone-500">
          Build each department as an ordered list of roles, lowest rank first. Promote/demote move members one step
          up or down this list.
        </p>

        {loading ? (
          <div className="py-10 text-center text-sm text-stone-400">Loading roles...</div>
        ) : (
          <div className="space-y-5">
            {departments.map((dept, i) => (
              <div key={i} className="rounded-xl border border-orange-100 bg-orange-50/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    value={dept.emoji}
                    onChange={(e) => updateDept(i, { emoji: e.target.value })}
                    className="w-12 rounded-lg border border-orange-100 bg-white px-2 py-2 text-center text-sm text-slate-800 outline-none focus:border-orange-300"
                  />
                  <input
                    value={dept.name}
                    onChange={(e) => updateDept(i, { name: e.target.value })}
                    placeholder="Department name (e.g. Restaurant Staff)"
                    className="flex-1 rounded-lg border border-orange-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-300"
                  />
                  <button onClick={() => removeDept(i)} aria-label="Remove department" className="text-stone-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-2 space-y-1.5">
                  {dept.roles.map((role, ri) => (
                    <div
                      key={role.roleId}
                      className="flex items-center justify-between rounded-lg border border-orange-100 bg-white px-3 py-1.5"
                    >
                      <span className="text-xs text-stone-400">#{ri + 1}</span>
                      <span className="flex-1 px-2 text-sm text-slate-800">{role.name}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveRole(i, ri, -1)} disabled={ri === 0} aria-label="Move role up" className="text-stone-400 hover:text-orange-700 disabled:opacity-20">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveRole(i, ri, 1)}
                          disabled={ri === dept.roles.length - 1}
                          aria-label="Move role down"
                          className="text-stone-400 hover:text-orange-700 disabled:opacity-20"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeRole(i, role.roleId)} aria-label={`Remove ${role.name}`} className="ml-1 text-stone-400 hover:text-rose-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!dept.roles.length && <div className="py-2 text-center text-xs text-stone-400">No roles yet — add one below</div>}
                </div>

                <select
                  onChange={(e) => {
                    addRoleToDept(i, e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-full rounded-lg border border-dashed border-orange-200 bg-white px-3 py-2 text-sm text-stone-600 outline-none focus:border-orange-300"
                >
                  <option value="">
                    + Add a role to this department
                  </option>
                  {roles
                    .filter((r) => !dept.roles.some((dr) => dr.roleId === r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}

            <button
              onClick={addDept}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-200 py-3 text-sm font-medium text-stone-600 hover:border-orange-400 hover:text-orange-800"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          </div>
        )}

        {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Hierarchy'}
          </button>
        </div>
      </div>
    </div>
  );
}
