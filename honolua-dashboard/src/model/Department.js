// lib/Department.js
import mongoose from "mongoose"

const MemberSchema = new mongoose.Schema(
  {
    username: { type: String, required: true }, // Roblox username, at time of assignment
    robloxId: { type: Number, required: true }, // permanent — used for live avatar lookups
  },
  { _id: false }
)

const PermissionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
)

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "Users" }, // matches a key in the frontend's ICON_MAP
    color: { type: String, default: "#E6736F" },
    status: { type: String, enum: ["Active", "Restricted", "Archived"], default: "Active" },
    members: { type: [MemberSchema], default: [] },
    permissions: {
      type: [PermissionSchema],
      default: () => [
        { label: "View Staff List", enabled: true },
        { label: "Manage Roles", enabled: false },
        { label: "Access Logs", enabled: false },
        { label: "Manage Department", enabled: false },
      ],
    },
  },
  { timestamps: true }
)

export default mongoose.models.Department || mongoose.model("Department", DepartmentSchema)