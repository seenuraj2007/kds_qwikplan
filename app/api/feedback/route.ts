import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function createSupabaseFromBearerToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}

async function createSupabaseFromCookies() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          ;(await cookieStore).set({ name, value, ...options })
        },
        async remove(name: string, options: Record<string, unknown>) {
          ;(await cookieStore).set({ name, value: '', ...options })
        },
      },
    }
  )
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

interface FeedbackRequestBody {
  feedbackText?: unknown
  niche?: unknown
  platform?: unknown
}

export async function POST(req: Request) {
  try {
    let body: FeedbackRequestBody | undefined
    try {
      body = await req.json() as FeedbackRequestBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const feedbackText =
      typeof body?.feedbackText === 'string' ? body.feedbackText.trim() : ''
    const niche = typeof body?.niche === 'string' ? body.niche.trim() : null
    const platform = typeof body?.platform === 'string' ? body.platform.trim() : null

    if (!feedbackText) {
      return NextResponse.json(
        { error: 'Missing required field: feedbackText' },
        { status: 400 }
      )
    }

    if (feedbackText.length > 2000) {
      return NextResponse.json(
        { error: 'Feedback is too long' },
        { status: 400 }
      )
    }

    const bearerToken = getBearerToken(req)

    const supabase = bearerToken
      ? createSupabaseFromBearerToken(bearerToken)
      : await createSupabaseFromCookies()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user.id,
      user_email: user.email || null,
      feedback_text: feedbackText,
      niche,
      platform,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Feedback insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const toListRaw =
      process.env.FEEDBACK_TO_EMAILS ||
      process.env.FEEDBACK_TO_EMAIL ||
      process.env.FEEDBACK_NOTIFICATION_EMAIL

    const to = toListRaw
      ? toListRaw
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
      : []

    if (resendApiKey && to.length > 0) {
      const resend = new Resend(resendApiKey)

      const from = process.env.RESEND_FROM || 'BizPlan AI <onboarding@resend.dev>'

      const safeFeedbackText = escapeHtml(feedbackText)
      const safeNiche = niche ? escapeHtml(niche) : 'Not specified'
      const safePlatform = platform ? escapeHtml(platform) : 'Not specified'
      const safeUserEmail = user.email ? escapeHtml(user.email) : 'Not provided'
      const safeUserId = escapeHtml(user.id)

      try {
        const { error } = await resend.emails.send({
          from,
          to,
          subject: `New Feedback: ${niche || 'Unknown Niche'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New BizPlan AI Feedback</h2>
              <p><strong>User ID:</strong> ${safeUserId}</p>
              <p><strong>Email:</strong> ${safeUserEmail}</p>
              <p><strong>Niche:</strong> ${safeNiche}</p>
              <p><strong>Platform:</strong> ${safePlatform}</p>
              <hr />
              <p><strong>Feedback:</strong></p>
              <p style="white-space: pre-wrap;">${safeFeedbackText}</p>
            </div>
          `,
          text: `New feedback received\n\nUser: ${user.id} (${user.email || 'no email'})\nNiche: ${niche || 'Not specified'}\nPlatform: ${platform || 'Not specified'}\n\nFeedback:\n${feedbackText}`,
        })

        if (error) {
          console.error('Resend send error:', error)
        }
      } catch (emailError) {
        console.error('Resend send exception:', emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
