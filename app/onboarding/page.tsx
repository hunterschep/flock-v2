'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UNIVERSITIES, DEGREE_TYPES, PROGRAM_NAMES } from '@/lib/constants/universities'

type OnboardingStep = 1 | 2 | 3 | 4 | 5

interface OnboardingData {
  full_name: string
  grad_year: number
  personal_email: string
  status: 'employed' | 'grad_school' | 'looking' | 'internship' | ''
  employer: string
  job_title: string
  grad_school: string
  program: string
  degree: string
  city: string
  state: string
  latitude: number | null
  longitude: number | null
  linkedin_url: string
  twitter_url: string
  instagram_url: string
  personal_website: string
  looking_for_roommate: boolean
  show_employer: boolean
  show_school: boolean
}

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState<OnboardingData>({
    full_name: '',
    grad_year: new Date().getFullYear(),
    personal_email: '',
    status: '',
    employer: '',
    job_title: '',
    grad_school: '',
    program: '',
    degree: '',
    city: '',
    state: '',
    latitude: null,
    longitude: null,
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    personal_website: '',
    looking_for_roommate: false,
    show_employer: true,
    show_school: true,
  })

  const [locationSearch, setLocationSearch] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [isLocationSelected, setIsLocationSelected] = useState(false)

  // Autocomplete state for university, program, and degree
  const [universitySearch, setUniversitySearch] = useState('')
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([])
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false)

  const [programSearch, setProgramSearch] = useState('')
  const [programSuggestions, setProgramSuggestions] = useState<string[]>([])
  const [showProgramSuggestions, setShowProgramSuggestions] = useState(false)

  const [degreeSearch, setDegreeSearch] = useState('')
  const [degreeSuggestions, setDegreeSuggestions] = useState<string[]>([])
  const [showDegreeSuggestions, setShowDegreeSuggestions] = useState(false)

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  // Filter universities as user types
  useEffect(() => {
    if (universitySearch.length > 0) {
      const filtered = UNIVERSITIES.filter(uni =>
        uni.toLowerCase().includes(universitySearch.toLowerCase())
      ).slice(0, 10)
      setUniversitySuggestions(filtered)
    } else {
      setUniversitySuggestions([])
    }
  }, [universitySearch])

  // Filter programs as user types
  useEffect(() => {
    if (programSearch.length > 0) {
      const filtered = PROGRAM_NAMES.filter(prog =>
        prog.toLowerCase().includes(programSearch.toLowerCase())
      ).slice(0, 10)
      setProgramSuggestions(filtered)
    } else {
      setProgramSuggestions([])
    }
  }, [programSearch])

  // Filter degrees as user types
  useEffect(() => {
    if (degreeSearch.length > 0) {
      const filtered = DEGREE_TYPES.filter(deg =>
        deg.toLowerCase().includes(degreeSearch.toLowerCase())
      ).slice(0, 10)
      setDegreeSuggestions(filtered)
    } else {
      setDegreeSuggestions([])
    }
  }, [degreeSearch])

  // Location search with debouncing
  useEffect(() => {
    const searchLocation = async () => {
      // Don't search if location was just selected or search is too short
      if (isLocationSelected || locationSearch.length < 3) {
        setLocationSuggestions([])
        return
      }

      setSearchingLocation(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5&countrycodes=us`
        )
        const results = await response.json()
        setLocationSuggestions(results)
      } catch (err) {
        console.error('Location search error:', err)
      } finally {
        setSearchingLocation(false)
      }
    }

    const timeoutId = setTimeout(searchLocation, 300)
    return () => clearTimeout(timeoutId)
  }, [locationSearch, isLocationSelected])

  const selectLocation = (location: any) => {
    console.log('Selected location:', location)
    
    // Extract city name from name field or first part of display_name
    const cityName = location.name || location.display_name.split(',')[0].trim()
    
    // Extract state from display_name (format: "City, County, State, Country")
    const displayParts = location.display_name.split(',').map((s: string) => s.trim())
    // State is usually the second-to-last item (before "United States")
    const stateName = displayParts.length >= 2 ? displayParts[displayParts.length - 2] : ''
    
    console.log('Extracted:', { cityName, stateName, lat: location.lat, lon: location.lon })
    
    // Update the data
    setData(prev => ({
      ...prev,
      city: cityName,
      state: stateName,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    }))
    
    // Mark location as selected to prevent auto-search
    setIsLocationSelected(true)
    
    // Update the search input to show selected location
    const displayText = stateName ? `${cityName}, ${stateName}` : cityName
    setLocationSearch(displayText)
    
    // Clear suggestions immediately
    setLocationSuggestions([])
  }

  const handleNext = () => {
    setError(null)
    
    // Step 1: Basic Info validation
    if (step === 1) {
      if (!data.full_name || !data.grad_year) {
        setError('Please fill in all required fields')
        return
      }
      const yearStr = data.grad_year.toString()
      if (yearStr.length !== 4 || data.grad_year < 1950 || data.grad_year > 2100) {
        setError('Please enter a valid 4-digit graduation year (1950-2100)')
        return
      }
    }
    
    // Step 2: Status validation
    if (step === 2 && !data.status) {
      setError('Please select your current status')
      return
    }
    
    // Step 3: Status-specific fields validation
    if (step === 3) {
      if (data.status === 'employed' || data.status === 'internship') {
        if (!data.employer || !data.job_title) {
          setError('Please provide your employer and job title')
          return
        }
      }
      if (data.status === 'grad_school') {
        if (!data.grad_school || !data.program || !data.degree) {
          setError('Please provide your school, program, and degree')
          return
        }
      }
    }
    
    // Step 4: Location validation
    if (step === 4) {
      if (!data.city || !data.state || !data.latitude || !data.longitude) {
        setError('Please select a location from the search dropdown')
        return
      }
    }
    
    if (step < 5) setStep((step + 1) as OnboardingStep)
  }

  const handleBack = () => {
    setError(null)
    if (step > 1) setStep((step - 1) as OnboardingStep)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get institution from email domain
      const emailDomain = user.email?.split('@')[1]
      
      if (!emailDomain) {
        throw new Error('Invalid email format')
      }

      const { data: institution } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('domain', emailDomain)
        .single()

      if (!institution) {
        throw new Error(`Institution not found for domain: ${emailDomain}. Please contact support to add your university.`)
      }

      // Insert user data (merged with profile data in V2)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          personal_email: data.personal_email || null,
          full_name: data.full_name,
          institution_id: institution.id,
          grad_year: data.grad_year,
          city: data.city || null,
          state: data.state || null,
          latitude: data.latitude,
          longitude: data.longitude,
          last_location_update: data.latitude && data.longitude ? new Date().toISOString() : null,
          // Profile fields (now in same table)
          status: data.status || null,
          employer: data.employer || null,
          job_title: data.job_title || null,
          grad_school: data.grad_school || null,
          program: data.program || null,
          degree: data.degree || null,
          linkedin_url: data.linkedin_url || null,
          twitter_url: data.twitter_url || null,
          instagram_url: data.instagram_url || null,
          personal_website: data.personal_website || null,
          looking_for_roommate: data.looking_for_roommate,
          onboarding_completed: true,
          email_verified: true,
          profile_visible: true, // Always true
          show_employer: data.show_employer,
          show_school: data.show_school,
        })

      if (userError) {
        // If user already exists, update instead
        if (userError.code === '23505') {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              personal_email: data.personal_email || null,
              full_name: data.full_name,
              institution_id: institution.id,
              grad_year: data.grad_year,
              city: data.city || null,
              state: data.state || null,
              latitude: data.latitude,
              longitude: data.longitude,
              last_location_update: data.latitude && data.longitude ? new Date().toISOString() : null,
              // Profile fields (now in same table)
              status: data.status || null,
              employer: data.employer || null,
              job_title: data.job_title || null,
              grad_school: data.grad_school || null,
              program: data.program || null,
              degree: data.degree || null,
              linkedin_url: data.linkedin_url || null,
              twitter_url: data.twitter_url || null,
              instagram_url: data.instagram_url || null,
              personal_website: data.personal_website || null,
              looking_for_roommate: data.looking_for_roommate,
              onboarding_completed: true,
              email_verified: true,
              profile_visible: true, // Always true
              show_employer: data.show_employer,
              show_school: data.show_school,
            })
            .eq('id', user.id)

          if (updateError) throw updateError
        } else {
          throw userError
        }
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating orbs - Ultra Dark */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-blue-500/15 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-4000"></div>
      
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8 relative z-10">
        {/* Epic Progress Indicator */}
        <div className="glass-strong rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/90 drop-shadow">Step {step} of 5</span>
            <span className="text-sm font-bold text-white drop-shadow">{Math.round((step / 5) * 100)}%</span>
          </div>
          
          {/* Progress bar with glow */}
          <div className="relative w-full glass-light rounded-full h-3 overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${(step / 5) * 100}%`,
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(99, 102, 241, 0.4)'
              }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between items-center pt-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                    num < step 
                      ? 'glass-button scale-100' 
                      : num === step
                        ? 'glass-button scale-110 animate-pulse'
                        : 'glass-light text-white/40'
                  }`}
                  style={num === step ? { 
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.8), 0 0 30px rgba(99, 102, 241, 0.5)'
                  } : {}}
                >
                  {num < step ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    num
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl sm:rounded-3xl px-6 sm:px-8 md:px-10 py-8 sm:py-10">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">
              {step === 1 && 'Welcome! Let\'s set up your profile'}
              {step === 2 && 'What are you up to?'}
              {step === 3 && 'Tell us more'}
              {step === 4 && 'Where are you located?'}
              {step === 5 && 'Connect & preferences'}
            </h2>
            <p className="text-sm sm:text-base text-white/80 drop-shadow">
              Step {step} of 5
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 sm:p-4 glass-card bg-red-500/20 border-red-300/30 rounded-xl">
              <p className="text-xs sm:text-sm text-white drop-shadow">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  className="glass-input w-full px-3 py-2 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.full_name}
                  onChange={(e) => updateData('full_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="grad_year" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Graduation Year * (4-digit year)
                </label>
                <input
                  type="number"
                  id="grad_year"
                  className="glass-input w-full px-3 py-2 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.grad_year || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow empty or 4-digit numbers only
                    if (value === '' || (value.length <= 4 && /^\d+$/.test(value))) {
                      const year = parseInt(value)
                      updateData('grad_year', value === '' ? new Date().getFullYear() : year)
                    }
                  }}
                  min="1950"
                  max="2100"
                  placeholder="2024"
                  maxLength={4}
                />
              </div>
              <div>
                <label htmlFor="personal_email" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Personal Email (optional)
                </label>
                <input
                  type="email"
                  id="personal_email"
                  className="glass-input w-full px-3 py-2 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.personal_email}
                  onChange={(e) => updateData('personal_email', e.target.value)}
                  placeholder="your.name@gmail.com"
                />
                <p className="text-xs text-white/70 mt-1 drop-shadow">
                  Recommended: Add a personal email so classmates can reach you after you lose access to your .edu email
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Status */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-white/90 mb-4 drop-shadow">
                  Current Status *
                </label>
                <div className="space-y-3">
                  {[
                    { 
                      value: 'employed', 
                      label: 'Employed', 
                      desc: 'Working full-time or part-time',
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ),
                      gradient: 'from-emerald-500/20 to-teal-500/20',
                      iconColor: 'text-emerald-400'
                    },
                    { 
                      value: 'internship', 
                      label: 'Internship', 
                      desc: 'Summer or part-time internship',
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      ),
                      gradient: 'from-blue-500/20 to-cyan-500/20',
                      iconColor: 'text-blue-400'
                    },
                    { 
                      value: 'grad_school', 
                      label: 'Grad School', 
                      desc: 'Pursuing further education',
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                      ),
                      gradient: 'from-purple-500/20 to-pink-500/20',
                      iconColor: 'text-purple-400'
                    },
                    { 
                      value: 'looking', 
                      label: 'Looking', 
                      desc: 'Seeking opportunities',
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      ),
                      gradient: 'from-orange-500/20 to-red-500/20',
                      iconColor: 'text-orange-400'
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`group flex items-start p-4 sm:p-5 glass-card rounded-xl cursor-pointer transition-all duration-300 ${
                        data.status === option.value
                          ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-400/50 scale-[1.02] shadow-lg'
                          : 'hover:bg-white/10 hover:scale-[1.01]'
                      }`}
                      style={data.status === option.value ? {
                        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 20px rgba(99, 102, 241, 0.2)'
                      } : {}}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={data.status === option.value}
                        onChange={(e) => updateData('status', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center ${option.iconColor} mr-4 transition-transform duration-300 ${
                        data.status === option.value ? 'scale-110' : 'group-hover:scale-105'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-white drop-shadow text-sm sm:text-base">{option.label}</div>
                          {data.status === option.value && (
                            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-white/70 drop-shadow">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details based on status */}
          {step === 3 && (
            <div className="space-y-6">
              {(data.status === 'employed' || data.status === 'internship') && (
                <>
                  <div>
                    <label htmlFor="employer" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                      Employer *
                    </label>
                    <input
                      type="text"
                      id="employer"
                      required
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={data.employer}
                      onChange={(e) => updateData('employer', e.target.value)}
                      placeholder="e.g., Google, Microsoft, Tesla"
                    />
                  </div>
                  <div>
                    <label htmlFor="job_title" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                      {data.status === 'internship' ? 'Internship Title *' : 'Job Title *'}
                    </label>
                    <input
                      type="text"
                      id="job_title"
                      required
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={data.job_title}
                      onChange={(e) => updateData('job_title', e.target.value)}
                      placeholder={data.status === 'internship' ? 'e.g., Software Engineer Intern' : 'e.g., Software Engineer, Product Manager'}
                    />
                  </div>
                  <div className="glass-card p-4 rounded-xl">
                    <label htmlFor="hide_employer" className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        id="hide_employer"
                        className="mt-1 mr-3 h-5 w-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-400"
                        checked={!data.show_employer}
                        onChange={(e) => updateData('show_employer', !e.target.checked)}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-white drop-shadow text-sm">Hide my employer name</span>
                        <p className="text-white/70 mt-1 text-xs drop-shadow">Your job title will still be visible, but your employer name will be hidden from your profile.</p>
                      </div>
                    </label>
                  </div>
                </>
              )}
              {data.status === 'grad_school' && (
                <>
                  {/* University Autocomplete */}
                  <div className="relative">
                    <label htmlFor="grad_school" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                      School *
                    </label>
                    <input
                      type="text"
                      id="grad_school"
                      required
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={universitySearch || data.grad_school}
                      onChange={(e) => {
                        setUniversitySearch(e.target.value)
                        updateData('grad_school', e.target.value)
                        setShowUniversitySuggestions(true)
                      }}
                      onFocus={() => setShowUniversitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)}
                      placeholder="e.g., Stanford University, MIT"
                      autoComplete="off"
                    />
                    {showUniversitySuggestions && universitySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto border border-white/10">
                        {universitySuggestions.map((uni, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              updateData('grad_school', uni)
                              setUniversitySearch(uni)
                              setShowUniversitySuggestions(false)
                            }}
                            className="px-4 py-2.5 hover:bg-white/10 cursor-pointer text-sm text-white transition-colors"
                          >
                            {uni}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Program Autocomplete */}
                  <div className="relative">
                    <label htmlFor="program" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                      Program *
                    </label>
                    <input
                      type="text"
                      id="program"
                      required
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={programSearch || data.program}
                      onChange={(e) => {
                        setProgramSearch(e.target.value)
                        updateData('program', e.target.value)
                        setShowProgramSuggestions(true)
                      }}
                      onFocus={() => setShowProgramSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 200)}
                      placeholder="e.g., Computer Science, MBA"
                      autoComplete="off"
                    />
                    {showProgramSuggestions && programSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto border border-white/10">
                        {programSuggestions.map((prog, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              updateData('program', prog)
                              setProgramSearch(prog)
                              setShowProgramSuggestions(false)
                            }}
                            className="px-4 py-2.5 hover:bg-white/10 cursor-pointer text-sm text-white transition-colors"
                          >
                            {prog}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Degree Autocomplete */}
                  <div className="relative">
                    <label htmlFor="degree" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                      Degree *
                    </label>
                    <input
                      type="text"
                      id="degree"
                      required
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={degreeSearch || data.degree}
                      onChange={(e) => {
                        setDegreeSearch(e.target.value)
                        updateData('degree', e.target.value)
                        setShowDegreeSuggestions(true)
                      }}
                      onFocus={() => setShowDegreeSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 200)}
                      placeholder="e.g., PhD, MS, MBA"
                      autoComplete="off"
                    />
                    {showDegreeSuggestions && degreeSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto border border-white/10">
                        {degreeSuggestions.map((deg, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              updateData('degree', deg)
                              setDegreeSearch(deg)
                              setShowDegreeSuggestions(false)
                            }}
                            className="px-4 py-2.5 hover:bg-white/10 cursor-pointer text-sm text-white transition-colors"
                          >
                            {deg}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-card p-4 rounded-xl">
                    <label htmlFor="hide_school" className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        id="hide_school"
                        className="mt-1 mr-3 h-5 w-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-400"
                        checked={!data.show_school}
                        onChange={(e) => updateData('show_school', !e.target.checked)}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-white drop-shadow text-sm">Hide my school name</span>
                        <p className="text-white/70 mt-1 text-xs drop-shadow">Your program and degree will still be visible, but your school name will be hidden from your profile.</p>
                      </div>
                    </label>
                  </div>
                </>
              )}
              {data.status === 'looking' && (
                <div className="glass-card p-6 rounded-xl text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-white/90 font-medium mb-2 drop-shadow">
                    Ready to explore opportunities!
                  </p>
                  <p className="text-white/70 text-sm drop-shadow">
                    You're all set for this step. Continue to add your location so classmates can connect with you.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="relative">
                <label htmlFor="location" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Location *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="location"
                    required
                    className="glass-input w-full px-4 py-3 pr-10 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value)
                      setIsLocationSelected(false)
                    }}
                    placeholder="Type to search... e.g., San Francisco, CA"
                    autoComplete="off"
                  />
                  {searchingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {locationSuggestions.length > 0 && (
                  <div 
                    className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto border border-white/10 shadow-2xl"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {locationSuggestions.map((location, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          selectLocation(location)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="font-medium text-white text-sm">
                          {location.display_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {data.city && data.state && (
                <div className="glass-card bg-emerald-500/10 border-emerald-400/30 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white drop-shadow">
                      Location confirmed
                    </p>
                    <p className="text-xs text-white/70 drop-shadow mt-0.5">
                      {data.city}, {data.state}
                    </p>
                  </div>
                </div>
              )}
              <div className="glass-card p-4 rounded-xl">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-white/90 drop-shadow mb-1">Privacy Protected</p>
                    <p className="text-xs text-white/70 drop-shadow leading-relaxed">
                      Your exact location will not be shared. We use this to connect you with classmates from your university and alumni within 50 miles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Social & Preferences */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="glass-card p-4 rounded-xl text-center mb-6">
                <p className="text-sm text-white/80 drop-shadow">
                  All fields on this page are <span className="font-semibold text-white">optional</span>. Add social links to help classmates connect with you.
                </p>
              </div>
              
              <div>
                <label htmlFor="linkedin_url" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                  </svg>
                  LinkedIn URL (optional)
                </label>
                <input
                  type="url"
                  id="linkedin_url"
                  className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.linkedin_url}
                  onChange={(e) => updateData('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              
              <div>
                <label htmlFor="twitter_url" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow flex items-center gap-2">
                  <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter/X URL (optional)
                </label>
                <input
                  type="url"
                  id="twitter_url"
                  className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.twitter_url}
                  onChange={(e) => updateData('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              
              <div>
                <label htmlFor="personal_website" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Personal Website (optional)
                </label>
                <input
                  type="url"
                  id="personal_website"
                  className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.personal_website}
                  onChange={(e) => updateData('personal_website', e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>
              
              <div className="pt-4">
                <div className="glass-card p-5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => updateData('looking_for_roommate', !data.looking_for_roommate)}>
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.looking_for_roommate}
                      onChange={(e) => updateData('looking_for_roommate', e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm font-semibold text-white drop-shadow">
                          I'm looking for roommates
                        </span>
                      </div>
                      <p className="text-xs text-white/70 drop-shadow">
                        Let classmates know you're searching for housing. This will make you easier to find for others looking for roommates.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 sm:mt-8 flex justify-between gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="glass-light px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-white hover:bg-white/20 disabled:opacity-50 text-sm sm:text-base font-medium transition-all"
              >
                Back
              </button>
            )}
            <div className={step === 1 ? 'ml-auto' : ''}>
              {step < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="glass-button px-4 sm:px-6 py-2 sm:py-3 text-white rounded-xl disabled:opacity-50 text-sm sm:text-base font-semibold"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="glass-button px-4 sm:px-6 py-2 sm:py-3 text-white rounded-xl disabled:opacity-50 text-sm sm:text-base font-semibold"
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

