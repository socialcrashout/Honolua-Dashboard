import mongoose, { Schema } from "mongoose";

// Flow action types available in the "Flows" tab. Keep this list in sync
// between the editor UI, the API validation, and the bot runtime.
export const FLOW_TYPES = [
  "DELETE_PREVIOUS_BOT_MESSAGE",
  "MOVE_CHANNEL_TO_CATEGORY",
  "SEND_DM_TO_INVOKER",
  "SEND_DM_TO_MENTIONED_USER",
  "PIN_BOT_RESPONSE",
  "ADD_REMOVE_ROLES",
  "CREATE_THREAD_ON_RESPONSE",
  "CREATE_THREAD_IN_CHANNEL",
  "SEND_TO_MENTIONED_CHANNEL",
  "RENAME_CHANNEL",
];

const FlowSchema = new Schema(
  {
    type: { type: String, enum: FLOW_TYPES, required: true },
    // Free-form per-action config, e.g. { categoryId } or { name } or
    // { addRoleIds: [], removeRoleIds: [] }. Shape depends on `type`.
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ContainerSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    headerText: { type: String, default: "" },
    bodyText: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    showDivider: { type: Boolean, default: false },
    footerText: { type: String, default: "" },
    showTimestamp: { type: Boolean, default: false },
  },
  { _id: false }
);

const AdvancedSchema = new Schema(
  {
    cooldownSeconds: { type: Number, default: 0 },
    deleteResponseAfterSeconds: { type: Number, default: 0 },
    deleteInvokingMessage: { type: Boolean, default: false },
  },
  { _id: false }
);

const TriggerSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, lowercase: true },
    enabled: { type: Boolean, default: true },
    category: { type: String, default: "General" },
    description: { type: String, default: "" },

    message: { type: String, default: "" },
    postToChannel: { type: String, default: "current" }, // "current" | channelId
    allowedRoles: { type: [String], default: ["everyone"] }, // ["everyone"] | roleIds

    container: { type: ContainerSchema, default: () => ({}) },
    advanced: { type: AdvancedSchema, default: () => ({}) },
    flows: { type: [FlowSchema], default: [] },

    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

TriggerSchema.index({ guildId: 1, name: 1 }, { unique: true });

export default mongoose.models.Trigger || mongoose.model("Trigger", TriggerSchema);