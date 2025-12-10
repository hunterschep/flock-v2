'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UNIVERSITIES, DEGREE_TYPES, PROGRAM_NAMES } from '@/lib/constants/universities'
import { Footer } from '@/components/Footer'
import { ArrowLeft, Check, Briefcase, GraduationCap, Search, Building, MapPin, Lock, Linkedin, Twitter, Globe, Home as HomeIcon, Trash2 } from 'lucide-react'

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
    { value: 'employed', label: 'Employed', icon: Briefcase, color: 'emerald' },
    { value: 'internship', label: 'Internship', icon: Building, color: 'blue' },
    { value: 'grad_school', label: 'Grad School', icon: GraduationCap, color: 'violet' },
    { value: 'looking', label: 'Looking', icon: Search, color: 'amber' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="glass-strong rounded-xl p-6 md:p-8">
            <h1 className="text-xl font-semibold text-white mb-6">Edit Profile</h1>

            {error && <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-sm text-red-400">{error}</p></div>}
            {success && <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><p className="text-sm text-emerald-400">Profile updated! Redirecting...</p></div>}

            <form onSubmit={handleSave} className="space-y-8">
              {/* Basic Info */}
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                    <input type="text" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Graduation Year</label>
                    <input type="number" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.grad_year} onChange={(e) => { const v = e.target.value; if (v === '' || (v.length <= 4 && /^\d+$/.test(v))) setData({ ...data, grad_year: v === '' ? new Date().getFullYear() : parseInt(v) }) }} min="1950" max="2100" maxLength={4} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Personal Email <span className="text-white/40">(optional)</span></label>
                    <input type="email" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.personal_email} onChange={(e) => setData({ ...data, personal_email: e.target.value })} placeholder="your.name@gmail.com" />
                    <p className="text-xs text-white/40 mt-1">For when you lose access to your .edu email</p>
                  </div>
                </div>
              </section>

              {/* Status */}
              <section className="space-y-4 pt-6 border-t border-white/[0.06]">
                <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Current Status</h2>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label key={option.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${data.status === option.value ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                      <input type="radio" name="status" value={option.value} checked={data.status === option.value} onChange={(e) => setData({ ...data, status: e.target.value as 'employed' | 'grad_school' | 'looking' | 'internship' })} className="sr-only" />
                      <option.icon className={`w-4 h-4 ${data.status === option.value ? 'text-[var(--color-accent)]' : 'text-white/50'}`} />
                      <span className="text-sm text-white">{option.label}</span>
                      {data.status === option.value && <Check className="w-4 h-4 text-[var(--color-accent)] ml-auto" />}
                    </label>
                  ))}
                </div>

                {(data.status === 'employed' || data.status === 'internship') && (
                  <div className="space-y-3 mt-4">
                    <input type="text" placeholder="Employer" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.employer} onChange={(e) => setData({ ...data, employer: e.target.value })} />
                    <input type="text" placeholder={data.status === 'internship' ? 'Internship Title' : 'Job Title'} className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={data.job_title} onChange={(e) => setData({ ...data, job_title: e.target.value })} />
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                      <input type="checkbox" checked={!data.show_employer} onChange={(e) => setData({ ...data, show_employer: !e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" />
                      <span className="text-sm text-white/70">Hide employer name</span>
                    </label>
                  </div>
                )}

                {data.status === 'grad_school' && (
                  <div className="space-y-3 mt-4">
                    <div className="relative">
                      <input type="text" placeholder="School" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={universitySearch || data.grad_school} onChange={(e) => { setUniversitySearch(e.target.value); setData({ ...data, grad_school: e.target.value }); setShowUniversitySuggestions(true) }} onFocus={() => setShowUniversitySuggestions(true)} onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)} autoComplete="off" />
                      {showUniversitySuggestions && universitySuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto">{universitySuggestions.map((uni, idx) => (<div key={idx} onClick={() => { setData({ ...data, grad_school: uni }); setUniversitySearch(uni); setShowUniversitySuggestions(false) }} className="px-4 py-2 hover:bg-white/[0.05] cursor-pointer text-sm text-white">{uni}</div>))}</div>
                      )}
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="Program" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={programSearch || data.program} onChange={(e) => { setProgramSearch(e.target.value); setData({ ...data, program: e.target.value }); setShowProgramSuggestions(true) }} onFocus={() => setShowProgramSuggestions(true)} onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 200)} autoComplete="off" />
                      {showProgramSuggestions && programSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto">{programSuggestions.map((prog, idx) => (<div key={idx} onClick={() => { setData({ ...data, program: prog }); setProgramSearch(prog); setShowProgramSuggestions(false) }} className="px-4 py-2 hover:bg-white/[0.05] cursor-pointer text-sm text-white">{prog}</div>))}</div>
                      )}
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="Degree" className="glass-input w-full px-4 py-3 rounded-lg text-sm" value={degreeSearch || data.degree} onChange={(e) => { setDegreeSearch(e.target.value); setData({ ...data, degree: e.target.value }); setShowDegreeSuggestions(true) }} onFocus={() => setShowDegreeSuggestions(true)} onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 200)} autoComplete="off" />
                      {showDegreeSuggestions && degreeSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto">{degreeSuggestions.map((deg, idx) => (<div key={idx} onClick={() => { setData({ ...data, degree: deg }); setDegreeSearch(deg); setShowDegreeSuggestions(false) }} className="px-4 py-2 hover:bg-white/[0.05] cursor-pointer text-sm text-white">{deg}</div>))}</div>
                      )}
                    </div>
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                      <input type="checkbox" checked={!data.show_school} onChange={(e) => setData({ ...data, show_school: !e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" />
                      <span className="text-sm text-white/70">Hide school name</span>
                    </label>
                  </div>
                )}
              </section>

              {/* Location */}
              <section className="space-y-4 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Location</h2>
                  {!canUpdateLocation && (
                    <span className="text-xs text-amber-400 flex items-center gap-1"><Lock className="w-3 h-3" />Locked for {daysUntilLocationUpdate} days</span>
                  )}
                </div>
                {!canUpdateLocation && <p className="text-xs text-white/40 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">Location updates are limited to once every 30 days.</p>}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" disabled={!canUpdateLocation} className="glass-input w-full pl-10 pr-4 py-3 rounded-lg text-sm disabled:opacity-50" value={locationSearch} onChange={(e) => { setLocationSearch(e.target.value); setIsLocationSelected(false) }} placeholder={canUpdateLocation ? "Search for a city..." : "Location update locked"} autoComplete="off" />
                  {searchingLocation && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />}
                  {locationSuggestions.length > 0 && canUpdateLocation && (
                    <div className="absolute z-50 w-full mt-1 glass-strong rounded-lg max-h-48 overflow-auto" onMouseDown={(e) => e.preventDefault()}>
                      {locationSuggestions.map((loc, idx) => (<div key={idx} onClick={() => selectLocation(loc)} className="px-4 py-3 hover:bg-white/[0.05] cursor-pointer text-sm text-white flex items-center gap-3"><MapPin className="w-4 h-4 text-[var(--color-accent)]" />{loc.display_name}</div>))}
                    </div>
                  )}
                </div>
                {data.city && data.state && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span className="text-sm text-white">{data.city}, {data.state}</span></div>}
              </section>

              {/* Social Links */}
              <section className="space-y-4 pt-6 border-t border-white/[0.06]">
                <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Social Links</h2>
                <div className="space-y-3">
                  <div className="relative"><Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" /><input type="url" placeholder="LinkedIn URL" className="glass-input w-full pl-10 pr-4 py-3 rounded-lg text-sm" value={data.linkedin_url} onChange={(e) => setData({ ...data, linkedin_url: e.target.value })} /></div>
                  <div className="relative"><Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" /><input type="url" placeholder="Twitter/X URL" className="glass-input w-full pl-10 pr-4 py-3 rounded-lg text-sm" value={data.twitter_url} onChange={(e) => setData({ ...data, twitter_url: e.target.value })} /></div>
                  <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-accent)]" /><input type="url" placeholder="Personal Website" className="glass-input w-full pl-10 pr-4 py-3 rounded-lg text-sm" value={data.personal_website} onChange={(e) => setData({ ...data, personal_website: e.target.value })} /></div>
                </div>
              </section>

              {/* Preferences */}
              <section className="space-y-4 pt-6 border-t border-white/[0.06]">
                <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Preferences</h2>
                <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-all">
                  <input type="checkbox" checked={data.looking_for_roommate} onChange={(e) => setData({ ...data, looking_for_roommate: e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-accent)]" />
                  <HomeIcon className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-sm text-white">I&apos;m looking for roommates</span>
                </label>
              </section>

              {/* Actions */}
              <div className="pt-6 flex gap-3">
                <button type="submit" disabled={saving} className="glass-button flex-1 px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                <Link href="/dashboard" className="px-6 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-all text-center">Cancel</Link>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-4">Danger Zone</h2>
              {!showDeleteConfirm ? (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />Delete Account
                </button>
              ) : (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-white mb-4">Are you sure? This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 text-sm font-medium">{deleting ? 'Deleting...' : 'Yes, delete'}</button>
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
