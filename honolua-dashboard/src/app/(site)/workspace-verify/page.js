"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav.js";
import Footer from "@/components/Footer.js";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return mounted;
}

function DiscordIcon({ color = "ffffff", className }) {
  return <img src={`https://cdn.simpleicons.org/discord/${color}`} alt="Discord" className={className} />;
}

function RobloxIcon({ color = "ffffff", className }) {
  return <img src={`https://cdn.simpleicons.org/roblox/${color}`} alt="Roblox" className={className} />;
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
    </svg>
  );
}

function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
    </svg>
  );
}

const BLOXLINK_VERIFY_URL = "https://blox.link/verify";

const ERROR_MESSAGES = {
  discord_state_mismatch: "Something went wrong with Discord login. Try again.",
  discord_failed: "Couldn't connect your Discord account. Try again.",
};

const BRAND_GRADIENT = "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)";

/* ---------- shared dark shell ---------- */

function DarkBackground({ children }) {
  return (
    <section className="relative min-h-screen bg-[#08080B] pt-40 pb-28 overflow-hidden">
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* brand glow orbs — warm, not purple */}
      <div
        className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-[110px] opacity-25"
        style={{ background: "#E6736F" }}
      />
      <div
        className="absolute -bottom-40 -right-16 w-[460px] h-[460px] rounded-full blur-[120px] opacity-20"
        style={{ background: "#F4B942" }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}

function TrustPill({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-white/70">
      {icon}
      {label}
    </span>
  );
}

/* ---------- step card ---------- */

function StepCard({ index, title, desc, status, action, delay, mounted }) {
  const isDone = status === "done";
  const isActive = status === "active";

  return (
    <div
      className="relative flex items-center gap-5 rounded-2xl border p-6 md:p-7 opacity-0"
      style={{
        background: isActive ? "rgba(230,115,111,0.06)" : "rgba(255,255,255,0.02)",
        borderColor: isActive ? "rgba(244,114,182,0.35)" : "rgba(255,255,255,0.08)",
        animation: mounted ? "stepIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        animationDelay: mounted ? `${delay}ms` : "0ms",
      }}
    >
      <div
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 overflow-hidden text-white"
        style={{
          background: isDone ? BRAND_GRADIENT : "rgba(255,255,255,0.06)",
          color: isDone ? "#0B0B10" : "rgba(255,255,255,0.6)",
        }}
      >
        {isDone ? <CheckIcon className="w-5 h-5" /> : index}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-sans font-bold text-base md:text-lg text-white mb-1">{title}</h3>
        <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
      </div>

      <div className="shrink-0">{action}</div>
    </div>
  );
}

/* ---------- terminal screens ---------- */

function DeniedScreen({ mounted, status }) {
  return (
    <div
      className="rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 md:p-10 opacity-0"
      style={{ animation: mounted ? "heroFadeUp 0.6s ease-out forwards" : "none" }}
    >
      <div className="flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white/80 bg-white/5 border border-white/10">
          <LockIcon className="w-7 h-7" />
        </div>
      </div>

      <h1 className="font-serif italic font-medium text-white text-3xl text-center mb-2">Access Restricted</h1>
      <p className="text-sm text-white/45 text-center mb-6 leading-relaxed max-w-md mx-auto">
        You are not allowed to view the Honolua Management Dashboard. This
        area is limited to staff at or above a specific rank in the Honolua
        Roblox group.
      </p>

      {status?.robloxUsername && (
        <p className="text-xs text-white/35 text-center mb-6">
          Signed in as <span className="font-semibold text-white/60">{status.robloxUsername}</span>
          {status.workspaceRoleName ? ` — ${status.workspaceRoleName}` : ""}
        </p>
      )}

      <Link
        href="/"
        className="block w-full text-center font-bold text-sm text-white border-2 border-white/15 px-6 py-3.5 rounded-full hover:border-white/40 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}

const ENTER_MESSAGES = [
  "Waxing the surfboards…",
  "Untangling the leis…",
  "Chasing the chickens off the dashboard…",
  "Warming up the ukulele…",
  "Shaking the sand out of the servers…",
  "Refilling the coconut water…",
  "Bribing the tiki gods…",
  "Double-checking the rank checked out…",
];

function EnteringOverlay() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ENTER_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#08080B]">
      <div
        className="w-16 h-16 rounded-full animate-spin"
        style={{ border: "5px solid rgba(255,255,255,0.08)", borderTopColor: "#E6736F" }}
      />
      <p className="font-serif italic font-medium text-white text-2xl text-center px-6">
        {ENTER_MESSAGES[index]}
      </p>
    </div>
  );
}

function VerifiedScreen({ mounted, status }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(() => router.push("/dashboard"), 10000);
  };

  return (
    <>
      {entering && <EnteringOverlay />}
      <div
        className="rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 md:p-10 opacity-0"
        style={{ animation: mounted ? "heroFadeUp 0.6s ease-out forwards" : "none" }}
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#5865F2]">
            <DiscordIcon className="w-7 h-7" />
          </div>
          <CheckIcon className="w-5 h-5 text-[#F472B6]" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: BRAND_GRADIENT }}>
            <RobloxIcon className="w-7 h-7" />
          </div>
        </div>

        <h1 className="font-serif italic font-medium text-white text-3xl text-center mb-2">Successfully Verified</h1>
        <p className="text-sm text-white/45 text-center mb-8 leading-relaxed">
          {status?.robloxUsername}
          {status?.workspaceRoleName ? ` — ${status.workspaceRoleName}` : ""} — you're cleared for workspace access.
        </p>

        <button
          onClick={handleEnter}
          disabled={entering}
          className="block w-full text-center text-[#0B0B10] font-extrabold text-sm px-7 py-4 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-70 disabled:translate-y-0"
          style={{ background: BRAND_GRADIENT }}
        >
          {entering ? "Entering…" : "Enter Workspace"}
        </button>
      </div>
    </>
  );
}

