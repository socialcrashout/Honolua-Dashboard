"use client";

import { useEffect, useRef, useState } from "react";

const DISCORD_INVITE_CODE = "8Am56ckPFP";
const ROBLOX_GROUP_ID = "743137138";
const STAFF_MIN_RANK = 140;
const POLL_INTERVAL_MS = 60_000;


async function fetchDiscordStats() {
  "use server";
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`discord fetch failed: ${res.status}`);
    const data = await res.json();
    return { memberCount: data.approximate_member_count ?? null };
  } catch (err) {
    console.error("[fetchDiscordStats]", err);
    return { error: true };
  }
}

async function fetchRobloxStats() {
  "use server";
  try {
    const [groupRes, rolesRes] = await Promise.all([
      fetch(`https://groups.roblox.com/v1/groups/${ROBLOX_GROUP_ID}`, {
        cache: "no-store",
      }),
      fetch(`https://groups.roblox.com/v1/groups/${ROBLOX_GROUP_ID}/roles`, {
        cache: "no-store",
      }),
    ]);
    if (!groupRes.ok || !rolesRes.ok) {
      throw new Error(
        `roblox fetch failed: group=${groupRes.status} roles=${rolesRes.status}`
      );
    }
    const group = await groupRes.json();
    const rolesData = await rolesRes.json();
    const staffCount = (rolesData.roles ?? [])
      .filter((r) => r.rank >= STAFF_MIN_RANK)
      .reduce((sum, r) => sum + (r.memberCount ?? 0), 0);
    return { memberCount: group.memberCount ?? null, staffCount };
  } catch (err) {
    console.error("[fetchRobloxStats]", err);
    return { error: true };
  }
}

function useCountUp(target, { duration = 1200, formatter = (n) => n.toLocaleString() } = {}) {
  const [display, setDisplay] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(t);
      const value = from + (to - from) * eased;
      setDisplay(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return target === null || target === undefined ? "—" : formatter(Math.round(display));
}

function DropText({ text, play, delayStart = 0, staggerMs = 45 }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top">
          <span
            className="inline-block opacity-0"
            style={{
              animation: play
                ? "wordDrop 0.5s cubic-bezier(0.16,1,0.3,1) forwards"
                : "none",
              animationDelay: play ? `${delayStart + i * staggerMs}ms` : "0ms",
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </>
  );
}

function LiveDot({ ok }) {
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span
        className={`absolute inline-flex h-full w-full rounded-full ${
          ok ? "bg-emerald-500" : "bg-lava/30"
        } ${ok ? "animate-ping" : ""} opacity-60`}
      />
      <span
        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-lava/30"
        }`}
      />
    </span>
  );
}

const ANIMATIONS = ["statFadeUp", "statScaleIn", "statSlideLeft", "statFlipIn"];

function StatCard({ header, value, label, live, error, delay, animIndex }) {
  const display = useCountUp(value);
  const animName = ANIMATIONS[animIndex % ANIMATIONS.length];

  const [entered, setEntered] = useState(false);
  const [flash, setFlash] = useState(false);
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (entered && prevValueRef.current !== null && value !== null && value !== prevValueRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      prevValueRef.current = value;
      return () => clearTimeout(t);
    }
    prevValueRef.current = value;
  }, [value, entered]);

  const cardAnimStyle = flash
    ? { animation: "statFlash 0.7s ease-out" }
    : entered
    ? {}
    : {
        animation: `${animName} 0.7s cubic-bezier(0.16,1,0.3,1) forwards`,
        animationDelay: `${delay}ms`,
      };

  return (
    <div
      onAnimationEnd={() => !entered && setEntered(true)}
      className="group relative overflow-hidden opacity-0 rounded-2xl border border-lava/10 bg-white/60 backdrop-blur-sm px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.07)] hover:border-lava/20"
      style={{
        opacity: entered ? 1 : undefined,
        transformOrigin: "top center",
        ...cardAnimStyle,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(closest-side, rgba(217,119,87,0.35), rgba(253,239,224,0.18) 60%, transparent 80%)",
          filter: "blur(18px)",
          animation: "statFlow 6s ease-in-out infinite",
          animationDelay: `${animIndex * 0.6}s`,
        }}
      />

      <p className="relative text-[11px] font-medium tracking-[0.12em] uppercase text-lava/40 mb-2.5 transition-all duration-300 group-hover:tracking-[0.16em] group-hover:text-lava/55">
        <DropText text={header} play={entered} delayStart={0} staggerMs={60} />
      </p>

      <div className="relative flex items-baseline gap-2 mb-1.5">
        <h3
          className="font-sans font-bold text-3xl text-reef-navy tabular-nums transition-all duration-300 group-hover:scale-[1.08] group-hover:text-emerald-600 animate-[statBreathe_3s_ease-in-out_infinite]"
          style={{ transformOrigin: "left" }}
        >
          {error ? "—" : display}
        </h3>
        {!error && <LiveDot ok={live} />}
      </div>

      <p className="relative text-sm text-lava/60 leading-relaxed">
        {error ? (
          <span className="text-lava/40">Couldn't reach this source right now</span>
        ) : (
          <DropText text={label} play={entered} delayStart={150} staggerMs={25} />
        )}
      </p>
    </div>
  );
}

export default function LiveStats() {
  const [discordTotal, setDiscordTotal] = useState(null);
  const [discordError, setDiscordError] = useState(false);

  const [robloxMembers, setRobloxMembers] = useState(null);
  const [robloxError, setRobloxError] = useState(false);

  const [staffCount, setStaffCount] = useState(null);
  const [staffError, setStaffError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const discord = await fetchDiscordStats();
      if (!cancelled) {
        if (discord.error) {
          setDiscordError(true);
        } else {
          setDiscordTotal(discord.memberCount);
          setDiscordError(false);
        }
      }

      const roblox = await fetchRobloxStats();
      if (!cancelled) {
        if (roblox.error) {
          setRobloxError(true);
          setStaffError(true);
        } else {
          setRobloxMembers(roblox.memberCount);
          setRobloxError(false);
          setStaffCount(roblox.staffCount);
          setStaffError(false);
        }
      }
    }

    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const stats = [
    {
      header: "Discord",
      value: discordTotal,
      label: "Total server members",
      live: !discordError,
      error: discordError,
    },
    {
      header: "Roblox",
      value: robloxMembers,
      label: "Group members",
      live: !robloxError,
      error: robloxError,
    },
    {
      header: "Staff Team",
      value: staffCount,
      label: `Ranked ${STAFF_MIN_RANK}+`,
      live: !staffError,
      error: staffError,
    },
  ];

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%)",
      }}
      className="pb-16"
    >
      <style>{`
        @keyframes statFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statScaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes statSlideLeft {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes statFlipIn {
          from { opacity: 0; transform: perspective(600px) rotateX(-70deg); }
          to { opacity: 1; transform: perspective(600px) rotateX(0deg); }
        }
        @keyframes statFlash {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
          60% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        @keyframes statBreathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes statFlow {
          0% { transform: translate(-10%, -6%) scale(1); }
          33% { transform: translate(8%, 4%) scale(1.15); }
          66% { transform: translate(-4%, 8%) scale(0.95); }
          100% { transform: translate(-10%, -6%) scale(1); }
        }
        @keyframes wordDrop {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-[1240px] mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-lava/10 pt-10">
        {stats.map((s, i) => (
          <StatCard
            key={s.header}
            header={s.header}
            value={s.value}
            label={s.label}
            live={s.live}
            error={s.error}
            delay={i * 110}
            animIndex={i}
          />
        ))}
      </div>
    </section>
  );
}