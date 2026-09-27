import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export const REASONS = ['vacation', 'school', 'exams', 'hospital', 'family', 'work', 'break', 'other'];
export const STATUSES = ['pending', 'approved', 'denied', 'cancelled'];

// Same "leaves" collection the César from Honolua bot writes to (via
// mongoose on that side) — these are plain documents, so keep this shape
// in sync by hand with bot/models/Leave.js: guildId, userId, username,
// avatar, reason, note, startDate, endDate, status, decidedBy,
// decidedByName, decidedAt, endedEarly, earlyEndDate, createdAt, updatedAt.
export async function getLeavesCollection() {
    const client = await clientPromise;
    return client.db().collection('leaves'); // uses the default db from your MONGODB_URI
}

export function toObjectId(id) {
    try {
        return new ObjectId(id);
    } catch {
        return null;
    }
}