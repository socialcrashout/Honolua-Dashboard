"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav.js";
import Footer from "@/components/Footer.js";

function useStagger(count, active, baseDelay = 0, step = 60) {
  return Array.from({ length: count }, (_, i) => (active ? baseDelay + i * step : 0));
}

function MemberCard({ member, delay, visible }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const initials = (member.displayName || member.username || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="group flex flex-col items-center text-center opacity-0"
      style={{
        animation: visible ? "memberIn 0.55s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        animationDelay: `${delay}ms`,
        width: 132,
      }}
    >
      <div
        className="relative rounded-2xl p-[3px] transition-all duration-400 ease-out group-hover:scale-[1.06] group-hover:-translate-y-1"
        style={{ background: "linear-gradient(135deg, #F5BF83, #F2A8A5, #F08DB9)" }}
      >
        <div className="relative w-[92px] h-[92px] rounded-[14px] overflow-hidden bg-sand flex items-center justify-center">
          {!imgLoaded && (
            <span className="font-serif italic font-semibold text-lava/30 text-lg">
              {initials}
            </span>
          )}
          {member.avatarUrl && (
            <img
              src={member.avatarUrl}
              alt={member.displayName || member.username}
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </div>
        <span
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{ boxShadow: "0 0 0 6px rgba(242,168,165,0.18)" }}
        />
      </div>

      <div className="mt-3 font-sans font-bold text-sm text-reef-navy leading-tight">
        {member.displayName || member.username}
      </div>
      <div className="text-[11px] text-lava/45 leading-tight">@{member.username}</div>
      {member.roleName && (
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lava/50">
          {member.roleName}
        </div>
      )}
      {member.rank != null && (
        <div className="text-[10px] font-medium text-lava/40">Rank #{member.rank}</div>
      )}
    </div>
  );
}

function Tier({ label, members, tierIndex, visible }) {
  const delays = useStagger(members.length, visible, tierIndex * 120, 55);

  return (
    <div className="mb-16 last:mb-0">
      <div className="flex items-center gap-4 mb-8">
        <span className="h-px flex-1 max-w-[40px]" style={{ background: "linear-gradient(90deg, transparent, #F2A8A5)" }} />
        <h3 className="font-serif italic font-medium text-xl md:text-2xl text-reef-navy whitespace-nowrap">
          {label}
        </h3>
        <span className="text-xs font-semibold text-lava/40 tabular-nums">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
        <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, #F2A8A5, transparent)" }} />
      </div>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-10">
        {members.map((m, i) => (
          <MemberCard key={m.userId} member={m} delay={delays[i]} visible={visible} />
        ))}
      </div>
    </div>
  );
}

function TeamContent() {
  const [teams, setTeams] = useState(null);
  const [membersByTeam, setMembersByTeam] = useState(null);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        setTeams(data.teams || []);
        setMembersByTeam(data.members || {});
        requestAnimationFrame(() => setVisible(true));
      })
      .catch(() => setError("Couldn't load the team roster right now."));
  }, []);

  const totalMembers = membersByTeam
    ? Object.values(membersByTeam).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <section
      className="pt-40 pb-28 min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%)",
      }}
    >
      <style>{`
        @keyframes memberIn {
          from { opacity: 0; transform: translateY(14px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="max-w-[1000px] mx-auto px-6 md:px-8">
        <div className="text-center mb-16">
          <div className="text-xs font-bold tracking-[0.18em] uppercase text-hibiscus mb-4">
            Our People
          </div>
          <h1 className="font-serif italic font-medium text-reef-navy text-4xl md:text-6xl leading-tight mb-5">
            Meet the Honolua team.
          </h1>
          <p className="text-lg leading-relaxed text-lava/60 max-w-[520px] mx-auto">
            Meet the people behind Honolua — our dedicated team working
            behind the scenes to bring the experience to life.
          </p>
        </div>

        {error && <p className="text-center text-lava/50 text-sm">{error}</p>}

        {!teams && !error && (
          <div className="flex justify-center gap-6 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[92px] h-[92px] rounded-2xl bg-lava/5 animate-pulse" />
            ))}
          </div>
        )}

        {teams && totalMembers === 0 && !error && (
          <p className="text-center text-lava/50 text-sm">No members found yet.</p>
        )}

        {teams &&
          totalMembers > 0 &&
          teams.map(({ key, label }, i) => {
            const members = membersByTeam[key] || [];
            if (members.length === 0) return null;
            return (
              <Tier key={key} label={label} members={members} tierIndex={i} visible={visible} />
            );
          })}
      </div>
    </section>
  );
}

export default function Team() {
  return (
    <div className="min-h-screen">
      <Nav />
      <TeamContent />
    </div>
  );
}