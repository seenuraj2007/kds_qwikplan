import { Zap } from 'lucide-react'

export default function WelcomeAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/30 rounded-full blur-[80px] animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Spinner */}
        <div className="relative w-24 h-24 animate-scale-in">
          <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-4 border-emerald-400/20 rounded-full animate-spin" style={{animationDuration: '3s'}}></div>
          <div className="absolute inset-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)] animate-pulse-glow">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        <div className="mt-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight animate-slide-in-up">
            Welcome Back!
          </h1>
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium animate-slide-in-up" style={{animationDelay: '100ms'}}>
            <span>Preparing your workspace</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
