export default function WelcomeAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Spinner */}
        <div className="relative w-20 h-20 animate-fade-in-up">
          <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            B
          </div>
        </div>
        <div className="mt-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight animate-fade-in-up" style={{animationDelay: '100ms'}}>
            Welcome Back!
          </h1>
          <p className="text-emerald-400 text-sm font-medium animate-fade-in-up" style={{animationDelay: '200ms'}}>
            Preparing your workspace...
          </p>
        </div>
      </div>
    </div>
  )
}