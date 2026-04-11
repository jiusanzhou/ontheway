'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), domain: domain.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create project')
      router.push(`/dashboard/projects/${data.project.id}`)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen theme-bg-page">
      <header className="theme-bg-primary border-b theme-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-4">
          <Link href="/dashboard" className="theme-text-secondary hover:theme-text-primary transition-colors">← Back</Link>
          <span className="font-medium theme-text-primary">New Project</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 theme-text-primary">Create Project</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 theme-text-primary">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 theme-input"
              placeholder="My App"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 theme-text-primary">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 theme-input"
              placeholder="myapp.com"
            />
            <p className="text-xs theme-text-tertiary mt-1">Optional. The domain where your app runs.</p>
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--danger)', color: '#fff', opacity: 0.9 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full theme-accent py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </main>
    </div>
  )
}
