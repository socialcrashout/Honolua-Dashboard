import mongoose from "mongoose"

const VerifiedAccountSchema = new mongoose.Schema(
  {
    robloxUserId: { type: String, required: true, unique: true, index: true },
    discordId: { type: String, required: true, index: true },
    robloxUsername: { type: String, default: "" },
    discordUsername: { type: String, default: "" },
    lastVerifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.models.VerifiedAccount || mongoose.model("VerifiedAccount", VerifiedAccountSchema)
