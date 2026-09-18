// api/team/route.js
// Vercel serverless function — runs server-side, avoids Roblox CORS restrictions.
import { NextResponse } from "next/server";

const GROUP_ID = 743137138;

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
    ranks: [255, 253, 251, 248, 246, 244],
    roleIds: [],
  },
  {
    key: "executive",
    label: "Executive Team",
    ranks: [242, 188, 185, 183, 180],
    roleIds: [],
  },
  {
    key: "management",
    label: "Management Team",
    ranks: [178, 175, 172, 169],
    roleIds: [],
  },
  {
    key: "ownership",
    label: "Ownership Team",
    ranks: [],
    roleIds: [
      534788067, // Vice Chairperson
      533420089, // Developer
      543554019, // Automation
      553418083, // Chairman
      533896073, // Holder
    ],
  },
  {
    key: "corporate",
    label: "Corporate Team",
    ranks: [],
    roleIds: [
      532298077, // Junior Director
      535386066, // Senior Director
      532346082, // Head Director
      532736129, // Corporate Intern
      532422121, // Junior Corporate
      533788115, // Senior Corporate
      533732073, // Head Corporate
      533348091, // Director Of Staff Management
      532338071, // Chief Public Relations Officer
      534132120, // Administrative Director
      539888069, // Presidential Assistant
    ],
  },
];

// Flatten to quick lookups: roleId -> team, and rank -> team
const ROLE_ID_TO_TEAM = {};
const RANK_TO_TEAM = {};
for (const team of TEAMS) {
  for (const id of team.roleIds || []) {
    ROLE_ID_TO_TEAM[id] = team;
  }
  for (const rank of team.ranks || []) {
    RANK_TO_TEAM[rank] = team;
  }
}

const ALL_ROLE_IDS = Object.keys(ROLE_ID_TO_TEAM).map(Number);
const ALL_RANKS = Object.keys(RANK_TO_TEAM).map(Number);

function teamForRole(role) {
  return ROLE_ID_TO_TEAM[role.id] || RANK_TO_TEAM[role.rank] || null;
}

export async function GET() {
  try {
    console.log("/api/team GET start", { GROUP_ID, teamCount: TEAMS.length });
    // 1. Get all group roles, keep only the ones we've assigned to a team
    //    (matched by exact role id OR by rank number)
    const rolesRes = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`);
    if (!rolesRes.ok) {
      console.error("Failed to fetch group roles", { status: rolesRes.status, statusText: rolesRes.statusText });
      throw new Error("Failed to fetch group roles");
    }
    const rolesData = await rolesRes.json();

    console.log("/api/team roles fetched", { rolesFound: rolesData.roles?.length || 0 });
    // TEMP DEBUG: dump every real role id/name/rank from Roblox so you can
    // compare them against the roleIds/ranks hardcoded in TEAMS above.
    // Remove this block once everything is confirmed correct.
    console.log(
      "/api/team ALL GROUP ROLES",
      rolesData.roles.map((r) => ({ id: r.id, name: r.name, rank: r.rank }))
    );

    const eligibleRoles = rolesData.roles.filter(
      (r) => ALL_ROLE_IDS.includes(r.id) || ALL_RANKS.includes(r.rank)
    );
    console.log("/api/team eligibleRoles", {
      count: eligibleRoles.length,
      names: eligibleRoles.map((r) => r.name),
    });

    // 2. For each eligible role, page through its members
    let members = [];
    for (const role of eligibleRoles) {
      const team = teamForRole(role);
      if (!team) continue;
      let cursor = "";
      do {
        const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/roles/${role.id}/users?limit=100${
          cursor ? `&cursor=${cursor}` : ""
        }`;
        const usersRes = await fetch(url);
        if (!usersRes.ok) {
          console.error("Failed to fetch users for role", { roleId: role.id, status: usersRes.status, statusText: usersRes.statusText });
          break;
        }
        const usersData = await usersRes.json();

        console.log("/api/team role page", { roleId: role.id, roleName: role.name, usersFetched: usersData.data.length, nextCursor: !!usersData.nextPageCursor });

        members.push(
          ...usersData.data.map((u) => ({
            userId: u.userId,
            username: u.username,
            displayName: u.displayName,
            roleName: role.name,
            rank: role.rank,
            teamKey: team.key,
            teamLabel: team.label,
          }))
        );

        cursor = usersData.nextPageCursor;
      } while (cursor);
    }

    console.log("/api/team members total", { totalMembers: members.length });

    // 3. Batch-fetch live avatar headshots (max 100 ids per request)
    const avatarMap = {};
    const userIds = members.map((m) => m.userId);

    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const thumbUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${batch.join(
        ","
      )}&size=420x420&format=Png&isCircular=false`;
      const thumbRes = await fetch(thumbUrl);
      if (!thumbRes.ok) {
        console.error("Failed to fetch thumbnails for batch", { batchSize: batch.length, status: thumbRes.status, statusText: thumbRes.statusText });
        continue;
      }
      const thumbData = await thumbRes.json();
      thumbData.data.forEach((d) => {
        avatarMap[d.targetId] = d.imageUrl;
      });
    }

    console.log("/api/team avatars fetched", { avatarCount: Object.keys(avatarMap).length });

    const withAvatars = members.map((m) => ({
      ...m,
      avatarUrl: avatarMap[m.userId] || null,
    }));

    // 4. Group into { leadership: [...], executive: [...], ... }, preserving TEAMS order
    const grouped = {};
    for (const team of TEAMS) {
      grouped[team.key] = withAvatars
        .filter((m) => m.teamKey === team.key)
        .sort((a, b) => b.rank - a.rank);
    }

    const groupedCounts = Object.fromEntries(Object.keys(grouped).map((k) => [k, grouped[k].length]));
    console.log("/api/team grouped counts", { groupedCounts });

    // Cache on Vercel's edge for 5 min, serve stale for 10 min while revalidating —
    // keeps avatars/roster fresh without hammering Roblox on every visit.
    return NextResponse.json(
      {
        teams: TEAMS.map((t) => ({ key: t.key, label: t.label })),
        members: grouped,
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("Team fetch error:", err);
    return NextResponse.json({ error: "Failed to load team data" }, { status: 500 });
  }
}