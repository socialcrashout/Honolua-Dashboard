'use client';

export default function StatCard({ icon: Icon, label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.03] text-white',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    sky: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  };

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
        <div className="text-2xl font-bold leading-tight text-white">{value}</div>
      </div>
    </div>
  );
}