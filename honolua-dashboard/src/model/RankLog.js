import { Schema, model, models } from 'mongoose';

// Mirrors the bot's models/RankLog.js exactly - same collection, same
// shape - so both sides can read/write it interchangeably.
const RankLogSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['promote', 'demote', 'changerank'] },
    command: { type: String, required: true },
    department: { type: String, default: null },

    actorId: { type: String, required: true },
    actorTag: { type: String, required: true },
    actorAvatar: { type: String, default: null },

    targetId: { type: String, required: true },
    targetTag: { type: String, required: true },
    targetAvatar: { type: String, default: null },

    oldRoles: { type: [String], default: [] },
    newRoles: { type: [String], default: [] },

    reason: { type: String, default: 'No reason provided.' },
  },
  { timestamps: true, collection: 'rankinglogs' },
);

export default models.RankLog || model('RankLog', RankLogSchema);