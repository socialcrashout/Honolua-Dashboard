# Honolua activity tracker

`HonoluaActivityTracker.server.lua` belongs in `ServerScriptService` as a normal server `Script`. It sends group member joins, 45-second heartbeats, leaves, and filtered in-game chat messages to the activity endpoint. Keep it server-side so the bearer secret is never shipped to players. The activity page resolves the signed-in Discord account through Bloxlink and returns only that member's own data. Chat entries are filtered by Roblox before sending and expire from the database after 30 days.

## Configure before publishing

1. Generate one long random secret and add it to the Honolua Dashboard Vercel project as `ROBLOX_ACTIVITY_SECRET` for Production, then redeploy.
2. In Creator Hub, add the same value to the experience Secrets Store with the exact name `HONOLUA_ACTIVITY_SECRET`. For Studio testing, add it under **File → Experience Settings → Security → Local Secrets**.
3. In Roblox Studio, enable **Allow HTTP Requests** for the experience under **File → Experience Settings → Security**.
4. Publish the place containing this script. Place it only in the experience whose staff activity should count.

The tracker reads the credential with `HttpService:GetSecret()` and sends it only in the authorization header. Do not paste the secret into this script or commit it to source control.

The personal activity view shows a six-month history, a streak that counts days with at least 10 minutes in-game, recent visits, and the account owner's own filtered chat messages from the last 30 days. Active sessions show their running elapsed minutes and the configured experience name. A session is live while a heartbeat has arrived within the last two minutes; if a server exits without a leave event, play time ends at its last heartbeat. Leadership quota editing lives at **Activity Settings** in the sidebar and remains rank-gated. Quota values are stored as whole minutes.
