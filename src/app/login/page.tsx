'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
