import dbConnect from "@/lib/mongoose";
import Trigger from "@/model/Trigger";
import { logStaffAction } from "@/lib/audit"; // ⚠️ confirm this path matches your project
import { getUserFromSession } from "@/lib/auth";

// Swap this for however you currently resolve "which server" a staff
// session belongs to — hardcoding a single guild here to match the rest
// of this codebase's single-group setup.
const GUILD_ID = process.env.DISCORD_GUILD_ID;

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");

  const filter = { guildId: GUILD_ID };
  if (category && category !== "All Triggers") filter.category = category;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const triggers = await Trigger.find(filter).sort({ createdAt: -1 }).lean();
  return Response.json({ ok: true, triggers });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json().catch(() => null);

  if (!body?.name?.trim()) {
    return Response.json({ ok: false, error: "Trigger name is required" }, { status: 400 });
  }

  try {
    const trigger = await Trigger.create({
      ...body,
      guildId: GUILD_ID,
      name: body.name.trim().toLowerCase(),
    });

    const user = await getUserFromSession(req).catch(() => null);
    await logStaffAction({
      session: { discordId: user?.discordId, discordUsername: user?.username || user?.discordUsername },
      action: "trigger_created",
      meta: { triggerId: trigger._id.toString(), name: trigger.name },
    });

    return Response.json({ ok: true, trigger }, { status: 201 });
  } catch (err) {
    if (err?.code === 11000) {
      return Response.json(
        { ok: false, error: "A trigger with that name already exists" },
        { status: 409 }
      );
    }
    console.error("[POST /api/triggers]", err);
    return Response.json({ ok: false, error: "Failed to create trigger" }, { status: 500 });
  }
}