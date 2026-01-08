'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UNIVERSITIES, DEGREE_TYPES, PROGRAM_NAMES } from '@/lib/constants/universities'
import { Footer } from '@/components/Footer'
import { CollegeLogo } from '@/components/CollegeLogo'
import { 
  ArrowLeft, 
  Check, 
  Briefcase, 
  GraduationCap, 
  Search, 
  Building, 
  MapPin, 
  Lock, 
  Home as HomeIcon, 
  Trash2,
  AlertTriangle,
  Loader2
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

  const [institution, setInstitution] = useState<{ name: string; domain: string } | null>(null)

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

      const { data: profile, error } = await supabase
        .from('users')
        .select('*, institutions:institution_id (name, domain)')
        .eq('id', user.id)
        .single()
      if (error) throw error

      if (profile.institutions) {
        setInstitution(profile.institutions as { name: string; domain: string })
      }

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
        personal_website: data.personal_website || null,
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
    { value: 'employed', label: 'Employed', icon: Briefcase },
    { value: 'internship', label: 'Internship', icon: Building },
    { value: 'grad_school', label: 'Grad School', icon: GraduationCap },
    { value: 'looking', label: 'Looking', icon: Search },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-2 -ml-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Edit Profile</h1>
          </div>
          {institution?.domain && (
            <CollegeLogo domain={institution.domain} size="sm" />
          )}
        </div>
      </header>

      <div className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-400">Profile updated! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Basic Info */}
            <section>
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Basic Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                    value={data.full_name} 
                    onChange={(e) => setData({ ...data, full_name: e.target.value })} 
                    placeholder="Your name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Grad Year</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                      value={data.grad_year} 
                      onChange={(e) => { const v = e.target.value; if (v === '' || (v.length <= 4 && /^\d+$/.test(v))) setData({ ...data, grad_year: v === '' ? new Date().getFullYear() : parseInt(v) }) }} 
                      min="1950" max="2100" maxLength={4} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Personal Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                      value={data.personal_email} 
                      onChange={(e) => setData({ ...data, personal_email: e.target.value })} 
                      placeholder="backup@gmail.com" 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Current Status */}
            <section>
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Current Status</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setData({ ...data, status: option.value as typeof data.status })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      data.status === option.value 
                        ? 'bg-white/[0.08] border-white/20 text-white' 
                        : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Conditional fields based on status */}
              {(data.status === 'employed' || data.status === 'internship') && (
                <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Company</label>
                      <input 
                        type="text" 
                        placeholder="Where do you work?" 
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                        value={data.employer} 
                        onChange={(e) => setData({ ...data, employer: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Title</label>
                      <input 
                        type="text" 
                        placeholder="Your role" 
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                        value={data.job_title} 
                        onChange={(e) => setData({ ...data, job_title: e.target.value })} 
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!data.show_employer} 
                      onChange={(e) => setData({ ...data, show_employer: !e.target.checked })} 
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" 
                    />
                    <span className="text-sm text-white/60">Hide company name from profile</span>
                  </label>
                </div>
              )}

              {data.status === 'grad_school' && (
                <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="relative">
                    <label className="block text-sm text-white/70 mb-2">School</label>
                    <input 
                      type="text" 
                      placeholder="University name" 
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                      value={universitySearch || data.grad_school} 
                      onChange={(e) => { setUniversitySearch(e.target.value); setData({ ...data, grad_school: e.target.value }); setShowUniversitySuggestions(true) }} 
                      onFocus={() => setShowUniversitySuggestions(true)} 
                      onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)} 
                      autoComplete="off" 
                    />
                    {showUniversitySuggestions && universitySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto">
                        {universitySuggestions.map((uni, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => { setData({ ...data, grad_school: uni }); setUniversitySearch(uni); setShowUniversitySuggestions(false) }} 
                            className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white border-b border-white/[0.04] last:border-0"
                          >
                            {uni}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm text-white/70 mb-2">Program</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Computer Science" 
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                        value={programSearch || data.program} 
                        onChange={(e) => { setProgramSearch(e.target.value); setData({ ...data, program: e.target.value }); setShowProgramSuggestions(true) }} 
                        onFocus={() => setShowProgramSuggestions(true)} 
                        onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 200)} 
                        autoComplete="off" 
                      />
                      {showProgramSuggestions && programSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto">
                          {programSuggestions.map((prog, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => { setData({ ...data, program: prog }); setProgramSearch(prog); setShowProgramSuggestions(false) }} 
                              className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white border-b border-white/[0.04] last:border-0"
                            >
                              {prog}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm text-white/70 mb-2">Degree</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MBA, PhD" 
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                        value={degreeSearch || data.degree} 
                        onChange={(e) => { setDegreeSearch(e.target.value); setData({ ...data, degree: e.target.value }); setShowDegreeSuggestions(true) }} 
                        onFocus={() => setShowDegreeSuggestions(true)} 
                        onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 200)} 
                        autoComplete="off" 
                      />
                      {showDegreeSuggestions && degreeSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto">
                          {degreeSuggestions.map((deg, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => { setData({ ...data, degree: deg }); setDegreeSearch(deg); setShowDegreeSuggestions(false) }} 
                              className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white border-b border-white/[0.04] last:border-0"
                            >
                              {deg}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!data.show_school} 
                      onChange={(e) => setData({ ...data, show_school: !e.target.checked })} 
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" 
                    />
                    <span className="text-sm text-white/60">Hide school name from profile</span>
                  </label>
                </div>
              )}
            </section>

            {/* Location */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">Location</h2>
                {!canUpdateLocation && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.05] text-xs text-white/40">
                    <Lock className="w-3 h-3" />
                    {daysUntilLocationUpdate}d until update
                  </span>
                )}
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  disabled={!canUpdateLocation} 
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  value={locationSearch} 
                  onChange={(e) => { setLocationSearch(e.target.value); setIsLocationSelected(false) }} 
                  placeholder={canUpdateLocation ? "Search for a city..." : "Location locked"} 
                  autoComplete="off" 
                />
                {searchingLocation && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />
                )}
                {locationSuggestions.length > 0 && canUpdateLocation && (
                  <div className="absolute z-50 w-full mt-2 bg-[#1a1a20] border border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-auto" onMouseDown={(e) => e.preventDefault()}>
                    {locationSuggestions.map((loc, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => selectLocation(loc)} 
                        className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white flex items-center gap-3 border-b border-white/[0.04] last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-white/30 shrink-0" />
                        <span className="truncate">{loc.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {data.city && data.state && (
                <p className="mt-2 text-sm text-white/40 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {data.city}, {data.state}
                </p>
              )}
            </section>

            {/* Links */}
            <section>
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Links</h2>
              <div className="space-y-3">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  <input 
                    type="url" 
                    placeholder="linkedin.com/in/yourprofile" 
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                    value={data.linkedin_url} 
                    onChange={(e) => setData({ ...data, linkedin_url: e.target.value })} 
                  />
                </div>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <input 
                    type="url" 
                    placeholder="x.com/yourhandle" 
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                    value={data.twitter_url} 
                    onChange={(e) => setData({ ...data, twitter_url: e.target.value })} 
                  />
                </div>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <input 
                    type="url" 
                    placeholder="yourwebsite.com" 
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors" 
                    value={data.personal_website} 
                    onChange={(e) => setData({ ...data, personal_website: e.target.value })} 
                  />
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section>
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Preferences</h2>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-colors">
                <input 
                  type="checkbox" 
                  checked={data.looking_for_roommate} 
                  onChange={(e) => setData({ ...data, looking_for_roommate: e.target.checked })} 
                  className="h-5 w-5 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <HomeIcon className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-medium text-white">Looking for roommates</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">Display a badge on your profile</p>
                </div>
              </label>
            </section>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button 
                type="submit" 
                disabled={saving} 
                className="flex-1 px-6 py-3.5 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-50 hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                className="px-6 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t border-white/[0.06]">
              <h2 className="text-sm font-medium text-red-400/60 uppercase tracking-wider mb-4">Danger Zone</h2>
              {!showDeleteConfirm ? (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-4">
                  <p className="text-sm text-red-400">Are you sure? This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={handleDeleteAccount} 
                      disabled={deleting} 
                      className="px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete my account'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteConfirm(false)} 
                      disabled={deleting} 
                      className="px-4 py-2.5 rounded-lg bg-white/[0.05] text-white/70 hover:bg-white/[0.08] text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
