import mongoose from "mongoose"

const EntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    kind: { type: String, enum: ["note", "warning", "suspension"], required: true },
    content: { type: String, required: true, maxlength: 1200 },
    createdAt: { type: Date, default: Date.now },
    createdById: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { _id: false }
)

const StaffMemberRecordSchema = new mongoose.Schema(
  {
    robloxUserId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, default: "" },
    entries: { type: [EntrySchema], default: [] },
  },
  { timestamps: true }
)

export default mongoose.models.StaffMemberRecord || mongoose.model("StaffMemberRecord", StaffMemberRecordSchema)
