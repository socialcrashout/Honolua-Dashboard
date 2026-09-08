"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return mounted;
}

function DiscordIcon({ color = "5865F2", className }) {
  return (
    <img
      src={`https://cdn.simpleicons.org/discord/${color}`}
      alt="Discord"
      className={className}
    />
  );
}

function RobloxIcon({ color = "000000", className }) {
  return (
    <img
      src={`https://cdn.simpleicons.org/roblox/${color}`}
      alt="Roblox"
      className={className}
    />
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SpinnerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle
        cx="12" cy="12" r="9"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="42" strokeDashoffset="14"
      />
    </svg>
  );
}

const BLOXLINK_VERIFY_URL = "https://blox.link/verify";

const ERROR_MESSAGES = {
  discord_state_mismatch: "Something went wrong with Discord login. Try again.",
  discord_failed: "Couldn't connect your Discord account. Try again.",
};

function StepCard({ index, title, desc, status, action, delay, mounted }) {
  const isDone = status === "done";
  const isActive = status === "active";

  return (
    <div
      className="relative flex items-center gap-5 rounded-[22px] bg-white border border-lava/10 p-6 md:p-7 opacity-0"
      style={{
        animation: mounted ? "stepIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        animationDelay: mounted ? `${delay}ms` : "0ms",
        boxShadow: isActive
          ? "0 12px 32px -12px rgba(230,115,111,0.25)"
          : "0 1px 2px rgba(0,0,0,0.03)",
        outline: isActive ? "2px solid rgba(244,114,182,0.35)" : "2px solid transparent",
        outlineOffset: "-2px",
      }}
    >
      <div
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 overflow-hidden"
        style={{
          background: isDone
            ? "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)"
            : "rgba(230,115,111,0.08)",
          color: isDone ? "#fff" : "#8A6B60",
        }}
      >
        {isDone ? <CheckIcon className="w-5 h-5" /> : index}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-sans font-bold text-base md:text-lg text-reef-navy mb-1">
          {title}
        </h3>
        <p className="text-sm text-lava/55 leading-relaxed">{desc}</p>
      </div>

      <div className="shrink-0">{action}</div>
    </div>
  );
}

function LinkedAccountRow({ label, avatarUrl, fallbackIcon, name, id }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-cream/60 border border-lava/10 px-5 py-4">
      <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-white border border-lava/10 flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          fallbackIcon
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-lava/45 mb-0.5">
          {label}
        </div>
        <div className="font-bold text-reef-navy truncate">{name}</div>
      </div>
      {id && (
        <div className="shrink-0 text-xs font-mono text-lava/45 bg-white border border-lava/10 rounded-full px-3 py-1.5">
          {id}
        </div>
      )}
    </div>
  );
}

function LinkedSuccessScreen({ mounted, status }) {
  return (
    <div
      className="bg-white rounded-[26px] border border-lava/10 p-8 md:p-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] opacity-0"
      style={{ animation: mounted ? "heroFadeUp 0.6s ease-out forwards" : "none" }}
    >
      <div className="flex items-center justify-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #5865F2, #7289DA)" }}
        >
          <DiscordIcon color="ffffff" className="w-7 h-7" />
        </div>
        <CheckIcon className="w-5 h-5 text-hibiscus" />
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #F4B942, #E6736F)" }}
        >
          <RobloxIcon color="ffffff" className="w-7 h-7" />
        </div>
      </div>

      <h1 className="font-serif italic font-medium text-reef-navy text-3xl text-center mb-2">
        Successfully Linked with Honolua Systems
      </h1>
      <p className="text-sm text-lava/55 text-center mb-8 leading-relaxed">
        Your Discord account is now linked to your Roblox account.
      </p>

      <div className="flex flex-col gap-3 mb-8">
        <LinkedAccountRow
          label="Discord"
          avatarUrl={status?.discordAvatar}
          fallbackIcon={<DiscordIcon color="5865F2" className="w-5 h-5" />}
          name={status?.discordUsername ? `@${status.discordUsername}` : "—"}
          id={status?.discordId}
        />
        <LinkedAccountRow
          label="Roblox"
          avatarUrl={status?.robloxAvatarUrl}
          fallbackIcon={<RobloxIcon color="E6736F" className="w-5 h-5" />}
          name={status?.robloxDisplayName || status?.robloxUsername || "—"}
          id={status?.robloxId}
        />
        <LinkedAccountRow
          label="Discord Server"
          avatarUrl="https://cdn.discordapp.com/icons/1516264096209834065/ed53886edff7ddb809c92ad56330722d.webp?size=2048"
          fallbackIcon={<DiscordIcon color="5865F2" className="w-5 h-5" />}
          name="Honolua"
          id={null}
        />
      </div>

      <p className="text-xs text-lava/45 text-center">
        Your accounts are now connected and ready to use.
      </p>
    </div>
  );
}

