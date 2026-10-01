import mongoose from "mongoose"

const MemberSanctionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    robloxUserId: { type: String, required: true, index: true },
    discordId: { type: String, default: "", index: true },
    username: { type: String, required: true, default: "" },
    action: { type: String, enum: ["notice", "warning", "restriction", "suspension", "ban"], required: true },
    category: { type: String, enum: ["conduct", "safety", "integrity", "community", "other"], required: true },
    reason: { type: String, required: true, maxlength: 500 },
    details: { type: String, default: "", maxlength: 2000 },
    restrictions: { type: [String], default: [] },
    days: { type: Number, default: 0, min: 0, max: 3650 },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ["active", "expired", "revoked"], default: "active", index: true },
    createdById: { type: String, default: "" },
    createdByName: { type: String, default: "" },
    revokedAt: { type: Date, default: null },
    revokedById: { type: String, default: "" },
  },
  { timestamps: true }
)

export default mongoose.models.MemberSanction || mongoose.model("MemberSanction", MemberSanctionSchema)
