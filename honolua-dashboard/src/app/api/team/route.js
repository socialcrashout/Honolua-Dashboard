// api/team/route.js
// Vercel serverless function — runs server-side, avoids Roblox CORS restrictions.
import { NextResponse } from "next/server";

const GROUP_ID = 743137138;

const ROBLOX_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
};

// Define your teams here, in the order you want them displayed.
// Each team can be filled in with EITHER:
//   - roleIds: the actual Roblox role ID (a big number like 534788067)
//   - ranks:   the role's rank number on Roblox's 1-255 scale
// You can use whichever you have on hand — no need to convert.
//
// NOT SURE OF THE REAL VALUES? Deploy this file, hit /api/team once, then
// check your Vercel function logs for "/api/team ALL GROUP ROLES" — it
// prints every real {id, name, rank} for this group.
const TEAMS = [
  {
    key: "leadership",
    label: "Leadership Team",
    ranks: [255, 253, 251, 248, 246, 242],
    roleIds: [],
    roleNames: ["Owner", "Co-owner", "President", "Vice President", "Island Head Developer", "Board of Directors"],
  },
  {
    key: "executive",
    label: "Executive Team",
    ranks: [188, 185, 183, 180],
    roleIds: [],
    roleNames: ["Executive Director", "Executive Officer", "Executive Assistant", "Executive Intern"],
  },
  {
    key: "management",
    label: "Management Team",
    ranks: [178, 175, 172, 169],
    roleIds: [],
    roleNames: ["Restaurant Manager", "Assistant Manager", "Restaurant Supervisor", "Restaurant Assistant"],
  },
  {
    key: "ownership",
    label: "Ownership Team",
    ranks: [],
    roleIds: [],
    roleNames: ["Island Developer"],
  },
  {
    key: "corporate",
    label: "Corporate Team",
    ranks: [],
    roleIds: [],
    roleNames: [],
  },
];

const normalizeRoleValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// Flatten to quick lookups: roleId -> team, role name -> team, and rank -> team.
// Role names are prioritized because Roblox ranks can repeat across different roles.
const ROLE_ID_TO_TEAM = {};
const ROLE_NAME_TO_TEAM = {};
const RANK_TO_TEAM = {};
for (const team of TEAMS) {
  for (const id of team.roleIds || []) {
    ROLE_ID_TO_TEAM[id] = team;
  }
  for (const name of team.roleNames || []) {
    ROLE_NAME_TO_TEAM[normalizeRoleValue(name)] = team;
  }
  for (const rank of team.ranks || []) {
    RANK_TO_TEAM[rank] = team;
  }
}

function teamForRole(role) {
  if (!role) return null;

  if (role.id != null && ROLE_ID_TO_TEAM[role.id]) {
    return ROLE_ID_TO_TEAM[role.id];
  }

  const normalizedName = normalizeRoleValue(role.name);
  if (normalizedName) {
    const exactNameMatch = ROLE_NAME_TO_TEAM[normalizedName];
    if (exactNameMatch) return exactNameMatch;

    const partialNameMatch = Object.entries(ROLE_NAME_TO_TEAM).find(
      ([name]) => name.includes(normalizedName) || normalizedName.includes(name)
    );
    if (partialNameMatch) return partialNameMatch[1];
  }

  if (role.rank != null && RANK_TO_TEAM[role.rank]) {
    return RANK_TO_TEAM[role.rank];
  }

  return null;
}

