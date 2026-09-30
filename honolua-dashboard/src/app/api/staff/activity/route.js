import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getUserFromSession } from "@/lib/auth"

const GROUP_ID = 743137138
const DB_NAME = "honolua"
const HISTORY_DAYS = 183
const ACTIVE_WINDOW_MS = 2 * 60 * 1000
const STREAK_MINUTES_PER_DAY = 10

function dayKey(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10)
}

function addSessionToDays(dayMinutes, start, end) {
  if (!(end > start)) return
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  while (cursor < end) {
    const next = new Date(cursor)
    next.setUTCDate(next.getUTCDate() + 1)
    const overlapStart = start > cursor ? start : cursor
    const overlapEnd = end < next ? end : next
    const minutes = Math.max(0, Math.floor((overlapEnd - overlapStart) / 60000))
    const key = dayKey(cursor)
    dayMinutes.set(key, (dayMinutes.get(key) || 0) + minutes)
    cursor = next
  }
}

async function getLinkedRobloxId(discordId) {
  const guildId = process.env.DISCORD_GUILD_ID
  const apiKey = process.env.BLOXLINK_API_KEY
  if (!guildId || !apiKey) throw new Error("Roblox account linking is not configured.")
  const response = await fetch(
    `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}`,
    { headers: { Authorization: apiKey }, cache: "no-store" }
  )
  if (response.status === 404) return null
  if (!response.ok) throw new Error("Could not verify your linked Roblox account.")
  const data = await response.json()
  return /^\d{1,20}$/.test(String(data.robloxID || "")) ? String(data.robloxID) : null
}

export async function GET() {
  const session = await getUserFromSession()
  if (!session?.discordId) return NextResponse.json({ error: "Sign in to view your activity." }, { status: 401 })

  try {
    const robloxUserId = await getLinkedRobloxId(String(session.discordId))
    if (!robloxUserId) {
      return NextResponse.json({ ok: true, linked: false, trackingReady: Boolean(process.env.ROBLOX_ACTIVITY_SECRET), sessions: [], messages: [], days: [], stats: null }, { headers: { "Cache-Control": "private, no-store" } })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const now = new Date()
    const historyStart = new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000)
    const messageStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const [sessionRecords, messageRecords, profileResponse] = await Promise.all([
      db.collection("activitySessions").find({ groupId: GROUP_ID, userId: robloxUserId, startedAt: { $gte: historyStart, $lt: now } }).sort({ startedAt: -1 }).limit(1000).toArray(),
      db.collection("activityMessages").find({ groupId: GROUP_ID, userId: robloxUserId, createdAt: { $gte: messageStart, $lt: now } }).sort({ createdAt: -1 }).limit(60).toArray(),
      fetch(`https://users.roblox.com/v1/users/${robloxUserId}`, { cache: "no-store" }),
    ])

    const dayMinutes = new Map()
    const sessions = sessionRecords.map((record) => {
      const startedAt = new Date(record.startedAt)
      const lastSeenAt = new Date(record.lastSeenAt || record.endedAt || record.startedAt)
      const isActive = Boolean(record.isActive) && now - lastSeenAt <= ACTIVE_WINDOW_MS
      const endedAt = isActive ? now : new Date(record.endedAt || lastSeenAt)
      addSessionToDays(dayMinutes, startedAt, endedAt)
      return {
        startedAt: record.startedAt,
        endedAt: isActive ? null : (record.endedAt || lastSeenAt),
        minutes: Math.max(0, Math.floor((endedAt - startedAt) / 60000)),
        isActive,
        experienceName: record.experienceName || "Honolua",
      }
    })

    const days = Array.from({ length: HISTORY_DAYS }, (_, index) => {
      const date = new Date(now)
      date.setUTCDate(date.getUTCDate() - (HISTORY_DAYS - index - 1))
      const key = dayKey(date)
      return { date: key, minutes: dayMinutes.get(key) || 0 }
    })
    const today = dayKey(now)
    const yesterdayDate = new Date(now)
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
    const yesterday = dayKey(yesterdayDate)
    const dayLookup = new Map(days.map((day) => [day.date, day.minutes]))
    let streakCursor = dayLookup.get(today) >= STREAK_MINUTES_PER_DAY ? new Date(now) : dayLookup.get(yesterday) >= STREAK_MINUTES_PER_DAY ? yesterdayDate : null
    let currentStreakDays = 0
    while (streakCursor && dayLookup.get(dayKey(streakCursor)) >= STREAK_MINUTES_PER_DAY) {
      currentStreakDays += 1
      streakCursor.setUTCDate(streakCursor.getUTCDate() - 1)
    }

    const thirtyDayStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentSessions = sessions.filter((item) => new Date(item.startedAt) >= thirtyDayStart)
    const totalRecentMinutes = recentSessions.reduce((total, item) => total + item.minutes, 0)
    const profile = profileResponse.ok ? await profileResponse.json().catch(() => null) : null

    return NextResponse.json({
      ok: true,
      linked: true,
      trackingReady: Boolean(process.env.ROBLOX_ACTIVITY_SECRET),
      currentSession: sessions.find((item) => item.isActive) || null,
      member: { username: profile?.name || session.robloxUsername || "Honolua member" },
      stats: {
        last30DaysMinutes: totalRecentMinutes,
        visits: recentSessions.length,
        averageVisitMinutes: recentSessions.length ? Math.round(totalRecentMinutes / recentSessions.length) : 0,
        currentStreakDays,
        streakMinimumMinutes: STREAK_MINUTES_PER_DAY,
      },
      days,
      sessions: sessions.slice(0, 40),
      messages: messageRecords.map((record) => ({
        id: String(record._id),
        text: record.message,
        channel: record.channel || "Experience chat",
        createdAt: record.createdAt,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("personal activity GET error:", error)
    return NextResponse.json({ error: "Could not load your activity right now." }, { status: 502 })
  }
}
