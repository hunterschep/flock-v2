'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Mail, CheckCircle, XCircle, Eye, EyeOff, Lock, KeyRound } from 'lucide-react'
import InteractiveStarfield from '@/components/InteractiveStarfield'

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'verify'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Determine initial mode from URL params
  const getInitialMode = (): AuthMode => {
    const mode = searchParams.get('mode')
    if (mode === 'reset') return 'reset'
    if (mode === 'verify') return 'verify'
    return 'signin'
  }

  const [mode, setMode] = useState<AuthMode>(getInitialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Check for URL params on mount
  useEffect(() => {
    const mode = searchParams.get('mode')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (mode === 'reset') setMode('reset')
    if (mode === 'verify') {
      setMode('verify')
      setMessage({ type: 'success', text: 'Email verified successfully! You can now sign in.' })
    }
    if (error) {
      setMessage({ type: 'error', text: errorDescription || 'Authentication error occurred' })
    }
  }, [searchParams])

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required'
    if (!email.includes('@')) return 'Please enter a valid email'
    if (!email.endsWith('.edu')) return 'Please use a .edu email address'
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must contain a number'
    return null
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const emailError = validateEmail(email)
    if (emailError) {
      setMessage({ type: 'error', text: emailError })
      setLoading(false)
      return
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Password is required' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setMessage({ type: 'error', text: 'Please verify your email before signing in. Check your inbox for the verification link.' })
        } else if (error.message.includes('Invalid login credentials')) {
          setMessage({ type: 'error', text: 'Invalid email or password. Please try again.' })
        } else {
          throw error
        }
        return
      }

      // Check onboarding status
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (!userData || !userData.onboarding_completed) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const emailError = validateEmail(email)
    if (emailError) {
      setMessage({ type: 'error', text: emailError })
      setLoading(false)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Account created! Check your email for the verification link to complete your registration.',
      })
      setPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('already registered')) {
        setMessage({ type: 'error', text: 'An account with this email already exists. Try signing in instead.' })
      } else {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const emailError = validateEmail(email)
    if (emailError) {
      setMessage({ type: 'error', text: emailError })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Password reset link sent! Check your email.',
      })
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const passwordError = validatePassword(password)
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setTimeout(() => {
        setMode('signin')
        setPassword('')
        setConfirmPassword('')
        router.push('/auth')
      }, 2000)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    setMessage(null)

    const emailError = validateEmail(email)
    if (emailError) {
      setMessage({ type: 'error', text: emailError })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Verification email sent! Check your inbox.' })
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setMessage(null)
    setPassword('')
    setConfirmPassword('')
  }

  const renderForm = () => {
    switch (mode) {
      case 'signup':
        return (
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                University Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30 text-sm"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="glass-input w-full px-4 py-3 pr-12 rounded-lg text-white placeholder-white/30 text-sm"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">
                8+ characters, uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30 text-sm"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {message && <MessageBox message={message} />}

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Create Account<ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-sm text-white/50">
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('signin')} className="text-[var(--color-accent)] hover:underline">
                Sign in
              </button>
            </p>
          </form>
        )

      case 'forgot':
        return (
          <form className="space-y-4" onSubmit={handleForgotPassword}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                University Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30 text-sm"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {message && <MessageBox message={message} />}

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending link...</>
              ) : (
                <>Send Reset Link<ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-sm text-white/50">
              Remember your password?{' '}
              <button type="button" onClick={() => switchMode('signin')} className="text-[var(--color-accent)] hover:underline">
                Sign in
              </button>
            </p>
          </form>
        )

      case 'reset':
        return (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="glass-input w-full px-4 py-3 pr-12 rounded-lg text-white placeholder-white/30 text-sm"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">
                8+ characters, uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30 text-sm"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {message && <MessageBox message={message} />}

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</>
              ) : (
                <>Update Password<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        )

      default: // signin
        return (
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                University Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/30 text-sm"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-white/70">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="glass-input w-full px-4 py-3 pr-12 rounded-lg text-white placeholder-white/30 text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {message && <MessageBox message={message} />}

            {message?.text.includes('verify your email') && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-all"
              >
                Resend verification email
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : (
                <>Sign In<ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-sm text-white/50">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="text-[var(--color-accent)] hover:underline">
                Create one
              </button>
            </p>
          </form>
        )
    }
  }

  const getIcon = () => {
    switch (mode) {
      case 'signup': return <Mail className="w-6 h-6 text-[var(--color-accent)]" />
      case 'forgot': return <KeyRound className="w-6 h-6 text-[var(--color-accent)]" />
      case 'reset': return <Lock className="w-6 h-6 text-[var(--color-accent)]" />
      default: return <Lock className="w-6 h-6 text-[var(--color-accent)]" />
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account'
      case 'forgot': return 'Reset Password'
      case 'reset': return 'Set New Password'
      default: return 'Welcome Back'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Sign up with your university email'
      case 'forgot': return 'Enter your email to receive a reset link'
      case 'reset': return 'Choose a new secure password'
      default: return 'Sign in to your account'
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col relative overflow-hidden">
      <InteractiveStarfield />
      
      <div className="flex-1 flex items-center justify-center py-8 md:py-12 px-4 md:px-6 relative z-10">
        <div className="max-w-sm w-full">
          <div className="glass-strong rounded-2xl p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[var(--color-accent)]/10 mb-4 md:mb-5">
                {getIcon()}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
                {getTitle()}
              </h1>
              <p className="text-sm text-white/50">
                {getSubtitle()}
              </p>
            </div>
            
            {/* Form container with min-height to prevent layout shifts */}
            <div className="min-h-[280px]">
            {renderForm()}
            </div>
          </div>

          {/* Back link */}
          <div className="mt-4 md:mt-6 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Compact footer for auth page */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[var(--color-bg)] py-4 md:py-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Flock
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function MessageBox({ message }: { message: { type: 'success' | 'error'; text: string } }) {
  return (
    <div className={`rounded-lg p-4 flex items-start gap-3 animate-fade-in ${
      message.type === 'error'
        ? 'bg-red-500/10 border border-red-500/20'
        : 'bg-emerald-500/10 border border-emerald-500/20'
    }`}>
      {message.type === 'error' ? (
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
      )}
      <p className="text-sm text-white/80">{message.text}</p>
    </div>
  )
}
