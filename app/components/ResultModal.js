import { useState } from 'react'

export default function ResultModal({ showModal, result, niche, platform, showToast, onClose, userId, userEmail }) {
  
  // --- Feedback States ---
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [isSending, setIsSending] = useState(false) // Add loading state

  // --- Feedback Handler ---
  async function handleFeedbackSubmit() {
    // Simple validation
    if (!feedbackText.trim()) {
      showToast('Please enter a message.', 'error')
      return
    }

    setIsSending(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackText: feedbackText,
          userId: userId,
          userEmail: userEmail || 'No email provided',
          niche: niche || 'Unknown niche',
          platform: platform || 'Unknown platform'
        })
      })

      // Try to parse JSON
      let responseData = {}
      try {
        responseData = await res.json()
      } catch (e) {
        console.error(">>> JSON Parse Error:", e)
      }

      if (!res.ok) {
        console.error(">>> API Error:", responseData)
        showToast('Feedback saved but email failed', 'warning')
      } else {
        console.log(">>> API Success!")
        showToast('Thanks for your feedback!', 'success')
      }

      setFeedbackSent(true)

    } catch (err) {
      console.error(">>> Network / Exception:", err)
      showToast('Error sending feedback', 'error')
    } finally {
      setIsSending(false)
      
      // Reset after delay
      setTimeout(() => {
        setFeedbackText('')
        setFeedbackSent(false)
      }, 3000)
    }
  }
  return (
    <>
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl z-10 animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 rounded-t-3xl flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">Marketing Blueprint</h2>
                <p className="text-slate-400 text-sm mt-1">{niche} - {platform}</p>
              </div>
              <div className="flex gap-2">
                 {/* Print Button */}
                 <button
                   onClick={() => window.print()}
                   className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
                   title="Save as PDF"
                 >
                   🖨️
                 </button>
                 {/* Close Button */}
                 <button
                   onClick={onClose}
                   className="text-slate-400 hover:text-white transition text-2xl leading-none"
                 >
                   ×
                 </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              
              {/* Strategy */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Core Strategy</h3>
                <div className="bg-emerald-50 p-5 border border-emerald-100 rounded-xl text-slate-800 font-medium leading-relaxed">
                  {result.strategy}
                </div>
              </div>

              {/* Pro Tip */}
              {result.proTip && (
                <div className="flex gap-4 bg-amber-50 p-5 rounded-xl border border-amber-100">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Expert Insight</h3>
                    <p className="text-slate-800 text-sm">{result.proTip}</p>
                  </div>
                </div>
              )}

              {/* Best Time to Post */}
              {result.bestPostTime && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Best Time to Post</h3>
                      <p className="text-slate-800 text-sm font-medium">{result.bestPostTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">7-Day Execution Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.schedule && result.schedule.map((dayPlan, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl hover:border-emerald-300 transition">
                      <div className="font-bold text-emerald-600 mb-1 flex items-center gap-2">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded text-xs">Day {i+1}</span>
                      </div>
                      {/* CRITICAL FIX: Handle Object vs String */}
                      <div className="text-sm text-slate-800">
                        {typeof dayPlan === 'object' && dayPlan.task ? dayPlan.task : dayPlan}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              {result.hashtags && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Targeted Hashtags</h3>
                  <div className="bg-slate-900 text-slate-50 p-4 rounded-xl font-mono text-sm flex justify-between items-center gap-4">
                    <span>{result.hashtags}</span>
                    <button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold transition"
                      onClick={() => {
                        navigator.clipboard.writeText(result.hashtags)
                        showToast('Hashtags Copied!', 'success')
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* --- NEW: Feedback Section --- */}
              <div className="border-t border-slate-200 pt-6 mt-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Rate this Plan
                </h3>
                
                {feedbackSent ? (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center text-sm font-semibold">
                    ✅ Feedback Received! Thank you.
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 mb-3">
                      <button 
                        onClick={() => setFeedbackText('Useful')}
                        className={`flex-1 py-2 rounded-lg border font-semibold text-sm transition ${feedbackText === 'Useful' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-400'}`}
                      >
                        👍 Useful
                      </button>
                      <button 
                        onClick={() => setFeedbackText('Needs Improvement')}
                        className={`flex-1 py-2 rounded-lg border font-semibold text-sm transition ${feedbackText === 'Needs Improvement' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-red-400'}`}
                      >
                        👎 Needs Work
                      </button>
                    </div>

                    <textarea
                      className="w-full bg-slate-50 border-slate-200 border rounded-lg px-4 py-3 text-sm outline-none transition border-slate-300 focus:ring-2 focus:ring-emerald-500 resize-none"
                      rows="2"
                      placeholder="Optional: Tell us what you think..."
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                    />

  <button 
    onClick={handleFeedbackSubmit}
    disabled={isSending || feedbackSent}
    className={`w-full ${isSending ? 'bg-slate-600' : 'bg-slate-800'} text-white font-bold py-2.5 rounded-lg text-sm hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {isSending ? 'Sending...' : 'Send Feedback'}
  </button>

                  </>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-8 py-4 rounded-b-3xl flex justify-between items-center border-t border-slate-200">
              <span className="text-xs text-slate-400">BizPlan AI Generated</span>
              <div className="flex gap-2">
                 <button onClick={() => {
                      const allText = `Strategy:\n${result.strategy}\n\nPro Tip:\n${result.proTip}\n\nBest Time to Post:\n${result.bestPostTime}\n\nSchedule:\n${result.schedule.join('\n')}\n\nHashtags:\n${result.hashtags}`
                      navigator.clipboard.writeText(allText)
                      showToast('Full Plan Copied!', 'success')
                     }} className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition text-xs">
                   Copy All
                 </button>
                <button
                  onClick={onClose}
                  className="bg-slate-200 text-slate-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}