'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UNIVERSITIES, DEGREE_TYPES, PROGRAM_NAMES } from '@/lib/constants/universities'

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState({
    full_name: '',
    grad_year: new Date().getFullYear(),
    personal_email: '',
    status: '' as 'employed' | 'grad_school' | 'looking' | 'internship' | '',
    employer: '',
    job_title: '',
    grad_school: '',
    program: '',
    degree: '',
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    personal_website: '',
    looking_for_roommate: false,
    show_employer: true,
    show_school: true,
    last_location_update: null as string | null,
  })

  // Track original location to check if it changed
  const [originalLocation, setOriginalLocation] = useState({
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  // Location search state
  const [locationSearch, setLocationSearch] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [isLocationSelected, setIsLocationSelected] = useState(false)
  const [canUpdateLocation, setCanUpdateLocation] = useState(true)
  const [daysUntilLocationUpdate, setDaysUntilLocationUpdate] = useState(0)

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

  useEffect(() => {
    loadProfile()
  }, [])

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

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Check if user can update location (30 day restriction)
      if (profile.last_location_update) {
        const lastUpdate = new Date(profile.last_location_update)
        const now = new Date()
        const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
        const daysRemaining = Math.max(0, 30 - daysSinceUpdate)
        
        setCanUpdateLocation(daysSinceUpdate >= 30)
        setDaysUntilLocationUpdate(Math.ceil(daysRemaining))
      }

      setData({
        full_name: profile.full_name || '',
        grad_year: profile.grad_year || new Date().getFullYear(),
        personal_email: profile.personal_email || '',
        status: profile.status || '',
        employer: profile.employer || '',
        job_title: profile.job_title || '',
        grad_school: profile.grad_school || '',
        program: profile.program || '',
        degree: profile.degree || '',
        city: profile.city || '',
        state: profile.state || '',
        latitude: profile.latitude,
        longitude: profile.longitude,
        linkedin_url: profile.linkedin_url || '',
        twitter_url: profile.twitter_url || '',
        instagram_url: profile.instagram_url || '',
        personal_website: profile.personal_website || '',
        looking_for_roommate: profile.looking_for_roommate || false,
        show_employer: profile.show_employer !== false,
        show_school: profile.show_school !== false,
        last_location_update: profile.last_location_update,
      })

      // Store original location
      setOriginalLocation({
        city: profile.city || '',
        state: profile.state || '',
        latitude: profile.latitude,
        longitude: profile.longitude,
      })

      // Set initial location search display
      if (profile.city && profile.state) {
        setLocationSearch(`${profile.city}, ${profile.state}`)
        setIsLocationSelected(true)
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate grad year is 4 digits
      const yearStr = data.grad_year.toString()
      if (yearStr.length !== 4 || data.grad_year < 1950 || data.grad_year > 2100) {
        throw new Error('Please enter a valid 4-digit graduation year (1950-2100)')
      }

      // Validate that if city/state are set, we have coordinates
      if ((data.city || data.state) && (!data.latitude || !data.longitude)) {
        throw new Error('Please select a location from the search dropdown')
      }

      // Check if location actually changed
      const locationChanged = 
        data.city !== originalLocation.city ||
        data.state !== originalLocation.state ||
        data.latitude !== originalLocation.latitude ||
        data.longitude !== originalLocation.longitude

      // If location changed, enforce 30-day restriction
      if (locationChanged && !canUpdateLocation) {
        throw new Error(`You can only update your location once every 30 days. Please wait ${daysUntilLocationUpdate} more day${daysUntilLocationUpdate !== 1 ? 's' : ''}.`)
      }

      // Build update object
      const updateData: any = {
        full_name: data.full_name,
        grad_year: data.grad_year,
        personal_email: data.personal_email || null,
        city: data.city || null,
        state: data.state || null,
        latitude: data.latitude,
        longitude: data.longitude,
        // Update last_location_update only if location changed
        ...(locationChanged && { last_location_update: new Date().toISOString() }),
        // Profile fields
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
        // Privacy settings
        show_employer: data.show_employer,
        show_school: data.show_school,
        profile_visible: true, // Always true, cannot be changed
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      
      // Force a full page refresh to ensure dashboard gets fresh data
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete user from public.users table
      // This will cascade delete due to ON DELETE CASCADE on auth.users FK
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (deleteError) throw deleteError

      // Sign out and delete auth user
      await supabase.auth.signOut()
      
      // Redirect to home page
      router.push('/')
    } catch (err: any) {
      console.error('Error deleting account:', err)
      setError(err.message)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="glass-strong rounded-2xl px-8 py-6">
          <p className="text-white text-lg drop-shadow">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating orbs - Ultra Dark */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
      
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-4 sm:mb-6">
          <Link href="/dashboard" className="glass-light px-4 py-2 rounded-lg text-white hover:bg-white/20 inline-block transition-all text-sm sm:text-base font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="glass-strong rounded-2xl sm:rounded-3xl px-6 sm:px-8 md:px-10 py-8 sm:py-10">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 drop-shadow-lg">Edit Profile</h1>

          {error && (
            <div className="mb-6 p-3 sm:p-4 glass-card bg-red-500/20 border-red-300/30 rounded-xl">
              <p className="text-xs sm:text-sm text-white drop-shadow">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 sm:p-4 glass-card bg-green-500/20 border-green-300/30 rounded-xl">
              <p className="text-xs sm:text-sm text-white drop-shadow">Profile updated successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-white drop-shadow">Basic Information</h2>
              
              <div>
                <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.full_name}
                  onChange={(e) => setData({ ...data, full_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="grad_year" className="block text-xs sm:text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Graduation Year (4-digit year)
                </label>
                <input
                  type="number"
                  id="grad_year"
                  className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.grad_year}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow empty or 4-digit numbers only
                    if (value === '' || (value.length <= 4 && /^\d+$/.test(value))) {
                      const year = parseInt(value)
                      setData({ ...data, grad_year: value === '' ? new Date().getFullYear() : year })
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
                  className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                  value={data.personal_email}
                  onChange={(e) => setData({ ...data, personal_email: e.target.value })}
                  placeholder="your.name@gmail.com"
                />
                <p className="text-xs text-white/70 mt-1 drop-shadow">
                  Keep your personal email updated so classmates can reach you after graduation
                </p>
              </div>
            </div>

            {/* Status - Enhanced */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white drop-shadow">Current Status</h2>
              </div>
              
              <div className="space-y-3">
                {[
                  { 
                    value: 'employed', 
                    label: 'Employed',
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                    gradient: 'from-emerald-500/20 to-teal-500/20',
                    iconColor: 'text-emerald-400'
                  },
                  { 
                    value: 'internship', 
                    label: 'Internship',
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                    gradient: 'from-blue-500/20 to-cyan-500/20',
                    iconColor: 'text-blue-400'
                  },
                  { 
                    value: 'grad_school', 
                    label: 'Grad School',
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
                    gradient: 'from-purple-500/20 to-pink-500/20',
                    iconColor: 'text-purple-400'
                  },
                  { 
                    value: 'looking', 
                    label: 'Looking',
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
                    gradient: 'from-orange-500/20 to-red-500/20',
                    iconColor: 'text-orange-400'
                  },
                ].map((option) => (
                  <label 
                    key={option.value}
                    className={`group flex items-center gap-3 p-4 glass-card rounded-xl cursor-pointer transition-all duration-300 ${
                      data.status === option.value
                        ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-400/40 scale-[1.02]'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={data.status === option.value}
                      onChange={(e) => setData({ ...data, status: e.target.value as any })}
                      className="sr-only"
                    />
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center ${option.iconColor} transition-transform ${
                      data.status === option.value ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      {option.icon}
                    </div>
                    <span className={`font-medium drop-shadow ${data.status === option.value ? 'text-white' : 'text-white/90'}`}>
                      {option.label}
                    </span>
                    {data.status === option.value && (
                      <svg className="w-5 h-5 text-purple-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>

              {(data.status === 'employed' || data.status === 'internship') && (
                <div className="space-y-4 mt-4">
                  <input
                    type="text"
                    placeholder="Employer"
                    className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                    value={data.employer}
                    onChange={(e) => setData({ ...data, employer: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder={data.status === 'internship' ? 'Internship Title (e.g. Software Engineer Intern)' : 'Job Title'}
                    className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                    value={data.job_title}
                    onChange={(e) => setData({ ...data, job_title: e.target.value })}
                  />
                  
                  {/* Option to hide employer */}
                  <label className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      checked={!data.show_employer}
                      onChange={(e) => setData({ ...data, show_employer: !e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-white/90 drop-shadow">Hide my employer name ({data.status === 'internship' ? 'internship' : 'job'} title will still show)</span>
                  </label>
                </div>
              )}

              {data.status === 'grad_school' && (
                <div className="space-y-4 mt-4">
                  {/* University Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="School (e.g., Stanford University)"
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={universitySearch || data.grad_school}
                      onChange={(e) => {
                        setUniversitySearch(e.target.value)
                        setData({ ...data, grad_school: e.target.value })
                        setShowUniversitySuggestions(true)
                      }}
                      onFocus={() => setShowUniversitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)}
                      autoComplete="off"
                    />
                    {showUniversitySuggestions && universitySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto">
                        {universitySuggestions.map((uni, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setData({ ...data, grad_school: uni })
                              setUniversitySearch(uni)
                              setShowUniversitySuggestions(false)
                            }}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm text-white"
                          >
                            {uni}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Program Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Program (e.g., Computer Science)"
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={programSearch || data.program}
                      onChange={(e) => {
                        setProgramSearch(e.target.value)
                        setData({ ...data, program: e.target.value })
                        setShowProgramSuggestions(true)
                      }}
                      onFocus={() => setShowProgramSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 200)}
                      autoComplete="off"
                    />
                    {showProgramSuggestions && programSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto">
                        {programSuggestions.map((prog, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setData({ ...data, program: prog })
                              setProgramSearch(prog)
                              setShowProgramSuggestions(false)
                            }}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm text-white"
                          >
                            {prog}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Degree Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Degree (e.g., PhD, MS, MBA)"
                      className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                      value={degreeSearch || data.degree}
                      onChange={(e) => {
                        setDegreeSearch(e.target.value)
                        setData({ ...data, degree: e.target.value })
                        setShowDegreeSuggestions(true)
                      }}
                      onFocus={() => setShowDegreeSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 200)}
                      autoComplete="off"
                    />
                    {showDegreeSuggestions && degreeSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto">
                        {degreeSuggestions.map((deg, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setData({ ...data, degree: deg })
                              setDegreeSearch(deg)
                              setShowDegreeSuggestions(false)
                            }}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm text-white"
                          >
                            {deg}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Option to hide school */}
                  <label className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      checked={!data.show_school}
                      onChange={(e) => setData({ ...data, show_school: !e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-white/90 drop-shadow">Hide my school name (program and degree will still show)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Location - Enhanced */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white drop-shadow">Location</h2>
                </div>
                {!canUpdateLocation && (
                  <span className="text-xs glass-light text-white/90 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Locked for {daysUntilLocationUpdate} more day{daysUntilLocationUpdate !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {!canUpdateLocation && (
                <div className="glass-card bg-orange-500/10 border-orange-400/20 p-3 rounded-lg">
                  <p className="text-sm text-white/90">
                    Location updates are limited to once every 30 days to prevent location hopping. You'll be able to update in {daysUntilLocationUpdate} day{daysUntilLocationUpdate !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}
              
              <div className="relative">
                <label htmlFor="location" className="block text-sm font-medium text-white/90 drop-shadow mb-2">
                  Search for your city
                </label>
                <input
                  type="text"
                  id="location"
                  disabled={!canUpdateLocation}
                  className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value)
                    // Allow searching again when user manually types
                    setIsLocationSelected(false)
                  }}
                  placeholder={canUpdateLocation ? "Search for a city..." : "Location update locked"}
                  autoComplete="off"
                />
                {searchingLocation && (
                  <div className="absolute right-3 top-10 text-gray-400">
                    Searching...
                  </div>
                )}
                {locationSuggestions.length > 0 && canUpdateLocation && (
                  <div 
                    className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-60 overflow-auto"
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
                        className="w-full px-4 py-2 text-left hover:bg-white/10 cursor-pointer text-white"
                      >
                        <div className="font-medium">
                          {location.display_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {data.city && data.state && (
                <div className="glass-card bg-emerald-500/10 border-emerald-400/20 p-3 rounded-lg flex items-center gap-2">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-white">
                    Location set: {data.city}, {data.state}
                  </p>
                </div>
              )}
              <p className="text-sm text-white/80 drop-shadow">
                Your exact location will not be shared. We use this to connect you with grads nearby (within 50 miles) or from your institution.
              </p>
            </div>

            {/* Social Links - Enhanced */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white drop-shadow">Social Links</h2>
              </div>
              
              <input
                type="url"
                placeholder="LinkedIn URL"
                className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                value={data.linkedin_url}
                onChange={(e) => setData({ ...data, linkedin_url: e.target.value })}
              />
              <input
                type="url"
                placeholder="Twitter/X URL"
                className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                value={data.twitter_url}
                onChange={(e) => setData({ ...data, twitter_url: e.target.value })}
              />
              <input
                type="url"
                placeholder="Personal Website"
                className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none text-white placeholder-white/50 text-sm sm:text-base"
                value={data.personal_website}
                onChange={(e) => setData({ ...data, personal_website: e.target.value })}
              />
            </div>

            {/* Preferences - Enhanced */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white drop-shadow">Preferences</h2>
              </div>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={data.looking_for_roommate}
                  onChange={(e) => setData({ ...data, looking_for_roommate: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-white/90 drop-shadow">I'm looking for roommates</span>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-6 flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="glass-button flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/dashboard"
                className="glass-light px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white hover:bg-white/20 text-center text-sm sm:text-base font-medium transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Delete Account Section */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 drop-shadow">Danger Zone</h2>
            <p className="text-xs sm:text-sm text-white/80 mb-4 drop-shadow">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="glass-card px-4 py-2 bg-red-500/20 border-red-300/30 text-white rounded-lg hover:bg-red-500/30 text-sm font-medium transition-all"
              >
                Delete Account
              </button>
            ) : (
              <div className="p-3 sm:p-4 glass-card bg-red-500/20 border-red-300/30 rounded-xl">
                <p className="text-xs sm:text-sm text-white mb-4 font-semibold drop-shadow">
                  Are you absolutely sure? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="glass-button bg-red-500/30 px-4 py-2 text-white rounded-lg hover:bg-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete my account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="glass-light px-4 py-2 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
