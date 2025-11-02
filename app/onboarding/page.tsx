'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UNIVERSITIES, DEGREE_TYPES, PROGRAM_NAMES } from '@/lib/constants/universities'

type OnboardingStep = 1 | 2 | 3 | 4 | 5

interface OnboardingData {
  full_name: string
  grad_year: number
  status: 'employed' | 'grad_school' | 'looking' | ''
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
      if (data.status === 'employed') {
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-lg shadow px-8 py-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 && 'Welcome! Let\'s set up your profile'}
              {step === 2 && 'What are you up to?'}
              {step === 3 && 'Tell us more'}
              {step === 4 && 'Where are you located?'}
              {step === 5 && 'Connect & preferences'}
            </h2>
            <p className="text-gray-600">
              Step {step} of 5
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.full_name}
                  onChange={(e) => updateData('full_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="grad_year" className="block text-sm font-medium text-gray-700 mb-2">
                  Graduation Year * (4-digit year)
                </label>
                <input
                  type="number"
                  id="grad_year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
          )}

          {/* Step 2: Status */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Current Status *
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'employed', label: 'Employed', desc: 'Working full-time or part-time' },
                    { value: 'grad_school', label: 'Grad School', desc: 'Pursuing further education' },
                    { value: 'looking', label: 'Looking', desc: 'Seeking opportunities' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        data.status === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={data.status === option.value}
                        onChange={(e) => updateData('status', e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.desc}</div>
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
              {data.status === 'employed' && (
                <>
                  <div>
                    <label htmlFor="employer" className="block text-sm font-medium text-gray-700 mb-2">
                      Employer *
                    </label>
                    <input
                      type="text"
                      id="employer"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={data.employer}
                      onChange={(e) => updateData('employer', e.target.value)}
                      placeholder="Google"
                    />
                  </div>
                  <div>
                    <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      id="job_title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={data.job_title}
                      onChange={(e) => updateData('job_title', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="hide_employer"
                      className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={!data.show_employer}
                      onChange={(e) => updateData('show_employer', !e.target.checked)}
                    />
                    <label htmlFor="hide_employer" className="text-sm text-gray-700">
                      <span className="font-medium">Hide my employer name</span>
                      <p className="text-gray-500 mt-1">Your job title will still be visible, but not your employer.</p>
                    </label>
                  </div>
                </>
              )}
              {data.status === 'grad_school' && (
                <>
                  {/* University Autocomplete */}
                  <div className="relative">
                    <label htmlFor="grad_school" className="block text-sm font-medium text-gray-700 mb-2">
                      School *
                    </label>
                    <input
                      type="text"
                      id="grad_school"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={universitySearch || data.grad_school}
                      onChange={(e) => {
                        setUniversitySearch(e.target.value)
                        updateData('grad_school', e.target.value)
                        setShowUniversitySuggestions(true)
                      }}
                      onFocus={() => setShowUniversitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)}
                      placeholder="Start typing university name..."
                      autoComplete="off"
                    />
                    {showUniversitySuggestions && universitySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {universitySuggestions.map((uni, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              updateData('grad_school', uni)
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
                    <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
                      Program *
                    </label>
                    <input
                      type="text"
                      id="program"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={programSearch || data.program}
                      onChange={(e) => {
                        setProgramSearch(e.target.value)
                        updateData('program', e.target.value)
                        setShowProgramSuggestions(true)
                      }}
                      onFocus={() => setShowProgramSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 200)}
                      placeholder="Start typing program name..."
                      autoComplete="off"
                    />
                    {showProgramSuggestions && programSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {programSuggestions.map((prog, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              updateData('program', prog)
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
                    <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-2">
                      Degree *
                    </label>
                    <input
                      type="text"
                      id="degree"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={degreeSearch || data.degree}
                      onChange={(e) => {
                        setDegreeSearch(e.target.value)
                        updateData('degree', e.target.value)
                        setShowDegreeSuggestions(true)
                      }}
                      onFocus={() => setShowDegreeSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 200)}
                      placeholder="Start typing degree..."
                      autoComplete="off"
                    />
                    {showDegreeSuggestions && degreeSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {degreeSuggestions.map((deg, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              updateData('degree', deg)
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

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="hide_school"
                      className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={!data.show_school}
                      onChange={(e) => updateData('show_school', !e.target.checked)}
                    />
                    <label htmlFor="hide_school" className="text-sm text-gray-700">
                      <span className="font-medium">Hide my school name</span>
                      <p className="text-gray-500 mt-1">Your program and degree will still be visible, but not your school.</p>
                    </label>
                  </div>
                </>
              )}
              {data.status === 'looking' && (
                <div>
                  <p className="text-gray-600">
                    You're all set for this step! Continue to add your location.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="relative">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value)
                    // Allow searching again when user manually types
                    setIsLocationSelected(false)
                  }}
                  placeholder="Search for a city..."
                  autoComplete="off"
                />
                {searchingLocation && (
                  <div className="absolute right-3 top-10 text-gray-400">
                    Searching...
                  </div>
                )}
                {locationSuggestions.length > 0 && (
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
                          console.log('Clicking location item')
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
                * Required field. Your exact location will not be shared. We use this to connect you with grads nearby (within 50 miles) or from your institution.
              </p>
            </div>
          )}

          {/* Step 5: Social & Preferences */}
          {step === 5 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                All fields on this page are optional. Add social links to help classmates connect with you.
              </p>
              <div>
                <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL (optional)
                </label>
                <input
                  type="url"
                  id="linkedin_url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.linkedin_url}
                  onChange={(e) => updateData('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter/X URL (optional)
                </label>
                <input
                  type="url"
                  id="twitter_url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.twitter_url}
                  onChange={(e) => updateData('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div>
                <label htmlFor="personal_website" className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Website (optional)
                </label>
                <input
                  type="url"
                  id="personal_website"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.personal_website}
                  onChange={(e) => updateData('personal_website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div className="pt-4 border-t">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.looking_for_roommate}
                    onChange={(e) => updateData('looking_for_roommate', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I'm looking for roommates
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
            )}
            <div className={step === 1 ? 'ml-auto' : ''}>
              {step < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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

