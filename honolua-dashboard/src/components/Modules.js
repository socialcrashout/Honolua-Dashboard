"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

const MODULES = [
  {
    tag: "Daily",
    name: "Operations",
    desc: (
      <>
        Shifts, staff activity, departments, and daily tasks — organized in{" "}
        <strong className="text-hibiscus font-bold">one workspace</strong> so
        management can keep everything under control.
      </>
    ),
  },
  {
    tag: "Live",
    name: "Activity",
    desc: (
      <>
        A live feed of staff actions, sessions, and updates across Honolua —
        giving management a clear view of what's happening{" "}
        <strong className="text-hibiscus font-bold">without the guesswork</strong>.
      </>
    ),
  },
  {
    tag: "Before it closes",
    name: "Review",
    desc: (
      <>
        Completed tasks, staff actions, and important updates are{" "}
        <strong className="text-hibiscus font-bold">reviewed by management</strong>{" "}
        before they're finalized, keeping Honolua organized and accountable.
      </>
    ),
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

function DropText({ text, inView, delayStart = 0, staggerMs = 45 }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-top"
          style={{ verticalAlign: "top" }}
        >
          <span
            className="inline-block opacity-0"
            style={{
              animation: inView
                ? "wordDrop 0.6s cubic-bezier(0.16,1,0.3,1) forwards"
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

export default function Modules() {
  const [headerRef, headerInView] = useInView(0.3);
  const [rowsRef, rowsInView] = useInView(0.15);

  return (
    <section
      id="modules"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%)",
      }}
      className="py-24 md:py-28"
    >
      <style>{`
        @keyframes moduleFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wordDrop {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-[1240px] mx-auto px-6 md:px-8">
        <div
          ref={headerRef}
          className="flex justify-between items-end gap-10 flex-wrap mb-16"
        >
          <div>
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-hibiscus mb-3.5 flex items-center gap-2.5">
              <span
                className="h-px bg-hibiscus transition-all duration-700 ease-out"
                style={{ width: headerInView ? 20 : 0 }}
              />
              How it fits together
            </div>
            <h2 className="font-serif italic font-medium text-3xl md:text-4xl text-reef-navy max-w-[560px] leading-tight">
              <DropText
                text="One dashboard, live operations, and a clear view of your resort — all in one place."
                inView={headerInView}
                delayStart={150}
                staggerMs={40}
              />
            </h2>
          </div>
          <p className="max-w-[340px] text-base text-lava/60 leading-relaxed">
            <DropText
              text="Honolua keeps management organized with tools built around how your resort actually operates, from staff activity to daily operations."
              inView={headerInView}
              delayStart={500}
              staggerMs={18}
            />
          </p>
        </div>

        <div ref={rowsRef} className="flex flex-col">
          {MODULES.map((m, i) => (
            <div
              key={m.name}
              className="group grid grid-cols-[50px_1fr] md:grid-cols-[90px_1fr_1.1fr_28px] gap-6 md:gap-8 items-center py-9 border-t border-lava/15 last:border-b hover:pl-3.5 transition-[padding] duration-300 opacity-0"
              style={{
                animation: rowsInView
                  ? `moduleFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards`
                  : "none",
                animationDelay: rowsInView ? `${i * 140}ms` : "0ms",
              }}
            >
              <div className="font-serif italic text-lg text-lava/35">
                {m.tag}
              </div>
              <div className="font-serif italic font-semibold text-2xl md:text-3xl text-reef-navy">
                {m.name}
              </div>
              <div className="col-span-2 md:col-span-1 text-base leading-relaxed text-lava/65">
                {m.desc}
              </div>
              <ArrowRight
                className="hidden md:block text-hibiscus opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                size={20}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}