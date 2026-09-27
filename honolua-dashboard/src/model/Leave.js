const mongoose = require('mongoose');

// This collection is shared with the Honolua Dashboard website — both the
// bot and the website read/write the same "leaves" collection in the same
// MongoDB database. Keep this schema identical to src/model/Leave.js on the
// dashboard side if you ever change it.

const STATUSES = ['pending', 'approved', 'denied', 'cancelled'];

const leaveSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true }, // cached display name at time of request
    avatar: { type: String }, // cached avatar URL, optional

    reason: { type: String, required: true },
    note: { type: String, default: '' },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    status: { type: String, enum: STATUSES, default: 'pending' },

    decidedBy: { type: String }, // discord id of the staff member who approved/denied
    decidedByName: { type: String },
    decidedAt: { type: Date },

    endedEarly: { type: Boolean, default: false },
    earlyEndDate: { type: Date },
}, { timestamps: true });

// Prevent OverwriteModelError if this file ever gets required twice
// (e.g. during a hot reload triggered by /sync or /deploy).
module.exports = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
module.exports.STATUSES = STATUSES;
