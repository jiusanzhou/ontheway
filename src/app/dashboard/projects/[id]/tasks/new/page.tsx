'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Step {
  id: string
  selector: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  spotlight: boolean
  url?: string
}

const CHANNEL_NAME = 'otw-recorder'

export default function NewTaskPage() {
  const params = useParams()
  const projectId = params.id as string

  const [taskName, setTaskName] = useState('')
  const [taskSlug, setTaskSlug] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [trigger, setTrigger] = useState<'manual' | 'auto' | 'first-visit'>('manual')
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'config' | 'editor'>('config')

  // Recording state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [recordingMode, setRecordingMode] = useState<'idle' | 'snippet' | 'proxy'>('idle')
  const [recorderConnected, setRecorderConnected] = useState(false)
  const [recorderUrl, setRecorderUrl] = useState('')
  const [showSnippet, setShowSnippet] = useState(false)
  const [copied, setCopied] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  // Auto-generate slug from name
  useEffect(() => {
    if (taskName && !taskSlug) {
      setTaskSlug(taskName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [taskName, taskSlug])

  const generateSessionId = () => 'rec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

  // ---- BroadcastChannel listener ----
  useEffect(() => {
    if (!sessionId) return

    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (e) => {
      const msg = e.data
      if (msg.session !== sessionId) return

      if (msg.type === 'connected') {
        setRecorderConnected(true)
        setRecorderUrl(msg.url || '')
      } else if (msg.type === 'pong') {
        setRecorderConnected(true)
        setRecorderUrl(msg.url || '')
      } else if (msg.type === 'step') {
        const s = msg.step
        const newStep: Step = {
          id: s.id || Date.now().toString(),
          selector: s.selector,
          title: s.innerText?.slice(0, 40) || `Step`,
          content: 'Click here to continue',
          position: 'auto',
          spotlight: true,
          url: s.url,
        }
        setSteps(prev => {
          const updated = [...prev, { ...newStep, title: `Step ${prev.length + 1}` }]
          setSelectedStep(newStep.id)
          setMobileView('editor')
          return updated
        })
      } else if (msg.type === 'stop') {
        stopRecording()
      }
    }

    // Ping to check if recorder is already connected
    channel.postMessage({ type: 'ping', session: sessionId })

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [sessionId])

  // ---- Start Snippet Mode ----
  const startSnippetRecording = useCallback(() => {
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    setRecordingMode('snippet')
    setRecorderConnected(false)
    setShowSnippet(true)
  }, [])

  // ---- Start Proxy Mode ----
  const startProxyRecording = useCallback(() => {
    if (!targetUrl) {
      alert('Please enter a target URL first')
      return
    }
    try { new URL(targetUrl) } catch {
      alert('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    setRecordingMode('proxy')
    setRecorderConnected(false)

    const protocol = targetUrl.startsWith('https') ? 'https' : 'http'
    const urlWithoutProtocol = targetUrl.replace(/^https?:\/\//, '')
    const proxyUrl = `/record/${newSessionId}/${protocol}/${urlWithoutProtocol}`
    window.open(proxyUrl, '_blank', 'width=1200,height=800')
  }, [targetUrl])

  // ---- Stop Recording ----
  const stopRecording = useCallback(() => {
    if (channelRef.current && sessionId) {
      channelRef.current.postMessage({ type: 'stop', session: sessionId })
    }
    setRecordingMode('idle')
    setRecorderConnected(false)
    setShowSnippet(false)
    setSessionId(null)
  }, [sessionId])

  // ---- Snippet text ----
  const snippetCode = sessionId
    ? `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/recorder-snippet.js" data-session="${sessionId}"><\/script>`
    : ''

  const consoleSnippet = sessionId
    ? `(function(){var s=document.createElement('script');s.src='${typeof window !== 'undefined' ? window.location.origin : ''}/recorder-snippet.js';s.dataset.session='${sessionId}';document.head.appendChild(s)})()`
    : ''

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ---- Step operations ----
  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s))
  }

  const deleteStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId))
    if (selectedStep === stepId) {
      const remaining = steps.filter(s => s.id !== stepId)
      setSelectedStep(remaining[0]?.id || null)
      if (remaining.length === 0) setMobileView('config')
    }
  }

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setSteps(prev => {
      const index = prev.findIndex(s => s.id === stepId)
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === prev.length - 1) return prev
      const newSteps = [...prev]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      ;[newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]]
      return newSteps
    })
  }

  const addManualStep = () => {
    const newStep: Step = {
      id: Date.now().toString(),
      selector: '',
      title: `Step ${steps.length + 1}`,
      content: 'Description here',
      position: 'auto',
      spotlight: true,
    }
    setSteps(prev => [...prev, newStep])
    setSelectedStep(newStep.id)
    setMobileView('editor')
  }

  const saveTask = async () => {
    if (!taskName || !taskSlug || steps.length === 0) {
      alert('Please fill in task name, slug, and add at least one step')
      return
    }

    const taskData = {
      name: taskName,
      slug: taskSlug,
      trigger,
      steps: steps.map(s => ({
        selector: s.selector,
        title: s.title,
        content: s.content,
        position: s.position,
        spotlight: s.spotlight,
      })),
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      if (res.ok) {
        window.location.href = `/dashboard/projects/${projectId}`
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch {
      alert('Failed to save task')
    }
  }

  const currentStep = steps.find(s => s.id === selectedStep)
  const isRecording = recordingMode !== 'idle'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => mobileView === 'editor' ? setMobileView('config') : undefined}
              className="sm:hidden text-gray-500 shrink-0"
            >
              {mobileView === 'editor' ? '←' : ''}
            </button>
            <Link href={`/dashboard/projects/${projectId}`} className="text-gray-500 hover:text-gray-700 hidden sm:inline shrink-0">
              ← Back
            </Link>
            <span className="font-medium text-sm sm:text-base truncate">New Task</span>
            {isRecording && (
              <span className={`text-xs sm:text-sm flex items-center gap-1 shrink-0 ${recorderConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${recorderConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="hidden sm:inline">{recorderConnected ? 'Recording...' : 'Waiting...'}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {isRecording && (
              <button onClick={stopRecording} className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg text-xs sm:text-sm">
                ⏹ Stop
              </button>
            )}
            <button
              onClick={saveTask}
              disabled={!taskName || steps.length === 0}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg text-xs sm:text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <aside className={`
          w-full sm:w-80 bg-white border-r flex flex-col shrink-0
          ${mobileView === 'config' ? 'flex' : 'hidden sm:flex'}
        `}>
          {/* Task settings */}
          <div className="p-3 sm:p-4 border-b space-y-3">
            <div className="flex items-center gap-2 sm:hidden">
              <Link href={`/dashboard/projects/${projectId}`} className="text-gray-400 hover:text-gray-600 text-sm">←</Link>
              <span className="font-medium text-sm">Task Settings</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)}
                placeholder="Welcome Tour" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input type="text" value={taskSlug} onChange={e => setTaskSlug(e.target.value)}
                placeholder="welcome-tour" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Trigger</label>
                <select value={trigger} onChange={e => setTrigger(e.target.value as typeof trigger)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="manual">Manual</option>
                  <option value="auto">Auto</option>
                  <option value="first-visit">First Visit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Recording controls */}
          <div className="p-3 sm:p-4 border-b space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Record Steps</p>

            {/* Snippet mode button */}
            <button
              onClick={startSnippetRecording}
              disabled={isRecording}
              className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                isRecording ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              📋 Copy Snippet to Your Page
            </button>

            {/* Proxy mode button */}
            <button
              onClick={startProxyRecording}
              disabled={isRecording || !targetUrl}
              className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                isRecording || !targetUrl ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              🌐 Proxy Mode
            </button>

            {/* Manual add */}
            <button onClick={addManualStep}
              className="w-full py-2 rounded-lg text-sm font-medium border hover:bg-gray-50">
              + Add Step Manually
            </button>
          </div>

          {/* Snippet modal */}
          {showSnippet && (
            <div className="p-3 sm:p-4 border-b bg-green-50 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-green-800">📋 Install Recorder</p>
                <button onClick={() => setShowSnippet(false)} className="text-green-600 text-xs">✕</button>
              </div>

              <div>
                <p className="text-xs text-green-700 mb-1 font-medium">Option 1: Paste in Console</p>
                <div className="relative">
                  <pre className="bg-green-900 text-green-300 p-2.5 rounded text-xs overflow-x-auto max-h-20">{consoleSnippet}</pre>
                  <button onClick={() => copySnippet(consoleSnippet)}
                    className="absolute top-1 right-1 px-2 py-0.5 bg-green-700 text-white text-xs rounded hover:bg-green-600">
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-green-700 mb-1 font-medium">Option 2: Add to HTML</p>
                <div className="relative">
                  <pre className="bg-green-900 text-green-300 p-2.5 rounded text-xs overflow-x-auto max-h-20">{snippetCode}</pre>
                  <button onClick={() => copySnippet(snippetCode)}
                    className="absolute top-1 right-1 px-2 py-0.5 bg-green-700 text-white text-xs rounded hover:bg-green-600">
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {recorderConnected ? (
                  <span className="text-green-700 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Connected — recording from {recorderUrl}
                  </span>
                ) : (
                  <span className="text-yellow-700 flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    Waiting for connection...
                  </span>
                )}
              </div>

              <p className="text-xs text-green-600">
                The page will show a green glowing border when recording is active. Click elements to capture steps.
              </p>
            </div>
          )}

          {/* Steps list */}
          <div className="flex-1 overflow-auto p-2">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-xs font-medium text-gray-500">Steps ({steps.length})</span>
            </div>
            {steps.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No steps yet
              </div>
            ) : (
              steps.map((step, index) => (
                <div
                  key={step.id}
                  onClick={() => { setSelectedStep(step.id); setMobileView('editor') }}
                  className={`p-3 rounded-lg cursor-pointer mb-1.5 active:bg-blue-50 ${
                    selectedStep === step.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm truncate flex-1">{step.title}</span>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'up') }}
                        className="text-gray-400 hover:text-gray-600 text-xs" disabled={index === 0}>↑</button>
                      <button onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'down') }}
                        className="text-gray-400 hover:text-gray-600 text-xs" disabled={index === steps.length - 1}>↓</button>
                      <span className="sm:hidden ml-1 text-gray-300">›</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 truncate pl-7">{step.selector || 'No selector'}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right panel - Step editor */}
        <main className={`
          flex-1 min-w-0 overflow-auto
          ${mobileView === 'editor' ? 'block' : 'hidden sm:block'}
        `}>
          {currentStep ? (
            <div className="p-4 sm:p-6">
              <div className="max-w-2xl mx-auto sm:mx-0">
                <div className="bg-white rounded-lg border p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-bold">
                      Edit Step {steps.findIndex(s => s.id === currentStep.id) + 1}
                    </h2>
                    <button onClick={() => deleteStep(currentStep.id)}
                      className="text-red-500 hover:text-red-600 text-sm">Delete</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">CSS Selector</label>
                      <input type="text" value={currentStep.selector}
                        onChange={e => updateStep(currentStep.id, { selector: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm font-mono min-w-0"
                        placeholder="#element-id" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input type="text" value={currentStep.title}
                        onChange={e => updateStep(currentStep.id, { title: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea value={currentStep.content}
                        onChange={e => updateStep(currentStep.id, { content: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 h-20 sm:h-24 resize-none text-sm sm:text-base" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <select value={currentStep.position}
                          onChange={e => updateStep(currentStep.id, { position: e.target.value as Step['position'] })}
                          className="w-full border rounded-lg px-3 py-2 text-sm">
                          <option value="auto">Auto</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={currentStep.spotlight}
                            onChange={e => updateStep(currentStep.id, { spotlight: e.target.checked })}
                            className="rounded" />
                          Spotlight
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 sm:mt-6 bg-white rounded-lg border p-4 sm:p-6">
                  <h3 className="font-medium mb-3 text-sm sm:text-base">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4 sm:p-8 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-4 max-w-xs w-full border text-left">
                      <h4 className="font-bold mb-2 text-sm sm:text-base">{currentStep.title || 'Step Title'}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">{currentStep.content || 'Description...'}</p>
                      <div className="flex justify-between">
                        <button className="text-xs sm:text-sm text-gray-500">Skip</button>
                        <button className="text-xs sm:text-sm bg-black text-white px-3 py-1 rounded">Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl mb-4">🎯</div>
                <h3 className="text-lg sm:text-xl font-medium mb-2">Ready to Record</h3>
                <p className="text-sm mb-4 max-w-xs mx-auto">
                  Use the Snippet mode to record on your own site, or Proxy mode for external sites.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button onClick={startSnippetRecording} disabled={isRecording}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    📋 Snippet Mode
                  </button>
                  <button onClick={addManualStep}
                    className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    + Add Manually
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
