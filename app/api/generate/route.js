// app/api/generate/route.js
import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    // --- 1. Body Parse ---
    const body = await req.json()

    // --- 2. Extract Variables ---
    const { niche, audience, platform, goal, userId } = body

    // --- 3. Validation ---
    if (!niche || !platform || !goal) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // --- 4. Safe DB Check (Handle Multiple Rows) ---
    let currentUsage = 0
    let limit = 10
    let profileId = null

    // FIX: Use array method instead of maybeSingle()
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, plan_usage, monthly_limit')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Fetch Error:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (profiles && profiles.length > 0) {
      // FIX: Take the first profile if multiple exist
      const profile = profiles[0]
      profileId = profile.id
      currentUsage = profile.plan_usage || 0
      limit = profile.monthly_limit || 10
      
      // Log warning if multiple profiles
      if (profiles.length > 1) {
        console.warn(`Multiple profiles found for user ${userId}. Using first one (ID: ${profileId})`)
      }
    } else {
      // Profile NOT found (New User): Create a new profile row
      console.log('Profile not found, creating new one for user:', userId)
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          user_id: userId, 
          plan_usage: 0, 
          monthly_limit: 10
        }])
        .select('id, plan_usage, monthly_limit')
        .single()

      if (insertError) {
        console.error('Insert Error:', insertError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
      
      // Use the newly created profile values
      if (newProfile) {
        profileId = newProfile.id
        currentUsage = newProfile.plan_usage
        limit = newProfile.monthly_limit
      }
    }

    // --- 5. Check Limit ---
    if (currentUsage >= limit) {
      return NextResponse.json({ 
        error: 'Monthly limit reached. Upgrade to Pro for more.', 
        usage: { current: currentUsage, limit: limit }
      }, { status: 429 })
    }

// TEMPORARY FIX: Allow unlimited usage during testing
// if (currentUsage >= limit) {
//   console.log(`[TEST MODE] Limit reached: ${currentUsage}/${limit}, but allowing anyway`)
//   // Continue instead of returning error
// }

    // --- 6. AI Logic ---
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    })

    const systemPrompt = "You are a senior social media marketing strategist."

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
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1,
      stream: false,
      response_format: { type: "json_object" }
    })

    const content = chatCompletion.choices[0]?.message?.content || '{}'

    let parsed
    try {
      parsed = JSON.parse(content)
      
      // FIX: Ensure schedule is always an array of strings
      if (parsed.schedule && Array.isArray(parsed.schedule)) {
        parsed.schedule = parsed.schedule.map(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.day && item.task) {
              return `${item.day}: ${item.task}`
            }
            return JSON.stringify(item)
          }
          return String(item)
        })
      }
    } catch (e) {
      console.error('JSON Parse Error:', e)
      return NextResponse.json({ error: 'Invalid AI Response' }, { status: 500 })
    }

    // --- 7. Increment Usage Count in DB ---
    if (profileId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plan_usage: currentUsage + 1 })
        .eq('id', profileId) // Use profileId instead of user_id

      if (updateError) {
        console.error('Update Error:', updateError)
      } else {
        console.log(`Usage updated for profile ${profileId}: ${currentUsage + 1}`)
      }
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}