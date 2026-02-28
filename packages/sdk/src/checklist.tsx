'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useOnTheWay } from './react'
import type { SDKTranslations } from './index'

// ---- Types ----

/**
 * A single task entry in the checklist.
 */
export interface ChecklistTask {
  /** Slug of the OnTheWay task — must match a server-side task slug */
  slug: string
  /** Human-readable title displayed in the list */
  title: string
  /** Optional description shown below the title */
  description?: string
  /** Whether this task must be completed before the checklist hides (default `true`) */
  required?: boolean
}

/**
 * Props for the `<OnTheWayChecklist>` component.
 */
export interface OnTheWayChecklistProps {
  /** Ordered list of tasks to display */
  tasks: ChecklistTask[]
  /** Panel title. Falls back to SDK translation `checklistTitle` if not set. */
  title?: string
  /** Panel position (default "bottom-right") */
  position?: 'bottom-right' | 'bottom-left'
  /** Fired when all required tasks are completed */
  onAllComplete?: () => void
  /**
   * Auto-hide the panel a few seconds after all required tasks are completed.
   * Default `true`. Set to `false` to keep it visible.
   */
  autoHide?: boolean
  /**
   * Delay in ms before auto-hiding after completion (default 4000).
   */
  autoHideDelay?: number
}

// ---- Storage helpers ----

const STORAGE_KEY_PREFIX = 'otw_checklist_'

function getCompletedSlugs(projectId: string): Set<string> {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + projectId)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    // ignore
  }
  return new Set()
}

function saveCompletedSlugs(projectId: string, slugs: Set<string>) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify([...slugs]))
}

// ---- Component ----

/**
 * Floating checklist panel that shows onboarding progress.
 *
 * Each task maps to an OnTheWay tour by slug. Clicking a task starts the
 * corresponding tour; completion is tracked and persisted to `localStorage`.
 *
 * @example
 * ```tsx
 * <OnTheWayChecklist
 *   tasks={[
 *     { slug: 'add-company', title: '接入公司' },
 *     { slug: 'add-courier', title: '添加快递员' },
 *     { slug: 'first-sync',  title: '首次同步', required: false },
 *   ]}
 *   onAllComplete={() => console.log('🎉 All done!')}
 * />
 * ```
 */
