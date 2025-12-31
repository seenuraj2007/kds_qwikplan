'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface PlanResult {
  strategy: string
  proTip?: string
  bestPostTime?: string
  schedule: string[]
  hashtags?: string
}

interface SaveTemplateFormProps {
  showModal: boolean
  result: PlanResult | null
  niche: string
  audience: string
  platform: string
  goal: string
  onClose: () => void
  onSaveSuccess: (templateId: string, name: string) => void
  showToast: (msg: string, type: 'success' | 'error') => void
}

export default function SaveTemplateForm({
  showModal,
  result,
  niche,
  audience,
  platform,
  goal,
  onClose,
  onSaveSuccess,
  showToast,
}: SaveTemplateFormProps) {
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on name input when modal opens
  useEffect(() => {
    if (showModal && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [showModal])

  // Reset form when modal closes
  useEffect(() => {
    if (!showModal) {
      setTemplateName('')
      setDescription('')
    }
  }, [showModal])

  async function handleSaveTemplate(e: FormEvent) {
    e.preventDefault()

    if (!templateName.trim()) {
      showToast('Please enter a template name', 'error')
      return
    }

    if (!result) {
      showToast('No plan data available', 'error')
      return
    }

    setIsSaving(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        showToast('Session expired. Please log in again.', 'error')
        setIsSaving(false)
        return
      }

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: templateName.trim(),
          description: description.trim(),
          platform,
          niche,
          audience,
          goal,
          strategy: result.strategy,
          proTip: result.proTip || '',
          bestPostTime: result.bestPostTime || '',
          schedule: result.schedule || [],
          hashtags: result.hashtags || '',
        }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        showToast(responseData.error || 'Error saving template', 'error')
        setIsSaving(false)
        return
      }

      showToast(`Template '${templateName}' saved successfully!`, 'success')
      onSaveSuccess(responseData.templateId, templateName)
    } catch (err) {
      console.error('Save template error:', err)
      showToast('Network error. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!showModal) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        {/* Backdrop Blur */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl z-10 animate-scale-in">
          {/* Modal Header */}
          <div className="bg-slate-900 p-6 rounded-t-3xl flex justify-between items-center sticky top-0 z-20">
            <h2 className="text-xl font-bold text-white">Save as Template</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSaveTemplate} className="p-8 space-y-6">
            {/* Template Name */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                maxLength={255}
                placeholder="e.g. Coffee Shop Instagram Strategy"
                className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-slate-300"
                disabled={isSaving}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Required - Max 255 characters</span>
                <span>{templateName.length}/255</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add notes about when to use this template..."
                className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-slate-300 resize-none"
                disabled={isSaving}
              />
            </div>

            {/* Preview */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">
                Template Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Platform
                  </label>
                  <div className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-slate-800 border border-slate-200">
                    {platform}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Niche
                  </label>
                  <div className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-slate-800 border border-slate-200 truncate">
                    {niche}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Audience
                  </label>
                  <div className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-slate-800 border border-slate-200 truncate">
                    {audience || 'Not specified'}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Goal
                  </label>
                  <div className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-slate-800 border border-slate-200">
                    {goal}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                <p>This template will include the full marketing plan:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Strategy Summary</li>
                  <li>7-Day Execution Plan ({result?.schedule?.length || 0} days)</li>
                  {result?.proTip && <li>Expert Pro Tip</li>}
                  {result?.bestPostTime && <li>Best Posting Time</li>}
                  {result?.hashtags && <li>Targeted Hashtags</li>}
                </ul>
              </div>
            </div>
          </form>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-8 py-4 rounded-b-3xl flex justify-between items-center border-t border-slate-200 sticky bottom-0 z-20">
            <span className="text-xs text-slate-400">
              {isSaving ? 'Saving template...' : 'Ready to save?'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition-all duration-200 transform hover:scale-105 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSaveTemplate}
                disabled={isSaving || !templateName.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Template'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}