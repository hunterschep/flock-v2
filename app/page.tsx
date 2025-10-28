import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to Flock
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with new grads from your university and discover who's in your city. 
          Build your network, find roommates, and stay connected with your classmates.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          * Requires a .edu email address
        </p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-3">🎓</div>
            <h3 className="font-semibold text-gray-900 mb-2">Connect with Classmates</h3>
            <p className="text-gray-600 text-sm">
              Find and connect with grads from your university, no matter where they are now.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-semibold text-gray-900 mb-2">Discover Nearby Grads</h3>
            <p className="text-gray-600 text-sm">
              See who from your school is in your city and explore opportunities to meet up.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-3">🏠</div>
            <h3 className="font-semibold text-gray-900 mb-2">Find Roommates</h3>
            <p className="text-gray-600 text-sm">
              Looking for a place? Connect with fellow alumni who are also searching.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
