"use client";

import Nav from "../components/Nav.js";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <section className="max-w-3xl">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">Honolua Dashboard</p>
          <h1 className="mt-4 text-balance text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Manage your workspace with clarity.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            Review verification activity, workspace status, and team updates from one focused dashboard.
          </p>
        </section>
        <div className="flex flex-wrap gap-4">
          <a className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground" href="/dashboard">
            Open dashboard
          </a>
          <a className="rounded-full border border-border px-6 py-3 font-semibold text-foreground" href="/team">
            View team
          </a>
        </div>
      </main>
    </div>
  );
}
