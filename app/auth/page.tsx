'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  
  // --- Auth States ---
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  // --- Form States ---
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

    // Add this useEffect at the top of your component
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        setIsCheckingSession(false)
      }
    }
    
    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push('/dashboard')
      }
    })

    checkSession()
    
    return () => { subscription.unsubscribe() }
  }, [router])

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }


  // --- Validation Helpers ---
  function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  function getPasswordStrength(pass: string) {
    if (!pass) return 0
    if (pass.length < 6) return 1 // Weak
    if (pass.length < 8) return 2 // Medium
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) return 3 // Strong
    return 4 // Very Strong
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // --- Signup Validation ---
    if (!isLogin) {
      if (!name.trim()) {
        setError("Please enter your name.")
        return
      }
      if (!validateEmail(email)) {
        setError("Please enter a valid email address.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
      if (getPasswordStrength(password) < 2) {
        setError("Password is too weak. Use 8+ characters with symbols.")
        return
      }
    } else {
      // Login Validation
      if (!email.trim() || !password.trim()) {
        setError("Please enter email & password")
        return
      }
    }

    setLoading(true)
    setError(null) // Clear old errors

    try {
      let authError: Error | null = null

      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        authError = loginError
      } else {
        // Signup with Name
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name } // Store name in metadata
          }
        })
        authError = signUpError
      }

      if (authError) throw authError

      // Success: Redirect to Dashboard
      router.push('/dashboard')

    } catch (err) {
      console.error('Auth Error:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // --- Google OAuth Handler ---
// Replace the import at the top

// Use this in your handleGoogleLogin function:
async function handleGoogleLogin() {
  setLoading(true)
  setError(null)
  
  try {
    const redirectUrl = `${window.location.origin}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({ // ✅ Use existing supabase
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    })
    
    if (error) throw error
    
  } catch (err) {
    console.error('Google Auth Error:', err)
    setError((err as Error).message)
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">

        {/* --- LEFT SIDE: Visuals --- */}
        <div className="md:w-1/2 bg-slate-900 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 mt-4">
              {isLogin ? 'Welcome Back!' : 'Start Planning Today'}
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              {isLogin
                ? 'Log in to access your marketing dashboard.'
                : 'Join thousands of small businesses growing with AI.'}
            </p>
          </div>

          <div className="hidden md:block relative z-10">
            <div className="flex gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Secure Login</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4 6-6"></path></svg>
                <span>AI Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span>Instant Setup</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Form --- */}
        <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`pb-4 border-b-2 text-sm font-semibold transition-all duration-200 ${isLogin ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`pb-4 border-b-2 text-sm font-semibold transition-all duration-200 ml-8 ${!isLogin ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}`}
            >
              Sign Up
            </button>
          </div>

          {/* General Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center gap-3 animate-shake">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* Name Field (Signup Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition text-slate-900"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                className={`w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition text-slate-900 ${!validateEmail(email) && email.length > 0 ? 'border-red-500 text-red-900 placeholder-red-300' : 'border-slate-300'}`}
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition pr-10 text-slate-900 ${getPasswordStrength(password) < 2 ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {/* Toggle Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268 2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                  )}
                </button>
              </div>              
              {/* Password Strength Bar (Signup Only) */}
              {!isLogin && password.length > 0 && (
                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-1.5 transition-all duration-300 ${
                      getPasswordStrength(password) === 1 ? 'bg-red-500 w-1/4' :
                      getPasswordStrength(password) === 2 ? 'bg-yellow-400 w-2/4' :
                      getPasswordStrength(password) === 3 ? 'bg-emerald-500 w-3/4' :
                      'bg-emerald-600 w-full'
                    }`}
                  ></div>
                </div>
              )}
            </div>

            {/* Confirm Password (Signup Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                <input
                  type="password"
                  className={`w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition text-slate-900 ${password !== confirmPassword ? 'border-red-500 text-red-900 placeholder-red-300' : 'border-slate-300'}`}
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl text-white font-bold py-4 shadow-lg transform transition hover:-translate-y-0.5 text-sm uppercase tracking-wide ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          {/* --- Divider --- */}
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* --- Google Login Button --- */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-xl py-3.5 px-4 font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}
