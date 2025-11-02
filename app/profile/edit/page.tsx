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
    status: '' as 'employed' | 'grad_school' | 'looking' | '',
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow px-8 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">Profile updated successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.full_name}
                  onChange={(e) => setData({ ...data, full_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="grad_year" className="block text-sm font-medium text-gray-700 mb-2">
                  Graduation Year (4-digit year)
                </label>
                <input
                  type="number"
                  id="grad_year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            {/* Status */}
            <div className="space-y-4 pt-6 border-t">
              <h2 className="text-lg font-semibold text-gray-900">Current Status</h2>
              
              <div className="space-y-3">
                {[
                  { value: 'employed', label: 'Employed' },
                  { value: 'grad_school', label: 'Grad School' },
                  { value: 'looking', label: 'Looking' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={data.status === option.value}
                      onChange={(e) => setData({ ...data, status: e.target.value as any })}
                      className="mr-2"
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              {data.status === 'employed' && (
                <div className="space-y-4 mt-4">
                  <input
                    type="text"
                    placeholder="Employer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={data.employer}
                    onChange={(e) => setData({ ...data, employer: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Job Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span className="text-sm text-gray-700">Hide my employer name (job title will still show)</span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {universitySuggestions.map((uni, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setData({ ...data, grad_school: uni })
                              setUniversitySearch(uni)
                              setShowUniversitySuggestions(false)
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {programSuggestions.map((prog, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setData({ ...data, program: prog })
                              setProgramSearch(prog)
                              setShowProgramSuggestions(false)
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {degreeSuggestions.map((deg, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setData({ ...data, degree: deg })
                              setDegreeSearch(deg)
                              setShowDegreeSuggestions(false)
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
                    <span className="text-sm text-gray-700">Hide my school name (program and degree will still show)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                {!canUpdateLocation && (
                  <span className="text-xs text-orange-600 font-medium">
                    🔒 Locked for {daysUntilLocationUpdate} more day{daysUntilLocationUpdate !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {!canUpdateLocation && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800">
                    You can only update your location once every 30 days to prevent location hopping. You'll be able to update in {daysUntilLocationUpdate} day{daysUntilLocationUpdate !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}
              
              <div className="relative">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Search for your city
                </label>
                <input
                  type="text"
                  id="location"
                  disabled={!canUpdateLocation}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
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
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">
                          {location.display_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {data.city && data.state && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✓ Location set: {data.city}, {data.state}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Your exact location will not be shared. We use this to connect you with grads nearby (within 50 miles) or from your institution.
              </p>
            </div>

            {/* Social Links */}
            <div className="space-y-4 pt-6 border-t">
              <h2 className="text-lg font-semibold text-gray-900">Social Links</h2>
              
              <input
                type="url"
                placeholder="LinkedIn URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.linkedin_url}
                onChange={(e) => setData({ ...data, linkedin_url: e.target.value })}
              />
              <input
                type="url"
                placeholder="Twitter/X URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.twitter_url}
                onChange={(e) => setData({ ...data, twitter_url: e.target.value })}
              />
              <input
                type="url"
                placeholder="Personal Website"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.personal_website}
                onChange={(e) => setData({ ...data, personal_website: e.target.value })}
              />
            </div>

            {/* Preferences */}
            <div className="space-y-4 pt-6 border-t">
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={data.looking_for_roommate}
                  onChange={(e) => setData({ ...data, looking_for_roommate: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">I'm looking for roommates</span>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-6 flex space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Delete Account Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h2>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
              >
                Delete Account
              </button>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 mb-4 font-semibold">
                  Are you absolutely sure? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete my account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
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
