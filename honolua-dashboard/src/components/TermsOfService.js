"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ---------------------------------------------------------
   Content — edit the copy here, layout stays untouched.
--------------------------------------------------------- */
const LAST_UPDATED = "September 8, 2026";

const SECTIONS = [
  {
    id: "01",
    title: "Service Overview",
    paragraphs: [
      "Honolua offers community management services and systems for its Roblox community. These may include staff management, applications, verification, activity tracking, moderation tools, and other features created for Honolua.",
      "By accessing or using these services, you agree to follow these Terms and any applicable Honolua rules.",
    ],
  },
  {
    id: "02",
    title: "Proper Use",
    paragraphs: [
      "Honolua services are provided for legitimate community and administrative purposes. You may not intentionally misuse, disrupt, exploit, or attempt to gain unauthorized access to any Honolua system.",
      "Any permissions provided to you should only be used for the responsibilities associated with your position.",
    ],
  },
  {
    id: "03",
    title: "Account Information",
    paragraphs: [
      "Some Honolua features may use information connected to your Roblox or Discord account to identify you and determine what areas you can access.",
      "You are responsible for your own account security. Honolua is not responsible for issues caused by you sharing your account or allowing another person to use your permissions.",
    ],
  },
  {
    id: "04",
    title: "Content & Records",
    paragraphs: [
      "Applications, staff information, reports, moderation records, activity information, and other content submitted through Honolua systems may be stored for community management purposes.",
      "Users should only provide information that is relevant to the feature being used and should not intentionally submit inappropriate or unnecessary private information.",
    ],
  },
  {
    id: "05",
    title: "Permissions",
    paragraphs: [
      "Honolua may limit, change, suspend, or remove access to its systems at any time. Staff permissions are provided based on an individual's responsibilities and should not be treated as permanent access.",
      "Abuse of permissions or access to information may lead to disciplinary action or removal from Honolua systems.",
    ],
  },
  {
    id: "06",
    title: "Changes to Honolua",
    paragraphs: [
      "Honolua may add new features, make adjustments, temporarily disable systems, or discontinue certain services when necessary. Features may change without prior notice as Honolua continues to develop.",
      "We make reasonable efforts to maintain our services but cannot promise that every system will always be available or error-free.",
    ],
  },
  {
    id: "07",
    title: "Updates to These Terms",
    paragraphs: [
      "These Terms may be changed as Honolua develops or introduces new services. The Last updated date at the top of this page will be changed whenever a new version is published.",
      "Your continued use of Honolua after changes are made indicates that you accept the updated Terms.",
    ],
  },
  {
    id: "08",
    title: "Questions",
    paragraphs: [
      "For questions regarding these Terms, Honolua services, or your access to them, please contact the Honolua Owner or an authorized member of Honolua leadership.",
    ],
  },
];

const GRADIENT = "linear-gradient(90deg, #F7C873, #F4B942, #E6736F)";

/* ---------------------------------------------------------
   useReveal — tiny in-view hook for scroll animations.
--------------------------------------------------------- */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function SectionBlock({ section, index, isLast }) {
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      className={`group relative px-7 py-8 md:px-10 md:py-9 transition-all duration-500 ease-out ${
        isLast ? "" : "border-b"
      }`}
      style={{
        borderColor: "rgba(230,115,111,0.12)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: visible ? `${Math.min(index, 4) * 50}ms` : "0ms",
      }}
    >
      <div className="flex items-start gap-4 md:gap-5 mb-4">
        <span
          className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-2xl text-sm font-extrabold text-white transition-transform duration-500 ease-out group-hover:scale-105"
          style={{
            background: GRADIENT,
            transform: visible ? "scale(1)" : "scale(0.6)",
            opacity: visible ? 1 : 0,
            transitionDelay: visible ? `${Math.min(index, 4) * 50 + 100}ms` : "0ms",
          }}
        >
          {section.id}
        </span>
        <h2 className="font-sans font-bold text-reef-navy text-xl md:text-2xl leading-snug pt-1.5">
          {section.title}
        </h2>
      </div>

      {section.paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-lava/70 leading-relaxed pl-[60px] md:pl-[64px] mb-3 last:mb-0"
        >
          {p}
        </p>
      ))}
    </div>
  );
}

export default function TermsOfService() {
  const [mounted, setMounted] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));

    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setScrollPct(max > 0 ? (scrolled / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className="relative"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FFF8EF 12%, #FDEFE0 26%, #FFF6EC 42%, #FFFCF8 60%, #FFFFFF 100%)",
      }}
    >
      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(14px, -18px) scale(1.06); }
        }
        @keyframes popFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{ width: `${scrollPct}%`, background: GRADIENT }}
        />
      </div>

      <section className="relative pt-14 md:pt-20 pb-24">
        {/* decorative floating blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 rounded-full blur-3xl opacity-40"
          style={{ background: "#F4B942", animation: "floatBlob 9s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-24 right-0 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ background: "#E6736F", animation: "floatBlob 11s ease-in-out infinite 1.5s" }}
        />

        <div className="max-w-[860px] mx-auto px-6 md:px-8 relative">
          {/* top bar */}
          <div
            className="flex items-center justify-between mb-14 md:mb-20 opacity-0"
            style={{
              animation: mounted ? "popFadeUp 0.6s ease-out forwards" : "none",
            }}
          >
            <Link href="/" className="inline-flex items-center">
              <img src="/typo.png" alt="Honolua" className="h-9 w-auto shrink-0" />
            </Link>
            <Link
              href="/"
              className="text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-[0_10px_30px_-8px_rgba(230,115,111,0.4)] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
              style={{ background: GRADIENT }}
            >
              Back to Dashboard
            </Link>
          </div>

          <div
            className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-hibiscus mb-6 opacity-0"
            style={{
              animation: mounted ? "popFadeUp 0.6s ease-out forwards" : "none",
              animationDelay: "80ms",
            }}
          >
            <span
              className="h-px bg-hibiscus/50 transition-all duration-700 ease-out"
              style={{ width: mounted ? 20 : 0 }}
            />
            Terms of Service
          </div>

          <h1
            className="font-sans font-bold text-reef-navy text-[2.1rem] md:text-[3.1rem] leading-[1.14] tracking-tight mb-5 opacity-0"
            style={{
              animation: mounted ? "popFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
              animationDelay: "160ms",
            }}
          >
            Honolua{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: GRADIENT }}
            >
              Terms of Service
            </span>
          </h1>

          <p
            className="text-lava/65 text-base md:text-lg mb-10 opacity-0"
            style={{
              animation: mounted ? "popFadeUp 0.7s ease-out forwards" : "none",
              animationDelay: "260ms",
            }}
          >
            Last updated: {LAST_UPDATED}
          </p>

          <div
            className="rounded-[28px] border bg-white/80 backdrop-blur-sm overflow-hidden relative z-10"
            style={{
              borderColor: "rgba(230,115,111,0.14)",
              boxShadow: "0 20px 45px -25px rgba(230,115,111,0.20)",
            }}
          >
            {SECTIONS.map((section, i) => (
              <SectionBlock
                key={section.id}
                section={section}
                index={i}
                isLast={i === SECTIONS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}