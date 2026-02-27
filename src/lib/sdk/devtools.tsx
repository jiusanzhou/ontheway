'use client'

/**
 * OnTheWay DevTools
 * 
 * Development-only floating panel for recording onboarding steps.
 * Auto-disabled in production. Steps are saved directly to OnTheWay backend.
 * 
 * Usage:
 *   import { OnTheWayDevTools } from '@ontheway/sdk/devtools'
 *   
 *   // In your app root (only runs in development):
 *   if (process.env.NODE_ENV === 'development') {
 *     OnTheWayDevTools.init({ projectId: 'xxx', apiKey: 'otw_xxx' })
 *   }
 * 
 * React:
 *   <OnTheWayDevToolsPanel projectId="xxx" apiKey="otw_xxx" />
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ---- Types ----

interface DevToolsConfig {
  projectId: string
  apiKey: string
  serverUrl?: string
}

interface RecordedStep {
  id: string
  selector: string
  tagName: string
  innerText: string
  title: string
  description: string
  position: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  spotlight: boolean
  url: string
}

interface Task {
  id: string
  name: string
  slug: string
  steps: unknown[]
  enabled: boolean
}

// ---- Selector Generator (same logic as recorder-snippet.js) ----

function genSelector(el: Element): string {
  const ds = (el as HTMLElement).dataset
  if (ds?.onthewayId) return `[data-ontheway-id="${ds.onthewayId}"]`

  if (el.id && !/^[\d:]/.test(el.id)) {
    try {
      if (document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id)
    } catch {}
  }

  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur !== document.body && cur !== document.documentElement && parts.length < 4) {
    let p = cur.tagName.toLowerCase()
    if (cur.id && !/^[\d:]/.test(cur.id)) { parts.unshift('#' + CSS.escape(cur.id)); break }
    const cls = Array.from(cur.classList || [])
      .filter(c => !/^(w-|h-|p-|m-|text-|bg-|flex|grid|border|rounded|hover:|focus:|sm:|md:|lg:|xl:)/.test(c))
      .slice(0, 2)
    if (cls.length) p += '.' + cls.map(c => CSS.escape(c)).join('.')
    const parent = cur.parentElement
    if (parent) {
      const sibs = Array.from(parent.children).filter(s => s.tagName === cur!.tagName)
      if (sibs.length > 1) p += `:nth-child(${sibs.indexOf(cur) + 1})`
    }
    parts.unshift(p)
    cur = cur.parentElement
  }

  const sel = parts.join(' > ')
  try { if (document.querySelector(sel) === el) return sel } catch {}

  // Fallback: full path
  parts.length = 0
  cur = el
  while (cur && cur !== document.body) {
    const parentEl: Element | null = cur.parentElement
    if (!parentEl) break
    parts.unshift(cur.tagName.toLowerCase() + ':nth-child(' + (Array.from(parentEl.children).indexOf(cur) + 1) + ')')
    cur = parentEl
  }
  return 'body > ' + parts.join(' > ')
}

// ---- React DevTools Panel ----

interface DevToolsPanelProps {
  projectId: string
  apiKey: string
  serverUrl?: string
}

export function OnTheWayDevToolsPanel({ projectId, apiKey, serverUrl }: DevToolsPanelProps) {
  const [minimized, setMinimized] = useState(true)
  const [tab, setTab] = useState<'record' | 'tasks'>('record')

  // Recording state
  const [recording, setRecording] = useState(false)
  const [steps, setSteps] = useState<RecordedStep[]>([])
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [taskName, setTaskName] = useState('')
  const [taskSlug, setTaskSlug] = useState('')
  const [trigger, setTrigger] = useState<'manual' | 'auto' | 'first-visit'>('manual')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // AI generation
  const [aiIntent, setAiIntent] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  // Tasks list
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  const highlightRef = useRef<HTMLDivElement | null>(null)
  const hoveredRef = useRef<Element | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const baseUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : '')

  // ---- Fetch tasks ----
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true)
    try {
      const res = await fetch(`${baseUrl}/api/sdk/${projectId}/config`)
      const data = await res.json()
      setTasks((data.tasks || []).map((t: { id: string; slug: string; trigger: string; steps: unknown[] }) => ({
        id: t.id,
        name: t.slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        slug: t.slug,
        steps: t.steps,
        enabled: true,
      })))
    } catch {
      setTasks([])
    }
    setLoadingTasks(false)
  }, [baseUrl, projectId])

  useEffect(() => {
    if (tab === 'tasks' && !minimized) fetchTasks()
  }, [tab, minimized, fetchTasks])

  // ---- Recording logic ----
  const isOurElement = useCallback((el: Element) => {
    return panelRef.current?.contains(el) || highlightRef.current?.contains(el) ||
      el.id === 'otw-devtools-highlight'
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === hoveredRef.current || isOurElement(el)) return
    hoveredRef.current = el
    if (!highlightRef.current) {
      const div = document.createElement('div')
      div.id = 'otw-devtools-highlight'
      div.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483645;border:2px solid #3b82f6;background:rgba(59,130,246,0.15);border-radius:3px;transition:all .08s ease'
      document.documentElement.appendChild(div)
      highlightRef.current = div
    }
    const r = el.getBoundingClientRect()
    const h = highlightRef.current
    h.style.display = 'block'
    h.style.top = r.top + 'px'
    h.style.left = r.left + 'px'
    h.style.width = r.width + 'px'
    h.style.height = r.height + 'px'
  }, [isOurElement])

  const onMouseLeave = useCallback(() => {
    if (highlightRef.current) highlightRef.current.style.display = 'none'
    hoveredRef.current = null
  }, [])

  const onClick = useCallback((e: MouseEvent) => {
    const el = e.target as Element
    if (isOurElement(el)) return
    e.preventDefault()
    e.stopPropagation()

    const r = el.getBoundingClientRect()
    const text = (el as HTMLElement).innerText?.trim().substring(0, 60) || ''
    const step: RecordedStep = {
      id: 'step_' + Date.now(),
      selector: genSelector(el),
      tagName: el.tagName.toLowerCase(),
      innerText: text,
      title: `Step ${steps.length + 1}`,
      description: 'Click here to continue',
      position: 'auto',
      spotlight: true,
      url: location.href,
    }
    setSteps(prev => [...prev, step])
    setEditingStep(step.id)

    // Flash feedback
    const orig = (el as HTMLElement).style.outline;
    (el as HTMLElement).style.outline = '3px solid #22c55e'
    setTimeout(() => { (el as HTMLElement).style.outline = orig }, 400)
  }, [isOurElement, steps.length])

  const startRecording = useCallback(() => {
    setRecording(true)
    document.addEventListener('mousemove', onMouseMove, true)
    document.addEventListener('mouseleave', onMouseLeave, true)
    document.addEventListener('click', onClick, true)
  }, [onMouseMove, onMouseLeave, onClick])

  const stopRecording = useCallback(() => {
    setRecording(false)
    document.removeEventListener('mousemove', onMouseMove, true)
    document.removeEventListener('mouseleave', onMouseLeave, true)
    document.removeEventListener('click', onClick, true)
    if (highlightRef.current) {
      highlightRef.current.remove()
      highlightRef.current = null
    }
    hoveredRef.current = null
  }, [onMouseMove, onMouseLeave, onClick])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onMouseMove, true)
      document.removeEventListener('mouseleave', onMouseLeave, true)
      document.removeEventListener('click', onClick, true)
      highlightRef.current?.remove()
    }
  }, [onMouseMove, onMouseLeave, onClick])

  // Auto slug from name
  useEffect(() => {
    if (taskName) {
      setTaskSlug(taskName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [taskName])

  // ---- Step operations ----
  const updateStep = (id: string, updates: Partial<RecordedStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id))
    if (editingStep === id) setEditingStep(null)
  }

  const moveStep = (id: string, dir: 'up' | 'down') => {
    setSteps(prev => {
      const i = prev.findIndex(s => s.id === id)
      if (i === -1) return prev
      if (dir === 'up' && i === 0) return prev
      if (dir === 'down' && i === prev.length - 1) return prev
      const next = [...prev]
      const j = dir === 'up' ? i - 1 : i + 1
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  // ---- DOM extraction for AI ----
  const extractDOM = useCallback(() => {
    const walk = (el: Element, depth: number): string => {
      if (depth > 6) return ''
      const tag = el.tagName.toLowerCase()
      // Skip our devtools, scripts, styles, hidden elements
      if (['script', 'style', 'noscript', 'svg', 'path'].includes(tag)) return ''
      if (el.id?.startsWith('otw-')) return ''
      if ((el as HTMLElement).offsetParent === null && tag !== 'body' && tag !== 'html') return ''

      const attrs: string[] = []
      if (el.id) attrs.push(`id="${el.id}"`)
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.split(/\s+/).filter(c =>
          !/^(w-|h-|p-|m-|text-|bg-|flex|grid|border|rounded|shadow|transition|transform|hover:|focus:|sm:|md:|lg:|xl:|2xl:)/.test(c)
        ).slice(0, 3).join(' ')
        if (cls) attrs.push(`class="${cls}"`)
      }
      if ((el as HTMLInputElement).type) attrs.push(`type="${(el as HTMLInputElement).type}"`)
      if ((el as HTMLInputElement).name) attrs.push(`name="${(el as HTMLInputElement).name}"`)
      if ((el as HTMLInputElement).placeholder) attrs.push(`placeholder="${(el as HTMLInputElement).placeholder}"`)
      if ((el as HTMLAnchorElement).href && tag === 'a') attrs.push(`href="..."`)
      const ds = (el as HTMLElement).dataset
      if (ds?.onthewayId) attrs.push(`data-ontheway-id="${ds.onthewayId}"`)

      const indent = '  '.repeat(depth)
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : ''

      // Leaf text
      const text = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent?.trim())
        .filter(Boolean)
        .join(' ')
        .substring(0, 60)

      const children = Array.from(el.children)
        .map(c => walk(c, depth + 1))
        .filter(Boolean)
        .join('\n')

      if (!children && !text && !['input', 'button', 'img', 'video', 'iframe'].includes(tag)) {
        return ''
      }

      if (!children) {
        return `${indent}<${tag}${attrStr}>${text ? ' ' + text + ' ' : ''}</${tag}>`
      }
      return `${indent}<${tag}${attrStr}>${text ? ' ' + text : ''}\n${children}\n${indent}</${tag}>`
    }

    return walk(document.body, 0)
  }, [])

  // ---- AI Generate ----
  const aiGenerate = useCallback(async () => {
    if (!aiIntent.trim()) {
      setSaveMsg('❌ Describe what the tour should do')
      return
    }
    setAiGenerating(true)
    setSaveMsg('')

    try {
      const dom = extractDOM()
      const res = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: aiIntent,
          dom,
          url: location.href,
          taskName: taskName || undefined,
        }),
      })

      const data = await res.json()

      if (data.steps && data.steps.length > 0) {
        const newSteps: RecordedStep[] = data.steps.map((s: Record<string, unknown>, i: number) => ({
          id: 'ai_' + Date.now() + '_' + i,
          selector: (s.selector as string) || '',
          tagName: '',
          innerText: '',
          title: (s.title as string) || `Step ${i + 1}`,
          description: (s.content as string) || (s.description as string) || '',
          position: (s.position as RecordedStep['position']) || 'auto',
          spotlight: s.spotlight !== false,
          url: location.href,
        }))

        setSteps(prev => [...prev, ...newSteps])
        if (!taskName && data.taskName) {
          setTaskName(data.taskName)
        }
        setEditingStep(newSteps[0].id)
        setSaveMsg(`✨ ${newSteps.length} steps generated (${data.source})`)
      } else {
        setSaveMsg('❌ No steps generated')
      }
    } catch {
      setSaveMsg('❌ AI generation failed')
    }
    setAiGenerating(false)
  }, [aiIntent, baseUrl, extractDOM, taskName])

  // ---- Save task ----
  const saveTask = async () => {
    if (!taskName || !taskSlug || steps.length === 0) {
      setSaveMsg('❌ Fill name + at least 1 step')
      return
    }
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          slug: taskSlug,
          trigger,
          steps: steps.map(s => ({
            selector: s.selector,
            title: s.title,
            content: s.description,
            position: s.position,
            spotlight: s.spotlight,
          })),
        }),
      })
      if (res.ok) {
        setSaveMsg('✅ Saved!')
        setSteps([])
        setTaskName('')
        setTaskSlug('')
        setEditingStep(null)
        stopRecording()
      } else {
        const err = await res.json()
        setSaveMsg('❌ ' + (err.error || 'Failed'))
      }
    } catch (e) {
      setSaveMsg('❌ Network error')
    }
    setSaving(false)
  }

  const currentStep = steps.find(s => s.id === editingStep)

  // ---- Styles (inline, no Tailwind dependency) ----
  const S = {
    panel: {
      position: 'fixed' as const,
      bottom: 16,
      right: 16,
      zIndex: 2147483646,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 13,
      color: '#1f2937',
    },
    card: {
      width: 360,
      maxHeight: '80vh',
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: '#111',
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
    },
    tabs: {
      display: 'flex',
      borderBottom: '1px solid #e5e7eb',
    },
    tab: (active: boolean) => ({
      flex: 1,
      padding: '8px 0',
      border: 'none',
      background: active ? '#fff' : '#f9fafb',
      borderBottom: active ? '2px solid #111' : '2px solid transparent',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      color: active ? '#111' : '#6b7280',
    }),
    body: {
      flex: 1,
      overflow: 'auto' as const,
      maxHeight: 'calc(80vh - 100px)',
    },
    section: {
      padding: '10px 14px',
      borderBottom: '1px solid #f3f4f6',
    },
    input: {
      width: '100%',
      padding: '6px 8px',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 12,
      marginTop: 4,
      boxSizing: 'border-box' as const,
    },
    select: {
      padding: '6px 8px',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 12,
      marginTop: 4,
    },
    btn: (color: string, disabled = false) => ({
      padding: '6px 14px',
      border: 'none',
      borderRadius: 6,
      background: disabled ? '#d1d5db' : color,
      color: '#fff',
      fontSize: 12,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),
    btnOutline: {
      padding: '6px 14px',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      background: '#fff',
      fontSize: 12,
      cursor: 'pointer',
    },
    stepItem: (active: boolean) => ({
      padding: '8px 10px',
      margin: '4px 0',
      borderRadius: 6,
      border: active ? '1px solid #3b82f6' : '1px solid #e5e7eb',
      background: active ? '#eff6ff' : '#fff',
      cursor: 'pointer',
    }),
    fab: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      border: 'none',
      background: '#111',
      color: '#fff',
      fontSize: 22,
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 11,
      fontWeight: 600,
      color: '#6b7280',
      marginBottom: 2,
      display: 'block',
    },
    recDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#ef4444',
      animation: 'otw-blink 1s ease-in-out infinite',
      display: 'inline-block',
      marginRight: 6,
    },
  }

  // ---- Inject blink animation ----
  useEffect(() => {
    if (document.getElementById('otw-devtools-style')) return
    const style = document.createElement('style')
    style.id = 'otw-devtools-style'
    style.textContent = '@keyframes otw-blink{0%,100%{opacity:1}50%{opacity:0.3}}'
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])

  if (minimized) {
    return (
      <div ref={panelRef} style={S.panel}>
        <button
          onClick={() => setMinimized(false)}
          style={{
            ...S.fab,
            ...(recording ? { background: '#22c55e', boxShadow: '0 0 20px rgba(34,197,94,0.5)' } : {}),
          }}
          title="OnTheWay DevTools"
        >
          {recording ? (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={S.recDot} />
            </span>
          ) : '🛤️'}
        </button>
      </div>
    )
  }

  return (
    <div ref={panelRef} style={S.panel}>
      <div style={S.card}>
        {/* Header */}
        <div style={S.header}>
          <span>🛤️ OnTheWay DevTools</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {recording && <span style={{ display: 'flex', alignItems: 'center', fontSize: 11 }}><span style={S.recDot} /> REC</span>}
            <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>−</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(tab === 'record')} onClick={() => setTab('record')}>
            ⏺ Record
          </button>
          <button style={S.tab(tab === 'tasks')} onClick={() => setTab('tasks')}>
            📋 Tasks ({tasks.length})
          </button>
        </div>

        {/* Body */}
        <div style={S.body}>
          {tab === 'record' ? (
            <>
              {/* Task config */}
              <div style={S.section}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={S.label}>Task Name</label>
                    <input style={S.input} value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Welcome Tour" />
                  </div>
                  <div>
                    <label style={S.label}>Trigger</label>
                    <select style={{ ...S.select, width: '100%' }} value={trigger} onChange={e => setTrigger(e.target.value as typeof trigger)}>
                      <option value="manual">Manual</option>
                      <option value="auto">Auto</option>
                      <option value="first-visit">First Visit</option>
                    </select>
                  </div>
                </div>
                {taskSlug && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>slug: {taskSlug}</div>}
              </div>

              {/* Recording controls */}
              <div style={{ ...S.section, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!recording ? (
                  <button style={S.btn('#22c55e')} onClick={startRecording}>
                    ⏺ Record
                  </button>
                ) : (
                  <button style={S.btn('#ef4444')} onClick={stopRecording}>
                    ⏹ Stop
                  </button>
                )}
                <button style={S.btn('#111', saving || steps.length === 0 || !taskName)} onClick={saveTask} disabled={saving || steps.length === 0 || !taskName}>
                  {saving ? '...' : '💾 Save'}
                </button>
              </div>

              {/* AI Generate */}
              <div style={S.section}>
                <label style={S.label}>✨ AI Generate</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    style={{ ...S.input, flex: 1, marginTop: 0 }}
                    value={aiIntent}
                    onChange={e => setAiIntent(e.target.value)}
                    placeholder="e.g. Guide new users to create their first project"
                    onKeyDown={e => { if (e.key === 'Enter' && !aiGenerating) aiGenerate() }}
                  />
                  <button
                    style={S.btn('#7c3aed', aiGenerating || !aiIntent.trim())}
                    onClick={aiGenerate}
                    disabled={aiGenerating || !aiIntent.trim()}
                  >
                    {aiGenerating ? '...' : '✨'}
                  </button>
                </div>
                {saveMsg && <div style={{ fontSize: 11, marginTop: 4, color: saveMsg.startsWith('✅') || saveMsg.startsWith('✨') ? '#16a34a' : saveMsg.startsWith('❌') ? '#dc2626' : '#6b7280' }}>{saveMsg}</div>}
              </div>

              {/* Steps */}
              <div style={S.section}>
                <label style={{ ...S.label, marginBottom: 6 }}>Steps ({steps.length})</label>
                {steps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 12 }}>
                    {recording ? 'Click elements on the page to capture steps' : 'Click Record to start'}
                  </div>
                ) : (
                  steps.map((step, i) => (
                    <div
                      key={step.id}
                      style={S.stepItem(editingStep === step.id)}
                      onClick={() => setEditingStep(editingStep === step.id ? null : step.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, fontSize: 12 }}>
                          <span style={{ color: '#9ca3af', marginRight: 6 }}>{i + 1}</span>
                          {step.title}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={e => { e.stopPropagation(); moveStep(step.id, 'up') }} disabled={i === 0}
                            style={{ ...S.btnOutline, padding: '2px 6px', fontSize: 10 }}>↑</button>
                          <button onClick={e => { e.stopPropagation(); moveStep(step.id, 'down') }} disabled={i === steps.length - 1}
                            style={{ ...S.btnOutline, padding: '2px 6px', fontSize: 10 }}>↓</button>
                          <button onClick={e => { e.stopPropagation(); deleteStep(step.id) }}
                            style={{ ...S.btnOutline, padding: '2px 6px', fontSize: 10, color: '#ef4444' }}>✕</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {step.selector}
                      </div>

                      {/* Inline editor */}
                      {editingStep === step.id && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}
                          onClick={e => e.stopPropagation()}>
                          <div>
                            <label style={S.label}>Selector</label>
                            <input style={{ ...S.input, fontFamily: 'monospace' }} value={step.selector}
                              onChange={e => updateStep(step.id, { selector: e.target.value })} />
                          </div>
                          <div>
                            <label style={S.label}>Title</label>
                            <input style={S.input} value={step.title}
                              onChange={e => updateStep(step.id, { title: e.target.value })} />
                          </div>
                          <div>
                            <label style={S.label}>Description</label>
                            <input style={S.input} value={step.description}
                              onChange={e => updateStep(step.id, { description: e.target.value })} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <label style={S.label}>Position</label>
                              <select style={{ ...S.select, width: '100%' }} value={step.position}
                                onChange={e => updateStep(step.id, { position: e.target.value as RecordedStep['position'] })}>
                                <option value="auto">Auto</option>
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'end', paddingBottom: 2 }}>
                              <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input type="checkbox" checked={step.spotlight}
                                  onChange={e => updateStep(step.id, { spotlight: e.target.checked })} />
                                Spotlight
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Tasks tab */
            <div style={S.section}>
              {loadingTasks ? (
                <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af' }}>Loading...</div>
              ) : tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af' }}>No tasks yet</div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} style={{ ...S.stepItem(false), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{task.name}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{task.slug} · {task.steps.length} steps</div>
                    </div>
                    <button
                      style={S.btn('#111')}
                      onClick={() => {
                        // Preview using Driver.js
                        if ((window as any).ontheway) {
                          (window as any).ontheway.start(task.slug)
                        }
                      }}
                    >▶</button>
                  </div>
                ))
              )}
              <button style={{ ...S.btnOutline, width: '100%', marginTop: 8 }} onClick={fetchTasks}>
                ↻ Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Vanilla JS init (non-React) ----

export const OnTheWayDevTools = {
  init(config: DevToolsConfig) {
    if (typeof window === 'undefined') return
    if (typeof document === 'undefined') return

    // Lazy: inject a minimal DOM-based devtools without React
    // For React apps, use <OnTheWayDevToolsPanel /> instead
    console.log(
      '%c🛤️ OnTheWay DevTools %c Use <OnTheWayDevToolsPanel /> in React, or import the standalone recorder-snippet.js',
      'background:#22c55e;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold',
      'color:#666'
    )

    // Auto-inject recorder-snippet as fallback
    const script = document.createElement('script')
    script.src = (config.serverUrl || '') + '/recorder-snippet.js'
    script.dataset.session = 'devtools_' + Date.now().toString(36)
    script.dataset.server = config.serverUrl || window.location.origin
    document.head.appendChild(script)
  }
}

export default OnTheWayDevToolsPanel
