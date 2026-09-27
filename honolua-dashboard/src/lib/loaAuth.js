import { cookies, headers } from 'next/headers';
import { canManageUpdates } from '@/lib/staff';

async function getJson(url, cookieHeader) {
    try {
        const response = await fetch(url, {
            headers: { cookie: cookieHeader },
            cache: 'no-store',
        });
        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

// Use the same Roblox group rank as workspace verification and other
// management routes. /api/auth/me may not have a rank until workspace/status
// has looked it up, so ask that route to resolve it when needed.
export async function getSessionUser() {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    const cookieHeader = cookieStore.toString();
    if (!cookieHeader) return null;

    const host = headerStore.get('host');
    if (!host) return null;
    const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const data = await getJson(`${origin}/api/auth/me`, cookieHeader);
    if (!data?.ok || !data?.user) return null;

    let workspaceRank = data.user.robloxRankId;
    if (!Number.isFinite(workspaceRank)) {
        const workspace = await getJson(`${origin}/api/workspace/status`, cookieHeader);
        workspaceRank = workspace?.workspaceRank;
    }

    return {
        id: data.user.discordId || data.user.id,
        username: data.user.username,
        avatar: data.user.avatarUrl,
        robloxUsername: data.user.robloxUsername || null,
        workspaceRank: Number.isFinite(workspaceRank) ? workspaceRank : null,
    };
}

export function isStaff(user) {
    return !!user && canManageUpdates(user.workspaceRank);
}
