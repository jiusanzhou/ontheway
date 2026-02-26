'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Step {
  id: string
  selector: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  spotlight: boolean
}

interface RecordedStep {
  selector: string
  tagName: string
  innerText?: string
  timestamp: number
}

export default function NewTaskPage() {
  const searchParams = useSearchParams()
  const sessionFromUrl = searchParams.get('session')
  
  const [taskName, setTaskName] = useState('')
  const [taskSlug, setTaskSlug] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [trigger, setTrigger] = useState<'manual' | 'auto' | 'first-visit'>('manual')
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  
  // 录制状态
  const [sessionId, setSessionId] = useState<string | null>(sessionFromUrl)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'waiting' | 'connected' | 'stopped'>('idle')

  // 从 SSE 接收录制的步骤
  useEffect(() => {
    if (!sessionId || recordingStatus === 'stopped') return

    const eventSource = new EventSource(`/api/recorder/ws?session=${sessionId}`)
    
    eventSource.onopen = () => {
      console.log('[SSE] Connected')
    }
    
    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        
        if (msg.type === 'init') {
          setRecordingStatus('connected')
          setTargetUrl(msg.data.url)
        } else if (msg.type === 'step') {
          const recorded: RecordedStep = msg.data
          const newStep: Step = {
            id: Date.now().toString(),
            selector: recorded.selector,
            title: `Step ${steps.length + 1}`,
            content: recorded.innerText?.slice(0, 50) || 'Click here to continue',
            position: 'auto',
            spotlight: true
          }
          setSteps(prev => {
            const updated = [...prev, newStep]
            setSelectedStep(newStep.id)
            return updated
          })
        } else if (msg.type === 'sync') {
          // 同步已有步骤
          const existingSteps = msg.steps.map((s: RecordedStep, i: number) => ({
            id: s.timestamp.toString(),
            selector: s.selector,
            title: `Step ${i + 1}`,
            content: s.innerText?.slice(0, 50) || 'Click here',
            position: 'auto' as const,
            spotlight: true
          }))
          setSteps(existingSteps)
          if (existingSteps.length > 0) {
            setSelectedStep(existingSteps[0].id)
          }
        } else if (msg.type === 'stop') {
          setRecordingStatus('stopped')
          setIsRecording(false)
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err)
      }
    }
    
    eventSource.onerror = () => {
      console.log('[SSE] Connection error')
    }
    
    return () => {
      eventSource.close()
    }
  }, [sessionId, recordingStatus, steps.length])

  // 生成唯一 session ID
  const generateSessionId = () => {
    return 'rec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  }

  // 开始代理模式录制
  const startProxyRecording = useCallback(() => {
    if (!targetUrl) {
      alert('Please enter a target URL first')
      return
    }
    
    // 验证 URL
    try {
      new URL(targetUrl)
    } catch {
      alert('Please enter a valid URL (e.g., https://example.com)')
      return
    }
    
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    setIsRecording(true)
    setRecordingStatus('waiting')
    
    // 打开代理录制页面
    const proxyUrl = `/record/${newSessionId}/${targetUrl}`
    window.open(proxyUrl, '_blank', 'width=1200,height=800')
  }, [targetUrl])

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s))
  }

  const deleteStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId))
    if (selectedStep === stepId) {
      const remaining = steps.filter(s => s.id !== stepId)
      setSelectedStep(remaining[0]?.id || null)
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
      spotlight: true
    }
    setSteps(prev => [...prev, newStep])
    setSelectedStep(newStep.id)
  }

  const saveTask = async () => {
    if (!taskName || !taskSlug || steps.length === 0) {
      alert('Please fill in task name, slug, and add at least one step')
      return
    }
    
    // TODO: Save to Supabase via API
    const taskData = {
      name: taskName,
      slug: taskSlug,
      trigger,
      steps: steps.map(s => ({
        selector: s.selector,
        title: s.title,
        content: s.content,
        position: s.position,
        spotlight: s.spotlight
      }))
    }
    
    console.log('Saving task:', taskData)
    
    try {
      const res = await fetch('/api/projects/1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (res.ok) {
        alert('Task saved!')
        window.location.href = '/dashboard/projects/1'
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save task')
    }
  }

  const currentStep = steps.find(s => s.id === selectedStep)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/projects/1" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <span className="font-medium">New Task</span>
            {recordingStatus === 'waiting' && (
              <span className="text-sm text-yellow-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Waiting for recorder...
              </span>
            )}
            {recordingStatus === 'connected' && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Recording...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={saveTask}
              disabled={!taskName || steps.length === 0}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Task
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Task settings & Steps */}
        <aside className="w-80 bg-white border-r flex flex-col">
          {/* Task settings */}
          <div className="p-4 border-b space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Task Name</label>
              <input
                type="text"
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder="Welcome Tour"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={taskSlug}
                onChange={e => setTaskSlug(e.target.value)}
                placeholder="welcome-tour"
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger</label>
              <select
                value={trigger}
                onChange={e => setTrigger(e.target.value as typeof trigger)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="manual">Manual (API call)</option>
                <option value="auto">Auto (every page load)</option>
                <option value="first-visit">First Visit Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://your-app.com"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Recording controls */}
          <div className="p-4 border-b space-y-2">
            <button
              onClick={startProxyRecording}
              disabled={isRecording || !targetUrl}
              className={`w-full py-2 rounded-lg text-sm font-medium ${
                isRecording
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRecording ? '⏺ Recording in progress...' : '⏺ Start Recording (Proxy Mode)'}
            </button>
            <button
              onClick={addManualStep}
              className="w-full py-2 rounded-lg text-sm font-medium border hover:bg-gray-50"
            >
              + Add Step Manually
            </button>
            <p className="text-xs text-gray-500">
              Proxy mode opens your site in a new window with recording enabled
            </p>
          </div>

          {/* Steps list */}
          <div className="flex-1 overflow-auto">
            <div className="p-2">
              {steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No steps yet. Start recording or add manually.
                </div>
              ) : (
                steps.map((step, index) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(step.id)}
                    className={`p-3 rounded-lg cursor-pointer mb-2 ${
                      selectedStep === step.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm truncate flex-1">{step.title}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'up') }}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          disabled={index === 0}
                        >↑</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'down') }}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          disabled={index === steps.length - 1}
                        >↓</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 truncate pl-7">{step.selector || 'No selector'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main area - Step editor */}
        <main className="flex-1 flex">
          {currentStep ? (
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-2xl">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-lg font-bold">Edit Step {steps.findIndex(s => s.id === currentStep.id) + 1}</h2>
                    <button
                      onClick={() => deleteStep(currentStep.id)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">CSS Selector</label>
                      <input
                        type="text"
                        value={currentStep.selector}
                        onChange={e => updateStep(currentStep.id, { selector: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                        placeholder="#element-id or .class-name"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The CSS selector for the element to highlight
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={currentStep.title}
                        onChange={e => updateStep(currentStep.id, { title: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Step title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={currentStep.content}
                        onChange={e => updateStep(currentStep.id, { content: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                        placeholder="Explain what this step is about..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Popover Position</label>
                        <select
                          value={currentStep.position}
                          onChange={e => updateStep(currentStep.id, { position: e.target.value as Step['position'] })}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="auto">Auto</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentStep.spotlight}
                            onChange={e => updateStep(currentStep.id, { spotlight: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">Spotlight effect</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 bg-white rounded-lg border p-6">
                  <h3 className="font-medium mb-4">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                    <div className="bg-white rounded-lg shadow-xl p-4 max-w-xs border">
                      <h4 className="font-bold mb-2">{currentStep.title || 'Step Title'}</h4>
                      <p className="text-sm text-gray-600 mb-4">{currentStep.content || 'Step description...'}</p>
                      <div className="flex justify-between items-center">
                        <button className="text-sm text-gray-500 hover:text-gray-700">Skip</button>
                        <div className="flex gap-2">
                          <button className="text-sm text-gray-500 hover:text-gray-700">Back</button>
                          <button className="text-sm bg-black text-white px-4 py-1.5 rounded hover:bg-gray-800">
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-medium mb-2">No steps yet</h3>
                <p className="text-sm mb-4">Start recording or add steps manually</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={startProxyRecording}
                    disabled={!targetUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    ⏺ Start Recording
                  </button>
                  <button
                    onClick={addManualStep}
                    className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
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
