// api/verify/confirm.js
import { getSession } from "../../lib/session.js";
import { sendWorkspaceLoginLog } from "../../lib/discordLog.js";

const DOT_EMOJI = "<:zarrow5:1525550609665757409>";
const ROBLOX_ACCOUNT_EMOJI = "<:Roblox:1545860046867529828>";

async function editOriginalInteraction(session) {
  if (!session.interactionToken || !session.interactionAppId) return;

  const payload = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container — no accent_color set, matches the rest of your UI
        components: [
          {
            type: 10, // Text Display
            content:
              `## ✅ Successfully Verified\n` +
              `Your Discord account is now linked and verified.`,
          },
          { type: 14 }, // Separator
          {
            type: 10,
            content:
              `${DOT_EMOJI} **Roblox Account:** ${ROBLOX_ACCOUNT_EMOJI} ` +
              `[${session.robloxUsername}](https://www.roblox.com/users/${session.robloxId}/profile)`,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(
      `https://discord.com/api/v10/webhooks/${session.interactionAppId}/${session.interactionToken}/messages/@original`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to edit original interaction:", res.status, text);
    }
  } catch (err) {
    // Most common cause: the 15-minute interaction token window expired.
    console.error("Interaction edit error (likely expired token):", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let session;
    try {
      session = getSession(req);
    } catch (sessionErr) {
      console.error("getSession threw:", sessionErr);
      return res.status(500).json({
        error: `Session error: ${sessionErr.message || "failed to read session"}`,
      });
    }

    if (!session?.discordId || !session?.robloxUsername) {
      return res.status(400).json({ error: "Not fully verified yet" });
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const roleId = process.env.DISCORD_VERIFIED_ROLE_ID;

    if (!guildId || !roleId || !process.env.DISCORD_BOT_TOKEN) {
      console.error("Missing Discord env vars (guildId/roleId/botToken)");
      return res.status(500).json({
        error: "Server misconfigured: missing Discord env vars",
      });
    }

    const botHeaders = {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    };

    const roleRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${session.discordId}/roles/${roleId}`,
      { method: "PUT", headers: botHeaders }
    );
    if (!roleRes.ok) {
      const text = await roleRes.text().catch(() => "");
      console.error("Role assignment failed:", roleRes.status, text);
      return res.status(502).json({
        error: `Failed to assign verified role (Discord ${roleRes.status}): ${text.slice(0, 200)}`,
      });
    }

    try {
      const nickRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${session.discordId}`,
        {
          method: "PATCH",
          headers: botHeaders,
          body: JSON.stringify({ nick: session.robloxUsername }),
        }
      );
      if (!nickRes.ok) {
        const text = await nickRes.text().catch(() => "");
        console.error("Nickname patch failed (non-fatal):", nickRes.status, text);
      }
    } catch (nickErr) {
      console.error("Nickname patch error (non-fatal):", nickErr);
    }

    try {
      await editOriginalInteraction(session);
    } catch (editErr) {
      console.error("editOriginalInteraction threw (non-fatal):", editErr);
    }

    try {
      await sendWorkspaceLoginLog({
        robloxUsername: session.robloxUsername,
        robloxId: session.robloxId,
        discordId: session.discordId,
        discordUsername: session.discordUsername,
        joinedTimestamp: session.joinedTimestamp,
        loginTimestamp: Math.floor(Date.now() / 1000),
      });
    } catch (logErr) {
      console.error("Workspace login log failed (non-fatal):", logErr);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Confirm error (uncaught):", err);
    return res.status(500).json({
      error: err?.message || "Failed to confirm verification",
    });
  }
}