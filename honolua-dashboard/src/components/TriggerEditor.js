"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Settings,
  MessageSquare,
  Wand2,
  Eye,
  Save,
  RotateCcw,
  Trash2,
  Plus,
  X,
  Hash,
  Volume2,
  Megaphone,
  MessagesSquare,
  Search,
  Check,
  ChevronDown,
  ShieldCheck,
  Minus,
  Link2,
  Palette,
} from "lucide-react";

const BRAND_GRADIENT = "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)";

const TOKENS = [
  "{user}", "{username}", "{avatar}", "{server}", "{channel}", "{everyone}",
  "{here}", "{&rolename}", "{#channel}", "{date}", "{time}", "{datetime}",
  "{timestamp}", "{year}", "{month}", "{day}", "{args1}", "{args2}", "{args3}",
];

const CATEGORIES = ["Applications", "Members", "Moderation", "System", "Economy", "Events", "General"];

// Temporary fallback so the pickers work without extra route/context
// wiring. Once this page has a real way to know the active server
// (route param, context, etc.), pass it in as the `guildId` prop
// instead and this constant stops being used.
const FALLBACK_GUILD_ID = "1516264096209834065";

const TABS = [
  { key: "basic", label: "Basic", icon: Settings },
  { key: "content", label: "Content", icon: MessageSquare },
  { key: "advanced", label: "Advanced", icon: Zap },
  { key: "flows", label: "Flows", icon: Wand2 },
  { key: "preview", label: "Preview", icon: Eye },
];

// Every action available to chain in the Flows tab. Nothing here is
// gated behind a paid tier — the whole list is available.
const FLOW_ACTIONS = [
  { type: "DELETE_PREVIOUS_BOT_MESSAGE", label: "Delete previous bot message", color: "#E6736F" },
  { type: "MOVE_CHANNEL_TO_CATEGORY", label: "Move channel to category", color: "#E8A33D", needsConfig: "categoryId" },
  { type: "SEND_DM_TO_INVOKER", label: "Send DM to invoker", color: "#E8A33D" },
  { type: "SEND_DM_TO_MENTIONED_USER", label: "Send DM to mentioned user", color: "#34C79A" },
  { type: "PIN_BOT_RESPONSE", label: "Pin bot response", color: "#5AA9E6" },
  { type: "ADD_REMOVE_ROLES", label: "Add / Remove roles", color: "#5AA9E6", needsConfig: "roles" },
  { type: "CREATE_THREAD_ON_RESPONSE", label: "Create thread on response", color: "#5AA9E6" },
  { type: "CREATE_THREAD_IN_CHANNEL", label: "Create thread in channel", color: "#34C79A" },
  { type: "SEND_TO_MENTIONED_CHANNEL", label: "Send to mentioned channel", color: "#34C79A" },
  { type: "RENAME_CHANNEL", label: "Rename channel", color: "#F472B6", needsConfig: "name" },
];

// Discord channel type ids we treat as "postable" (things a message can go to).
const TEXTLIKE_CHANNEL_TYPES = new Set([0, 5, 15]); // GUILD_TEXT, GUILD_ANNOUNCEMENT, GUILD_FORUM

// Preset accent colors for the Components V2 container — mirrors the
// swatches Discord itself offers for container accent color, plus "none".
const ACCENT_PRESETS = [
  { label: "None", value: null },
  { label: "Brand", value: "#E6736F" },
  { label: "Blurple", value: "#5865F2" },
  { label: "Green", value: "#34C79A" },
  { label: "Yellow", value: "#F4B942" },
  { label: "Red", value: "#ED4245" },
  { label: "Sky", value: "#5AA9E6" },
];

function flowMeta(type) {
  return FLOW_ACTIONS.find((f) => f.type === type);
}

function channelIcon(type) {
  if (type === 2) return Volume2;
  if (type === 5) return Megaphone;
  if (type === 15) return MessagesSquare;
  return Hash;
}

function roleColorHex(color) {
  if (!color) return "#99A1AF";
  if (typeof color === "string") return color.startsWith("#") ? color : `#${color}`;
  return `#${color.toString(16).padStart(6, "0")}`;
}

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_TRIGGER = {
  name: "",
  enabled: true,
  category: "General",
  description: "",
  message: "",
  postToChannel: "current",
  allowedRoles: ["everyone"],
  container: {
    enabled: false,
    accentColor: null,
    headerText: "",
    separatorAfterHeader: false,
    bodyText: "",
    separatorBeforeImage: false,
    imageUrl: "",
    separatorBeforeFooter: false,
    footerText: "",
    showTimestamp: false,
    linkButtons: [],
  },
  advanced: {
    cooldownSeconds: 0,
    deleteResponseAfterSeconds: 0,
    deleteInvokingMessage: false,
  },
  flows: [],
};

