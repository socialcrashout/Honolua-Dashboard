import Link from "next/link"
import { Construction, ArrowLeft } from "lucide-react"

export default function ComingSoonDoc({
  title,
  description = "We're still writing up this guide. Check back soon.",
  backHref = "/docs",
  backLabel = "Back to docs",
}) {
  return (
    <div className="mt-12 flex flex-col items-center rounded-2xl border border-white/10 bg-[#101010] px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40">
        <Construction className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-white">{title || "Documentation coming soon"}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">{description}</p>

      <Link
        href={backHref}
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>
    </div>
  )
}