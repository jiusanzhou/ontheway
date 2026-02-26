'use client'

import { useState } from 'react'
import Link from 'next/link'
import Recorder from '@/components/Recorder'

interface RecordedStep {
  id: string
  selector: string
  tagName: string
  innerText?: string
  rect: DOMRect
  timestamp: number
}

interface Step {
  id: string
  selector: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  spotlight: boolean
}

export default function NewTaskPage() {
  const [taskName, setTaskName] = useState('')
  const [taskSlug, setTaskSlug] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [trigger, setTrigger] = useState<'manual' | 'auto' | 'first-visit'>('manual')
  const [steps, setSteps] = useState<Step[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)

  const handleStepRecorded = (recorded: RecordedStep) => {
    const newStep: Step = {
      id: recorded.id,
      selector: recorded.selector,
      title: `Step ${steps.length + 1}`,
      content: recorded.innerText || 'Click here to continue',
      position: 'auto',
      spotlight: true
    }
    setSteps(prev => [...prev, newStep])
    setSelectedStep(newStep.id)
  }

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s))
  }

  const deleteStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId))
    if (selectedStep === stepId) {
      setSelectedStep(steps[0]?.id || null)
    }
  }

  const startRecording = () => {
    if (!targetUrl) {
      alert('Please enter a target URL first')
      return
    }
    setShowRecorder(true)
    setIsRecording(true)
  }

  const stopRecording = () => {
    setIsRecording(false)
    setShowRecorder(false)
  }

  const saveTask = async () => {
    // TODO: Save to Supabase
    console.log('Saving task:', {
      name: taskName,
      slug: taskSlug,
      trigger,
      steps
    })
    alert('Task saved! (mock)')
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
          <div className="p-4 border-b">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full py-2 rounded-lg text-sm font-medium ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Click elements on your site to add steps
            </p>
          </div>

          {/* Steps list */}
          <div className="flex-1 overflow-auto">
            <div className="p-2">
              {steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No steps yet. Start recording to add steps.
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
                      <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm truncate">{step.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate pl-7">{step.selector}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main area - Recorder or Step editor */}
        <main className="flex-1 flex">
          {showRecorder ? (
            <div className="flex-1">
              <Recorder
                targetUrl={targetUrl}
                onStepRecorded={handleStepRecorded}
                onStop={stopRecording}
                isRecording={isRecording}
              />
            </div>
          ) : currentStep ? (
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-2xl">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-lg font-bold">Edit Step</h2>
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
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={currentStep.title}
                        onChange={e => updateStep(currentStep.id, { title: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={currentStep.content}
                        onChange={e => updateStep(currentStep.id, { content: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Position</label>
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

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="spotlight"
                        checked={currentStep.spotlight}
                        onChange={e => updateStep(currentStep.id, { spotlight: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="spotlight" className="text-sm">
                        Spotlight effect
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 bg-white rounded-lg border p-6">
                  <h3 className="font-medium mb-4">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <div className="inline-block bg-white rounded-lg shadow-lg p-4 max-w-xs">
                      <h4 className="font-bold mb-2">{currentStep.title}</h4>
                      <p className="text-sm text-gray-600">{currentStep.content}</p>
                            <div className="mt-4 flex justify-between">
                        <button className="text-sm text-gray-500">Skip</button>
                        <button className="text-sm bg-black text-white px-4 py-1 rounded">Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <p>Start recording to capture steps</p>
                <p className="text-sm mt-2">or add steps manually</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
