"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Zap,
  MessageSquare,
  UserPlus,
  ShieldAlert,
  Clock,
  Star,
  Megaphone,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";

const BRAND_GRADIENT = "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)";

// Category -> icon + pastel chip color, pulled from the brand palette so
// every category reads as "this product" rather than a generic rainbow.
const CATEGORY_META = {
  Applications: { icon: MessageSquare, color: "#F4B942" },
  Members: { icon: UserPlus, color: "#F472B6" },
  Moderation: { icon: ShieldAlert, color: "#E6736F" },
  System: { icon: Clock, color: "#E8A33D" },
  Economy: { icon: Star, color: "#34C79A" },
  Events: { icon: Megaphone, color: "#A78BFA" },
  General: { icon: Zap, color: "#F4B942" },
};

function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.General;
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? undefined : "rgba(20,20,20,0.12)" }}
    >
      {checked && (
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: BRAND_GRADIENT }}
        />
      )}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

function RowMenu({ trigger, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-lava/40 transition hover:bg-lava/5 hover:text-reef-navy"
        aria-label="More options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-lava/10 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <Link
              href={`/staff/triggers/${trigger._id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-reef-navy/80 hover:bg-lava/5"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <button
              onClick={() => onDuplicate(trigger)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-reef-navy/80 hover:bg-lava/5"
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </button>
            <button
              onClick={() => onDelete(trigger)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#C24B4B] hover:bg-[#E6736F]/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TriggerRow({ trigger, onToggle, onDuplicate, onDelete }) {
  const meta = categoryMeta(trigger.category);
  const Icon = meta.icon;

  return (
    <div className="group relative flex items-center gap-4 py-3.5 pl-5 pr-4 transition hover:bg-lava/[0.02]">
      <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background: meta.color }} />

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${meta.color}1F`, color: meta.color }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>

      <Link href={`/staff/triggers/${trigger._id}`} className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-reef-navy">
          {trigger.description ? trigger.description.split(".")[0] : `!${trigger.name}`}
        </div>
        <div className="truncate text-sm text-lava/50">
          {trigger.description || `Members type !${trigger.name} to invoke this.`}
        </div>
      </Link>

      <span
        className="hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block"
        style={{ background: `${meta.color}1F`, color: meta.color }}
      >
        {trigger.category || "General"}
      </span>

      <Switch checked={trigger.enabled} onChange={(v) => onToggle(trigger, v)} />

      <RowMenu trigger={trigger} onDuplicate={onDuplicate} onDelete={onDelete} />
    </div>
  );
}

export default function TriggersPage() {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Triggers");
  const [filterOpen, setFilterOpen] = useState(false);

  const categories = ["All Triggers", ...Object.keys(CATEGORY_META)];

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category !== "All Triggers") params.set("category", category);
      const res = await fetch(`/api/triggers?${params.toString()}`);
      const j = await res.json();
      if (j.ok) setTriggers(j.triggers);
    } catch {
      // fail silently, empty state below covers it
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200); // debounce search typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  async function handleToggle(trigger, enabled) {
    setTriggers((prev) =>
      prev.map((t) => (t._id === trigger._id ? { ...t, enabled } : t))
    );
    try {
      await fetch(`/api/triggers/${trigger._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
    } catch {
      // revert on failure
      setTriggers((prev) =>
        prev.map((t) => (t._id === trigger._id ? { ...t, enabled: !enabled } : t))
      );
    }
  }

  async function handleDuplicate(trigger) {
    const copy = {
      ...trigger,
      name: `${trigger.name}-copy`,
      description: trigger.description ? `${trigger.description} (copy)` : "",
    };
    delete copy._id;
    delete copy.createdAt;
    delete copy.updatedAt;
    const res = await fetch("/api/triggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copy),
    });
    if (res.ok) load();
  }

  async function handleDelete(trigger) {
    if (!confirm(`Delete "!${trigger.name}"? This can't be undone.`)) return;
    setTriggers((prev) => prev.filter((t) => t._id !== trigger._id));
    await fetch(`/api/triggers/${trigger._id}`, { method: "DELETE" });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lava/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search triggers..."
            className="w-full rounded-full border border-lava/10 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-reef-navy placeholder:text-lava/35 outline-none focus:border-lava/25"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            onBlur={() => setTimeout(() => setFilterOpen(false), 120)}
            className="flex items-center gap-2 rounded-full border border-lava/10 bg-white/70 px-4 py-2.5 text-sm text-reef-navy/80"
          >
            {category}
            <ChevronDown className="h-3.5 w-3.5 text-lava/40" />
          </button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-lava/10 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
              >
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-reef-navy/80 hover:bg-lava/5"
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link
          href="/staff/triggers/new"
          className="flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(230,115,111,0.35)] transition-transform hover:scale-[1.02]"
          style={{ background: BRAND_GRADIENT }}
        >
          <Plus className="h-4 w-4" /> Create Trigger
        </Link>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-lava/10 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {loading && triggers.length === 0 ? (
          <div className="py-16 text-center text-sm text-lava/40">Loading triggers…</div>
        ) : triggers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-reef-navy/70">No triggers yet</p>
            <p className="mt-1 text-sm text-lava/45">
              Create one to have the bot respond automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-lava/8">
            {triggers.map((trigger, i) => (
              <motion.div
                key={trigger._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <TriggerRow
                  trigger={trigger}
                  onToggle={handleToggle}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}