/* ------------------------------------------------------------------ */
/* Guild data (channels + roles)                                       */
/*                                                                      */
/* Pass `guildId` in explicitly as a prop from whatever page renders   */
/* <TriggerEditor /> — that's the most reliable way to wire this up    */
/* since it doesn't depend on your route shape. If you don't pass one, */
/* this falls back to a `guildId` or `serverId` route param, in case   */
/* your Next.js route already has one.                                */
/* ------------------------------------------------------------------ */

function useGuildData(guildId) {
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState(guildId ? "loading" : "no-guild");

  useEffect(() => {
    if (!guildId) {
      setStatus("no-guild");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const [chRes, roleRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/roles`),
        ]);
        const chJson = await chRes.json();
        const roleJson = await roleRes.json();
        if (cancelled) return;
        setChannels(chJson.ok ? chJson.channels || [] : []);
        setRoles(roleJson.ok ? roleJson.roles || [] : []);
        setStatus("ready");
      } catch (err) {
        console.error("Failed to load guild channels/roles", err);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  return { channels, roles, status };
}

/* ------------------------------------------------------------------ */
/* Small primitives                                                    */
/* ------------------------------------------------------------------ */

function useClickOutside(onOutside) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

function Switch({ checked, onChange, size = "md" }) {
  const dims = size === "sm" ? { w: 36, h: 20, knob: 16 } : { w: 44, h: 24, knob: 20 };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 rounded-full transition-colors duration-200"
      style={{
        width: dims.w,
        height: dims.h,
        background: checked ? undefined : "rgba(20,20,20,0.12)",
      }}
    >
      {checked && (
        <span className="absolute inset-0 rounded-full" style={{ background: BRAND_GRADIENT }} />
      )}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-0.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        style={{
          width: dims.knob,
          height: dims.knob,
          left: checked ? dims.w - dims.knob - 2 : 2,
        }}
      />
    </button>
  );
}

function TokenChips({ onInsert }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {TOKENS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onInsert(t)}
          className="rounded-md border border-lava/10 bg-lava/[0.04] px-2 py-1 font-mono text-[11px] text-reef-navy/60 transition hover:border-lava/20 hover:bg-lava/[0.08]"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// Cards carry a left accent bar instead of an icon-in-a-circle header —
// a quieter way of marking a section than the usual dashboard-kit look.
function Card({ title, icon: Icon, accent = "rgba(230,115,111,0.4)", right, children }) {
  return (
    // No overflow-hidden here on purpose — the role/channel picker
    // dropdowns are absolutely-positioned children that need to be able
    // to render outside this card's box. The accent bar is rounded on
    // its own (rounded-full), so it doesn't need a clipped parent.
    <div className="relative rounded-2xl border border-lava/10 bg-white/70 p-5 pl-6">
      <span className="absolute inset-y-4 left-0 w-[3px] rounded-full" style={{ background: accent }} />
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-lava/45" />}
            {title && <h3 className="text-[15px] font-semibold text-reef-navy">{title}</h3>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-reef-navy/80">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-lava/45">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-lava/10 bg-white px-3.5 py-2.5 text-sm text-reef-navy placeholder:text-lava/35 outline-none focus:border-lava/25";

/* ------------------------------------------------------------------ */
/* A generic searchable dropdown shell shared by the channel & role    */
/* pickers, so scrolling/positioning behaves the same for both.        */
/* ------------------------------------------------------------------ */

function PickerShell({ trigger, open, setOpen, query, setQuery, placeholder, children }) {
  const wrapRef = useClickOutside(() => setOpen(false));
  return (
    <div ref={wrapRef} className="relative">
      {trigger(() => setOpen((v) => !v))}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-lava/10 bg-white shadow-[0_16px_32px_rgba(0,0,0,0.16)]"
          >
            <div className="flex items-center gap-2 border-b border-lava/10 px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-lava/35" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full text-sm outline-none placeholder:text-lava/35"
              />
            </div>
            {/* overscroll-contain keeps scrolling a long list from also
                scrolling the page behind it */}
            <div className="max-h-64 overflow-y-auto overscroll-contain py-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Channel picker — single select, grouped by category, searchable    */
/* ------------------------------------------------------------------ */

function ChannelPicker({ channels, status, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const postable = useMemo(
    () => channels.filter((c) => TEXTLIKE_CHANNEL_TYPES.has(c.type)),
    [channels]
  );

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? postable.filter((c) => c.name.toLowerCase().includes(q)) : postable;
    const byCategory = new Map();
    for (const c of filtered) {
      const key = c.parentName || "No category";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key).push(c);
    }
    return byCategory;
  }, [postable, query]);

  const selectedChannel = value !== "current" ? channels.find((c) => c.id === value) : null;
  const SelectedIcon = selectedChannel ? channelIcon(selectedChannel.type) : Hash;

  return (
    <PickerShell
      open={open}
      setOpen={setOpen}
      query={query}
      setQuery={setQuery}
      placeholder="Search channels…"
      trigger={(toggle) => (
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-xl border border-lava/10 bg-white px-3.5 py-2.5 text-left text-sm text-reef-navy outline-none focus:border-lava/25"
        >
          <span className="flex items-center gap-2 truncate">
            <SelectedIcon className="h-3.5 w-3.5 shrink-0 text-lava/45" />
            <span className="truncate">
              {value === "current" ? "Current channel (reply in place)" : selectedChannel?.name || "Select a channel"}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-lava/35" />
        </button>
      )}
    >
      <button
        type="button"
        onClick={() => {
          onChange("current");
          setOpen(false);
        }}
        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-reef-navy/80 hover:bg-lava/[0.05]"
      >
        <MessageSquare className="h-3.5 w-3.5 text-lava/45" />
        Current channel (reply in place)
        {value === "current" && <Check className="ml-auto h-3.5 w-3.5 text-[#34C79A]" />}
      </button>

      {status === "loading" && <p className="px-3.5 py-3 text-xs text-lava/40">Loading channels…</p>}
      {status === "error" && <p className="px-3.5 py-3 text-xs text-lava/40">Couldn't load channels — try again.</p>}
      {status === "no-guild" && (
        <p className="px-3.5 py-3 text-xs text-lava/40">No server connected to this page yet.</p>
      )}
      {status === "ready" && postable.length === 0 && (
        <p className="px-3.5 py-3 text-xs text-lava/40">No text channels found.</p>
      )}

      {[...grouped.entries()].map(([category, list]) => (
        <div key={category} className="mt-1">
          <p className="px-3.5 pb-1 pt-2 text-[11px] font-medium text-lava/35">{category}</p>
          {list.map((c) => {
            const Icon = channelIcon(c.type);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-reef-navy/80 hover:bg-lava/[0.05]"
              >
                <Icon className="h-3.5 w-3.5 text-lava/45" />
                <span className="truncate">{c.name}</span>
                {value === c.id && <Check className="ml-auto h-3.5 w-3.5 text-[#34C79A]" />}
              </button>
            );
          })}
        </div>
      ))}
    </PickerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Role picker — multi-select with an "everyone" shortcut              */
/* ------------------------------------------------------------------ */

function RolePicker({ roles, status, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isEveryone = !value || value.length === 0 || value[0] === "everyone";
  const selectedRoles = isEveryone ? [] : value.map((id) => roles.find((r) => r.id === id)).filter(Boolean);

  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? roles.filter((r) => r.name.toLowerCase().includes(q)) : roles;
  }, [roles, query]);

  function toggleRole(id) {
    const current = isEveryone ? [] : value;
    const next = current.includes(id) ? current.filter((r) => r !== id) : [...current, id];
    onChange(next.length === 0 ? ["everyone"] : next);
  }

  return (
    <PickerShell
      open={open}
      setOpen={setOpen}
      query={query}
      setQuery={setQuery}
      placeholder="Search roles…"
      trigger={(toggle) => (
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-lava/10 bg-white px-3.5 py-2.5 text-left text-sm text-reef-navy outline-none focus:border-lava/25"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            {isEveryone ? (
              <span className="flex items-center gap-1.5 text-reef-navy/80">
                <ShieldCheck className="h-3.5 w-3.5 text-lava/45" /> Everyone (no restriction)
              </span>
            ) : (
              selectedRoles.map((r) => (
                <span
                  key={r.id}
                  className="flex items-center gap-1 rounded-full border border-lava/10 bg-lava/[0.04] px-2 py-0.5 text-xs text-reef-navy/80"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: roleColorHex(r.color) }} />
                  {r.name}
                </span>
              ))
            )}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-lava/35" />
        </button>
      )}
    >
      <button
        type="button"
        onClick={() => {
          onChange(["everyone"]);
          setOpen(false);
        }}
        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-reef-navy/80 hover:bg-lava/[0.05]"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-lava/45" />
        Everyone (no restriction)
        {isEveryone && <Check className="ml-auto h-3.5 w-3.5 text-[#34C79A]" />}
      </button>

      {status === "loading" && <p className="px-3.5 py-3 text-xs text-lava/40">Loading roles…</p>}
      {status === "error" && <p className="px-3.5 py-3 text-xs text-lava/40">Couldn't load roles — try again.</p>}
      {status === "no-guild" && (
        <p className="px-3.5 py-3 text-xs text-lava/40">No server connected to this page yet.</p>
      )}
      {status === "ready" && filteredRoles.length === 0 && (
        <p className="px-3.5 py-3 text-xs text-lava/40">No roles found.</p>
      )}

      {filteredRoles.map((r) => {
        const checked = !isEveryone && value.includes(r.id);
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => toggleRole(r.id)}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-reef-navy/80 hover:bg-lava/[0.05]"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: roleColorHex(r.color) }} />
            <span className="truncate">{r.name}</span>
            {checked && <Check className="ml-auto h-3.5 w-3.5 text-[#34C79A]" />}
          </button>
        );
      })}
    </PickerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Accent color swatch picker for the Components V2 container          */
/* ------------------------------------------------------------------ */

function AccentColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ACCENT_PRESETS.map((p) => {
        const selected = value === p.value;
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.value)}
            title={p.label}
            className="flex h-8 w-8 items-center justify-center rounded-full border transition"
            style={{
              background: p.value || "repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 0 / 8px 8px",
              borderColor: selected ? "#E6736F" : "rgba(20,20,20,0.1)",
              borderWidth: selected ? 2 : 1,
            }}
          >
            {selected && <Check className="h-3.5 w-3.5" style={{ color: p.value ? "white" : "#E6736F" }} />}
          </button>
        );
      })}
      <div className="flex items-center gap-1.5 rounded-full border border-lava/10 bg-white px-2 py-1">
        <input
          type="color"
          value={value || "#e6736f"}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
          title="Custom color"
        />
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="#RRGGBB"
          className="w-20 font-mono text-xs text-reef-navy/70 outline-none placeholder:text-lava/35"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main editor                                                         */
/* ------------------------------------------------------------------ */

export default function TriggerEditor({ triggerId, guildId: guildIdProp }) {
  const router = useRouter();
  const params = useParams();
  // Prefer an explicit prop from the parent page. Fall back to common
  // route-param names in case this page already sits under a
  // [guildId] or [serverId] segment.
  const guildId = guildIdProp || params?.guildId || params?.serverId || FALLBACK_GUILD_ID;
  const { channels, roles, status: guildDataStatus } = useGuildData(guildId);

  const isNew = !triggerId;

  const [initial, setInitial] = useState(DEFAULT_TRIGGER);
  const [trigger, setTrigger] = useState(DEFAULT_TRIGGER);
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const res = await fetch(`/api/triggers/${triggerId}`);
      const j = await res.json();
      if (j.ok) {
        setTrigger(j.trigger);
        setInitial(j.trigger);
      }
      setLoading(false);
    })();
  }, [triggerId, isNew]);

  const isDirty = JSON.stringify(trigger) !== JSON.stringify(initial);

  function update(patch) {
    setTrigger((prev) => ({ ...prev, ...patch }));
  }
  function updateContainer(patch) {
    setTrigger((prev) => ({ ...prev, container: { ...prev.container, ...patch } }));
  }
  function updateAdvanced(patch) {
    setTrigger((prev) => ({ ...prev, advanced: { ...prev.advanced, ...patch } }));
  }

  function insertToken(field, token) {
    setTrigger((prev) => ({ ...prev, [field]: `${prev[field] || ""}${token}` }));
  }
  function insertContainerToken(field, token) {
    setTrigger((prev) => ({
      ...prev,
      container: { ...prev.container, [field]: `${prev.container[field] || ""}${token}` },
    }));
  }

  function addLinkButton() {
    setTrigger((prev) => {
      if (prev.container.linkButtons.length >= 5) return prev;
      return {
        ...prev,
        container: {
          ...prev.container,
          linkButtons: [...prev.container.linkButtons, { id: makeId(), label: "", url: "" }],
        },
      };
    });
  }
  function updateLinkButton(id, patch) {
    setTrigger((prev) => ({
      ...prev,
      container: {
        ...prev.container,
        linkButtons: prev.container.linkButtons.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      },
    }));
  }
  function removeLinkButton(id) {
    setTrigger((prev) => ({
      ...prev,
      container: {
        ...prev.container,
        linkButtons: prev.container.linkButtons.filter((b) => b.id !== id),
      },
    }));
  }

  function addFlow(type) {
    if (trigger.flows.some((f) => f.type === type)) return;
    update({ flows: [...trigger.flows, { type, config: {} }] });
  }
  function removeFlow(type) {
    update({ flows: trigger.flows.filter((f) => f.type !== type) });
  }
  function setFlowConfig(type, config) {
    update({
      flows: trigger.flows.map((f) => (f.type === type ? { ...f, config: { ...f.config, ...config } } : f)),
    });
  }

  async function handleSave() {
    if (!trigger.name.trim()) {
      setActiveTab("basic");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(isNew ? "/api/triggers" : `/api/triggers/${triggerId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trigger),
      });
      const j = await res.json();
      if (j.ok) {
        setInitial(j.trigger);
        setTrigger(j.trigger);
        if (isNew) router.push(`/staff/triggers/${j.trigger._id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setTrigger(initial);
  }

  if (loading) {
    return <div className="py-24 text-center text-sm text-lava/40">Loading trigger…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-28">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/staff/triggers")}
            className="mt-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-lava/40 transition hover:bg-lava/5 hover:text-reef-navy"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ background: BRAND_GRADIENT }}
              >
                <Zap className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold text-reef-navy">
                {isNew ? "New Trigger" : `!${trigger.name}`}
              </h1>
            </div>
            <p className="mt-1 text-sm text-lava/50">
              Create a prefix command that posts a message when used
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-lava/10 bg-white/70 px-3.5 py-2">
          <span className="text-sm text-reef-navy/70">Enabled</span>
          <Switch checked={trigger.enabled} onChange={(v) => update({ enabled: v })} size="sm" />
        </div>
      </div>

      {/* Name + category */}
      <Card accent="rgba(244,185,66,0.5)">
        <div className="grid gap-4 sm:grid-cols-[1fr,180px]">
          <Field label="Trigger name" hint={`Members type !${trigger.name || "trigger"} to invoke this`}>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lava/[0.06] font-mono text-lava/50">
                !
              </div>
              <input
                value={trigger.name}
                onChange={(e) => update({ name: e.target.value.replace(/\s+/g, "-") })}
                placeholder="commandname"
                className={inputCls}
              />
            </div>
          </Field>
          <Field label="Category">
            <select
              value={trigger.category}
              onChange={(e) => update({ category: e.target.value })}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      {/* Body: a settings rail on the left, content on the right — a fixed
          width flex layout (not an arbitrary-value CSS grid) so it holds
          up regardless of the Tailwind build config. */}
      <div className="mt-5 sm:flex sm:items-start sm:gap-5">
        <div className="mb-4 flex gap-1 overflow-x-auto sm:mb-0 sm:w-40 sm:shrink-0 sm:flex-col sm:gap-1.5 sm:overflow-visible">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors sm:w-full"
              >
                {active && (
                  <motion.div
                    layoutId="trigger-tab-highlight"
                    className="absolute inset-0 rounded-xl border border-lava/10 bg-white"
                    style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className="relative z-10 flex items-center gap-2"
                  style={{ color: active ? "#E6736F" : "rgba(20,20,20,0.45)" }}
                >
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {activeTab === "basic" && (
                <>
                  <Card title="Message Content" icon={MessageSquare}>
                    <Field label="Message">
                      <textarea
                        value={trigger.message}
                        onChange={(e) => update({ message: e.target.value })}
                        placeholder="The message the bot will send…"
                        rows={6}
                        className={`${inputCls} resize-y`}
                      />
                      <TokenChips onInsert={(t) => insertToken("message", t)} />
                    </Field>
                  </Card>

                  <Card title="Delivery" icon={Hash}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Post to channel" hint="Reply in place, or send to a specific channel">
                        <ChannelPicker
                          channels={channels}
                          status={guildDataStatus}
                          value={trigger.postToChannel}
                          onChange={(v) => update({ postToChannel: v })}
                        />
                      </Field>
                      <Field label="Allowed roles" hint="Restrict who can use this trigger">
                        <RolePicker
                          roles={roles}
                          status={guildDataStatus}
                          value={trigger.allowedRoles}
                          onChange={(v) => update({ allowedRoles: v })}
                        />
                      </Field>
                    </div>
                    {guildDataStatus === "no-guild" && (
                      <p className="mt-3 text-xs text-lava/45">
                        This page isn't connected to a server yet — pass a{" "}
                        <code className="rounded bg-lava/[0.06] px-1 py-0.5 font-mono">guildId</code> prop into{" "}
                        <code className="rounded bg-lava/[0.06] px-1 py-0.5 font-mono">TriggerEditor</code> to load its
                        channels and roles here.
                      </p>
                    )}
                  </Card>

                  <Card accent="rgba(90,169,230,0.4)">
                    <Field label="List description" hint="Shown in the trigger list — optional">
                      <input
                        value={trigger.description}
                        onChange={(e) => update({ description: e.target.value })}
                        placeholder="e.g. Sends a welcome message when someone joins"
                        className={inputCls}
                      />
                    </Field>
                  </Card>
                </>
              )}

              {activeTab === "content" && (
                <>
                  <Card accent="rgba(244,114,182,0.4)">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[15px] font-semibold text-reef-navy">
                          Send as Components V2 container
                        </h3>
                        <p className="mt-0.5 text-sm text-lava/50">
                          Styled message using Discord's newer layout components
                        </p>
                      </div>
                      <Switch
                        checked={trigger.container.enabled}
                        onChange={(v) => updateContainer({ enabled: v })}
                      />
                    </div>
                  </Card>

                  {trigger.container.enabled ? (
                    <>
                      <Card title="Accent color" icon={Palette}>
                        <AccentColorPicker
                          value={trigger.container.accentColor}
                          onChange={(v) => updateContainer({ accentColor: v })}
                        />
                        <p className="mt-2.5 text-xs text-lava/45">
                          Shows as a colored bar down the left edge of the container, like an embed color
                        </p>
                      </Card>

                      <Card title="Container" icon={Wand2}>
                        <div className="space-y-4">
                          <Field label="Header text">
                            <input
                              value={trigger.container.headerText}
                              onChange={(e) => updateContainer({ headerText: e.target.value })}
                              placeholder="Bold heading at the top of the container"
                              className={inputCls}
                            />
                          </Field>

                          <div className="flex items-center justify-between rounded-xl border border-dashed border-lava/15 px-4 py-2.5">
                            <span className="flex items-center gap-1.5 text-sm text-reef-navy/70">
                              <Minus className="h-3.5 w-3.5 text-lava/40" /> Separator after header
                            </span>
                            <Switch
                              checked={trigger.container.separatorAfterHeader}
                              onChange={(v) => updateContainer({ separatorAfterHeader: v })}
                              size="sm"
                            />
                          </div>

                          <Field label="Body text">
                            <textarea
                              value={trigger.container.bodyText}
                              onChange={(e) => updateContainer({ bodyText: e.target.value })}
                              placeholder="Main body text inside the container…"
                              rows={5}
                              className={`${inputCls} resize-y`}
                            />
                            <TokenChips onInsert={(t) => insertContainerToken("bodyText", t)} />
                          </Field>

                          <div className="flex items-center justify-between rounded-xl border border-dashed border-lava/15 px-4 py-2.5">
                            <span className="flex items-center gap-1.5 text-sm text-reef-navy/70">
                              <Minus className="h-3.5 w-3.5 text-lava/40" /> Separator before image
                            </span>
                            <Switch
                              checked={trigger.container.separatorBeforeImage}
                              onChange={(v) => updateContainer({ separatorBeforeImage: v })}
                              size="sm"
                            />
                          </div>

                          <Field label="Image URL">
                            <input
                              value={trigger.container.imageUrl}
                              onChange={(e) => updateContainer({ imageUrl: e.target.value })}
                              placeholder="https://…"
                              className={inputCls}
                            />
                          </Field>
                        </div>
                      </Card>

                      <Card title="Footer" icon={Hash}>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-xl border border-dashed border-lava/15 px-4 py-2.5">
                            <span className="flex items-center gap-1.5 text-sm text-reef-navy/70">
                              <Minus className="h-3.5 w-3.5 text-lava/40" /> Separator before footer
                            </span>
                            <Switch
                              checked={trigger.container.separatorBeforeFooter}
                              onChange={(v) => updateContainer({ separatorBeforeFooter: v })}
                              size="sm"
                            />
                          </div>
                          <Field label="Footer text">
                            <input
                              value={trigger.container.footerText}
                              onChange={(e) => updateContainer({ footerText: e.target.value })}
                              placeholder="Footer text…"
                              className={inputCls}
                            />
                          </Field>
                          <div className="flex items-center justify-between rounded-xl border border-lava/10 px-4 py-3">
                            <div>
                              <span className="block text-sm text-reef-navy/80">Show timestamp</span>
                              <span className="text-xs text-lava/45">Appends the current time to the footer</span>
                            </div>
                            <Switch
                              checked={trigger.container.showTimestamp}
                              onChange={(v) => updateContainer({ showTimestamp: v })}
                              size="sm"
                            />
                          </div>
                        </div>
                      </Card>

                      <Card
                        title="Link Buttons"
                        icon={Link2}
                        right={
                          <span className="text-xs text-lava/40">{trigger.container.linkButtons.length}/5</span>
                        }
                      >
                        {trigger.container.linkButtons.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-lava/15 py-8 text-center text-sm text-lava/40">
                            No link buttons added yet
                            <p className="mt-0.5 text-xs text-lava/35">Buttons appear below the message and open a URL when clicked</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {trigger.container.linkButtons.map((btn) => (
                              <div key={btn.id} className="flex items-center gap-2">
                                <input
                                  value={btn.label}
                                  onChange={(e) => updateLinkButton(btn.id, { label: e.target.value })}
                                  placeholder="Button label"
                                  className={`${inputCls} sm:w-40`}
                                />
                                <input
                                  value={btn.url}
                                  onChange={(e) => updateLinkButton(btn.id, { url: e.target.value })}
                                  placeholder="https://…"
                                  className={inputCls}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeLinkButton(btn.id)}
                                  className="shrink-0 text-lava/30 hover:text-[#E6736F]"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={addLinkButton}
                          disabled={trigger.container.linkButtons.length >= 5}
                          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#E6736F] disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add button
                        </button>
                      </Card>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-lava/15 bg-white/40 py-14 text-center text-sm text-lava/40">
                      Enable the container toggle above to configure its appearance
                    </div>
                  )}
                </>
              )}

              {activeTab === "advanced" && (
                <Card title="Behaviour" icon={Zap}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Cooldown (seconds)" hint="No cooldown">
                      <input
                        type="number"
                        min={0}
                        value={trigger.advanced.cooldownSeconds}
                        onChange={(e) => updateAdvanced({ cooldownSeconds: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Delete response after (seconds)" hint="Response persists">
                      <input
                        type="number"
                        min={0}
                        value={trigger.advanced.deleteResponseAfterSeconds}
                        onChange={(e) =>
                          updateAdvanced({ deleteResponseAfterSeconds: Number(e.target.value) })
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-lava/10 px-4 py-3.5">
                    <div>
                      <span className="block text-sm font-medium text-reef-navy/80">
                        Delete invoking message
                      </span>
                      <span className="text-xs text-lava/45">
                        Removes the member's command message after the bot responds
                      </span>
                    </div>
                    <Switch
                      checked={trigger.advanced.deleteInvokingMessage}
                      onChange={(v) => updateAdvanced({ deleteInvokingMessage: v })}
                    />
                  </div>
                </Card>
              )}

              {activeTab === "flows" && (
                <Card>
                  <div className="mb-5">
                    <h3 className="text-[15px] font-semibold text-reef-navy">Custom Trigger Flows</h3>
                    <p className="mt-1 max-w-md text-sm text-lava/50">
                      Chain multiple bot actions together that fire after the trigger runs.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {FLOW_ACTIONS.map((action) => {
                      const selected = trigger.flows.some((f) => f.type === action.type);
                      return (
                        <button
                          key={action.type}
                          onClick={() => (selected ? removeFlow(action.type) : addFlow(action.type))}
                          className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition"
                          style={
                            selected
                              ? { background: action.color, borderColor: action.color, color: "white" }
                              : { borderColor: `${action.color}55`, color: action.color, background: `${action.color}12` }
                          }
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>

                  {trigger.flows.length > 0 && (
                    <div className="mt-6 space-y-2 border-t border-lava/10 pt-5">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-lava/40">
                        Runs in this order
                      </p>
                      {trigger.flows.map((flow, i) => {
                        const meta = flowMeta(flow.type);
                        return (
                          <div
                            key={flow.type}
                            className="flex items-center gap-3 rounded-xl border border-lava/10 bg-white px-3.5 py-2.5"
                          >
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                              style={{ background: meta.color }}
                            >
                              {i + 1}
                            </span>
                            <span className="flex-1 text-sm text-reef-navy/80">{meta.label}</span>

                            {meta.needsConfig === "name" && (
                              <input
                                value={flow.config?.name || ""}
                                onChange={(e) => setFlowConfig(flow.type, { name: e.target.value })}
                                placeholder="new-channel-name"
                                className="w-40 rounded-lg border border-lava/10 px-2.5 py-1.5 text-xs"
                              />
                            )}
                            {meta.needsConfig === "categoryId" && (
                              <input
                                value={flow.config?.categoryId || ""}
                                onChange={(e) => setFlowConfig(flow.type, { categoryId: e.target.value })}
                                placeholder="Category ID"
                                className="w-40 rounded-lg border border-lava/10 px-2.5 py-1.5 text-xs"
                              />
                            )}
                            {meta.needsConfig === "roles" && (
                              <input
                                value={flow.config?.addRoleIds?.join(",") || ""}
                                onChange={(e) =>
                                  setFlowConfig(flow.type, {
                                    addRoleIds: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                  })
                                }
                                placeholder="Role IDs to add, comma separated"
                                className="w-56 rounded-lg border border-lava/10 px-2.5 py-1.5 text-xs"
                              />
                            )}

                            <button
                              onClick={() => removeFlow(flow.type)}
                              className="text-lava/30 hover:text-[#E6736F]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {activeTab === "preview" && (
                <Card>
                  <div className="overflow-hidden rounded-xl border border-lava/10">
                    <div className="flex items-center gap-1.5 bg-lava/[0.04] px-4 py-2.5 text-sm text-lava/50">
                      <Hash className="h-3.5 w-3.5" />
                      {trigger.postToChannel === "current"
                        ? "current-channel"
                        : channels.find((c) => c.id === trigger.postToChannel)?.name || "current-channel"}
                    </div>
                    <div className="bg-white px-4 py-4">
                      <div className="flex gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: BRAND_GRADIENT }}
                        >
                          B
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-reef-navy">YourBot</span>
                            <span className="rounded bg-lava/10 px-1 py-[1px] text-[10px] font-medium text-lava/50">
                              APP
                            </span>
                            <span className="text-xs text-lava/35">Today at 12:00 PM</span>
                          </div>

                          {trigger.container.enabled ? (
                            <div className="mt-1.5 flex max-w-md overflow-hidden rounded-xl border border-lava/10 bg-lava/[0.03]">
                              {trigger.container.accentColor && (
                                <span className="w-1 shrink-0" style={{ background: trigger.container.accentColor }} />
                              )}
                              <div className="min-w-0 flex-1 p-4">
                                {trigger.container.headerText && (
                                  <p className="mb-1.5 text-sm font-bold text-reef-navy">
                                    {trigger.container.headerText}
                                  </p>
                                )}
                                {trigger.container.separatorAfterHeader && <div className="my-2 h-px bg-lava/10" />}

                                <p className="whitespace-pre-wrap text-sm text-reef-navy/80">
                                  {trigger.container.bodyText || "Main body text inside the container…"}
                                </p>

                                {trigger.container.separatorBeforeImage && <div className="my-3 h-px bg-lava/10" />}
                                {trigger.container.imageUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={trigger.container.imageUrl}
                                    alt=""
                                    className="mt-2 max-h-48 w-full rounded-lg object-cover"
                                  />
                                )}

                                {trigger.container.separatorBeforeFooter && <div className="my-3 h-px bg-lava/10" />}
                                {(trigger.container.footerText || trigger.container.showTimestamp) && (
                                  <p className="mt-3 text-xs text-lava/40">
                                    {trigger.container.footerText}
                                    {trigger.container.footerText && trigger.container.showTimestamp ? " · " : ""}
                                    {trigger.container.showTimestamp ? "Today at 12:00 PM" : ""}
                                  </p>
                                )}

                                {trigger.container.linkButtons.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {trigger.container.linkButtons.map((b) => (
                                      <span
                                        key={b.id}
                                        className="flex items-center gap-1 rounded-lg border border-lava/15 bg-white px-2.5 py-1.5 text-xs font-medium text-reef-navy/80"
                                      >
                                        <Link2 className="h-3 w-3 text-lava/40" />
                                        {b.label || "Button"}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 whitespace-pre-wrap text-sm text-reef-navy/80">
                              {trigger.message || <span className="text-lava/35">No message set</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-lava/10 bg-lava/[0.02] px-4 py-2 text-xs text-lava/40">
                      Invoked with !{trigger.name || "trigger"}
                      {trigger.allowedRoles && trigger.allowedRoles[0] !== "everyone" && (
                        <> · restricted to {trigger.allowedRoles.length} role{trigger.allowedRoles.length === 1 ? "" : "s"}</>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky save bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-lava/10 bg-white px-5 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
          >
            <span className="flex items-center gap-1.5 text-sm text-reef-navy/70">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#E6736F" }} />
              Unsaved changes
            </span>
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 text-sm text-lava/50 hover:text-reef-navy"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: BRAND_GRADIENT }}
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}