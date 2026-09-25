// api/team/route.js
// Vercel serverless function — runs server-side, avoids Roblox CORS restrictions.
import { NextResponse } from "next/server";

const GROUP_ID = 743137138;

// A normal browser User-Agent. Roblox's endpoints can silently reject bare
// server-to-server requests (no UA, or a generic one like "node") — sending
// this avoids that.
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

const ALL_ROLE_IDS = Object.keys(ROLE_ID_TO_TEAM).map(Number);
const ALL_ROLE_NAMES = Object.keys(ROLE_NAME_TO_TEAM);
const ALL_RANKS = Object.keys(RANK_TO_TEAM).map(Number);

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
    // 1. Get all group roles, keep only the ones we've assigned to a team
    //    (matched by exact role id OR by rank number)
    const rolesRes = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`, {
      headers: ROBLOX_HEADERS,
    });
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

    const eligibleRoles = rolesData.roles.filter((r) => {
      if (ALL_ROLE_IDS.includes(r.id)) return true;
      if (ALL_RANKS.includes(r.rank)) return true;
      if (ALL_ROLE_NAMES.includes(normalizeRoleValue(r.name))) return true;
      return !!teamForRole(r);
    });
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
        const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/roles/${role.id}/users?limit=100&sortOrder=Asc${
          cursor ? `&cursor=${cursor}` : ""
        }`;
        const usersRes = await fetch(url, { headers: ROBLOX_HEADERS });
        if (!usersRes.ok) {
          const bodyText = await usersRes.text().catch(() => "<could not read body>");
          console.error("Failed to fetch users for role", {
            roleId: role.id,
            url,
            status: usersRes.status,
            statusText: usersRes.statusText,
            body: bodyText,
          });
          break;
        }
        const usersData = await usersRes.json();

        console.log("/api/team role page", {
          roleId: role.id,
          roleName: role.name,
          usersFetched: usersData.data.length,
          nextCursor: !!usersData.nextPageCursor,
        });

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
        sampleUserIds: batch.slice(0, 3),
        dataLength: thumbData.data?.length || 0,
        sample: thumbData.data?.slice(0, 3),
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