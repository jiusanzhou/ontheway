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

// Mock data
const mockTask = {
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

  const currentStep = task.steps.find(s => s.id === selectedStep)

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setTask(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
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
  }

  const deleteStep = (stepId: string) => {
    setTask(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    }))
    if (selectedStep === stepId) {
      setSelectedStep(task.steps[0]?.id || null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/projects/1" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <span className="font-medium">{task.name}</span>
            <span className="text-sm text-gray-400">({task.slug})</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`px-4 py-2 rounded-lg text-sm ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {isRecording ? '⏹ Stop Recording' : '⏺ Record'}
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Preview
            </button>
            <button className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
              Save
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Steps sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <span className="font-medium">Steps</span>
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
                <div className="text-xs text-gray-500 truncate pl-7">{step.selector || 'No selector'}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Step editor */}
        <main className="flex-1 p-6 overflow-auto">
          {currentStep ? (
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
                  {/* Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-1">CSS Selector</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentStep.selector}
                        onChange={e => updateStep(currentStep.id, { selector: e.target.value })}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
                        placeholder="#element-id or .class-name"
                      />
                      <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                        🎯 Pick
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The element to highlight. Use the Pick button to select from your site.
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={currentStep.title}
                      onChange={e => updateStep(currentStep.id, { title: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={currentStep.content}
                      onChange={e => updateStep(currentStep.id, { content: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                    />
                  </div>

                  {/* Position */}
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

                  {/* Spotlight */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="spotlight"
                      checked={currentStep.spotlight}
                      onChange={e => updateStep(currentStep.id, { spotlight: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="spotlight" className="text-sm">
                      Spotlight effect (dim background)
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview section */}
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
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Add a step to get started
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
