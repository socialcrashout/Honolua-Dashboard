import { cookies, headers } from 'next/headers';

// Mirrors the ROLE_LEVELS map in your StaffSidebar component. If you ever
// move that map into a shared file (e.g. src/lib/roles.js), import it in
// both places instead of keeping two copies in sync by hand.
const ROLE_LEVELS = {
    moderator: 0,
    administrator: 1,
    manager: 2,
    executive: 3,
    owner: 4,
};

// Who can approve/deny/end leave for other people. Everyone at or above
// this level counts as LOA staff. Bump to ROLE_LEVELS.manager if you'd
// rather only managers+ decide leave, not administrators.
const APPROVER_MIN_LEVEL = ROLE_LEVELS.administrator;

// Reuses your existing /api/auth/me route rather than re-implementing
// session/cookie parsing here — this file forwards the request's cookies
// to that route and reads the same { ok, user } shape your sidebar uses.
export async function getSessionUser() {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    const cookieHeader = cookieStore.toString();
    if (!cookieHeader) return null;

    const host = headerStore.get('host');
    const protocol = host?.startsWith('localhost') || host?.startsWith('127.0.0.1') ? 'http' : 'https';

    let res;
    try {
        res = await fetch(`${protocol}://${host}/api/auth/me`, {
            headers: { cookie: cookieHeader },
            cache: 'no-store',
        });
    } catch {
        return null;
    }
    if (!res.ok) return null;

    const data = await res.json().catch(() => ({}));
    if (!data?.ok || !data?.user) return null;

    const role = (data.user.staffRole || '').toLowerCase().trim();
    return {
        id: data.user.discordId || data.user.id,
        username: data.user.username,
        avatar: data.user.avatarUrl,
        level: ROLE_LEVELS[role] ?? -1,
    };
}

export function isStaff(user) {
    return !!user && user.level >= APPROVER_MIN_LEVEL;
}