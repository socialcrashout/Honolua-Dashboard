import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getSession } from "@/lib/session"
import SiteControlClient from "@/components/SiteControlClient"

export const dynamic = "force-dynamic"

export default async function SiteControlPage() {
  // getSession expects something shaped like a NextRequest (it calls
  // request.cookies.get(...)). next/headers' cookies() returns a store with
  // the same .get() shape, so we can hand it in directly without needing a
  // real Request object inside a server component.
  const cookieStore = await cookies()
  const session = getSession({ cookies: cookieStore })

  if (!session?.discordId) {
    redirect("/login")
  }

  // NOTE: this only confirms the person is logged in. It does not yet check
  // their Roblox rank server-side the way the sidebar does on the client —
  // right now anyone with a valid session can load this page directly by
  // URL, even if the sidebar hides the link from them. If you want that
  // enforced here too, I can port the same rank-range check from Sidebar.js
  // into a shared helper and call it here.

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-reef-navy">Site control</h1>
        <p className="mt-1 text-sm text-lava/50">Maintenance mode, shutdown, and site-wide announcements.</p>
      </div>

      <SiteControlClient />
    </div>
  )
}