'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  domain: string
  api_key: string
}

export default function ProjectSettings({ project }: { project: Project }) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [domain, setDomain] = useState(project.domain || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState('')

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain }),
      })
      if (res.ok) {
        setMsg('✅ Saved')
        setTimeout(() => setMsg(''), 2000)
      } else {
        const err = await res.json()
        setMsg('❌ ' + (err.error || 'Failed'))
      }
    } catch {
      setMsg('❌ Network error')
    }
    setSaving(false)
  }

  const deleteProject = async () => {
    if (confirmDelete !== project.name) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        setMsg('❌ Failed to delete')
        setDeleting(false)
      }
    } catch {
      setMsg('❌ Network error')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen theme-bg-page">
      <header className="theme-bg-primary border-b theme-border">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={`/dashboard/projects/${project.id}`} className="theme-text-secondary hover:theme-text-primary transition-colors">← Back</Link>
            <span className="font-medium text-sm sm:text-base theme-text-primary">Settings</span>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-xs">{msg}</span>}
            <button onClick={save} disabled={saving}
              className="px-4 py-2 theme-accent rounded-lg text-sm disabled:opacity-50 transition-colors">
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* General */}
        <div className="theme-bg-primary rounded-lg border theme-border p-4 sm:p-6">
          <h2 className="font-bold mb-4 theme-text-primary">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 theme-text-primary">Project Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm theme-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 theme-text-primary">Domain</label>
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
                placeholder="example.com" className="w-full border rounded-lg px-3 py-2 text-sm theme-input" />
              <p className="text-xs theme-text-tertiary mt-1">Optional. Used for domain validation in production.</p>
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="theme-bg-primary rounded-lg border theme-border p-4 sm:p-6">
          <h2 className="font-bold mb-4 theme-text-primary">API Key</h2>
          <div className="theme-bg-secondary rounded-lg p-3">
            <code className="text-xs sm:text-sm break-all select-all theme-text-secondary">{project.api_key}</code>
          </div>
          <p className="text-xs theme-text-tertiary mt-2">Use this key for API access. Keep it secret.</p>
        </div>

        {/* Danger Zone */}
        <div className="theme-bg-primary rounded-lg border p-4 sm:p-6" style={{ borderColor: 'var(--danger)' }}>
          <h2 className="font-bold mb-2" style={{ color: 'var(--danger)' }}>Danger Zone</h2>
          <p className="text-sm theme-text-secondary mb-4">
            Deleting this project will permanently remove all tasks and analytics data.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 theme-text-primary">
                Type <span className="font-mono" style={{ color: 'var(--danger)' }}>{project.name}</span> to confirm
              </label>
              <input type="text" value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)}
                placeholder={project.name} className="w-full border rounded-lg px-3 py-2 text-sm theme-input" style={{ borderColor: 'var(--danger)' }} />
            </div>
            <button onClick={deleteProject}
              disabled={confirmDelete !== project.name || deleting}
              className="px-4 py-2 theme-danger rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
