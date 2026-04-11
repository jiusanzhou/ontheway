export type ThemeId = 'light' | 'dark' | 'teal'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  preview: {
    bg: string
    accent: string
    text: string
  }
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'light',
    name: '清爽白',
    description: '默认浅色主题',
    preview: { bg: '#ffffff', accent: '#000000', text: '#171717' },
  },
  {
    id: 'dark',
    name: '暗夜黑',
    description: '深色主题，护眼舒适',
    preview: { bg: '#0f172a', accent: '#6366f1', text: '#f1f5f9' },
  },
  {
    id: 'teal',
    name: '青碧绿',
    description: '深色底+青绿强调色',
    preview: { bg: '#0f2027', accent: '#14b8a6', text: '#e2e8f0' },
  },
]

export const DEFAULT_THEME: ThemeId = 'light'
export const THEME_STORAGE_KEY = 'otw-theme'
