import clientPromise from '@/lib/mongodb';

export const DEFAULT_LOA_SETTINGS = {
    acceptingRequests: true,
    minDays: 1,
    maxDays: 30,
    customReasons: [],
};

export async function getLoaSettings(guildId) {
    const client = await clientPromise;
    const settings = await client.db().collection('loaSettings').findOne({ guildId });
    if (!settings) return { ...DEFAULT_LOA_SETTINGS };
    return {
        ...DEFAULT_LOA_SETTINGS,
        acceptingRequests: settings.acceptingRequests !== false,
        minDays: settings.minDays ?? DEFAULT_LOA_SETTINGS.minDays,
        maxDays: settings.maxDays ?? DEFAULT_LOA_SETTINGS.maxDays,
        customReasons: Array.isArray(settings.customReasons) ? settings.customReasons : [],
    };
}
