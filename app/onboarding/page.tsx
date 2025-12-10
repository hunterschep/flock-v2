'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UNIVERSITIES, DEGREE_TYPES, PROGRAM_NAMES } from '@/lib/constants/universities'
import { Footer } from '@/components/Footer'
import InteractiveStarfield from '@/components/InteractiveStarfield'
import { ArrowLeft, ArrowRight, Check, Briefcase, GraduationCap, Search, Building, MapPin, Home as HomeIcon, Linkedin, Twitter, Globe } from 'lucide-react'

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
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ name: string; display_name: string; lat: string; lon: string }>>([])
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [isLocationSelected, setIsLocationSelected] = useState(false)

  const [universitySearch, setUniversitySearch] = useState('')
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([])
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false)

  const [programSearch, setProgramSearch] = useState('')
  const [programSuggestions, setProgramSuggestions] = useState<string[]>([])
  const [showProgramSuggestions, setShowProgramSuggestions] = useState(false)

  const [degreeSearch, setDegreeSearch] = useState('')
  const [degreeSuggestions, setDegreeSuggestions] = useState<string[]>([])
  const [showDegreeSuggestions, setShowDegreeSuggestions] = useState(false)

  const updateData = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  // Filter universities
  useEffect(() => {
    if (universitySearch.length > 0) {
      setUniversitySuggestions(UNIVERSITIES.filter(uni => uni.toLowerCase().includes(universitySearch.toLowerCase())).slice(0, 10))
    } else {
      setUniversitySuggestions([])
    }
  }, [universitySearch])

  // Filter programs
  useEffect(() => {
    if (programSearch.length > 0) {
      setProgramSuggestions(PROGRAM_NAMES.filter(prog => prog.toLowerCase().includes(programSearch.toLowerCase())).slice(0, 10))
    } else {
      setProgramSuggestions([])
    }
  }, [programSearch])

  // Filter degrees
  useEffect(() => {
    if (degreeSearch.length > 0) {
      setDegreeSuggestions(DEGREE_TYPES.filter(deg => deg.toLowerCase().includes(degreeSearch.toLowerCase())).slice(0, 10))
    } else {
      setDegreeSuggestions([])
    }
  }, [degreeSearch])

  // Location search
  useEffect(() => {
    const searchLocation = async () => {
      if (isLocationSelected || locationSearch.length < 3) {
        setLocationSuggestions([])
        return
      }
      setSearchingLocation(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5&countrycodes=us`)
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

  const selectLocation = (location: { name: string; display_name: string; lat: string; lon: string }) => {
    const cityName = location.name || location.display_name.split(',')[0].trim()
    const displayParts = location.display_name.split(',').map((s: string) => s.trim())
    const stateName = displayParts.length >= 2 ? displayParts[displayParts.length - 2] : ''
    
    setData(prev => ({ ...prev, city: cityName, state: stateName, latitude: parseFloat(location.lat), longitude: parseFloat(location.lon) }))
    setIsLocationSelected(true)
    setLocationSearch(stateName ? `${cityName}, ${stateName}` : cityName)
    setLocationSuggestions([])
  }

  const handleNext = () => {
    setError(null)
    
    if (step === 1) {
      if (!data.full_name || !data.grad_year) { setError('Please fill in all required fields'); return }
      const yearStr = data.grad_year.toString()
      if (yearStr.length !== 4 || data.grad_year < 1950 || data.grad_year > 2100) { setError('Please enter a valid 4-digit graduation year (1950-2100)'); return }
    }
    
    if (step === 2 && !data.status) { setError('Please select your current status'); return }
    
    if (step === 3) {
      if ((data.status === 'employed' || data.status === 'internship') && (!data.employer || !data.job_title)) { setError('Please provide your employer and job title'); return }
      if (data.status === 'grad_school' && (!data.grad_school || !data.program || !data.degree)) { setError('Please provide your school, program, and degree'); return }
    }
    
    if (step === 4 && (!data.city || !data.state || !data.latitude || !data.longitude)) { setError('Please select a location from the search dropdown'); return }
    
    if (step < 5) setStep((step + 1) as OnboardingStep)
  }

  const handleBack = () => { setError(null); if (step > 1) setStep((step - 1) as OnboardingStep) }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const emailDomain = user.email?.split('@')[1]
      if (!emailDomain) throw new Error('Invalid email format')

      const { data: institution } = await supabase.from('institutions').select('id, name').eq('domain', emailDomain).single()
      if (!institution) throw new Error(`Institution not found for domain: ${emailDomain}. Please contact support to add your university.`)

      const userData = {
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
        profile_visible: true,
        show_employer: data.show_employer,
        show_school: data.show_school,
      }

      const { error: userError } = await supabase.from('users').insert(userData)

      if (userError) {
        if (userError.code === '23505') {
          const { error: updateError } = await supabase.from('users').update(userData).eq('id', user.id)
          if (updateError) throw updateError
        } else {
          throw userError
        }
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'employed', label: 'Employed', desc: 'Working full-time or part-time', icon: Briefcase, color: 'emerald' },
    { value: 'internship', label: 'Internship', desc: 'Summer or part-time internship', icon: Building, color: 'blue' },
    { value: 'grad_school', label: 'Grad School', desc: 'Pursuing further education', icon: GraduationCap, color: 'violet' },
    { value: 'looking', label: 'Looking', desc: 'Seeking opportunities', icon: Search, color: 'amber' },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col relative overflow-hidden">
      <InteractiveStarfield />
      
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 md:px-6 relative z-10">
        <div className="max-w-lg w-full">
          {/* Progress */}
          <div className="glass-strong rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">Step {step} of 5</span>
              <span className="text-sm font-medium text-white">{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="relative w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-[var(--color-accent)] rounded-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  num < step ? 'bg-[var(--color-accent)] text-white' : num === step ? 'bg-[var(--color-accent)] text-white' : 'bg-white/[0.05] text-white/30'
                }`}>
                  {num < step ? <Check className="w-4 h-4" /> : num}
                </div>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="glass-strong rounded-xl p-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-white mb-1">
                {step === 1 && "Let's set up your profile"}
                {step === 2 && 'What are you up to?'}
                {step === 3 && 'Tell us more'}
                {step === 4 && 'Where are you located?'}
                {step === 5 && 'Connect & preferences'}
              </h1>
              <p className="text-sm text-white/50">
                {step === 1 && 'Basic information about you'}
                {step === 2 && 'Your current status'}
                {step === 3 && 'Details about your work or studies'}
                {step === 4 && 'Help classmates find you'}
                {step === 5 && 'Optional social links'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Full Name *</label>
                  <input type="text" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.full_name} onChange={(e) => updateData('full_name', e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Graduation Year *</label>
                  <input type="number" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.grad_year || ''} onChange={(e) => { const value = e.target.value; if (value === '' || (value.length <= 4 && /^\d+$/.test(value))) updateData('grad_year', value === '' ? new Date().getFullYear() : parseInt(value)) }} min="1950" max="2100" placeholder="2024" maxLength={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Personal Email <span className="text-white/40">(optional)</span></label>
                  <input type="email" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.personal_email} onChange={(e) => updateData('personal_email', e.target.value)} placeholder="your.name@gmail.com" />
                  <p className="text-xs text-white/40 mt-2">Recommended for when you lose access to your .edu email</p>
                </div>
              </div>
            )}

            {/* Step 2: Status */}
            {step === 2 && (
              <div className="space-y-3">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      data.status === option.value
                        ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    <input type="radio" name="status" value={option.value} checked={data.status === option.value} onChange={(e) => updateData('status', e.target.value as OnboardingData['status'])} className="sr-only" />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.status === option.value ? 'bg-[var(--color-accent)]/20' : 'bg-white/[0.05]'}`}>
                      <option.icon className={`w-5 h-5 ${data.status === option.value ? 'text-[var(--color-accent)]' : 'text-white/50'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{option.label}</div>
                      <div className="text-xs text-white/50">{option.desc}</div>
                    </div>
                    {data.status === option.value && <Check className="w-5 h-5 text-[var(--color-accent)]" />}
                  </label>
                ))}
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <div className="space-y-5">
                {(data.status === 'employed' || data.status === 'internship') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Employer *</label>
                      <input type="text" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.employer} onChange={(e) => updateData('employer', e.target.value)} placeholder="e.g., Google, Microsoft" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">{data.status === 'internship' ? 'Internship Title' : 'Job Title'} *</label>
                      <input type="text" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.job_title} onChange={(e) => updateData('job_title', e.target.value)} placeholder="e.g., Software Engineer" />
                    </div>
                    <label className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                      <input type="checkbox" checked={!data.show_employer} onChange={(e) => updateData('show_employer', !e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" />
                      <div>
                        <span className="text-sm font-medium text-white">Hide employer name</span>
                        <p className="text-xs text-white/40 mt-1">Your job title will still be visible</p>
                      </div>
                    </label>
                  </>
                )}
                {data.status === 'grad_school' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-white/70 mb-2">School *</label>
                      <input type="text" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={universitySearch || data.grad_school} onChange={(e) => { setUniversitySearch(e.target.value); updateData('grad_school', e.target.value); setShowUniversitySuggestions(true) }} onFocus={() => setShowUniversitySuggestions(true)} onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)} placeholder="e.g., Stanford University" autoComplete="off" />
                      {showUniversitySuggestions && universitySuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto">
                          {universitySuggestions.map((uni, idx) => (
                            <div key={idx} onClick={() => { updateData('grad_school', uni); setUniversitySearch(uni); setShowUniversitySuggestions(false) }} className="px-4 py-2.5 hover:bg-white/[0.05] cursor-pointer text-sm text-white">{uni}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-white/70 mb-2">Program *</label>
                      <input type="text" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={programSearch || data.program} onChange={(e) => { setProgramSearch(e.target.value); updateData('program', e.target.value); setShowProgramSuggestions(true) }} onFocus={() => setShowProgramSuggestions(true)} onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 200)} placeholder="e.g., Computer Science" autoComplete="off" />
                      {showProgramSuggestions && programSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto">
                          {programSuggestions.map((prog, idx) => (
                            <div key={idx} onClick={() => { updateData('program', prog); setProgramSearch(prog); setShowProgramSuggestions(false) }} className="px-4 py-2.5 hover:bg-white/[0.05] cursor-pointer text-sm text-white">{prog}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-white/70 mb-2">Degree *</label>
                      <input type="text" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={degreeSearch || data.degree} onChange={(e) => { setDegreeSearch(e.target.value); updateData('degree', e.target.value); setShowDegreeSuggestions(true) }} onFocus={() => setShowDegreeSuggestions(true)} onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 200)} placeholder="e.g., PhD, MS, MBA" autoComplete="off" />
                      {showDegreeSuggestions && degreeSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto">
                          {degreeSuggestions.map((deg, idx) => (
                            <div key={idx} onClick={() => { updateData('degree', deg); setDegreeSearch(deg); setShowDegreeSuggestions(false) }} className="px-4 py-2.5 hover:bg-white/[0.05] cursor-pointer text-sm text-white">{deg}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <label className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                      <input type="checkbox" checked={!data.show_school} onChange={(e) => updateData('show_school', !e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" />
                      <div>
                        <span className="text-sm font-medium text-white">Hide school name</span>
                        <p className="text-xs text-white/40 mt-1">Your program and degree will still be visible</p>
                      </div>
                    </label>
                  </>
                )}
                {data.status === 'looking' && (
                  <div className="p-6 rounded-lg bg-white/[0.02] border border-white/[0.06] text-center">
                    <Search className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <p className="text-sm text-white mb-1">Ready to explore opportunities!</p>
                    <p className="text-xs text-white/50">Continue to add your location so classmates can connect with you.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Location */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="relative">
                  <label className="block text-sm font-medium text-white/70 mb-2">Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="text" className="glass-input w-full pl-10 pr-4 py-3 rounded-lg text-sm" value={locationSearch} onChange={(e) => { setLocationSearch(e.target.value); setIsLocationSelected(false) }} placeholder="Type to search... e.g., San Francisco, CA" autoComplete="off" />
                    {searchingLocation && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />}
                  </div>
                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto" onMouseDown={(e) => e.preventDefault()}>
                      {locationSuggestions.map((location, idx) => (
                        <div key={idx} onClick={() => selectLocation(location)} className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-[var(--color-accent)]" />
                          {location.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {data.city && data.state && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-fade-in">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Location confirmed</p>
                      <p className="text-xs text-white/50">{data.city}, {data.state}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Privacy Protected</p>
                    <p className="text-xs text-white/40 mt-1">Your exact location is not shared. We use this to connect you with alumni within 50 miles.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Social */}
            {step === 5 && (
              <div className="space-y-5">
                <p className="text-sm text-white/50 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] text-center">All fields on this page are optional</p>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2"><Linkedin className="w-4 h-4 text-blue-400" />LinkedIn</label>
                  <input type="url" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.linkedin_url} onChange={(e) => updateData('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2"><Twitter className="w-4 h-4 text-sky-400" />Twitter/X</label>
                  <input type="url" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.twitter_url} onChange={(e) => updateData('twitter_url', e.target.value)} placeholder="https://twitter.com/yourhandle" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-[var(--color-accent)]" />Personal Website</label>
                  <input type="url" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.personal_website} onChange={(e) => updateData('personal_website', e.target.value)} placeholder="https://yourportfolio.com" />
                </div>
                <label className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-all" onClick={() => updateData('looking_for_roommate', !data.looking_for_roommate)}>
                  <input type="checkbox" checked={data.looking_for_roommate} onChange={(e) => updateData('looking_for_roommate', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <HomeIcon className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="text-sm font-medium text-white">I&apos;m looking for roommates</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Let classmates know you&apos;re searching for housing</p>
                  </div>
                </label>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between gap-3">
              {step > 1 && (
                <button onClick={handleBack} disabled={loading} className="px-5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-all flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <div className={step === 1 ? 'ml-auto' : ''}>
                {step < 5 ? (
                  <button onClick={handleNext} disabled={loading} className="glass-button px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} className="glass-button px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Completing...</>
                    ) : (
                      <><Check className="w-4 h-4" />Complete Setup</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
