'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Step {
  id: string
  selector: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  spotlight: boolean
}

interface Task {
  id: string
  name: string
  slug: string
  trigger: string
  enabled: boolean
  steps: Step[]
}

// Mock data
const mockTask: Task = {
  id: '1',
  name: 'Welcome Tour',
  slug: 'welcome',
  trigger: 'first-visit' as const,
  enabled: true,
  steps: [
    { id: '1', selector: '#header-logo', title: 'Welcome!', content: 'This is your dashboard. Let me show you around.', position: 'bottom' as const, spotlight: true },
    { id: '2', selector: '.sidebar-nav', title: 'Navigation', content: 'Use this menu to navigate between sections.', position: 'right' as const, spotlight: true },
    { id: '3', selector: '#create-button', title: 'Create New', content: 'Click here to create your first item.', position: 'bottom' as const, spotlight: true },
  ]
}

export default function TaskEditorPage() {
  const [task, setTask] = useState(mockTask)
  const [selectedStep, setSelectedStep] = useState<string | null>(task.steps[0]?.id || null)
  const [isRecording, setIsRecording] = useState(false)
  const [mobileView, setMobileView] = useState<'steps' | 'editor'>('steps')

  const currentStep = task.steps.find(s => s.id === selectedStep)

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setTask(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, ...updates } : s) as typeof prev.steps
    }))
  }

  const addStep = () => {
    const newStep: Step = {
      id: Date.now().toString(),
      selector: '',
      title: 'New Step',
      content: 'Description here',
      position: 'auto',
      spotlight: true
    }
    setTask(prev => ({ ...prev, steps: [...prev.steps, newStep] }))
    setSelectedStep(newStep.id)
    setMobileView('editor')
  }

  const deleteStep = (stepId: string) => {
    setTask(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    }))
    if (selectedStep === stepId) {
      const remaining = task.steps.filter(s => s.id !== stepId)
      setSelectedStep(remaining[0]?.id || null)
      if (remaining.length === 0) setMobileView('steps')
    }
  }

  const selectStep = (stepId: string) => {
    setSelectedStep(stepId)
    setMobileView('editor')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile: back to steps list when in editor */}
            <button 
              onClick={() => mobileView === 'editor' ? setMobileView('steps') : undefined}
              className="sm:hidden text-gray-500 hover:text-gray-700 shrink-0"
            >
              {mobileView === 'editor' ? '← Steps' : ''}
            </button>
            <Link href="/dashboard/projects/1" className="text-gray-500 hover:text-gray-700 hidden sm:inline shrink-0">
              ← Back
            </Link>
            <span className="font-medium text-sm sm:text-base truncate">{task.name}</span>
            <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">({task.slug})</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {isRecording ? '⏹ Stop' : '⏺ Rec'}
            </button>
            <button className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg text-xs sm:text-sm hover:bg-gray-800">
              Save
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Steps sidebar — desktop always visible, mobile toggle */}
        <aside className={`
          w-full sm:w-64 bg-white border-r flex flex-col shrink-0
          ${mobileView === 'steps' ? 'flex' : 'hidden sm:flex'}
        `}>
          <div className="p-3 sm:p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/projects/1" className="text-gray-400 hover:text-gray-600 sm:hidden text-sm">
                ←
              </Link>
              <span className="font-medium text-sm sm:text-base">Steps ({task.steps.length})</span>
            </div>
            <button 
              onClick={addStep}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {task.steps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => selectStep(step.id)}
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
                  <span className="font-medium text-sm truncate">{step.title}</span>
                  {/* Mobile: arrow indicator */}
                  <span className="sm:hidden ml-auto text-gray-300">›</span>
                </div>
                <div className="text-xs text-gray-500 truncate pl-7">{step.selector || 'No selector'}</div>
              </div>
            ))}

            {task.steps.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                <p className="mb-2">No steps yet</p>
                <button onClick={addStep} className="text-blue-600 hover:text-blue-700">
                  + Add first step
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Step editor — desktop always visible, mobile toggle */}
        <main className={`
          flex-1 p-4 sm:p-6 overflow-auto min-w-0
          ${mobileView === 'editor' ? 'flex flex-col' : 'hidden sm:block'}
        `}>
          {currentStep ? (
            <div className="max-w-2xl mx-auto sm:mx-0">
              <div className="bg-white rounded-lg border p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold">Edit Step</h2>
                  <button 
                    onClick={() => deleteStep(currentStep.id)}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-1">CSS Selector</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentStep.selector}
                        onChange={e => updateStep(currentStep.id, { selector: e.target.value })}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono min-w-0"
                        placeholder="#element-id"
                      />
                      <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 shrink-0">
                        🎯
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The element to highlight.
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={currentStep.title}
                      onChange={e => updateStep(currentStep.id, { title: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={currentStep.content}
                      onChange={e => updateStep(currentStep.id, { content: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 h-20 sm:h-24 resize-none text-sm sm:text-base"
                    />
                  </div>

                  {/* Position & Spotlight row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Position</label>
                      <select
                        value={currentStep.position}
                        onChange={e => updateStep(currentStep.id, { position: e.target.value as Step['position'] })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="auto">Auto</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentStep.spotlight}
                          onChange={e => updateStep(currentStep.id, { spotlight: e.target.checked })}
                          className="rounded"
                        />
                        Spotlight
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 sm:mt-6 bg-white rounded-lg border p-4 sm:p-6">
                <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Preview</h3>
                <div className="bg-gray-100 rounded-lg p-4 sm:p-8 text-center">
                  <div className="inline-block bg-white rounded-lg shadow-lg p-4 max-w-xs w-full text-left">
                    <h4 className="font-bold mb-2 text-sm sm:text-base">{currentStep.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{currentStep.content}</p>
                    <div className="mt-3 sm:mt-4 flex justify-between">
                      <button className="text-xs sm:text-sm text-gray-500">Skip</button>
                      <button className="text-xs sm:text-sm bg-black text-white px-3 sm:px-4 py-1 rounded">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <div className="text-center">
                <p className="mb-2">Select a step to edit</p>
                <button onClick={addStep} className="text-blue-600 hover:text-blue-700 text-sm">
                  or add a new one
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
