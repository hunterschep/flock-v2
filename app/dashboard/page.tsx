import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Get current user's profile
  const { data: currentUser } = await supabase
    .from('users')
    .select(`
      *,
      institutions:institution_id (
        name,
        domain
      )
    `)
    .eq('id', user.id)
    .single()

  if (!currentUser || !currentUser.onboarding_completed) {
    redirect('/onboarding')
  }

  // Get classmates from same institution OR nearby (within 50 miles)
  // The RLS policies handle the filtering, so we just query all visible users
  const { data: classmates } = await supabase
    .from('users')
    .select(`
      *,
      institutions:institution_id (
        name,
        domain
      )
    `)
    .neq('id', user.id)
    .eq('profile_visible', true)
    .order('created_at', { ascending: false })
    .limit(100)

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Flock</h1>
          <div className="flex items-center space-x-4">
            <Link 
              href="/profile/edit"
              className="text-gray-600 hover:text-gray-900"
            >
              Edit Profile
            </Link>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current user card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentUser.full_name}</h2>
              <p className="text-gray-600 mt-1">
                {currentUser.institutions?.name || 'No institution'} • Class of {currentUser.grad_year}
              </p>
              <div className="mt-2">
                {currentUser.status === 'employed' && (
                  <p className="text-sm text-gray-700">
                    {currentUser.job_title && `${currentUser.job_title}`}
                    {currentUser.show_employer !== false && currentUser.employer && ` at ${currentUser.employer}`}
                    {!currentUser.job_title && currentUser.show_employer !== false && currentUser.employer}
                  </p>
                )}
                {currentUser.status === 'grad_school' && currentUser.program && (
                  <p className="text-sm text-gray-700">
                    {currentUser.degree} in {currentUser.program}
                    {currentUser.show_school !== false && currentUser.institutions?.name && ` at ${currentUser.institutions.name}`}
                  </p>
                )}
                {currentUser.status === 'looking' && (
                  <p className="text-sm text-gray-700">
                    Looking for opportunities
                  </p>
                )}
              </div>
              {currentUser.city && currentUser.state && (
                <p className="text-sm text-gray-500 mt-2">
                  📍 {currentUser.city}, {currentUser.state}
                </p>
              )}
            </div>
            <Link
              href="/profile/edit"
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Classmates section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Network
            </h3>
            <p className="text-sm text-gray-500">
              {classmates?.length || 0} {classmates?.length === 1 ? 'person' : 'people'} found
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Showing classmates from {currentUser.institutions?.name || 'your institution'} and people within 50 miles of your location
          </p>

          {!classmates || classmates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">
                No one in your network yet. Invite classmates or add your location to connect with nearby grads!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classmates.map((classmate) => (
                <div
                  key={classmate.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-gray-900">{classmate.full_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Class of {classmate.grad_year}
                  </p>
                  
                  <div className="mt-3">
                    {classmate.status === 'employed' && (
                      <p className="text-sm text-gray-700">
                        {classmate.job_title && `${classmate.job_title}`}
                        {classmate.show_employer !== false && classmate.employer && ` at ${classmate.employer}`}
                        {!classmate.job_title && classmate.show_employer !== false && classmate.employer}
                      </p>
                    )}
                    {classmate.status === 'grad_school' && classmate.program && (
                      <p className="text-sm text-gray-700">
                        {classmate.degree && `${classmate.degree} in `}
                        {classmate.program}
                        {classmate.show_school !== false && classmate.institutions?.name && ` at ${classmate.institutions.name}`}
                      </p>
                    )}
                    {classmate.status === 'looking' && (
                      <p className="text-sm text-gray-700">
                        Looking for opportunities
                      </p>
                    )}
                  </div>

                  {classmate.city && classmate.state && (
                    <p className="text-sm text-gray-500 mt-2">
                      📍 {classmate.city}, {classmate.state}
                    </p>
                  )}

                  {classmate.looking_for_roommate && (
                    <span className="inline-block mt-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Looking for roommate
                    </span>
                  )}

                  {/* Social links */}
                  {(classmate.linkedin_url || classmate.twitter_url || classmate.personal_website) && (
                    <div className="mt-4 flex space-x-3">
                      {classmate.linkedin_url && (
                        <a
                          href={classmate.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="sr-only">LinkedIn</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                          </svg>
                        </a>
                      )}
                      {classmate.twitter_url && (
                        <a
                          href={classmate.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="sr-only">Twitter</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      {classmate.personal_website && (
                        <a
                          href={classmate.personal_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="sr-only">Website</span>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

