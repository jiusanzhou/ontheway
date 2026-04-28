'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const OAUTH_ERROR_MAP: Record<string, string> = {
  invalid_state: 'The sign-in link expired. Please try again.',
  token_exchange_failed: 'Could not exchange authorization code. Please try again.',
  fetch_profile_failed: 'Could not fetch your profile from the provider.',
  missing_code_or_state: 'Sign-in was cancelled.',
  access_denied: 'Sign-in was cancelled.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Surface OAuth callback errors
  useEffect(() => {
    const err = searchParams.get('error')
    if (err) setError(OAUTH_ERROR_MAP[err] || err.replace(/_/g, ' '))
  }, [searchParams])

  const handleOAuth = (provider: 'github' | 'google') => {
    window.location.href = `/api/auth/oauth/${provider}?next=/dashboard`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong')
      } else if (isSignUp) {
        router.push('/dashboard')
        router.refresh()
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen theme-bg-page flex flex-col">
      <header className="border-b theme-border theme-bg-primary">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <Link href="/" className="text-lg sm:text-xl font-bold theme-text-primary">OnTheWay</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-8 theme-text-primary">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>

          <div className="space-y-2 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              className="w-full flex items-center justify-center gap-2 border theme-border rounded-lg py-2.5 theme-bg-primary theme-text-primary hover:opacity-90 transition-opacity"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2c-3.2.69-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.9-.38 2.88-.39.98.01 1.97.13 2.88.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.35.77 1.04.77 2.1v3.11c0 .3.2.66.8.55C20.22 21.38 23.5 17.07 23.5 12 23.5 5.73 18.27.5 12 .5z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t theme-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="theme-bg-page px-2 theme-text-secondary">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 theme-text-primary">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 theme-input"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 theme-text-primary">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 theme-input"
                placeholder="--------"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--danger)', color: '#fff', opacity: 0.9 }}>
                {error}
              </div>
            )}

            {message && (
              <div className="theme-success text-sm rounded-lg p-3">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full theme-accent py-2.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm theme-text-secondary mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              className="theme-link"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
