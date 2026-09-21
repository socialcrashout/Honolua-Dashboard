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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/guilds/${guildId}/roles`).then((r) => r.json()).catch(() => ({ roles: [] })),
      fetch(`/api/ranking/hierarchy?guildId=${guildId}`).then((r) => r.json()).catch(() => ({ departments: [] })),
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
      await fetch('/api/ranking/hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, departments: clean }),
      });
      onSaved?.(clean);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Manage Rank Hierarchy</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-white/60">
          Build each department as an ordered list of roles, lowest rank first. Promote/demote move members one step
          up or down this list.
        </p>

        {loading ? (
          <div className="py-10 text-center text-sm text-white/40">Loading roles...</div>
        ) : (
          <div className="space-y-5">
            {departments.map((dept, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    value={dept.emoji}
                    onChange={(e) => updateDept(i, { emoji: e.target.value })}
                    className="w-12 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-center text-sm text-white outline-none focus:border-orange-400/50"
                  />
                  <input
                    value={dept.name}
                    onChange={(e) => updateDept(i, { name: e.target.value })}
                    placeholder="Department name (e.g. Restaurant Staff)"
                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-orange-400/50"
                  />
                  <button onClick={() => removeDept(i)} className="text-white/30 hover:text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-2 space-y-1.5">
                  {dept.roles.map((role, ri) => (
                    <div
                      key={role.roleId}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-1.5"
                    >
                      <span className="text-xs text-white/40">#{ri + 1}</span>
                      <span className="flex-1 px-2 text-sm text-white">{role.name}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveRole(i, ri, -1)} disabled={ri === 0} className="text-white/30 hover:text-orange-300 disabled:opacity-20">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveRole(i, ri, 1)}
                          disabled={ri === dept.roles.length - 1}
                          className="text-white/30 hover:text-orange-300 disabled:opacity-20"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeRole(i, role.roleId)} className="ml-1 text-white/30 hover:text-rose-400">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!dept.roles.length && <div className="py-2 text-center text-xs text-white/30">No roles yet - add one below</div>}
                </div>

                <select
                  onChange={(e) => {
                    addRoleToDept(i, e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-full rounded-lg border border-dashed border-white/15 bg-transparent px-3 py-2 text-sm text-white/60 outline-none focus:border-orange-400/50"
                >
                  <option value="" className="bg-neutral-900">
                    + Add a role to this department
                  </option>
                  {roles
                    .filter((r) => !dept.roles.some((dr) => dr.roleId === r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id} className="bg-neutral-900">
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}

            <button
              onClick={addDept}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-white/60 hover:border-orange-400/40 hover:text-orange-300"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.05]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Hierarchy'}
          </button>
        </div>
      </div>
    </div>
  );
}