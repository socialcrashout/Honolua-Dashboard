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
    title: "Information We Handle",
    intro:
      "Depending on how you interact with Honolua, we may process information such as:",
    list: [
      "Roblox username, user ID, display name, avatar, and group information",
      "Honolua ranks, departments, and staff assignments",
      "Staff activity and session participation",
      "Moderation actions, warnings, and internal staff records",
      "Information submitted through applications, forms, tickets, or verification systems",
      "Basic information required to maintain sessions and provide access to Honolua services",
    ],
    outro:
      "We only aim to collect information that is reasonably necessary to operate and manage the community.",
  },
  {
    id: "02",
    title: "Why We Use It",
    intro: "Information may be used to:",
    list: [
      "Verify Roblox or Discord membership",
      "Provide access to Honolua systems and staff areas",
      "Manage ranks, departments, and internal responsibilities",
      "Track community and staff activity",
      "Process applications and staff requests",
      "Maintain moderation and administrative records",
      "Improve the reliability and functionality of Honolua services",
      "Protect the community against abuse, exploitation, or unauthorized access",
    ],
  },
  {
    id: "03",
    title: "Access & Visibility",
    paragraphs: [
      "All information handled by Honolua is private and may only be viewed by the Owner. No staff member, department member, administrator, moderator, or other user is permitted to access, review, share, or distribute Honolua data unless the Owner has provided explicit authorization.",
      "Honolua information must not be copied, exported, disclosed, or used for personal purposes. Any access granted by the Owner must be limited to the specific purpose approved by the Owner and may be revoked at any time.",
      "Public-facing information may be visible to community members when necessary for normal Honolua operations. However, private records, moderation information, staff notes, applications, tickets, verification data, and other internal information remain restricted to the Owner unless otherwise authorized.",
      "Unauthorized access or disclosure of Honolua information may result in removal from staff, loss of access, disciplinary action, or other appropriate measures.",
    ],
  },
  {
    id: "04",
    title: "Third-Party Platforms",
    paragraphs: [
      "Honolua may rely on platforms such as Roblox and Discord to provide community and account-related functionality. Information processed through those platforms may also be subject to their respective privacy policies and terms.",
      "Honolua does not control how external platforms independently process information.",
    ],
  },
  {
    id: "05",
    title: "Protection of Information",
    paragraphs: [
      "Reasonable administrative and technical measures are used to prevent unauthorized access to Honolua information. Access permissions are strictly controlled by the Owner, and sensitive systems may require authenticated access.",
      "However, no online service can guarantee complete security, and users should avoid submitting unnecessary private information.",
    ],
  },
  {
    id: "06",
    title: "Retention & Removal",
    paragraphs: [
      "Information may be retained for as long as it is reasonably required for community management, moderation, security, or operational purposes.",
      "If information is no longer necessary, Honolua may remove or anonymize it where appropriate. Certain records may be retained when necessary for security, moderation history, or administrative purposes.",
    ],
  },
  {
    id: "07",
    title: "Changes to This Policy",
    paragraphs: [
      "Honolua may revise this Privacy Policy when its systems, services, or data practices change. Updates will be reflected in the policy's Last Updated date.",
      "Continued use of Honolua services after an update means the revised policy applies to future use.",
    ],
  },
  {
    id: "08",
    title: "Questions & Requests",
    paragraphs: [
      "If you have a question regarding information handled by Honolua, or believe information associated with you needs to be corrected or removed, contact the Owner.",
      "All requests will be reviewed by the Owner based on the nature of the information and the reason it is being retained.",
    ],
  },
];

const GRADIENT = "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)";

