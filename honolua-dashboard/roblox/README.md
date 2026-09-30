# Honolua activity tracker

`HonoluaActivityTracker.server.lua` belongs in `ServerScriptService` as a normal server `Script`. It sends group member joins, 45-second heartbeats, and leaves to the activity endpoint. Keep it server-side so the bearer secret is never shipped to players.

## Configure before publishing

1. Generate one long random secret.
2. Add it to the Honolua Dashboard Vercel project as `ROBLOX_ACTIVITY_SECRET` for the Production environment, then redeploy.
3. Replace `ACTIVITY_SECRET` in the Studio script with that exact value.
4. In Roblox Studio, enable **Allow HTTP Requests** for the experience under **Game Settings → Security**.
5. Publish the place containing this script. Place it only in the experience whose staff activity should count.

The dashboard considers a session live while a heartbeat has arrived within the last two minutes. It counts the session through its last heartbeat if the server exits without a leave event.
