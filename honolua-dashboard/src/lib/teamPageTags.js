export const TEAM_TAG_COLOR_GROUPS = [
  {
    label: "Classic",
    colors: ["#2F6B57", "#2E6F95", "#7753A6", "#C05662", "#B46924", "#586275", "#BD8B21", "#247A78"],
  },
  {
    label: "Neon",
    colors: ["#39FF14", "#00F5FF", "#FF2BD6", "#FF5E00", "#B8FF00", "#A100FF", "#FF1744", "#FFF000"],
  },
]

export const TEAM_TAG_NEON_COLORS = TEAM_TAG_COLOR_GROUPS[1].colors
export const TEAM_TAG_COLORS = TEAM_TAG_COLOR_GROUPS.flatMap((group) => group.colors)

export const TEAM_TAG_ICONS = [
  "BadgeCheck",
  "ShieldCheck",
  "Star",
  "Sparkles",
  "Crown",
  "HeartHandshake",
  "Gem",
  "CircleCheck",
  "Medal",
  "Award",
  "Flower2",
  "Handshake",
]

export function normalizeTeamTag(raw) {
  if (!raw || typeof raw !== "object") return null
  const name = typeof raw.name === "string" ? raw.name.trim().replace(/\s+/g, " ") : ""
  const icon = typeof raw.icon === "string" ? raw.icon : ""
  const color = typeof raw.color === "string" ? raw.color.toUpperCase() : ""
  if (!name || name.length > 24 || !TEAM_TAG_ICONS.includes(icon) || !TEAM_TAG_COLORS.includes(color)) return null
  return { name, icon, color }
}
