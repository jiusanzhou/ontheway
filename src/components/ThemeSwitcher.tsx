'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { THEMES } from '@/lib/themes'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs theme-text-secondary hover:theme-bg-secondary transition-colors"
        title="切换主题"
      >
        <span
          className="w-3 h-3 rounded-full border border-current/20"
          style={{ backgroundColor: current.preview.accent }}
        />
        <span className="hidden sm:inline">{current.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 theme-bg-primary rounded-lg border theme-border shadow-lg z-50 py-1">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:theme-bg-secondary transition-colors ${
                theme === t.id ? 'theme-text-accent font-medium' : 'theme-text-primary'
              }`}
            >
              <span className="flex gap-0.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.preview.bg }} />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.preview.accent }} />
              </span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
