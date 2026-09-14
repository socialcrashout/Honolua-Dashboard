"use server";

const DISCORD_INVITE_CODE = "8Am56ckPFP";
const ROBLOX_GROUP_ID = "743137138";
const STAFF_MIN_RANK = 140;

export async function fetchDiscordStats() {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`discord fetch failed: ${res.status}`);
    const data = await res.json();
    return { memberCount: data.approximate_member_count ?? null };
  } catch (err) {
    console.error("[fetchDiscordStats]", err);
    return { error: true };
  }
}

export async function fetchRobloxStats() {
  try {
    const [groupRes, rolesRes] = await Promise.all([
      fetch(`https://groups.roblox.com/v1/groups/${ROBLOX_GROUP_ID}`, {
        cache: "no-store",
      }),
      fetch(`https://groups.roblox.com/v1/groups/${ROBLOX_GROUP_ID}/roles`, {
        cache: "no-store",
      }),
    ]);
    if (!groupRes.ok || !rolesRes.ok) {
      throw new Error(
        `roblox fetch failed: group=${groupRes.status} roles=${rolesRes.status}`
      );
    }
    const group = await groupRes.json();
    const rolesData = await rolesRes.json();
    const staffCount = (rolesData.roles ?? [])
      .filter((r) => r.rank >= STAFF_MIN_RANK)
      .reduce((sum, r) => sum + (r.memberCount ?? 0), 0);
    return { memberCount: group.memberCount ?? null, staffCount };
  } catch (err) {
    console.error("[fetchRobloxStats]", err);
    return { error: true };
  }
}