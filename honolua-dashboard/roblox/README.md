# Honolua activity tracker

`HonoluaActivityTracker.server.lua` belongs in `ServerScriptService` as a normal server `Script`. It sends group member joins, 45-second heartbeats, leaves, and filtered in-game chat messages to the activity endpoint. Keep it server-side so the bearer secret is never shipped to players. The activity page resolves the signed-in Discord account through Bloxlink and returns only that member's own data. Chat entries are filtered by Roblox before sending and expire from the database after 30 days.

## Configure before publishing

1. Generate one long random secret.
2. Add it to the Honolua Dashboard Vercel project as `ROBLOX_ACTIVITY_SECRET` for the Production environment, then redeploy.
3. Replace `ACTIVITY_SECRET` in the Studio script with that exact value.
4. In Roblox Studio, enable **Allow HTTP Requests** for the experience under **Game Settings → Security**.
5. Publish the place containing this script. Place it only in the experience whose staff activity should count.

The personal activity view shows a six-month history, a streak that counts days with at least 10 minutes in-game, recent visits, and the account owner's own filtered chat messages from the last 30 days. A session is live while a heartbeat has arrived within the last two minutes; if a server exits without a leave event, play time ends at its last heartbeat. Leadership quota editing lives at **Activity Settings** in the sidebar and remains rank-gated.