export function OnTheWayChecklist({
  tasks,
  title: titleProp,
  position = 'bottom-right',
  onAllComplete,
  autoHide = true,
  autoHideDelay = 4000,
}: OnTheWayChecklistProps) {
  const { otw, ready, start, isTaskCompleted } = useOnTheWay()
  const [expanded, setExpanded] = useState(true)
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set())
  const [hidden, setHidden] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const allCompleteFired = useRef(false)

  // Access projectId and translations from the SDK instance
  const projectId = otw?.getProjectId() ?? 'default'
  const sdkT = otw?.getTranslations()
  const title = titleProp ?? sdkT?.checklistTitle ?? 'Getting Started'
  const completedText = sdkT?.checklistCompleted ?? 'All done!'

  // Load persisted state
  useEffect(() => {
    const stored = getCompletedSlugs(projectId)
    if (stored.size > 0) setCompletedSlugs(stored)
  }, [projectId])

  // Poll for newly completed tasks (the SDK marks them on tour finish)
  useEffect(() => {
    if (!ready || !otw) return
    const interval = setInterval(() => {
      let changed = false
      const next = new Set(completedSlugs)
      for (const task of tasks) {
        if (!next.has(task.slug) && isTaskCompleted(task.slug)) {
          next.add(task.slug)
          changed = true
        }
      }
      if (changed) {
        setCompletedSlugs(next)
        saveCompletedSlugs(projectId, next)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [ready, otw, tasks, completedSlugs, isTaskCompleted, projectId])

  // Check all-complete
  const requiredTasks = tasks.filter(t => t.required !== false)
  const allDone = requiredTasks.length > 0 && requiredTasks.every(t => completedSlugs.has(t.slug))
  const completedCount = tasks.filter(t => completedSlugs.has(t.slug)).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  useEffect(() => {
    if (allDone && !allCompleteFired.current) {
      allCompleteFired.current = true
      setCelebrating(true)
      onAllComplete?.()
      if (autoHide) {
        const timer = setTimeout(() => setHidden(true), autoHideDelay)
        return () => clearTimeout(timer)
      }
    }
  }, [allDone, onAllComplete, autoHide, autoHideDelay])

  const handleTaskClick = useCallback(
    (slug: string) => {
      if (completedSlugs.has(slug)) return
      start(slug)
    },
    [completedSlugs, start],
  )

  if (hidden) return null

  // ---- Styles ----
  const isRight = position === 'bottom-right'

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    ...(isRight ? { right: 24 } : { left: 24 }),
    zIndex: 2147483640,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
    width: expanded ? 320 : 'auto',
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    userSelect: 'none',
    background: celebrating ? '#f0fdf4' : '#fff',
    borderBottom: expanded ? '1px solid #f3f4f6' : 'none',
  }

  const progressBarBg: React.CSSProperties = {
    height: 4,
    background: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  }

  const progressBarFill: React.CSSProperties = {
    height: '100%',
    width: `${progress}%`,
    background: allDone ? '#22c55e' : '#3b82f6',
    borderRadius: 2,
    transition: 'width 0.4s ease',
  }

  const taskItemStyle = (done: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 16px',
    cursor: done ? 'default' : 'pointer',
    borderBottom: '1px solid #f9fafb',
    opacity: done ? 0.6 : 1,
    transition: 'background 0.15s',
  })

  const checkboxStyle = (done: boolean): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: 4,
    border: done ? '2px solid #22c55e' : '2px solid #d1d5db',
    background: done ? '#22c55e' : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    transition: 'all 0.2s',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
  })

  // Collapsed badge
  if (!expanded) {
    return (
      <div style={containerStyle}>
        <button
          onClick={() => setExpanded(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: celebrating ? '#22c55e' : '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          {celebrating ? '🎉' : '📋'} {title}
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
            }}
          >
            {completedCount}/{tasks.length}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle} onClick={() => setExpanded(false)}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {celebrating ? '🎉' : '📋'} {title}
            </div>
            <div style={progressBarBg}>
              <div style={progressBarFill} />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {completedCount} of {tasks.length} complete
            </div>
          </div>
          <span
            style={{
              color: '#9ca3af',
              fontSize: 18,
              marginLeft: 8,
              transition: 'transform 0.2s',
              transform: 'rotate(0deg)',
            }}
          >
            ▾
          </span>
        </div>

        {/* Celebration banner */}
        {celebrating && (
          <div
            style={{
              padding: '12px 16px',
              background: '#f0fdf4',
              borderBottom: '1px solid #dcfce7',
              textAlign: 'center',
              fontSize: 13,
              color: '#15803d',
              fontWeight: 500,
            }}
          >
            🎉 {completedText}
          </div>
        )}

        {/* Task list */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {tasks.map(task => {
            const done = completedSlugs.has(task.slug)
            return (
              <div
                key={task.slug}
                style={taskItemStyle(done)}
                onClick={() => handleTaskClick(task.slug)}
                onMouseEnter={e => {
                  if (!done) (e.currentTarget as HTMLElement).style.background = '#f9fafb'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = ''
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleTaskClick(task.slug)
                  }
                }}
              >
                <div style={checkboxStyle(done)}>
                  {done ? '✓' : ''}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 13,
                      color: done ? '#9ca3af' : '#374151',
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                    {task.required === false && (
                      <span
                        style={{
                          fontSize: 10,
                          color: '#9ca3af',
                          marginLeft: 6,
                          fontWeight: 400,
                        }}
                      >
                        optional
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {task.description}
                    </div>
                  )}
                </div>
                {!done && (
                  <span style={{ color: '#d1d5db', fontSize: 16, marginTop: 1 }}>›</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OnTheWayChecklist
