'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

// --- IMPORT COMPONENTS ---
import UsageCard from '../../app/components/UsageCard'
import ResultModal from '../../app/components/ResultModal'
import WelcomeAnimation from '../../app/components/WelcomeAnimation'

import Link from 'next/link'
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart,
  Rocket,
  Github,
  CheckCircle2,
  Code,
  Globe
} from 'lucide-react'

interface PlanResult {
  strategy: string
  proTip?: string
  bestPostTime?: string
  schedule: string[]
  hashtags?: string
}

interface Toast {
  show: boolean
  msg: string
  type: 'success' | 'error'
}

export default function Dashboard() {
  const router = useRouter()

  // --- User Info State ---
  const [userEmail, setUserEmail] = useState('')
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // --- Tool State ---
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [goal, setGoal] = useState('sales')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PlanResult | null>(null)

  // --- Pop-up Modal State ---
  const [showModal, setShowModal] = useState(false)

  // --- Toast Notification State ---
  const [toast, setToast] = useState<Toast>({ show: false, msg: '', type: 'success' })

  // --- Real Usage States ---
  const [realUsage, setRealUsage] = useState(0)
  const [realLimit, setRealLimit] = useState(10) // Changed to 10

  // --- NEW: Usage Ref (Prevent Reset to 0 on DB Fail) ---
  const usageRef = useRef(0)

  // 1. Check Session
  useEffect(() => {
    async function checkSession() {
      try {
        console.log(">>> Step 1: Checking Session...")
        const { data: { session } } = await supabase.auth.getSession()

        // app/dashboard/page.ts (Line approx 25)
        if (!session) {
          console.log(">>> Session is null. Redirecting to home.")
          router.push('/') // <--- CHANGE THIS
          return
        } else {
          console.log(">>> Session Found. User ID:", session.user.id)
          setUserEmail(session.user.email ?? '')
          setUserId(session.user.id)

          console.log(">>> Step 2: Fetching Profile from DB...")

          // Use array method to handle multiple rows
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, plan_usage, monthly_limit')
            .eq('user_id', session.user.id)

          if (error) {
            console.error(">>> DB Fetch Error:", error.message)
            setRealUsage(usageRef.current)
          } else {
            console.log(">>> DB Fetch Successful. Profiles:", profiles)

            if (profiles && profiles.length > 0) {
              // Take the first profile if multiple exist
              const profile = profiles[0]
              const usageValue = profile.plan_usage || 0
              const limitValue = profile.monthly_limit || 10 // Changed to 10

              console.log(">>> Step 3: Setting Usage to:", usageValue, "limit:", limitValue)
              setRealUsage(usageValue)
              setRealLimit(limitValue)
              usageRef.current = usageValue

              // If multiple profiles exist, log warning
              if (profiles.length > 1) {
                console.warn(">>> WARNING: Multiple profiles found for user. Using first one.")
                console.warn(">>> Profile IDs:", profiles.map(p => p.id))
              }
            } else {
              // No profile found - new user
              console.log(">>> No profile found. Setting defaults.")
              setRealUsage(0)
              setRealLimit(10) // Changed to 10
              usageRef.current = 0
            }
          }
        }
      } catch (err) {
        console.error('>>> Session Check Exception:', err)
        console.log(">>> Exception caught. Using Ref Usage:", usageRef.current)
        setRealUsage(usageRef.current)
      } finally {
        // Artificial Delay for Animation
        setTimeout(() => {
          setLoadingAuth(false)
          console.log(">>> Loading finished. Showing Dashboard.")
        }, 2000)
      }
    }
    checkSession()
  }, [router])

  // Show WelcomeAnimation while loading
  if (loadingAuth) {
    return <WelcomeAnimation />
  }

  // 2. Toast Helper
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, msg: message, type })
    setTimeout(() => {
      setToast({ show: false, msg: '', type })
    }, 3000)
  }

  // 3. Logout
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // 4. Generate Plan
  async function handleGenerate() {
    if (!niche.trim()) {
      showToast('Please enter your business niche', 'error')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        showToast('Session expired. Please log in again.', 'error')
        router.push('/auth')
        return
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          niche,
          audience,
          platform,
          goal,
        }),
      })

      if (!res.ok) {
        let errorData: Record<string, unknown> = {}
        try {
          errorData = await res.json()
        } catch {
          errorData = {}
        }

        showToast((errorData.error as string) || 'Something went wrong', 'error')

        if (res.status === 401) {
          router.push('/auth')
        }

        return
      }

      const data = await res.json()
      setResult(data)
      setShowModal(true)
      showToast('Marketing Plan Generated Successfully!', 'success')

      // Update Local Usage
      const newUsage = realUsage + 1
      setRealUsage(newUsage)
      usageRef.current = newUsage // Update Ref too
      setRealLimit(realLimit)

    } catch (err) {
      console.error('Fetch error:', err)
      showToast('Network error.', 'error')
    } finally {
      setLoading(false)
    }
  }


  // unlimited useage for testing
  //   async function handleGenerate() {
  //   if (!niche.trim()) {
  //     showToast('Please enter your business niche', 'error')
  //     return
  //   }

  //   setLoading(true)
  //   setResult(null)

  //   try {
  //     const { data: { session } } = await supabase.auth.getSession()
  //     const currentUserId = session.user.id

  //     const res = await fetch('/api/generate', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ 
  //         niche, 
  //         audience, 
  //         platform, 
  //         goal,
  //         userId: currentUserId 
  //       })
  //     })

  //     // Don't check for 429 status anymore during testing
  //     const data = await res.json()

  //     // Check for other errors
  //     if (data.error && !data.error.includes('Monthly limit reached')) {
  //       showToast(data.error || 'Something went wrong', 'error')
  //       setLoading(false)
  //       return
  //     }

  //     setResult(data)
  //     setShowModal(true)
  //     showToast('Marketing Plan Generated Successfully!', 'success')

  //     // Optional: Still update local usage count if you want to track
  //     setRealUsage(prev => prev + 1)

  //   } catch (err) {
  //     console.error('Fetch error:', err)
  //     showToast('Network error.', 'error')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // 5. Render
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">

      {/* Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[60] px-6 py-4 rounded-xl shadow-2xl font-medium text-white transition-all duration-300 transform animate-scale-in flex items-center gap-3 min-w-[300px] ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40 bg-white/95 backdrop-blur-md">
          {/* Logo */}
          <Link href="/auth" className="flex items-center gap-2 font-bold text-xl tracking-tight group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-slate-900 group-hover:text-emerald-600 transition-colors">DKS QwikPlan</span>
          </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-xs font-medium text-slate-400 uppercase tracking-wider">
            {userEmail}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">

        {/* LEFT: UsageCard Component */}
        <UsageCard
          userEmail={userEmail}
          usage={realUsage}
          limit={realLimit}
        />

        {/* RIGHT: Tool Area */}
        <div className="lg:col-span-3 space-y-8">

          {/* Tool Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-slate-900 p-8 border-b border-slate-100">
              <h1 className="text-2xl font-bold text-white mb-1">AI Marketing Generator</h1>
              <p className="text-slate-400 text-sm mt-1">Create professional strategies in seconds.</p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Niche</label>
                <input
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-slate-300"
                  placeholder="e.g. Boutique Coffee Shop"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target</label>
                <input
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-slate-300"
                  placeholder="e.g. IT Professionals"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Platform</label>
                <select
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer"
                  value={platform} onChange={e => setPlatform(e.target.value)}
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Goal</label>
                <select
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer"
                  value={goal} onChange={e => setGoal(e.target.value)}
                >
                  <option value="sales">Drive Sales</option>
                  <option value="brand">Brand Awareness</option>
                  <option value="engagement">Boost Engagement</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full rounded-xl text-white font-bold py-4 text-sm uppercase tracking-wide transition-all duration-300 transform ${
                    loading
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Generate Strategy
                      <Zap className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Modal Component */}
          {userId && (
            <ResultModal
              showModal={showModal}
              result={result}
              niche={niche}
              platform={platform}
              showToast={showToast}
              onClose={() => setShowModal(false)}
              userId={userId}
              userEmail={userEmail}
            />
          )}
        </div>
      </div>
    </div>
  )
}
