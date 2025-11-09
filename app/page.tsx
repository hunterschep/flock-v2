'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, MapPin, Home as HomeIcon, ArrowRight, Lock, Sparkles, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
import InteractiveStarfield from '@/components/InteractiveStarfield'

// Dynamically import the map to avoid SSR issues
const FlockMap = dynamic(() => import('@/components/map/FlockMap').then(mod => mod.FlockMap), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
    </div>
  )
})

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen gradient-ocean flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-ocean overflow-hidden relative">
      {/* EPIC Interactive Starfield */}
      <InteractiveStarfield />
      
      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-4000"></div>
      
      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 glass-light px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-sm text-white/90 font-medium">Alumni Network Platform</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in-up" style={{animationDelay: '100ms'}}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 drop-shadow-2xl leading-tight tracking-tight">
            Your network,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient">
              visualized
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Discover alumni in your city. Build connections that matter.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/auth"
              className="group relative px-8 py-4 glass-button rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all duration-300 overflow-hidden"
              style={{
                boxShadow: '0 20px 60px rgba(139, 92, 246, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)'
              }}
            >
              <span className="relative z-10">Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/50 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Link>
            
            <div className="glass-light px-5 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-white/90">Free with .edu email</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-center">
            <div className="animate-fade-in-up" style={{animationDelay: '200ms'}}>
              <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow">10K+</div>
              <div className="text-sm text-white/60">Alumni Connected</div>
            </div>
            <div className="animate-fade-in-up" style={{animationDelay: '300ms'}}>
              <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow">50+</div>
              <div className="text-sm text-white/60">Universities</div>
            </div>
            <div className="animate-fade-in-up" style={{animationDelay: '400ms'}}>
              <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow">100+</div>
              <div className="text-sm text-white/60">Cities</div>
            </div>
          </div>
        </div>

        {/* Locked Map Preview - EPIC Interactive Element */}
        <div className="max-w-6xl mx-auto animate-fade-in-up" style={{animationDelay: '500ms'}}>
          <div className="relative group">
            {/* Map Container with blur - responsive height */}
            <div className="glass-strong rounded-3xl overflow-hidden relative h-[350px] sm:h-[450px] md:h-[500px]">
              <div className="absolute inset-0 pointer-events-none z-10">
                <FlockMap />
              </div>
              
              {/* Lighter Blur Overlay - tease the user! */}
              <div className="absolute inset-0 backdrop-blur-sm bg-black/30 z-20"></div>
              
              {/* Lock UI */}
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
                {/* Animated Lock Icon */}
                <div className="relative mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative glass-strong p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
                    <Lock className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400 animate-pulse" />
                  </div>
                </div>
                
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg px-4">
                  Your Network Awaits
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-white/80 mb-6 sm:mb-8 max-w-md px-4">
                  Sign in to explore the interactive alumni map and connect with your network
                </p>
                
                <Link
                  href="/auth"
                  className="group relative px-6 sm:px-8 py-3 sm:py-4 glass-button rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2 sm:gap-3 hover:scale-105 transition-all duration-300 overflow-hidden"
                  style={{
                    boxShadow: '0 15px 40px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                  <span className="relative z-10">Unlock Full Access</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/50 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </Link>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 px-4">
                  <div className="glass-light px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm text-white/90">Live Map</span>
                  </div>
                  <div className="glass-light px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-xs sm:text-sm text-white/90">Alumni Directory</span>
                  </div>
                  <div className="glass-light px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2">
                    <HomeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                    <span className="text-xs sm:text-sm text-white/90">Roommate Finder</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10"></div>
          </div>
        </div>

        {/* University Carousel - EPIC */}
        <div className="max-w-6xl mx-auto mt-16 sm:mt-24 overflow-hidden pb-12 sm:pb-16">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-xs sm:text-sm uppercase tracking-wider text-white/50 font-semibold mb-3 sm:mb-4">Trusted By Students At</p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              Top Universities Nationwide
            </h3>
          </div>

          {/* Infinite Scrolling Carousel */}
          <div className="relative">
            {/* Fade gradients on edges for seamless effect */}
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-r from-[#000000] via-[#000000]/50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l from-[#000000] via-[#000000]/50 to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex animate-carousel">
              {/* First set of universities */}
              <div className="flex gap-4 sm:gap-6 shrink-0">
                {[
                  { emoji: '🌲', name: 'Stanford', color: 'from-red-500/20 to-red-600/20' },
                  { emoji: '🐻', name: 'UC Berkeley', color: 'from-blue-500/20 to-yellow-500/20' },
                  { emoji: '🌊', name: 'MIT', color: 'from-red-500/20 to-gray-500/20' },
                  { emoji: '🦅', name: 'Harvard', color: 'from-red-600/20 to-red-700/20' },
                  { emoji: '🌴', name: 'USC', color: 'from-yellow-500/20 to-red-500/20' },
                  { emoji: '🔵', name: 'Duke', color: 'from-blue-600/20 to-blue-700/20' },
                  { emoji: '🐾', name: 'Northwestern', color: 'from-purple-500/20 to-purple-600/20' },
                  { emoji: '🦁', name: 'Columbia', color: 'from-blue-400/20 to-blue-500/20' },
                ].map((uni, idx) => (
                  <div
                    key={`set1-${idx}`}
                    className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col items-center gap-2 sm:gap-3 min-w-[110px] sm:min-w-[140px] hover:scale-105 transition-all duration-300 group cursor-pointer"
                  >
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${uni.color} flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      {uni.emoji}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white/90 text-center">{uni.name}</span>
                  </div>
                ))}
              </div>
              
              {/* Duplicate set for seamless loop */}
              <div className="flex gap-4 sm:gap-6 shrink-0 ml-4 sm:ml-6">
                {[
                  { emoji: '🌲', name: 'Stanford', color: 'from-red-500/20 to-red-600/20' },
                  { emoji: '🐻', name: 'UC Berkeley', color: 'from-blue-500/20 to-yellow-500/20' },
                  { emoji: '🌊', name: 'MIT', color: 'from-red-500/20 to-gray-500/20' },
                  { emoji: '🦅', name: 'Harvard', color: 'from-red-600/20 to-red-700/20' },
                  { emoji: '🌴', name: 'USC', color: 'from-yellow-500/20 to-red-500/20' },
                  { emoji: '🔵', name: 'Duke', color: 'from-blue-600/20 to-blue-700/20' },
                  { emoji: '🐾', name: 'Northwestern', color: 'from-purple-500/20 to-purple-600/20' },
                  { emoji: '🦁', name: 'Columbia', color: 'from-blue-400/20 to-blue-500/20' },
                ].map((uni, idx) => (
                  <div
                    key={`set2-${idx}`}
                    className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col items-center gap-2 sm:gap-3 min-w-[110px] sm:min-w-[140px] hover:scale-105 transition-all duration-300 group cursor-pointer"
                  >
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${uni.color} flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      {uni.emoji}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white/90 text-center">{uni.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
