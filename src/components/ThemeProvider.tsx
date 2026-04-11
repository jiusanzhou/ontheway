'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { type ThemeId, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/themes'

const ThemeContext = createContext<{
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}>({ theme: DEFAULT_THEME, setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME)

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
    if (saved && ['light', 'dark', 'teal'].includes(saved)) {
      setThemeState(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t)
    localStorage.setItem(THEME_STORAGE_KEY, t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
