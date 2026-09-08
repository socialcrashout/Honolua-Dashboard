// api/auth/discord.js
import crypto from "crypto";

export default function handler(req, res) {
  const flow = req.query.flow === "workspace" ? "workspace" : "server";
  const random = crypto.randomBytes(16).toString("hex");
  const state = `${random}.${flow}`;

  res.setHeader(
    "Set-Cookie",
    `discord_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `${process.env.PUBLIC_URL}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
    state,
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}