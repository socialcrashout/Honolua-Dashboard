import dbConnect from "@/lib/mongoose";
import Trigger from "@/models/Trigger";

export async function GET(_req, { params }) {
  await dbConnect();
  const trigger = await Trigger.findById(params.id).lean();
  if (!trigger) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  return Response.json({ ok: true, trigger });
}

// Partial update — used for full edits from the editor AND for the quick
// enabled/disabled toggle on the list page (just send { enabled }).
export async function PATCH(req, { params }) {
  await dbConnect();
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });

  if (body.name) body.name = body.name.trim().toLowerCase();

  try {
    const trigger = await Trigger.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!trigger) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    return Response.json({ ok: true, trigger });
  } catch (err) {
    if (err?.code === 11000) {
      return Response.json(
        { ok: false, error: "A trigger with that name already exists" },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/triggers/:id]", err);
    return Response.json({ ok: false, error: "Failed to update trigger" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  await dbConnect();
  const trigger = await Trigger.findByIdAndDelete(params.id);
  if (!trigger) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}