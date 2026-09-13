import mongoose from "mongoose"

const ProductUpdateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    mediaUrl: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

export default mongoose.models.ProductUpdate ||
  mongoose.model("ProductUpdate", ProductUpdateSchema)