"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "Home", href: "/", type: "route" },
  { label: "Team", href: "/team", type: "route" },
  { label: "About", href: "#cta", type: "anchor" },
];

const NAV_GRADIENT = "linear-gradient(90deg, #F4B942 0%, #FF7A59 50%, #F472B6 100%)";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header id="home" className="absolute top-0 left-0 right-0 z-30 pt-7">
      <style>{`
        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes navUnfold {
          from { opacity: 0; transform: scaleY(0.85) translateY(-6px); }
          to { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        @keyframes navLinkIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <nav
        className="max-w-[1240px] mx-auto px-6 md:px-8 flex items-center justify-between opacity-0"
        style={{ animation: "navDropIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}
      >
        <Link href="/" className="flex items-center gap-2.5 font-sans font-bold text-2xl text-reef-navy">
          <img
            src="/logo.png"
            alt="Honolua logo"
            className="h-9 w-auto shrink-0" />
          Honolua
        </Link>

        <ul className="hidden md:flex gap-2">
          {LINKS.map((l) => (
            <li key={l.label}>
              {l.type === "route" ? (
                <Link
                  href={l.href}
                  className="relative inline-block text-sm font-semibold text-reef-navy/70 hover:text-reef-navy transition-colors duration-200 px-4 py-2 rounded-full overflow-hidden"
                >
                  <span
                    className="absolute inset-0 scale-75 opacity-0 hover:scale-100 hover:opacity-100 transition-all duration-300 ease-out rounded-full"
                    style={{ background: "rgba(217,119,87,0.10)" }}
                  />
                  <span className="relative">{l.label}</span>
                </Link>
              ) : (
                <a
                  href={l.href}
                  className="relative inline-block text-sm font-semibold text-reef-navy/70 hover:text-reef-navy transition-colors duration-200 px-4 py-2 rounded-full overflow-hidden"
                >
                  <span
                    className="absolute inset-0 scale-75 opacity-0 hover:scale-100 hover:opacity-100 transition-all duration-300 ease-out rounded-full"
                    style={{ background: "rgba(217,119,87,0.10)" }}
                  />
                  <span className="relative">{l.label}</span>
                </a>
              )}
            </li>
          ))}
        </ul>

        <Link
          href="/workspace-verify"
          className="hidden md:inline-flex text-reef-navy-deep font-bold text-sm px-5 py-2.5 rounded-full hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,122,89,0.35)] transition-all duration-300 whitespace-nowrap"
          style={{ background: NAV_GRADIENT }}
        >
          Enter Honolua
        </Link>

        <button
          className="md:hidden relative text-reef-navy w-[26px] h-[26px]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Menu
            size={26}
            className={`absolute inset-0 transition-all duration-300 ${
              open ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            size={26}
            className={`absolute inset-0 transition-all duration-300 ${
              open ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
            }`}
          />
        </button>
      </nav>

      {open && (
        <div
          className="md:hidden mx-6 mt-4 rounded-2xl bg-white shadow-lg border border-lava/10 p-6 flex flex-col gap-4 origin-top"
          style={{ animation: "navUnfold 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          {LINKS.map((l, i) =>
            l.type === "route" ? (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 text-reef-navy/80 font-semibold text-sm opacity-0"
                style={{
                  animation: "navLinkIn 0.35s ease-out forwards",
                  animationDelay: `${0.1 + i * 0.06}s`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: NAV_GRADIENT }}
                />
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 text-reef-navy/80 font-semibold text-sm opacity-0"
                style={{
                  animation: "navLinkIn 0.35s ease-out forwards",
                  animationDelay: `${0.1 + i * 0.06}s`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: NAV_GRADIENT }}
                />
                {l.label}
              </a>
            )
          )}

          <Link
            href="/workspace-verify"
            onClick={() => setOpen(false)}
            className="text-reef-navy-deep font-bold text-sm px-5 py-2.5 rounded-full text-center opacity-0"
            style={{
              background: NAV_GRADIENT,
              animation: "navLinkIn 0.35s ease-out forwards",
              animationDelay: `${0.1 + LINKS.length * 0.06}s`,
            }}
          >
            Enter Honolua
          </Link>
        </div>
      )}
    </header>
  );
}
