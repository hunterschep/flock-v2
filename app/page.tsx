import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, MapPin, Home as HomeIcon, ArrowRight, Sparkles } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen gradient-ocean flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-hidden relative">
      {/* Decorative elements - Ultra Dark */}
      <div className="absolute top-10 -left-10 sm:top-20 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
      <div className="absolute top-20 -right-10 sm:top-40 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
      <div className="absolute -bottom-10 left-10 sm:-bottom-8 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-indigo-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-4000"></div>
      
      <div className="max-w-6xl mx-auto text-center relative z-10 w-full">
        {/* Hero Section */}
        <div className="glass-strong rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 mb-12 sm:mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 glass-light px-4 py-2 rounded-full mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/90 font-medium">Alumni Network Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 drop-shadow-lg leading-tight tracking-tight">
            Connect with your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              university network
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
            Build meaningful connections with alumni from your university. Discover classmates in your city, 
            find career opportunities, and grow your professional network.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth"
              className="glass-button px-10 py-5 text-white rounded-2xl font-bold hover:scale-105 transition-all duration-300 text-base sm:text-lg flex items-center gap-3 group relative overflow-hidden"
              style={{
                boxShadow: '0 20px 60px rgba(139, 92, 246, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)'
              }}
            >
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/50 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Link>
            <div className="glass-light px-4 py-2.5 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-white/90 font-medium">University email required</span>
            </div>
          </div>
        </div>

        {/* Features Grid - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div 
            className="feature-card-purple glass-card p-6 sm:p-8 group hover:scale-[1.02] transition-all duration-500 animate-fade-in relative overflow-hidden cursor-pointer"
            style={{animationDelay: '100ms'}}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/10 group-hover:to-purple-600/10 transition-all duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-3 drop-shadow group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">Alumni Network</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Connect with graduates from your university and build lasting professional relationships.
              </p>
            </div>
          </div>
          
          <div 
            className="feature-card-blue glass-card p-6 sm:p-8 group hover:scale-[1.02] transition-all duration-500 animate-fade-in relative overflow-hidden cursor-pointer"
            style={{animationDelay: '200ms'}}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/30 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <MapPin className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-3 drop-shadow group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 transition-all">Location-Based Discovery</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Find alumni in your city and discover local networking opportunities.
              </p>
            </div>
          </div>
          
          <div 
            className="feature-card-pink glass-card p-6 sm:p-8 group hover:scale-[1.02] transition-all duration-500 animate-fade-in relative overflow-hidden cursor-pointer"
            style={{animationDelay: '300ms'}}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-rose-500/0 group-hover:from-pink-500/10 group-hover:to-rose-500/10 transition-all duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/30 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <HomeIcon className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-3 drop-shadow group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-rose-400 transition-all">Housing Connections</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Connect with fellow alumni searching for roommates in your area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