export async function GET() {
  try {
    console.log("/api/team GET start", { GROUP_ID, teamCount: TEAMS.length });

    // 1. Get the group's role list — used only for logging/reference now
    //    (we no longer query per-role, so this isn't required for matching,
    //    but it's cheap and useful to keep in the logs).
    const rolesRes = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`, {
      headers: ROBLOX_HEADERS,
    });
    if (rolesRes.ok) {
      const rolesData = await rolesRes.json();
      console.log("/api/team roles fetched", { rolesFound: rolesData.roles?.length || 0 });
    } else {
      console.error("Failed to fetch group roles (non-fatal, continuing)", {
        status: rolesRes.status,
        statusText: rolesRes.statusText,
      });
    }

    // 2. Page through ALL group members ONCE (single endpoint, not one call
    //    per role) — each item includes { user, roles }, so we can
    //    filter/group locally instead of hammering Roblox with 15+ rapid
    //    per-role requests (which was triggering bot/rate-limit blocks).
    let members = [];
    let cursor = "";
    let page = 0;
    do {
      page += 1;
      // Roblox's v1 member endpoint has been retired; v2 returns roles as an
      // array because members may hold more than one role.
      const url = `https://groups.roblox.com/v2/groups/${GROUP_ID}/users?limit=100&sortOrder=Asc${
        cursor ? `&cursor=${cursor}` : ""
      }`;
      const usersRes = await fetch(url, { headers: ROBLOX_HEADERS });
      if (!usersRes.ok) {
        const bodyText = await usersRes.text().catch(() => "<could not read body>");
        console.error("Failed to fetch group members page", {
          page,
          url,
          status: usersRes.status,
          statusText: usersRes.statusText,
          body: bodyText,
        });
        break;
      }
      const usersData = await usersRes.json();
      console.log("/api/team members page", {
        page,
        usersFetched: usersData.data.length,
        nextCursor: !!usersData.nextPageCursor,
      });

      for (const entry of usersData.data || []) {
        // Pick the highest matching configured team role if someone has
        // multiple roles, and emit one card per member.
        const matchingRoles = (entry.roles || [])
          .map((role) => ({ role, team: teamForRole(role) }))
          .filter(({ team }) => team)
          .sort((a, b) => b.role.rank - a.role.rank);
        const match = matchingRoles[0];
        if (!match) continue; // no displayed team role — skip
        members.push({
          userId: entry.user.userId,
          username: entry.user.username,
          displayName: entry.user.displayName,
          roleName: match.role.name,
          rank: match.role.rank,
          teamKey: match.team.key,
          teamLabel: match.team.label,
        });
      }

      cursor = usersData.nextPageCursor;

      // Small delay between pages so we don't look like scraping.
      if (cursor) await new Promise((r) => setTimeout(r, 150));
    } while (cursor);

    console.log("/api/team members total", { totalMembers: members.length });

    // 3. Batch-fetch live avatar headshots (max 100 ids per request)
    const avatarMap = {};
    const userIds = members.map((m) => m.userId);

    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const thumbUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${batch.join(
        ","
      )}&size=420x420&format=Png&isCircular=false`;
      const thumbRes = await fetch(thumbUrl, { headers: ROBLOX_HEADERS });
      if (!thumbRes.ok) {
        console.error("Failed to fetch thumbnails for batch", {
          batchSize: batch.length,
          status: thumbRes.status,
          statusText: thumbRes.statusText,
        });
        continue;
      }
      const thumbData = await thumbRes.json();
      console.log("/api/team thumbnail batch response", {
        batchSize: batch.length,
        dataLength: thumbData.data?.length || 0,
        sample: thumbData.data?.slice(0, 2),
      });
      thumbData.data.forEach((d) => {
        avatarMap[d.targetId] = d.imageUrl;
      });
    }

    console.log("/api/team avatars fetched", { avatarCount: Object.keys(avatarMap).length });

    const withAvatars = members.map((m) => ({
      ...m,
      avatarUrl: avatarMap[m.userId] || null,
    }));

    // Presence is public Roblox data; experience names can be hidden by a
    // member's privacy settings. Only resolve names Roblox exposes directly.
    const presenceByUserId = {};
    const universeIds = new Set();
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100).map(Number).filter(Number.isSafeInteger);
      if (!batch.length) continue;
      try {
        const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
          method: "POST",
          headers: { ...ROBLOX_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: batch }),
          cache: "no-store",
        });
        if (!presenceRes.ok) continue;
        const presenceData = await presenceRes.json();
        for (const presence of presenceData.userPresences || []) {
          const userId = String(presence.userId);
          const playing = Number(presence.userPresenceType) === 2;
          const universeId = playing && presence.universeId ? String(presence.universeId) : null;
          presenceByUserId[userId] = { presenceType: Number(presence.userPresenceType), universeId };
          if (universeId) universeIds.add(universeId);
        }
      } catch (presenceError) {
        console.warn("Roblox presence lookup unavailable", { batchSize: batch.length, error: presenceError?.message });
      }
    }

    const experienceNames = {};
    const uniqueUniverseIds = Array.from(universeIds);
    for (let i = 0; i < uniqueUniverseIds.length; i += 50) {
      const batch = uniqueUniverseIds.slice(i, i + 50);
      try {
        const gamesRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${batch.join(",")}`, {
          headers: ROBLOX_HEADERS,
          cache: "no-store",
        });
        if (!gamesRes.ok) continue;
        const gamesData = await gamesRes.json();
        for (const game of gamesData.data || []) experienceNames[String(game.id)] = game.name;
      } catch (gameError) {
        console.warn("Roblox experience name lookup unavailable", { batchSize: batch.length, error: gameError?.message });
      }
    }

    for (const member of withAvatars) {
      const presence = presenceByUserId[String(member.userId)];
      member.presenceType = Number.isInteger(presence?.presenceType) ? presence.presenceType : null;
      member.experienceName = presence?.universeId ? experienceNames[presence.universeId] || null : null;
    }

    // 4. Group into { leadership: [...], executive: [...], ... }, preserving TEAMS order
    const grouped = {};
    for (const team of TEAMS) {
      grouped[team.key] = withAvatars
        .filter((m) => m.teamKey === team.key)
        .sort((a, b) => b.rank - a.rank);
    }

    const groupedCounts = Object.fromEntries(Object.keys(grouped).map((k) => [k, grouped[k].length]));
    console.log("/api/team grouped counts", { groupedCounts });

    return NextResponse.json(
      {
        teams: TEAMS.map((t) => ({ key: t.key, label: t.label })),
        members: grouped,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("Team fetch error:", err);
    return NextResponse.json({ error: "Failed to load team data" }, { status: 500 });
  }
}
