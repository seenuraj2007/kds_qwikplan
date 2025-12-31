interface UsageCardProps {
  userEmail: string
  usage: number
  limit: number
}

export default function UsageCard({ userEmail, usage, limit }: UsageCardProps) {
  const percentage = Math.min((usage / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100


  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Account Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account</h2>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
            {userEmail?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 truncate w-32" title={userEmail}>{userEmail}</div>
            <div className="text-xs text-emerald-600 font-semibold">Free Plan</div>
          </div>
        </div>
      </div>
      {/* Usage Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10">Your Usage</h3>
        <div className="flex items-baseline gap-2 mb-1 relative z-10">
          <div className="text-4xl font-extrabold">{Math.floor(usage)}</div>
          <div className="text-lg text-slate-400">/ {limit}</div>
        </div>
        <div className="text-xs text-slate-400 mb-4 relative z-10">Plans generated this month</div>
        <div className="w-full bg-slate-700 h-2.5 rounded-full mt-3 relative z-10 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ease-out ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2 relative z-10">
          <div className="text-[10px] text-slate-400">
            {Math.round(percentage)}% of monthly limit
          </div>
          {isNearLimit && !isAtLimit && (
            <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Approaching limit</span>
          )}
          {isAtLimit && (
            <span className="text-[10px] text-red-400 font-semibold">Limit reached</span>
          )}
        </div>
      </div>
    </div>
  )
}
