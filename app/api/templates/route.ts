import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface SaveTemplateRequestBody {
  name?: unknown
  description?: unknown
  platform?: unknown
  niche?: unknown
  audience?: unknown
  goal?: unknown
  strategy?: unknown
  proTip?: unknown
  bestPostTime?: unknown
  schedule?: unknown
  hashtags?: unknown
}

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

export async function POST(req: Request) {
  try {
    let body: SaveTemplateRequestBody | undefined
    try {
      body = await req.json() as SaveTemplateRequestBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const description = typeof body?.description === 'string' ? body.description.trim() : ''
    const platform = typeof body?.platform === 'string' ? body.platform.trim() : ''
    const niche = typeof body?.niche === 'string' ? body.niche.trim() : ''
    const audience = typeof body?.audience === 'string' ? body.audience.trim() : ''
    const goal = typeof body?.goal === 'string' ? body.goal.trim() : ''
    const strategy = typeof body?.strategy === 'string' ? body.strategy : ''
    const proTip = typeof body?.proTip === 'string' ? body.proTip : ''
    const bestPostTime = typeof body?.bestPostTime === 'string' ? body.bestPostTime : ''
    const hashtags = typeof body?.hashtags === 'string' ? body.hashtags : ''

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: 'Template name must be 255 characters or less' },
        { status: 400 }
      )
    }

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
    }

    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 })
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

    // Check for duplicate template name for this user
    const { data: existingTemplates, error: checkError } = await supabase
      .from('templates')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .limit(1)

    if (checkError) {
      console.error('Duplicate check error:', checkError)
      return NextResponse.json(
        { error: 'Database error while checking for duplicates' },
        { status: 500 }
      )
    }

    if (existingTemplates && existingTemplates.length > 0) {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      )
    }

    // Prepare schedule data
    let scheduleData: string[] = []
    if (body?.schedule && Array.isArray(body.schedule)) {
      scheduleData = body.schedule.map(item => String(item))
    }

    // Insert the template
    const { data: newTemplate, error: insertError } = await supabase
      .from('templates')
      .insert([
        {
          user_id: user.id,
          name,
          description,
          platform,
          niche,
          audience,
          goal,
          strategy,
          pro_tip: proTip,
          best_post_time: bestPostTime,
          schedule: scheduleData,
          hashtags,
        },
      ])
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('Template insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save template' },
        { status: 500 }
      )
    }

    if (!newTemplate) {
      return NextResponse.json(
        { error: 'Template creation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templateId: newTemplate.id,
      createdAt: newTemplate.created_at,
    })
  } catch (error) {
    console.error('Save template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}