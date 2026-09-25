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

function DiscordIcon({ color = "5865F2", className }) {
  return <img src={`https://cdn.simpleicons.org/discord/${color}`} alt="Discord" className={className} />;
}

function RobloxIcon({ color = "000000", className }) {
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

function LightBackground({ children }) {
  return (
    <section
      className="relative min-h-screen pt-40 pb-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%), radial-gradient(85% 65% at 8% 100%, rgba(244,114,182,0.08), transparent 60%), radial-gradient(70% 50% at 95% 0%, rgba(244,185,66,0.12), transparent 60%)",
      }}
    >
      <div className="relative">{children}</div>
    </section>
  );
}

function TrustPill({ icon, label, color }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
      style={{ background: `${color}18`, color }}
    >
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
        background: isActive ? "rgba(230,115,111,0.06)" : "rgba(138,107,96,0.03)",
        borderColor: isActive ? "rgba(244,114,182,0.35)" : "rgba(138,107,96,0.08)",
        animation: mounted ? "stepIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        animationDelay: mounted ? `${delay}ms` : "0ms",
      }}
    >
      <div
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 overflow-hidden"
        style={{
          background: isDone ? BRAND_GRADIENT : "rgba(230,115,111,0.08)",
          color: isDone ? "#fff" : "#8A6B60",
        }}
      >
        {isDone ? <CheckIcon className="w-5 h-5" /> : index}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-sans font-bold text-base md:text-lg text-reef-navy mb-1">{title}</h3>
        <p className="text-sm text-lava/55 leading-relaxed">{desc}</p>
      </div>

      <div className="shrink-0">{action}</div>
    </div>
  );
}

/* ---------- terminal screens ---------- */

function DeniedScreen({ mounted, status }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #8A6B60, #B5473F)" }}>
          <LockIcon className="w-7 h-7" />
        </div>
      </div>

      <h1 className="font-serif italic font-medium text-reef-navy text-3xl mb-2">Access Restricted</h1>
      <p className="text-sm text-lava/55 mb-6 leading-relaxed max-w-md mx-auto">
        You are not allowed to view the Honolua Management Dashboard. This
        area is limited to staff at or above a specific rank in the Honolua
        Roblox group.
      </p>

      {status?.robloxUsername && (
        <p className="text-xs text-lava/45 mb-6">
          Signed in as <span className="font-semibold">{status.robloxUsername}</span>
          {status.workspaceRoleName ? ` — ${status.workspaceRoleName}` : ""}
        </p>
      )}

      <Link
        href="/"
        className="block w-full text-center font-bold text-sm text-reef-navy border-2 border-hibiscus/25 px-6 py-3.5 rounded-full hover:border-hibiscus transition-colors"
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
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FFF3E4 30%, #FDE3C8 55%, #FFF3E4 80%, #FFFFFF 100%)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full animate-spin"
        style={{ border: "5px solid rgba(230,115,111,0.15)", borderTopColor: "#E6736F" }}
      />
      <p className="font-serif italic font-medium text-reef-navy text-2xl text-center px-6">
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
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #5865F2, #7289DA)" }}>
            <DiscordIcon color="ffffff" className="w-7 h-7" />
          </div>
          <CheckIcon className="w-5 h-5 text-hibiscus" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: BRAND_GRADIENT }}>
            <RobloxIcon color="ffffff" className="w-7 h-7" />
          </div>
        </div>

        <h1 className="font-serif italic font-medium text-reef-navy text-3xl mb-2">Successfully Verified</h1>
        <p className="text-sm text-lava/55 mb-8 leading-relaxed">
          {status?.robloxUsername}
          {status?.workspaceRoleName ? ` — ${status.workspaceRoleName}` : ""} — you're cleared for workspace access.
        </p>

        <button
          onClick={handleEnter}
          disabled={entering}
          className="block w-full text-center text-white font-extrabold text-sm px-7 py-4 rounded-full shadow-[0_10px_30px_-8px_rgba(230,115,111,0.4)] hover:-translate-y-0.5 transition-transform disabled:opacity-70 disabled:translate-y-0"
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
    <LightBackground>
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

      <div className="max-w-[680px] mx-auto px-6 md:px-8">
        <div
          className="rounded-[28px] border border-lava/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-8 md:p-12 opacity-0"
          style={{ animation: mounted ? "heroFadeUp 0.6s ease-out forwards" : "none" }}
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #5865F2, #7289DA)" }}>
                <DiscordIcon color="ffffff" className="w-4.5 h-4.5" />
              </div>
              <span className="text-lava/30 text-lg font-light">×</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND_GRADIENT }}>
                <RobloxIcon color="ffffff" className="w-4.5 h-4.5" />
              </div>
            </div>

            <h1 className="font-serif italic font-medium text-reef-navy text-4xl md:text-5xl leading-tight mb-4">
              Verify to enter the workspace.
            </h1>
            <p className="text-lg leading-relaxed text-lava/60 max-w-[480px] mb-6">
              Log in with Discord — we'll check your Roblox group rank to confirm workspace access.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <TrustPill icon={<ShieldIcon className="w-3.5 h-3.5" />} label="Auto rank check" color="#E6736F" />
              <TrustPill icon={<BoltIcon className="w-3.5 h-3.5" />} label="No manual review" color="#F4B942" />
              <TrustPill icon={<CheckIcon className="w-3.5 h-3.5" />} label="Powered by Bloxlink" color="#F472B6" />
            </div>
          </div>

          {errorParam && (
            <div
              className="mb-6 rounded-2xl px-5 py-4 text-sm font-semibold"
              style={{ background: "rgba(230,115,111,0.10)", color: "#B5473F" }}
            >
              {ERROR_MESSAGES[errorParam] || "Something went wrong. Please try again."}
            </div>
          )}

          {!loading && !showDenied && !showVerified && (
            <div className="flex flex-col gap-4">
              <StepCard
                index={1}
                title="Discord account"
                desc={discordConnected ? `Logged in as @${status.discordUsername}` : "Log in with Discord to start verification."}
                status={discordConnected ? "done" : "active"}
                mounted={mounted}
                delay={100}
                action={
                  discordConnected ? (
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Connected</span>
                  ) : (
                    <a
                      href="/api/auth/discord?flow=workspace"
                      className="flex items-center gap-2 text-white font-bold text-xs px-4 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                      style={{ background: BRAND_GRADIENT }}
                    >
                      <DiscordIcon color="ffffff" className="w-3.5 h-3.5" />
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
                        className="text-white font-bold text-xs px-4 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                        style={{ background: BRAND_GRADIENT }}
                      >
                        Verify with Bloxlink
                      </a>
                      <button onClick={fetchStatus} className="text-xs font-bold text-reef-navy/40 hover:text-reef-navy/70">
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
                    <button onClick={fetchStatus} className="text-xs font-bold text-reef-navy/40 hover:text-reef-navy/70">
                      Refresh
                    </button>
                  ) : null
                }
              />
            </div>
          )}

          {showDenied && <DeniedScreen mounted={mounted} status={status} />}

          {showVerified && <VerifiedScreen mounted={mounted} status={status} />}
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-lava/40 mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          All systems operational
        </p>
      </div>
    </LightBackground>
  );
}

export default function WorkspaceVerify() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Suspense fallback={null}>
        <WorkspaceVerifyContent />
      </Suspense>
      <Footer />
    </div>
  );
}