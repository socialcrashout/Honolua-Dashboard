"use client";

import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

function DropText({ text, inView, delayStart = 0, staggerMs = 45 }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top">
          <span
            className="inline-block opacity-0"
            style={{
              animation: inView
                ? "wordDrop 0.5s cubic-bezier(0.16,1,0.3,1) forwards"
                : "none",
              animationDelay: inView ? `${delayStart + i * staggerMs}ms` : "0ms",
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

function DiscordIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.21.375-.444.87-.608 1.262a18.27 18.27 0 0 0-5.9 0A12.6 12.6 0 0 0 9.442 3 19.79 19.79 0 0 0 5.68 4.37C2.995 8.36 2.26 12.25 2.628 16.09a19.9 19.9 0 0 0 5.994 3.03c.484-.66.914-1.36 1.284-2.1a12.9 12.9 0 0 1-2.02-.97c.17-.124.336-.253.497-.386 3.9 1.8 8.13 1.8 11.98 0 .163.135.33.264.497.386-.643.38-1.32.7-2.02.97.37.74.8 1.44 1.284 2.1a19.87 19.87 0 0 0 5.994-3.03c.432-4.45-.727-8.31-3.42-11.72ZM9.68 13.69c-1.17 0-2.13-1.07-2.13-2.39 0-1.31.94-2.39 2.13-2.39 1.2 0 2.15 1.09 2.13 2.39 0 1.32-.94 2.39-2.13 2.39Zm6.64 0c-1.17 0-2.13-1.07-2.13-2.39 0-1.31.94-2.39 2.13-2.39 1.2 0 2.15 1.09 2.13 2.39 0 1.32-.93 2.39-2.13 2.39Z" />
    </svg>
  );
}

function RobloxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.24 0 0 15.62 15.62 24l8.14-15.76L4.24 0Zm5.29 8.53 6.02 1.6-1.6 6.02-6.02-1.6 1.6-6.02Z" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.7L4.8 22H1.6l8.1-9.3L1 2h7l4.9 6.1L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z" />
    </svg>
  );
}

const SOCIALS = [
  { label: "Discord", href: "#", Icon: DiscordIcon },
  { label: "Roblox", href: "#", Icon: RobloxIcon },
  { label: "X", href: "#", Icon: XIcon },
];

const LEGAL_LINKS = ["Terms of Service", "Privacy Policy"];

export default function Footer() {
  const [ref, inView] = useInView(0.2);

  return (
    <footer
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%)",
      }}
      className="pt-10 pb-7"
    >
      <style>{`
        @keyframes wordDrop {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes colFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .footer-link {
          position: relative;
        }
        .footer-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 1.5px;
          background: linear-gradient(90deg, #F5BF83, #F2A8A5, #F08DB9);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .footer-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .footer-social {
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), color 0.25s ease;
        }
        .footer-social:hover {
          transform: translateY(-3px) rotate(-8deg) scale(1.15);
        }
      `}</style>

      <div ref={ref} className="max-w-[1240px] mx-auto px-6 md:px-8">
        <div className="flex justify-between items-start flex-wrap gap-8 pb-6">
          <div
            className="opacity-0"
            style={{
              animation: inView ? "colFadeUp 0.6s ease-out forwards" : "none",
            }}
          >
            <a
              href="#home"
              className="flex items-center gap-2.5 font-serif italic font-semibold text-xl text-reef-navy mb-3"
            >
              <img
                src="/INITIAL%20(1).png"
                alt="Honolua logo"
                className="w-6 h-6 rounded-full shrink-0 object-cover"
              />
              Honolua Management Dashboard
            </a>
            <span className="inline-flex items-center gap-1.5 text-xs text-lava/45">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All services online
            </span>
          </div>

          <div
            className="opacity-0"
            style={{
              animation: inView ? "colFadeUp 0.6s ease-out forwards" : "none",
              animationDelay: inView ? "120ms" : "0ms",
            }}
          >
            <h4 className="text-xs tracking-[0.1em] uppercase text-reef-navy/40 mb-4">
              Workspace
            </h4>
            <a
              href="#"
              className="footer-link inline-block text-lava/65 text-sm"
            >
              Dashboard
            </a>
          </div>

          <div
            className="opacity-0 flex flex-col items-start sm:items-end gap-3"
            style={{
              animation: inView ? "colFadeUp 0.6s ease-out forwards" : "none",
              animationDelay: inView ? "200ms" : "0ms",
            }}
          >
            <div className="flex gap-5">
              {LEGAL_LINKS.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="footer-link text-xs text-lava/50"
                >
                  {link}
                </a>
              ))}
            </div>
            <div className="flex gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="footer-social text-lava/40 hover:text-hibiscus"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between flex-wrap gap-3 pt-5 border-t border-lava/10 text-xs text-reef-navy/35">
          <span>
            <DropText text="Honolua Workspace" inView={inView} delayStart={380} staggerMs={50} />
          </span>
          <span>
            <DropText
              text="Built for Honolua staff."
              inView={inView}
              delayStart={440}
              staggerMs={30}
            />
          </span>
        </div>
      </div>
    </footer>
  );
}