"use client";

import { useEffect, useState } from "react";
import ComingSoonDoc from "@/components/temp";
import Sidebar from "@/components/Sidebar";

const stats = [
  {
    label: "Staff On Duty",
    value: "9",
    delta: "+2 today",
    tone: "up",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M11 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 10v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: "bg-amber-100",
  },
  {
    label: "Active LOAs",
    value: "3",
    delta: "1 ending soon",
    tone: "neutral",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 8v4l3 3" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" stroke="#EC4899" strokeWidth="1.8"/>
      </svg>
    ),
    iconBg: "bg-pink-100",
  },
  {
    label: "Open Infractions",
    value: "7",
    delta: "2 new this week",
    tone: "down",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: "bg-red-100",
  },
  {
    label: "Sessions This Week",
    value: "14",
    delta: "on track",
    tone: "up",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="#D97706" strokeWidth="1.8"/>
        <path d="M3 9h18M8 2v4M16 2v4" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: "bg-amber-100",
  },
];

const activity = [
  { name: "Alex Rivera", action: "hosted a training session", time: "2h ago", tag: "Session" },
  { name: "Taylor Brooks", action: "was issued a strike — AFK during patrol", time: "3h ago", tag: "Infraction" },
  { name: "Jordan Kim", action: "LOA request approved through Sep 20", time: "5h ago", tag: "LOA" },
  { name: "Casey Morgan", action: "promoted to Senior Moderator", time: "6h ago", tag: "Rank" },
  { name: "Riley Chen", action: "submitted a new staff application", time: "8h ago", tag: "Application" },
];

const tagStyles = {
  Session: "bg-amber-100 text-amber-800",
  Infraction: "bg-red-100 text-red-700",
  LOA: "bg-pink-100 text-pink-700",
  Rank: "bg-emerald-100 text-emerald-700",
  Application: "bg-orange-100 text-orange-700",
};

const quickLinks = [
  { label: "View Staff Roster" },
  { label: "My LOA" },
  { label: "Infraction Log" },
  { label: "Session Schedule" },
  { label: "Settings" },
];

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workspace/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%), radial-gradient(85% 65% at 8% 100%, rgba(244,114,182,0.08), transparent 60%), radial-gradient(70% 50% at 95% 0%, rgba(244,185,66,0.10), transparent 60%)",
      }}
    >
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-stone-500 text-sm">Welcome back,</p>
                <h1 className="text-4xl font-bold text-stone-900 tracking-tight">
                  {status?.username || "Staff"}
                </h1>
                <p className="text-stone-500 mt-1">
                  {loading
                    ? "Loading your workspace…"
                    : "Here's what's happening across the team today."}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 backdrop-blur px-4 py-2 text-sm text-stone-600">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <rect x="3" y="4" width="18" height="17" rx="2" stroke="#78716C" strokeWidth="1.6"/>
                  <path d="M3 9h18M8 2v4M16 2v4" stroke="#78716C" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                {today}
              </div>
            </div>

            {/* Stats — one banded panel, divided, instead of four identical cards */}
            <div className="mb-8 overflow-hidden rounded-[28px] border border-stone-200 bg-white/70 backdrop-blur shadow-sm">
              <div className="grid grid-cols-1 divide-y divide-stone-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="p-5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${s.iconBg}`}>
                      {s.icon}
                    </div>
                    <p className="text-stone-500 text-sm">{s.label}</p>
                    <p className="text-3xl font-bold text-stone-900 mt-1">{s.value}</p>
                    <p className="text-xs text-stone-400 mt-2">{s.delta}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity + Quick links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 overflow-hidden rounded-[28px] border border-stone-200 bg-white/70 backdrop-blur shadow-sm">
                <div className="flex items-center justify-between p-6 pb-4">
                  <h2 className="text-lg font-semibold text-stone-900">Recent Activity</h2>
                  <button className="text-sm font-semibold text-amber-700 hover:text-amber-800">
                    View all
                  </button>
                </div>
                <div className="divide-y divide-stone-100 px-6 pb-2">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-600">
                          {a.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-800">{a.name}</p>
                          <p className="text-xs text-stone-500">{a.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${tagStyles[a.tag]}`}>
                          {a.tag}
                        </span>
                        <span className="text-xs text-stone-400 w-14 text-right">{a.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-stone-200 bg-white/70 backdrop-blur p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">Quick Links</h2>
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((q) => (
                    <button
                      key={q.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}