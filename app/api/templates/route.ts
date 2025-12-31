import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface TemplateRequestBody {
  name: string
  description?: string
  platform: string
  niche: string
  audience?: string
  goal?: string
  strategy: string
  proTip?: string
  bestPostTime?: string
  schedule: string[]
  hashtags?: string
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

export async function POST(req: Request) {
  try {
    let body: TemplateRequestBody | undefined
    try {
      body = await req.json() as TemplateRequestBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const description = typeof body?.description === 'string' ? body.description.trim() : ''
    const platform = typeof body?.platform === 'string' ? body.platform.trim() : ''
    const niche = typeof body?.niche === 'string' ? body.niche.trim() : ''
    const audience = typeof body?.audience === 'string' ? body.audience.trim() : ''
    const goal = typeof body?.goal === 'string' ? body.goal.trim() : ''
    const strategy = typeof body?.strategy === 'string' ? body.strategy.trim() : ''
    const proTip = typeof body?.proTip === 'string' ? body.proTip.trim() : ''
    const bestPostTime = typeof body?.bestPostTime === 'string' ? body.bestPostTime.trim() : ''
    const schedule = Array.isArray(body?.schedule) ? body.schedule.map((s) => String(s)) : []
    const hashtags = typeof body?.hashtags === 'string' ? body.hashtags.trim() : ''

    // Validate template name
    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    if (name.length > 255) {
      return NextResponse.json({ error: 'Template name must be 255 characters or less' }, { status: 400 })
    }

    const bearerToken = getBearerToken(req)

    if (!bearerToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseFromBearerToken(bearerToken)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for duplicate template names for this user
    const { data: existingTemplates, error: checkError } = await supabase
      .from('templates')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .limit(1)

    if (checkError) {
      console.error('Template Check Error:', checkError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingTemplates && existingTemplates.length > 0) {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 })
    }

    // Insert the template
    const { data: newTemplate, error: insertError } = await supabase
      .from('templates')
      .insert([
        {
          user_id: user.id,
          name,
          description: description || null,
          platform,
          niche,
          audience: audience || null,
          goal: goal || null,
          strategy,
          pro_tip: proTip || null,
          best_post_time: bestPostTime || null,
          schedule,
          hashtags: hashtags || null,
        },
      ])
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('Template Insert Error:', insertError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      templateId: newTemplate.id,
      createdAt: newTemplate.created_at,
    })
  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
