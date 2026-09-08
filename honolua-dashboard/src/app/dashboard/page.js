"use client";

import { useEffect, useState } from "react";

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

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%), radial-gradient(85% 65% at 8% 100%, rgba(244,114,182,0.08), transparent 60%), radial-gradient(70% 50% at 95% 0%, rgba(244,185,66,0.10), transparent 60%)",
      }}
    >
      <div className="px-6 pt-10">
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Workspace overview</h1>
          <p className="mt-3 text-muted-foreground">Your dashboard modules will appear here.</p>
        </section>
      </div>
    </div>
  );
}
