interface UsageCardProps {
  userEmail: string
  usage: number
  limit: number
}

export default function UsageCard({ userEmail, usage, limit }: UsageCardProps) {
  const percentage = Math.min((usage / limit) * 100, 100)


  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Account Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account</h2>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
            {userEmail?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 truncate w-32">{userEmail}</div>
            <div className="text-xs text-emerald-600 font-semibold">Free Plan</div>
          </div>
        </div>
      </div>
      {/* Usage Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Usage</h3>
<div className="text-4xl font-extrabold mb-1">{Math.floor(usage)}</div>
        <div className="text-xs text-slate-400">Plans generated</div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${percentage}%`}}></div>
        </div>
<div className="text-[10px] text-slate-400 mt-1">
  {Math.round(percentage)}% of monthly limit
</div>
      </div>
    </div>
  )
}
