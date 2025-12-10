import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth?error=auth_error&error_description=${encodeURIComponent(error.message)}`)
    }

    // Handle password recovery - redirect to reset form
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth?mode=reset`)
    }

    // Handle email verification (signup confirmation)
    if (type === 'signup' || type === 'email') {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has already completed onboarding
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (userData?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        
        // New user - go to onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }

    // Default: check user status and redirect appropriately
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (!userData || !userData.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Fallback to auth page
  return NextResponse.redirect(`${origin}/auth`)
}
