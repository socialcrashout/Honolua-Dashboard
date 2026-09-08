"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function DropText({ text, mounted, delayStart = 0, staggerMs = 45 }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top">
          <span
            className="inline-block opacity-0"
            style={{
              animation: mounted
                ? "wordDrop 0.6s cubic-bezier(0.16,1,0.3,1) forwards"
                : "none",
              animationDelay: mounted ? `${delayStart + i * staggerMs}ms` : "0ms",
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

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <section
      className="relative overflow-hidden pt-16 md:pt-24 pb-16"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%), radial-gradient(85% 65% at 8% 100%, rgba(244,114,182,0.08), transparent 60%), radial-gradient(70% 50% at 95% 0%, rgba(244,185,66,0.10), transparent 60%)",
      }}
    >
      <style>{`
        @keyframes wordDrop {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-[1240px] mx-auto px-6 md:px-8 relative flex flex-col md:flex-row items-center gap-10 md:gap-8">
        <div className="w-full md:w-[52%]">
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-hibiscus mb-6">
            <span
              className="h-px bg-hibiscus/50 transition-all duration-700 ease-out"
              style={{ width: mounted ? 20 : 0 }}
            />
            Team Workspace
          </div>

          <h1 className="font-sans font-bold text-reef-navy text-[2.2rem] md:text-[3.4rem] leading-[1.14] tracking-tight mb-6">
            <DropText text="Aloha! Welcome to" mounted={mounted} delayStart={80} staggerMs={60} />
            <br />
            <DropText text="Honolua" mounted={mounted} delayStart={320} staggerMs={60} />{" "}
            <span
              className="inline-block overflow-hidden align-top"
            >
              <span
                className="inline-block bg-clip-text text-transparent opacity-0"
                style={{
                  backgroundImage: "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)",
                  animation: mounted
                    ? "wordDrop 0.6s cubic-bezier(0.16,1,0.3,1) forwards"
                    : "none",
                  animationDelay: mounted ? "440ms" : "0ms",
                }}
              >
                Dashboard
              </span>
            </span>
          </h1>

          <p
            className="text-lg leading-relaxed text-lava/65 max-w-[460px] mb-9 opacity-0"
            style={{
              animation: mounted ? "heroFadeUp 0.7s ease-out forwards" : "none",
              animationDelay: mounted ? "650ms" : "0ms",
            }}
          >
            A tropical command center designed to bring Honolua’s staff operations, sessions, activity, and community resources together in one seamless experience — inspired by the spirit of the islands. 🌺
          </p>

          <div
            className="flex items-center gap-6 flex-wrap opacity-0"
            style={{
              animation: mounted ? "heroFadeUp 0.7s ease-out forwards" : "none",
              animationDelay: mounted ? "820ms" : "0ms",
            }}
          >
            <Link
              href="/workspace-verify"
              className="text-white font-extrabold text-sm px-7 py-4 rounded-full shadow-[0_10px_30px_-8px_rgba(230,115,111,0.4)] hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)" }}
            >
              Enter Workspace
            </Link>

            
            <a
              href="#activity"
              className="font-bold text-sm text-reef-navy border-b border-lava/25 pb-1 hover:border-hibiscus hover:text-hibiscus transition-colors"
            >
              See live activity ↓
            </a>
          </div>
        </div>

        <div
          className="w-full md:w-[48%] flex items-center justify-center opacity-0"
          style={{
            animation: mounted ? "heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
            animationDelay: mounted ? "300ms" : "0ms",
          }}
        >
          <div
            className="group relative rounded-[32px] px-8 py-14 md:px-16 md:py-20 flex items-center justify-center w-full max-w-[640px] border transition-all duration-300 ease-out hover:-translate-y-2"
            style={{
              background: "linear-gradient(160deg, #FFFFFF 0%, #FFF6EA 100%)",
              borderColor: "rgba(230,115,111,0.15)",
              boxShadow:
                "0 30px 70px -25px rgba(230,115,111,0.18), 0 8px 20px -8px rgba(20,50,35,0.10)",
            }}
          >
            <img
              src="/typo.png"
              alt="Honolua"
              className="w-full h-auto max-w-[540px] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}