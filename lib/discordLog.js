// lib/discordLog.js

// Same IDs used by setup-verification.js — keep these two files in sync
// manually since they run in separate processes (bot vs website API).
const DOT_EMOJI = "<:zarrow5:1525550609665757409>";
const ROBLOX_ACCOUNT_EMOJI = "<:Roblox:1545860046867529828>";

export async function sendVerificationLog({
  robloxUsername,
  robloxId,
  discordId,
  joinedTimestamp, // unix seconds, or null/undefined if unknown
  verifiedTimestamp, // unix seconds — defaults to "now" if omitted
}) {
  const verifiedAt = verifiedTimestamp ?? Math.floor(Date.now() / 1000);

  const joinedLine = joinedTimestamp
    ? `<t:${joinedTimestamp}:R>`
    : "unknown";

  const payload = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container (no accent_color set = no strip)
        components: [
          {
            type: 10, // Text Display
            content:
              `## New Account Verification\n` +
              `**${robloxUsername}** has **successfully** linked their Roblox account.`,
          },
          { type: 14 }, // Separator
          {
            type: 10,
            content:
              `${DOT_EMOJI} **Joined:** ${joinedLine}\n` +
              `${DOT_EMOJI} **Verified At:** <t:${verifiedAt}:R>\n` +
              `${DOT_EMOJI} **Roblox Account:** ${ROBLOX_ACCOUNT_EMOJI} [${robloxUsername}](https://www.roblox.com/users/${robloxId}/profile) (\`${robloxId}\`)\n` +
              `${DOT_EMOJI} **Discord User:** <@${discordId}> (\`${discordId}\`)`,
          },
          {
            type: 1, // Action row
            components: [
              {
                type: 2, // Button
                style: 5, // Link
                label: "View Profile",
                url: `https://www.roblox.com/users/${robloxId}/profile`,
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch(
    `https://discord.com/api/v10/channels/${process.env.LOG_CHANNEL_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Discord log post failed:", res.status, text);
    // Doesn't throw — a failed log post should never block verification.
  }
}