/* ---------------------------------------------------------
   useReveal — tiny in-view hook for scroll animations.
   Swap this out for your existing RevealOnScroll.js if you'd
   rather keep animation logic in one shared place.
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

      {section.intro && (
        <p className="text-lava/70 leading-relaxed mb-4 pl-[60px] md:pl-[64px]">
          {section.intro}
        </p>
      )}

      {section.list && (
        <ul className="space-y-2.5 mb-4 pl-[60px] md:pl-[64px]">
          {section.list.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-lava/70 leading-relaxed"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-8px)",
                transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                transitionDelay: visible ? `${150 + i * 55}ms` : "0ms",
              }}
            >
              <span
                className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: GRADIENT }}
              />
              {item}
            </li>
          ))}
        </ul>
      )}

      {section.paragraphs &&
        section.paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-lava/70 leading-relaxed pl-[60px] md:pl-[64px] mb-3 last:mb-0"
          >
            {p}
          </p>
        ))}

      {section.outro && (
        <p className="text-lava/70 leading-relaxed pl-[60px] md:pl-[64px] mt-4 pt-4 border-t border-hibiscus/10">
          {section.outro}
        </p>
      )}
    </div>
  );
}

export default function PrivacyPolicy() {
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
    <div className="relative">
      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(14px, -18px) scale(1.06); }
        }
        @keyframes popFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-6px) rotate(4deg); }
        }
      `}</style>

      {/* scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{ width: `${scrollPct}%`, background: GRADIENT }}
        />
      </div>

      <section
        className="relative overflow-hidden pt-14 md:pt-20 pb-14"
        style={{
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%), radial-gradient(85% 65% at 8% 100%, rgba(244,114,182,0.08), transparent 60%), radial-gradient(70% 50% at 95% 0%, rgba(244,185,66,0.10), transparent 60%)",
        }}
      >
        {/* decorative floating blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 rounded-full blur-3xl opacity-40"
          style={{ background: "#F4B942", animation: "floatBlob 9s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-24 right-0 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ background: "#F472B6", animation: "floatBlob 11s ease-in-out infinite 1.5s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute select-none text-4xl"
          style={{ top: "18%", left: "6%", animation: "bob 6s ease-in-out infinite" }}
        >
          🌺
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute select-none text-3xl"
          style={{ top: "10%", right: "10%", animation: "bob 7s ease-in-out infinite 0.8s" }}
        >
          🌴
        </div>

        <div className="max-w-[860px] mx-auto px-6 md:px-8 relative">
          {/* top bar */}
          <div
            className="flex items-center justify-between mb-14 md:mb-20 opacity-0"
            style={{
              animation: mounted ? "popFadeUp 0.6s ease-out forwards" : "none",
            }}
          >
            <Link href="/" className="inline-flex items-center">
              <img src="/typo.png" alt="Honolua" className="h-7 md:h-8 w-auto" />
            </Link>
            <Link
              href="/"
              className="text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-full shadow-[0_10px_30px_-8px_rgba(230,115,111,0.4)] hover:-translate-y-0.5 transition-transform"
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
            Privacy Policy
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
              Privacy Policy
            </span>
          </h1>

          <p
            className="text-lava/65 text-base md:text-lg mb-3 opacity-0"
            style={{
              animation: mounted ? "popFadeUp 0.7s ease-out forwards" : "none",
              animationDelay: "260ms",
            }}
          >
            Last updated: {LAST_UPDATED}
          </p>

          <p
            className="text-lava/70 leading-relaxed max-w-[620px] opacity-0"
            style={{
              animation: mounted ? "popFadeUp 0.7s ease-out forwards" : "none",
              animationDelay: "340ms",
            }}
          >
            Honolua values the privacy of its community members, staff, and users. This
            policy explains what information may be handled through Honolua's Roblox
            groups, Discord server, internal systems, and related services. 🌊
          </p>
        </div>
      </section>

      <section className="relative bg-white pb-24">
        <div className="max-w-[860px] mx-auto px-6 md:px-8 -mt-6 md:-mt-8 space-y-6 relative z-10">
          <div
            className="rounded-[28px] border bg-white/80 backdrop-blur-sm overflow-hidden"
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

          {/* contact CTA */}
          <div
            className="relative rounded-[28px] px-7 py-10 md:px-10 md:py-12 text-center overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, #FFF8EF 0%, #FDEFE0 55%, #FFF6EC 100%)",
              border: "1px solid rgba(230,115,111,0.15)",
            }}
          >
            <div className="text-3xl mb-3">🌸</div>
            <h3 className="font-sans font-bold text-reef-navy text-xl md:text-2xl mb-2">
              Have a question or a request?
            </h3>
            <p className="text-lava/70 leading-relaxed max-w-[440px] mx-auto mb-6">
              Reach out to the Owner about anything in this policy, or if you'd like
              information corrected or removed.
            </p>
            {/* TODO: point this at your actual contact channel (Discord, form, etc.) */}
            <a
              href="#"
              className="inline-block text-white font-extrabold text-sm px-7 py-4 rounded-full shadow-[0_10px_30px_-8px_rgba(230,115,111,0.4)] hover:-translate-y-0.5 transition-transform"
              style={{ background: GRADIENT }}
            >
              Contact the Owner
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}