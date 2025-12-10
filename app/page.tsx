'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Lock, Users, Check } from 'lucide-react'
import dynamic from 'next/dynamic'
import InteractiveStarfield from '@/components/InteractiveStarfield'
import { Footer } from '@/components/Footer'

const FlockMap = dynamic(() => import('@/components/map/FlockMap').then(mod => mod.FlockMap), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
    </div>
  )
})

export default function Home() {
  const router = useRouter()
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
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    )
  }

  const universities = [
    { image: '/schools/bc.png', name: 'Boston College' },
    { image: '/schools/uw.png', name: 'UW' },
    { image: '/schools/umass.png', name: 'UMass' },
    { image: '/schools/rice.png', name: 'Rice' },
    { image: '/schools/purdue.png', name: 'Purdue' },
    { image: '/schools/bu.png', name: 'BU' },
    { image: '/schools/neu.png', name: 'Northeastern' },
    { image: '/schools/wsu.png', name: 'WSU' },
  ]

  return (
    <div id="main-content" className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden">
      <InteractiveStarfield />
      
      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-28 md:pb-20">
        {/* Badge */}
        <div className="flex justify-center mb-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-white/60">Now in beta at 50+ universities</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
            Find your classmates
            <span className="block text-[var(--color-accent)]">worldwide</span>
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-lg mx-auto leading-relaxed">
            Find your people: alumni everywhere, new grads near you
          </p>
        </div>
        
        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Link
            href="/auth"
            className="group glass-button px-7 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            Free with .edu email
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-10 md:gap-16 mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          {[
            { value: '10K+', label: 'Alumni' },
            { value: '50+', label: 'Universities' },
            { value: '100+', label: 'Cities' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Map Preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20 md:pb-28">
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)]/20 via-transparent to-[var(--color-accent)]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Map container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
              <div className="aspect-[16/10] md:aspect-[16/9] relative">
                <div className="absolute inset-0 pointer-events-none">
                  <FlockMap onLocationSelect={() => {}} hideControls />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20" />
                
                {/* CTA overlay */}
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6">
                  <div className="text-center max-w-md">
                    <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white/80" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Explore Your Network
                    </h3>
                    <p className="text-white/50 mb-6 text-sm">
                      Sign in to unlock the full interactive map and alumni directory.
                    </p>
                    <Link
                      href="/auth"
                      className="inline-flex items-center gap-2 glass-button px-5 py-2.5 rounded-lg text-sm font-semibold"
                    >
                      <Lock className="w-4 h-4" />
                      Unlock Map
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 pb-20 md:pb-28 overflow-hidden">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Trusted by students at</p>
          <h2 className="text-lg md:text-xl font-semibold text-white">
            Top Universities Nationwide
          </h2>
        </div>

        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--color-bg)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--color-bg)] to-transparent z-10 pointer-events-none" />
          
          <div className="flex animate-carousel">
            {[...universities, ...universities].map((uni, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-3 p-5 min-w-[140px] shrink-0 mx-2 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={uni.image} 
                    alt={uni.name}
                    className="w-full h-full object-contain opacity-70"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 md:pb-32 text-center">
        <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
          <Users className="w-10 h-10 text-[var(--color-accent)] mx-auto mb-5" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Join your alumni network
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto text-sm">
            Connect with thousands of graduates from your university. It only takes a minute to get started.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 glass-button px-8 py-4 rounded-xl text-base font-semibold"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
