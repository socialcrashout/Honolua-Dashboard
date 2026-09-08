"use client";

import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    n: "01",
    title: "Operations",
    desc: "Coordinate shifts, sessions, tasks, and daily restaurant activity through one streamlined workspace.",
  },
  {
    n: "02",
    title: "Management",
    desc: "Oversee staff, departments, responsibilities, and performance with a clear and organized system.",
  },
  {
    n: "03",
    title: "Community",
    desc: "Keep Honolua connected with a centralized space built around its staff, culture, and island-inspired experience.",
  },
];

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
                ? "wordDrop 0.6s cubic-bezier(0.16,1,0.3,1) forwards"
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

export default function DesignedForHonolua() {
  const [headerRef, headerInView] = useInView(0.3);
  const [cardsRef, cardsInView] = useInView(0.15);

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%)",
      }}
      className="py-24 md:py-28"
    >
      <style>{`
        @keyframes wordDrop {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes featureCardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="max-w-[1240px] mx-auto px-6 md:px-8">
        <div ref={headerRef} className="mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase text-hibiscus mb-5">
            <span
              className="h-px bg-hibiscus/60 transition-all duration-700 ease-out"
              style={{ width: headerInView ? 20 : 0 }}
            />
            Designed for Honolua
          </div>
          <h2 className="font-serif italic font-medium text-reef-navy text-3xl md:text-5xl max-w-[640px] leading-tight">
            <DropText
              text="Everything your team needs, all in one place."
              play={headerInView}
              delayStart={100}
              staggerMs={50}
            />
          </h2>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.n}
              className="group relative rounded-[26px] p-8 bg-white border border-lava/10 opacity-0 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5"
              style={{
                animation: cardsInView
                  ? "featureCardIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards"
                  : "none",
                animationDelay: cardsInView ? `${i * 150}ms` : "0ms",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{
                  padding: 1.5,
                  background: "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <div
                className="font-serif italic font-bold text-4xl mb-6 bg-clip-text text-transparent transition-transform duration-500 ease-out group-hover:rotate-[8deg] group-hover:scale-110 inline-block"
                style={{
                  backgroundImage: "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)",
                  transformOrigin: "left center",
                }}
              >
                {f.n}
              </div>
              <h3 className="font-sans font-bold text-xl text-reef-navy mb-3">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-lava/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}