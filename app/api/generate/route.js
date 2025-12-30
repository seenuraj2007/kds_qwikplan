import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit } from '../../../lib/rate-limit'

function getBearerToken(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || null
}

function createSupabaseFromBearerToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

function createSupabaseFromCookies(cookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function POST(req) {
  try {
    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const niche = typeof body?.niche === 'string' ? body.niche.trim() : ''
    const audience = typeof body?.audience === 'string' ? body.audience.trim() : ''
    const platform = typeof body?.platform === 'string' ? body.platform.trim() : ''
    const goal = typeof body?.goal === 'string' ? body.goal.trim() : ''

    if (!niche || !platform || !goal) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const bearerToken = getBearerToken(req)
    const cookieStore = cookies()

    const supabase = bearerToken
      ? createSupabaseFromBearerToken(bearerToken)
      : createSupabaseFromCookies(cookieStore)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = checkRateLimit(user.id)
    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimitResult.retryAfter - Date.now()) / 1000)
      )

      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      )
    }

    let currentUsage = 0
    let limit = 10
    let profileId = null

    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, plan_usage, monthly_limit')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Fetch Error:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (profiles && profiles.length > 0) {
      const profile = profiles[0]
      profileId = profile.id
      currentUsage = profile.plan_usage || 0
      limit = profile.monthly_limit || 10

      if (profiles.length > 1) {
        console.warn(
          `Multiple profiles found for user ${user.id}. Using first one (ID: ${profileId})`
        )
      }
    } else {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            plan_usage: 0,
            monthly_limit: 10,
          },
        ])
        .select('id, plan_usage, monthly_limit')
        .single()

      if (insertError) {
        console.error('Insert Error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      profileId = newProfile?.id
      currentUsage = newProfile?.plan_usage || 0
      limit = newProfile?.monthly_limit || 10
    }

    if (currentUsage >= limit) {
      return NextResponse.json(
        {
          error: 'Monthly limit reached. Upgrade to Pro for more.',
          usage: { current: currentUsage, limit },
        },
        { status: 429 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const systemPrompt = 'You are a senior social media marketing strategist.'

    const userPrompt = `
      Niche: ${niche}
      Target Audience: ${audience || 'General public'} 
      Platform: ${platform}
      Goal: ${goal}

      TASK: Create a 7-Day Social Media Plan.

      Output Sections:
      1. Strategy Summary: 
         - Focus on how to appeal to this ${audience || 'audience'} on ${platform}.

      2. Weekly Schedule (7 Days):
         - Each day must be actionable.
         - Provide as a simple array of strings, not objects.
         - Example: ["Day 1: Post about X", "Day 2: Create Y"]
         - DO NOT use objects with day/task keys.

      3. Pro Tip:
         - Give ONE specific insider secret or psychology hack for this niche on this platform.

      4. Best Time to Post (NEW):
         - Suggest ideal time slot to post on ${platform} for ${audience || 'your audience'} to achieve goal ${goal}.
         - Example format: "7 PM - 9 PM" or "Weekdays 9 AM".

      5. Viral Hashtags:
         - 5-10 relevant hashtags.

      Return ONLY raw JSON with this EXACT structure:
      {
        "strategy": "Summary text...",
        "schedule": ["Day 1: task...", "Day 2: task..."],
        "proTip": "Secret tip here...",
        "bestPostTime": "Time slot here...", 
        "hashtags": "#tag1 #tag2"
      }
    `

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 1,
      stream: false,
      response_format: { type: 'json_object' },
    })

    const content = chatCompletion.choices[0]?.message?.content || '{}'

    let parsed
    try {
      parsed = JSON.parse(content)

      if (!Array.isArray(parsed.schedule)) {
        parsed.schedule = []
      }

      parsed.schedule = parsed.schedule.map((item) => {
        if (typeof item === 'object' && item !== null) {
          if (item.day && item.task) {
            return `${item.day}: ${item.task}`
          }
          return JSON.stringify(item)
        }
        return String(item)
      })
    } catch (e) {
      console.error('JSON Parse Error:', e)
      return NextResponse.json({ error: 'Invalid AI Response' }, { status: 500 })
    }

    if (profileId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plan_usage: currentUsage + 1 })
        .eq('id', profileId)

      if (updateError) {
        console.error('Update Error:', updateError)
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
