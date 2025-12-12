'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UNIVERSITIES, DEGREE_TYPES, PROGRAM_NAMES } from '@/lib/constants/universities'
import { Footer } from '@/components/Footer'
import { 
  ArrowLeft, 
  Check, 
  Briefcase, 
  GraduationCap, 
  Search, 
  Building, 
  MapPin, 
  Lock, 
  Globe, 
  Home as HomeIcon, 
  Trash2,
  User,
  Link2,
  Shield,
  AlertTriangle,
  Sparkles
} from 'lucide-react'

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

  const [originalLocation, setOriginalLocation] = useState({
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const [locationSearch, setLocationSearch] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ name: string; display_name: string; lat: string; lon: string }>>([])
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [isLocationSelected, setIsLocationSelected] = useState(false)
  const [canUpdateLocation, setCanUpdateLocation] = useState(true)
  const [daysUntilLocationUpdate, setDaysUntilLocationUpdate] = useState(0)

  const [universitySearch, setUniversitySearch] = useState('')
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([])
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false)

  const [programSearch, setProgramSearch] = useState('')
  const [programSuggestions, setProgramSuggestions] = useState<string[]>([])
  const [showProgramSuggestions, setShowProgramSuggestions] = useState(false)

  const [degreeSearch, setDegreeSearch] = useState('')
  const [degreeSuggestions, setDegreeSuggestions] = useState<string[]>([])
  const [showDegreeSuggestions, setShowDegreeSuggestions] = useState(false)

  // Calculate profile completeness
  const profileCompleteness = (() => {
    let score = 0
    const maxScore = 10
    if (data.full_name) score++
    if (data.grad_year) score++
    if (data.status) score++
    if (data.city && data.state) score++
    if (data.employer || data.grad_school) score++
    if (data.job_title || data.program) score++
    if (data.linkedin_url) score++
    if (data.twitter_url || data.personal_website) score++
    if (data.personal_email) score++
    if (data.looking_for_roommate !== undefined) score++
    return Math.round((score / maxScore) * 100)
  })()

  useEffect(() => { 
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (universitySearch.length > 0) setUniversitySuggestions(UNIVERSITIES.filter(uni => uni.toLowerCase().includes(universitySearch.toLowerCase())).slice(0, 10))
    else setUniversitySuggestions([])
  }, [universitySearch])

  useEffect(() => {
    if (programSearch.length > 0) setProgramSuggestions(PROGRAM_NAMES.filter(prog => prog.toLowerCase().includes(programSearch.toLowerCase())).slice(0, 10))
    else setProgramSuggestions([])
  }, [programSearch])

  useEffect(() => {
    if (degreeSearch.length > 0) setDegreeSuggestions(DEGREE_TYPES.filter(deg => deg.toLowerCase().includes(degreeSearch.toLowerCase())).slice(0, 10))
    else setDegreeSuggestions([])
  }, [degreeSearch])

  useEffect(() => {
    const searchLocation = async () => {
      if (isLocationSelected || locationSearch.length < 3) { setLocationSuggestions([]); return }
      setSearchingLocation(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5&countrycodes=us`)
        const results = await response.json()
        setLocationSuggestions(results)
      } catch (err) { console.error('Location search error:', err) }
      finally { setSearchingLocation(false) }
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

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile, error } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (error) throw error

      if (profile.last_location_update) {
        const lastUpdate = new Date(profile.last_location_update)
        const now = new Date()
        const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
        setCanUpdateLocation(daysSinceUpdate >= 30)
        setDaysUntilLocationUpdate(Math.ceil(Math.max(0, 30 - daysSinceUpdate)))
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

      setOriginalLocation({ city: profile.city || '', state: profile.state || '', latitude: profile.latitude, longitude: profile.longitude })
      if (profile.city && profile.state) { setLocationSearch(`${profile.city}, ${profile.state}`); setIsLocationSelected(true) }
    } catch (err: unknown) { console.error('Error loading profile:', err); setError(err instanceof Error ? err.message : 'An error occurred') }
    finally { setLoading(false) }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const yearStr = data.grad_year.toString()
      if (yearStr.length !== 4 || data.grad_year < 1950 || data.grad_year > 2100) throw new Error('Please enter a valid 4-digit graduation year (1950-2100)')
      if ((data.city || data.state) && (!data.latitude || !data.longitude)) throw new Error('Please select a location from the search dropdown')

      const locationChanged = data.city !== originalLocation.city || data.state !== originalLocation.state || data.latitude !== originalLocation.latitude || data.longitude !== originalLocation.longitude
      if (locationChanged && !canUpdateLocation) throw new Error(`You can only update your location once every 30 days. Please wait ${daysUntilLocationUpdate} more day${daysUntilLocationUpdate !== 1 ? 's' : ''}.`)

      const updateData: Record<string, unknown> = {
        full_name: data.full_name, grad_year: data.grad_year, personal_email: data.personal_email || null,
        city: data.city || null, state: data.state || null, latitude: data.latitude, longitude: data.longitude,
        ...(locationChanged && { last_location_update: new Date().toISOString() }),
        status: data.status || null, employer: data.employer || null, job_title: data.job_title || null,
        grad_school: data.grad_school || null, program: data.program || null, degree: data.degree || null,
        linkedin_url: data.linkedin_url || null, twitter_url: data.twitter_url || null,
        instagram_url: data.instagram_url || null, personal_website: data.personal_website || null,
        looking_for_roommate: data.looking_for_roommate, show_employer: data.show_employer, show_school: data.show_school, profile_visible: true,
      }

      const { error: updateError } = await supabase.from('users').update(updateData).eq('id', user.id)
      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => { window.location.href = '/dashboard' }, 1000)
    } catch (err: unknown) { console.error('Error saving profile:', err); setError(err instanceof Error ? err.message : 'An error occurred') }
    finally { setSaving(false) }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: deleteError } = await supabase.from('users').delete().eq('id', user.id)
      if (deleteError) throw deleteError
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: unknown) { console.error('Error deleting account:', err); setError(err instanceof Error ? err.message : 'An error occurred'); setDeleting(false); setShowDeleteConfirm(false) }
  }

  const statusOptions = [
    { value: 'employed', label: 'Employed', description: 'Working full-time', icon: Briefcase, color: 'emerald' },
    { value: 'internship', label: 'Internship', description: 'Currently interning', icon: Building, color: 'blue' },
    { value: 'grad_school', label: 'Grad School', description: 'Pursuing advanced degree', icon: GraduationCap, color: 'violet' },
    { value: 'looking', label: 'Looking', description: 'Open to opportunities', icon: Search, color: 'amber' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">Edit Profile</h1>
              <p className="text-xs text-white/40">Update your information</p>
            </div>
          </div>
          
          {/* Profile completeness */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-white/40">Profile</p>
              <p className="text-sm font-semibold text-white">{profileCompleteness}%</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle 
                  cx="18" cy="18" r="15.5" fill="none" 
                  stroke="url(#gradient)" strokeWidth="3" 
                  strokeLinecap="round"
                  strokeDasharray={`${profileCompleteness} 100`}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F97066" />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Error</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Profile updated</p>
                <p className="text-sm text-emerald-400/80">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Basic Information</h2>
                      <p className="text-xs text-white/40">Your public identity</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/20 transition-all" 
                          value={data.full_name} 
                          onChange={(e) => setData({ ...data, full_name: e.target.value })} 
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Graduation Year</label>
                        <input 
                          type="number" 
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/20 transition-all" 
                          value={data.grad_year} 
                          onChange={(e) => { const v = e.target.value; if (v === '' || (v.length <= 4 && /^\d+$/.test(v))) setData({ ...data, grad_year: v === '' ? new Date().getFullYear() : parseInt(v) }) }} 
                          min="1950" max="2100" maxLength={4} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Personal Email <span className="text-white/30 font-normal">(optional)</span>
                      </label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/20 transition-all" 
                        value={data.personal_email} 
                        onChange={(e) => setData({ ...data, personal_email: e.target.value })} 
                        placeholder="your.name@gmail.com" 
                      />
                      <p className="text-xs text-white/30 mt-2">Backup email for when you lose .edu access</p>
                    </div>
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Current Status</h2>
                      <p className="text-xs text-white/40">What are you up to?</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {statusOptions.map((option) => (
                        <label 
                          key={option.value} 
                          className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                            data.status === option.value 
                              ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 ring-1 ring-[var(--color-accent)]/20' 
                              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                          }`}
                        >
                          <input type="radio" name="status" value={option.value} checked={data.status === option.value} onChange={(e) => setData({ ...data, status: e.target.value as typeof data.status })} className="sr-only" />
                          <div className="flex items-center justify-between mb-2">
                            <option.icon className={`w-5 h-5 ${data.status === option.value ? 'text-[var(--color-accent)]' : 'text-white/40'}`} />
                            {data.status === option.value && <Check className="w-4 h-4 text-[var(--color-accent)]" />}
                          </div>
                          <span className="text-sm font-medium text-white">{option.label}</span>
                          <span className="text-xs text-white/40">{option.description}</span>
                        </label>
                      ))}
                    </div>

                    {/* Conditional fields */}
                    {(data.status === 'employed' || data.status === 'internship') && (
                      <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input type="text" placeholder="Company name" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all" value={data.employer} onChange={(e) => setData({ ...data, employer: e.target.value })} />
                          <input type="text" placeholder={data.status === 'internship' ? 'Internship title' : 'Job title'} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all" value={data.job_title} onChange={(e) => setData({ ...data, job_title: e.target.value })} />
                        </div>
                        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-all">
                          <input type="checkbox" checked={!data.show_employer} onChange={(e) => setData({ ...data, show_employer: !e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)] focus:ring-[var(--color-accent)]/20" />
                          <div>
                            <span className="text-sm text-white">Hide employer name</span>
                            <p className="text-xs text-white/40">Only show your job title</p>
                          </div>
                        </label>
                      </div>
                    )}

                    {data.status === 'grad_school' && (
                      <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                        <div className="relative">
                          <input type="text" placeholder="School name" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all" value={universitySearch || data.grad_school} onChange={(e) => { setUniversitySearch(e.target.value); setData({ ...data, grad_school: e.target.value }); setShowUniversitySuggestions(true) }} onFocus={() => setShowUniversitySuggestions(true)} onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)} autoComplete="off" />
                          {showUniversitySuggestions && universitySuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto">{universitySuggestions.map((uni, idx) => (<div key={idx} onClick={() => { setData({ ...data, grad_school: uni }); setUniversitySearch(uni); setShowUniversitySuggestions(false) }} className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white border-b border-white/[0.04] last:border-0">{uni}</div>))}</div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="relative">
                            <input type="text" placeholder="Program" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all" value={programSearch || data.program} onChange={(e) => { setProgramSearch(e.target.value); setData({ ...data, program: e.target.value }); setShowProgramSuggestions(true) }} onFocus={() => setShowProgramSuggestions(true)} onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 200)} autoComplete="off" />
                            {showProgramSuggestions && programSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto">{programSuggestions.map((prog, idx) => (<div key={idx} onClick={() => { setData({ ...data, program: prog }); setProgramSearch(prog); setShowProgramSuggestions(false) }} className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white border-b border-white/[0.04] last:border-0">{prog}</div>))}</div>
                            )}
                          </div>
                          <div className="relative">
                            <input type="text" placeholder="Degree (e.g., MBA, PhD)" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all" value={degreeSearch || data.degree} onChange={(e) => { setDegreeSearch(e.target.value); setData({ ...data, degree: e.target.value }); setShowDegreeSuggestions(true) }} onFocus={() => setShowDegreeSuggestions(true)} onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 200)} autoComplete="off" />
                            {showDegreeSuggestions && degreeSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto">{degreeSuggestions.map((deg, idx) => (<div key={idx} onClick={() => { setData({ ...data, degree: deg }); setDegreeSearch(deg); setShowDegreeSuggestions(false) }} className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white border-b border-white/[0.04] last:border-0">{deg}</div>))}</div>
                            )}
                          </div>
                        </div>
                        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-all">
                          <input type="checkbox" checked={!data.show_school} onChange={(e) => setData({ ...data, show_school: !e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)] focus:ring-[var(--color-accent)]/20" />
                          <div>
                            <span className="text-sm text-white">Hide school name</span>
                            <p className="text-xs text-white/40">Only show your program</p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-white">Location</h2>
                        <p className="text-xs text-white/40">Where are you based?</p>
                      </div>
                    </div>
                    {!canUpdateLocation && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">{daysUntilLocationUpdate}d lock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {!canUpdateLocation && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <p className="text-xs text-amber-400/80">Location updates are limited to once every 30 days to prevent abuse.</p>
                      </div>
                    )}
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input 
                        type="text" 
                        disabled={!canUpdateLocation} 
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                        value={locationSearch} 
                        onChange={(e) => { setLocationSearch(e.target.value); setIsLocationSelected(false) }} 
                        placeholder={canUpdateLocation ? "Search for a city..." : "Location locked"} 
                        autoComplete="off" 
                      />
                      {searchingLocation && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />}
                      {locationSuggestions.length > 0 && canUpdateLocation && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto" onMouseDown={(e) => e.preventDefault()}>
                          {locationSuggestions.map((loc, idx) => (<div key={idx} onClick={() => selectLocation(loc)} className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white flex items-center gap-3 border-b border-white/[0.04] last:border-0"><MapPin className="w-4 h-4 text-[var(--color-accent)] shrink-0" /><span className="truncate">{loc.display_name}</span></div>))}
                        </div>
                      )}
                    </div>
                    {data.city && data.state && (
                      <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-white">{data.city}, {data.state}</span>
                          <p className="text-xs text-emerald-400/60">Location confirmed</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Social Links Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Social Links</h2>
                      <p className="text-xs text-white/40">Connect your profiles</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      <input type="url" placeholder="linkedin.com/in/..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all" value={data.linkedin_url} onChange={(e) => setData({ ...data, linkedin_url: e.target.value })} />
                    </div>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <input type="url" placeholder="x.com/..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 transition-all" value={data.twitter_url} onChange={(e) => setData({ ...data, twitter_url: e.target.value })} />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-accent)]" />
                      <input type="url" placeholder="yourwebsite.com" className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all" value={data.personal_website} onChange={(e) => setData({ ...data, personal_website: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Preferences Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Preferences</h2>
                      <p className="text-xs text-white/40">Additional options</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-all">
                      <input type="checkbox" checked={data.looking_for_roommate} onChange={(e) => setData({ ...data, looking_for_roommate: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)] focus:ring-[var(--color-accent)]/20" />
                      <div>
                        <div className="flex items-center gap-2">
                          <HomeIcon className="w-4 h-4 text-[var(--color-accent)]" />
                          <span className="text-sm font-medium text-white">Looking for roommates</span>
                        </div>
                        <p className="text-xs text-white/40 mt-1">Show a badge on your profile</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-3">
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[#FB7185] text-white text-sm font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-[var(--color-accent)]/20 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <Link 
                    href="/dashboard" 
                    className="w-full px-6 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-all flex items-center justify-center"
                  >
                    Cancel
                  </Link>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-500/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
                      <p className="text-xs text-red-400/60">Irreversible actions</p>
                    </div>
                  </div>
                  <div className="p-6">
                    {!showDeleteConfirm ? (
                      <button 
                        type="button" 
                        onClick={() => setShowDeleteConfirm(true)} 
                        className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-red-400/80">Are you sure? This cannot be undone.</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleDeleteAccount} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 text-sm font-medium transition-all">{deleting ? 'Deleting...' : 'Yes, delete'}</button>
                          <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-all">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