/* ---------- main content ---------- */

function WorkspaceVerifyContent() {
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const errorParam = searchParams.get("error");

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/workspace/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();

    if (searchParams.get("connected") || searchParams.get("error")) {
      const t = setTimeout(() => router.replace("/workspace-verify"), 50);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const discordConnected = status?.discordConnected;
  const robloxLinked = status?.robloxLinked;
  const rankChecked = robloxLinked && status?.workspaceRank !== null;
  const workspaceAllowed = status?.workspaceAllowed;

  const showDenied = rankChecked && !workspaceAllowed;
  const showVerified = rankChecked && workspaceAllowed;

  return (
    <DarkBackground>
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-[720px] mx-auto px-6 md:px-8">
        <div
          className="flex flex-col items-center text-center mb-10 opacity-0"
          style={{ animation: mounted ? "heroFadeUp 0.6s ease-out forwards" : "none" }}
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#5865F2]">
              <DiscordIcon className="w-4.5 h-4.5" />
            </div>
            <span className="text-white/30 text-lg font-light">×</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND_GRADIENT }}>
              <RobloxIcon className="w-4.5 h-4.5" />
            </div>
          </div>

          <h1 className="font-serif italic font-medium text-white text-4xl md:text-5xl leading-tight mb-4">
            Verify to enter the workspace.
          </h1>
          <p className="text-lg leading-relaxed text-white/45 max-w-[480px] mb-6">
            Log in with Discord — we'll check your Roblox group rank to confirm workspace access.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <TrustPill icon={<ShieldIcon className="w-3.5 h-3.5" />} label="Rank-synced" />
            <TrustPill icon={<BoltIcon className="w-3.5 h-3.5" />} label="Instant check" />
            <TrustPill icon={<CheckIcon className="w-3.5 h-3.5" />} label="Bloxlink verified" />
          </div>
        </div>

        {errorParam && (
          <div
            className="mb-6 rounded-2xl px-5 py-4 text-sm font-semibold opacity-0"
            style={{ animation: "heroFadeUp 0.4s ease-out forwards", background: "rgba(230,115,111,0.12)", color: "#F4A5A2" }}
          >
            {ERROR_MESSAGES[errorParam] || "Something went wrong. Please try again."}
          </div>
        )}

        {!loading && !showDenied && !showVerified && (
          <div className="flex flex-col gap-4 mb-10">
            <StepCard
              index={1}
              title="Discord account"
              desc={discordConnected ? `Logged in as @${status.discordUsername}` : "Log in with Discord to start verification."}
              status={discordConnected ? "done" : "active"}
              mounted={mounted}
              delay={100}
              action={
                discordConnected ? (
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Connected</span>
                ) : (
                  <a
                    href="/api/auth/discord?flow=workspace"
                    className="flex items-center gap-2 text-[#0B0B10] font-bold text-xs px-4 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                    style={{ background: BRAND_GRADIENT }}
                  >
                    <DiscordIcon color="0B0B10" className="w-3.5 h-3.5" />
                    Continue with Discord
                  </a>
                )
              }
            />

            <StepCard
              index={2}
              title="Roblox account"
              desc={
                robloxLinked
                  ? `Linked to ${status.robloxDisplayName || status.robloxUsername} (@${status.robloxUsername})`
                  : discordConnected
                  ? "No linked Roblox account found via Bloxlink yet."
                  : "Connect Discord first — we'll check your linked Roblox account."
              }
              status={robloxLinked ? "done" : discordConnected ? "active" : "pending"}
              mounted={mounted}
              delay={200}
              action={
                robloxLinked ? (
                  status.robloxAvatarUrl && (
                    <img src={status.robloxAvatarUrl} alt={status.robloxUsername} className="w-10 h-10 rounded-xl object-cover" />
                  )
                ) : discordConnected ? (
                  <div className="flex flex-col items-end gap-2">
                    <a
                      href={BLOXLINK_VERIFY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0B0B10] font-bold text-xs px-4 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                      style={{ background: BRAND_GRADIENT }}
                    >
                      Verify with Bloxlink
                    </a>
                    <button onClick={fetchStatus} className="text-xs font-bold text-white/40 hover:text-white/70">
                      Refresh
                    </button>
                  </div>
                ) : null
              }
            />

            <StepCard
              index={3}
              title="Group rank check"
              desc={robloxLinked ? "Checking your rank in the Honolua Roblox group…" : "Complete both steps above to check workspace access."}
              status={rankChecked ? "done" : robloxLinked ? "active" : "pending"}
              mounted={mounted}
              delay={300}
              action={
                robloxLinked && !rankChecked ? (
                  <button onClick={fetchStatus} className="text-xs font-bold text-white/40 hover:text-white/70">
                    Refresh
                  </button>
                ) : null
              }
            />
          </div>
        )}

        {showDenied && (
          <div className="mb-10">
            <DeniedScreen mounted={mounted} status={status} />
          </div>
        )}

        {showVerified && (
          <div className="mb-10">
            <VerifiedScreen mounted={mounted} status={status} />
          </div>
        )}

        <p className="flex items-center justify-center gap-2 text-xs text-white/25 mt-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          All systems operational
        </p>
      </div>
    </DarkBackground>
  );
}

export default function WorkspaceVerify() {
  return (
    <div className="min-h-screen bg-[#08080B]">
      <Nav />
      <Suspense fallback={null}>
        <WorkspaceVerifyContent />
      </Suspense>
      <Footer />
    </div>
  );
}