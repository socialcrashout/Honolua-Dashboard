import { getSessionUser, isStaff } from '@/lib/loaAuth';
import BindsClient from './BindsClient';

const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
export const dynamic = 'force-dynamic';

export default async function BindsPage() {
  const user = await getSessionUser();
  if (!user) return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-neutral-500">Sign in to manage role binds.</div>;
  if (!isStaff(user)) return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-neutral-500">You don’t have access to role binds.</div>;
  if (!GUILD_ID) return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-neutral-500">Role binds need a Discord guild ID configured.</div>;

  return <BindsClient guildId={GUILD_ID} />;
}
