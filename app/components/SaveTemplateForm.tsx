'use client'

import { useState, useEffect, ChangeEvent, useRef } from 'react'
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
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showModal && nameInputRef.current) {
      setName('')
      setDescription('')
      setError('')
      nameInputRef.current.focus()
    }
  }, [showModal])

  async function handleSubmit() {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Template name is required')
      return
    }

    if (trimmedName.length > 255) {
      setError('Template name must be 255 characters or less')
      return
    }

    if (!result) {
      showToast('No plan data to save', 'error')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        showToast('Session expired. Please log in again.', 'error')
        setIsLoading(false)
        return
      }

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || undefined,
          platform,
          niche,
          audience: audience || undefined,
          goal: goal || undefined,
          strategy: result.strategy,
          proTip: result.proTip || undefined,
          bestPostTime: result.bestPostTime || undefined,
          schedule: result.schedule,
          hashtags: result.hashtags || undefined,
        }),
      })

      let responseData: { error?: string; templateId?: string } = {}
      try {
        responseData = await res.json()
      } catch {
        responseData = {}
      }

      if (!res.ok) {
        if (res.status === 409) {
          setError('A template with this name already exists')
          showToast('Template name already exists', 'error')
        } else {
          setError((responseData.error as string) || 'Failed to save template')
          showToast((responseData.error as string) || 'Failed to save template', 'error')
        }
        setIsLoading(false)
        return
      }

      showToast(`Template "${trimmedName}" saved successfully!`, 'success')
      onSaveSuccess(responseData.templateId || '', trimmedName)
      onClose()
    } catch (err) {
      console.error('Save template error:', err)
      setError('Network error. Please try again.')
      showToast('Network error. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop Blur */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md overflow-y-auto rounded-3xl shadow-2xl z-10 animate-scale-in">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">Save as Template</h2>
              <p className="text-emerald-100 text-sm mt-1">Create a reusable template from this plan</p>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-100 hover:text-white hover:bg-emerald-500/30 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Template Name */}
          <div className="space-y-2">
            <label htmlFor="template-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="template-name"
              type="text"
              className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-slate-300"
              placeholder="e.g., Coffee Shop Instagram Plan"
              value={name}
              maxLength={255}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSubmit()
                }
              }}
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <span className={`text-xs ${name.length > 240 ? 'text-red-500' : 'text-slate-400'}`}>
                {name.length}/255
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="template-description" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="template-description"
              className="w-full bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 hover:border-slate-300 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Add a note about when to use this template..."
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Preview Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Platform:</span>
                <span className="font-medium text-slate-800 capitalize">{platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Niche:</span>
                <span className="font-medium text-slate-800 capitalize">{niche}</span>
              </div>
              {audience && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Audience:</span>
                  <span className="font-medium text-slate-800">{audience}</span>
                </div>
              )}
              {goal && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Goal:</span>
                  <span className="font-medium text-slate-800 capitalize">{goal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200 animate-slide-in-up">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 rounded-b-3xl flex justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 transition-all duration-200 transform hover:scale-105 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
            className={`px-5 py-2.5 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 text-sm shadow-md hover:shadow-lg ${
              isLoading || !name.trim()
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
            } disabled:opacity-50 disabled:transform-none`}
          >
            {isLoading ? (
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
  )
}
