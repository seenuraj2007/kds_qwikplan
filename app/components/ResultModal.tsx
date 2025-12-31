'use client'

import { useState, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import SaveTemplateForm from './SaveTemplateForm'

interface ResultModalProps {
  showModal: boolean
  result: {
    strategy: string
    proTip?: string
    bestPostTime?: string
    schedule: string[]
    hashtags?: string
  } | null
  niche: string
  audience: string
  platform: string
  goal: string
  showToast: (message: string, type: 'success' | 'error') => void
  onClose: () => void
  userId: string
  userEmail: string
}

export default function ResultModal({
  showModal,
  result,
  niche,
  audience,
  platform,
  goal,
  showToast,
  onClose,
}: ResultModalProps) {
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  async function handleFeedbackSubmit() {
    if (!feedbackText.trim()) {
      showToast('Please enter a message.', 'error')
      return
    }

    setIsSending(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        showToast('Session expired. Please log in again.', 'error')
        return
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          feedbackText,
          niche: niche || 'Unknown niche',
          platform: platform || 'Unknown platform',
        }),
      })

      let responseData: Record<string, unknown> = {}
      try {
        responseData = await res.json()
      } catch {
        responseData = {}
      }

      if (!res.ok) {
        showToast((responseData.error as string) || 'Error sending feedback', 'error')
        return
      }

      showToast('Thanks for your feedback!', 'success')
      setFeedbackSent(true)
    } catch (err) {
      console.error('Feedback submit error:', err)
      showToast('Error sending feedback', 'error')
    } finally {
      setIsSending(false)

      setTimeout(() => {
        setFeedbackText('')
        setFeedbackSent(false)
      }, 3000)
    }
  }

  return (
    <>
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 rounded-t-3xl flex justify-between items-start sticky top-0 z-20">
              <div>
                <h2 className="text-2xl font-bold text-white">Marketing Blueprint</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {niche} - {platform}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                  title="Save as PDF"
                >
                  🖨️
                </button>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 transform hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Strategy */}
              <div className="animate-slide-in-up" style={{animationDelay: '100ms'}}>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Core Strategy
                </h3>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 border border-emerald-200/50 rounded-xl text-slate-800 font-medium leading-relaxed shadow-sm">
                  {result.strategy}
                </div>
              </div>

              {/* Pro Tip */}
              {result.proTip && (
                <div className="flex gap-4 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-xl border border-amber-200/50 shadow-sm animate-slide-in-up" style={{animationDelay: '200ms'}}>
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                      Expert Insight
                    </h3>
                    <p className="text-slate-800 text-sm leading-relaxed">{result.proTip}</p>
                  </div>
                </div>
              )}

              {/* Best Time to Post */}
              {result.bestPostTime && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200/50 shadow-sm animate-slide-in-up" style={{animationDelay: '300ms'}}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⏰</span>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
                        Best Time to Post
                      </h3>
                      <p className="text-slate-800 text-sm font-medium">
                        {result.bestPostTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div className="animate-slide-in-up" style={{animationDelay: '400ms'}}>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  7-Day Execution Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.schedule &&
                    result.schedule.map((dayPlan, i) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-200 p-4 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                        style={{animationDelay: `${400 + i * 50}ms`}}
                      >
                        <div className="font-bold text-emerald-600 mb-1 flex items-center gap-2">
                          <span className="bg-emerald-100 px-2 py-0.5 rounded text-xs font-semibold">
                            Day {i + 1}
                          </span>
                        </div>
                        <div className="text-sm text-slate-800 leading-relaxed">
                          {typeof dayPlan === 'object' && dayPlan !== null && 'task' in dayPlan
                            ? (dayPlan as { task: string }).task
                            : dayPlan}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Hashtags */}
              {result.hashtags && (
                <div className="animate-slide-in-up" style={{animationDelay: '800ms'}}>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Targeted Hashtags
                  </h3>
                  <div className="bg-slate-900 text-slate-50 p-4 rounded-xl font-mono text-sm flex justify-between items-center gap-4 shadow-md">
                    <span className="break-all">{result.hashtags}</span>
                    <button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(result.hashtags ?? '')
                        showToast('Hashtags Copied!', 'success')
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              <div className="border-t border-slate-200 pt-6 mt-4 animate-slide-in-up" style={{animationDelay: '900ms'}}>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Rate this Plan
                </h3>

                {feedbackSent ? (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center text-sm font-semibold border border-emerald-200">
                    ✅ Feedback Received! Thank you.
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 mb-3">
                      <button
                        onClick={() => setFeedbackText('Useful')}
                        className={`flex-1 py-3 rounded-lg border font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                          feedbackText === 'Useful'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md'
                            : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                        }`}
                      >
                        👍 Useful
                      </button>
                      <button
                        onClick={() => setFeedbackText('Needs Improvement')}
                        className={`flex-1 py-3 rounded-lg border font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                          feedbackText === 'Needs Improvement'
                            ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                            : 'border-slate-200 hover:border-red-400 hover:bg-red-50/50'
                        }`}
                      >
                        👎 Needs Work
                      </button>
                    </div>

                    <textarea
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-slate-400 resize-none"
                      rows={2}
                      placeholder="Optional: Tell us what you think..."
                      value={feedbackText}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
                    />

                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={isSending || feedbackSent}
                      className={`w-full mt-3 ${
                        isSending ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'
                      } text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md`}
                    >
                      {isSending ? 'Sending...' : 'Send Feedback'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-8 py-4 rounded-b-3xl flex justify-between items-center border-t border-slate-200 sticky bottom-0 z-20">
              <span className="text-xs text-slate-400">BizPlan AI Generated</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allText = `Strategy:\n${result.strategy}\n\nPro Tip:\n${result.proTip ?? ''}\n\nBest Time to Post:\n${result.bestPostTime ?? ''}\n\nSchedule:\n${result.schedule.join('\n')}\n\nHashtags:\n${result.hashtags ?? ''}`
                    navigator.clipboard.writeText(allText)
                    showToast('Full Plan Copied!', 'success')
                  }}
                  className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition-all duration-200 transform hover:scale-105 text-xs"
                >
                  Copy All
                </button>
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105 text-xs shadow-md hover:shadow-lg"
                >
                  Save as Template
                </button>
                <button
                  onClick={onClose}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 text-sm shadow-md hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && result && (
        <SaveTemplateForm
          showModal={showSaveTemplateModal}
          result={result}
          niche={niche}
          audience={audience}
          platform={platform}
          goal={goal}
          onClose={() => setShowSaveTemplateModal(false)}
          onSaveSuccess={(templateId, name) => {
            console.log('Template saved:', templateId, name)
          }}
          showToast={showToast}
        />
      )}
    </>
  )
}
