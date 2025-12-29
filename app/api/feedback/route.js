import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  try {
    // 1. Parse the request body
    const body = await req.json()
    const { feedbackText, userId, userEmail, niche, platform } = body

    console.log(">>> Received feedback:", {
      userId,
      userEmail,
      niche,
      platform,
      feedbackLength: feedbackText?.length
    })

    // 2. Validate required fields
    if (!feedbackText || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: feedbackText and userId' },
        { status: 400 }
      )
    }

    // 3. First, check if feedback table exists, create if not
    console.log(">>> Step 1: Checking/creating feedback table...")
    
    // Try to insert into feedback table
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        user_email: userEmail || null,
        feedback_text: feedbackText,
        niche: niche || null,
        platform: platform || null,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error(">>> DB Insert Error:", insertError)
      
      // If table doesn't exist, create it first
      if (insertError.code === '42P01') { // Table doesn't exist
        console.log(">>> Creating feedback table...")
        
        // You'll need to create the table manually in Supabase first
        // Or use SQL query with service role key
        return NextResponse.json(
          { error: 'Feedback table not set up. Please create it in Supabase.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to save feedback to database' },
        { status: 500 }
      )
    }

    console.log(">>> Step 2: Feedback saved to DB successfully")

    // 4. Send email via Resend (if API key exists)
    if (process.env.RESEND_API_KEY) {
      console.log(">>> Step 3: Attempting to send email...")
      
      try {
        const { data, error } = await resend.emails.send({
          from: 'BizPlan AI <onboarding@resend.dev>', // Replace with your verified domain
          to: ['214seenuraja@gmail.com'], // 👈 YOUR EMAIL HERE
          subject: `📝 New Feedback: ${niche || 'Unknown Niche'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0;">🚀 New BizPlan AI Feedback</h1>
              </div>
              
              <div style="padding: 30px; background: #f9fafb;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <h3 style="color: #374151; margin-top: 0;">Feedback Details</h3>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>User ID:</strong></td>
                      <td style="padding: 8px 0;">${userId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                      <td style="padding: 8px 0;">${userEmail || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;"><strong>Niche:</strong></td>
                      <td style="padding: 8px 0;">${niche || 'Not specified'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;"><strong>Platform:</strong></td>
                      <td style="padding: 8px 0;">${platform || 'Not specified'}</td>
                    </tr>
                  </table>
                  
                  <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-left: 4px solid #10b981; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; color: #374151;"><strong>Feedback:</strong></p>
                    <p style="margin: 0; color: #4b5563; font-style: italic;">"${feedbackText}"</p>
                  </div>
                  
                  <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px;">
                      Sent from BizPlan AI Dashboard • ${new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `,
          text: `New feedback received from user ${userId} (${userEmail || 'no email'}).
          
Niche: ${niche || 'Not specified'}
Platform: ${platform || 'Not specified'}

Feedback:
"${feedbackText}"

Sent: ${new Date().toLocaleString()}
          `
        })

        if (error) {
          console.error(">>> Resend Error:", error)
          // Don't fail the request if email fails
        } else {
          console.log(">>> Email sent successfully!")
        }
      } catch (emailError) {
        console.error(">>> Email Exception:", emailError)
        // Continue anyway
      }
    } else {
      console.log(">>> No RESEND_API_KEY found, skipping email")
    }

    // 5. Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback saved successfully' 
    })

  } catch (error) {
    console.error('>>> Server Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}