export default function Verify() {
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [done, setDone] = useState(false);
  const autoConfirmedRef = useRef(false);

  const errorParam = searchParams.get("error");

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/verify/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();

    const token = searchParams.get("token");
    const appId = searchParams.get("app_id");
    if (token && appId) {
      fetch("/api/verify/register-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, app_id: appId }),
      }).catch(() => {});
    }

    if (searchParams.get("connected") || searchParams.get("error")) {
      const t = setTimeout(() => router.replace("/verify"), 50);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    setConfirming(true);
    setConfirmError(null);
    fetch("/api/verify/confirm", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          let message = `Confirm failed (${res.status})`;
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {
            // response wasn't JSON — keep the generic message
          }
          throw new Error(message);
        }
        return res.json();
      })
      .then(() => {
        setConfirming(false);
        setDone(true);
      })
      .catch((err) => {
        console.error("Confirm error:", err);
        setConfirming(false);
        setConfirmError(err.message || "Something went wrong confirming verification.");
      });
  };

  const discordConnected = status?.discordConnected;
  const robloxLinked = status?.robloxLinked;
  const bothReady = discordConnected && robloxLinked;

  // Auto-confirm the instant both accounts are linked — no button click
  // needed. Guarded by the ref so it only ever fires once per page load,
  // even if bothReady flips true/false/true from a re-fetch.
  useEffect(() => {
    if (bothReady && !done && !confirming && !autoConfirmedRef.current) {
      autoConfirmedRef.current = true;
      handleConfirm();
    }
  }, [bothReady, done, confirming]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      className="pt-40 pb-28 min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%), radial-gradient(85% 65% at 8% 100%, rgba(244,114,182,0.08), transparent 60%), radial-gradient(70% 50% at 95% 0%, rgba(244,185,66,0.10), transparent 60%)",
      }}
    >
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="max-w-[720px] mx-auto px-6 md:px-8">
        <div
          className="mb-10 opacity-0"
          style={{ animation: mounted ? "heroFadeUp 0.6s ease-out forwards" : "none" }}
        >
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-hibiscus mb-5">
            <span
              className="h-px bg-hibiscus/60 transition-all duration-700 ease-out"
              style={{ width: mounted ? 20 : 0 }}
            />
            Roblox &amp; Discord Verification
          </div>
          <h1 className="font-serif italic font-medium text-reef-navy text-4xl md:text-5xl leading-tight mb-5">
            Verify to enter Honolua.
          </h1>
          <p className="text-lg leading-relaxed text-lava/60 max-w-[520px]">
            Log in with Discord and we'll pull your linked Roblox account to
            confirm your staff role.
          </p>
        </div>

        {errorParam && (
          <div
            className="mb-6 rounded-2xl px-5 py-4 text-sm font-semibold opacity-0"
            style={{
              animation: "heroFadeUp 0.4s ease-out forwards",
              background: "rgba(230,115,111,0.10)",
              color: "#B5473F",
            }}
          >
            {ERROR_MESSAGES[errorParam] || "Something went wrong. Please try again."}
          </div>
        )}

        {!loading && !done && (
          <div className="flex flex-col gap-4 mb-10">
            <StepCard
              index={1}
              title="Discord account"
              desc={
                discordConnected
                  ? `Logged in as @${status.discordUsername}`
                  : "Log in with Discord to start verification."
              }
              status={discordConnected ? "done" : "active"}
              mounted={mounted}
              delay={100}
              action={
                discordConnected ? (
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                    Connected
                  </span>
                ) : (
                  <a
                    href="/api/auth/discord"
                    className="flex items-center gap-2 text-white font-bold text-xs px-4 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                    style={{ background: "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)" }}
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
                    <img
                      src={status.robloxAvatarUrl}
                      alt={status.robloxUsername}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  )
                ) : discordConnected ? (
                  <div className="flex flex-col items-end gap-2">
                    <a
                      href={BLOXLINK_VERIFY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-bold text-xs px-4 py-2.5 rounded-full hover:-translate-y-0.5 transition-transform"
                      style={{ background: "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)" }}
                    >
                      Verify with Bloxlink
                    </a>
                    <button
                      onClick={fetchStatus}
                      className="text-xs font-bold text-reef-navy/60 hover:text-reef-navy"
                    >
                      Refresh
                    </button>
                  </div>
                ) : null
              }
            />

            <StepCard
              index={3}
              title="Workspace access"
              desc={
                confirming
                  ? "Finishing setup — this only takes a second…"
                  : bothReady
                  ? "Both accounts verified — you're ready to enter."
                  : "Complete both steps above to unlock workspace access."
              }
              status={done ? "done" : "pending"}
              mounted={mounted}
              delay={300}
              action={
                confirming ? (
                  <SpinnerIcon
                    className="w-5 h-5 text-hibiscus"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                ) : null
              }
            />
          </div>
        )}

        {done && (
          <div className="mb-10">
            <LinkedSuccessScreen mounted={mounted} status={status} />
          </div>
        )}

        {/* Only shown if auto-confirm actually failed — gives the user a
            way to retry without needing to refresh the whole page. */}
        {!done && confirmError && (
          <div
            className="flex flex-col gap-3 opacity-0"
            style={{ animation: "heroFadeUp 0.4s ease-out forwards" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#B5473F" }}>
              {confirmError}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="text-white font-extrabold text-sm px-7 py-4 rounded-full shadow-[0_10px_30px_-8px_rgba(230,115,111,0.4)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                style={{ background: "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)" }}
              >
                {confirming ? "Retrying…" : "Retry"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}