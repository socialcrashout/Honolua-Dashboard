import { Schema, model, models } from 'mongoose';

const RoleStepSchema = new Schema(
  {
    roleId: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: '🌺' },
    roles: { type: [RoleStepSchema], default: [] }, // ordered LOW -> HIGH
  },
  { _id: false },
);

const RankingConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    logChannelId: { type: String, default: null },
    departments: { type: [DepartmentSchema], default: [] },
  },
  { timestamps: true, collection: 'rankingconfigs' },
);

export default models.RankingConfig || model('RankingConfig', RankingConfigSchema);