import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        // If user doesn't exist in users table or hasn't completed onboarding, redirect to onboarding
        if (!userData || !userData.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/auth`)
}

