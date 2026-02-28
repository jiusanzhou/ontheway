'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Step {
  selector: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  spotlight: boolean
}

interface TaskData {
  id: string
  project_id: string
  name: string
  slug: string
  trigger: 'auto' | 'manual' | 'first-visit' | 'condition'
  enabled: boolean
  steps: Step[]
}

interface EditorStep extends Step {
  _id: string
}

export default function TaskEditor({ projectId, task }: { projectId: string; task: TaskData }) {
  const router = useRouter()
  const [taskName, setTaskName] = useState(task.name)
  const [taskSlug, setTaskSlug] = useState(task.slug)
  const [trigger, setTrigger] = useState(task.trigger)
  const [enabled, setEnabled] = useState(task.enabled)
  const [steps, setSteps] = useState<EditorStep[]>(
    (task.steps || []).map((s, i) => ({ ...s, _id: `s_${i}_${Date.now()}` }))
  )
  const [selectedStep, setSelectedStep] = useState<string | null>(steps[0]?._id || null)
  const [mobileView, setMobileView] = useState<'steps' | 'editor'>('steps')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [deleting, setDeleting] = useState(false)

  const currentStep = steps.find(s => s._id === selectedStep)

  const updateStep = (id: string, updates: Partial<Step>) => {
    setSteps(prev => prev.map(s => s._id === id ? { ...s, ...updates } : s))
  }

  const addStep = () => {
    const newStep: EditorStep = {
      _id: 'new_' + Date.now(),
      selector: '',
      title: `Step ${steps.length + 1}`,
      content: 'Description here',
      position: 'auto',
      spotlight: true,
    }
    setSteps(prev => [...prev, newStep])
    setSelectedStep(newStep._id)
    setMobileView('editor')
  }

  const deleteStep = (id: string) => {
    setSteps(prev => prev.filter(s => s._id !== id))
    if (selectedStep === id) {
      const remaining = steps.filter(s => s._id !== id)
      setSelectedStep(remaining[0]?._id || null)
      if (remaining.length === 0) setMobileView('steps')
    }
  }

  const moveStep = (id: string, dir: 'up' | 'down') => {
    setSteps(prev => {
      const i = prev.findIndex(s => s._id === id)
      if (i === -1) return prev
      if (dir === 'up' && i === 0) return prev
      if (dir === 'down' && i === prev.length - 1) return prev
      const next = [...prev]
      const j = dir === 'up' ? i - 1 : i + 1
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const saveTask = async () => {
    if (!taskName || !taskSlug) {
      setSaveMsg('Name and slug required')
      return
    }
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          slug: taskSlug,
          trigger,
          enabled,
          steps: steps.map(({ _id, ...s }) => s),
        }),
      })
      if (res.ok) {
        setSaveMsg('✅ Saved')
        setTimeout(() => setSaveMsg(''), 2000)
      } else {
        const err = await res.json()
        setSaveMsg('❌ ' + (err.error || 'Failed'))
      }
    } catch {
      setSaveMsg('❌ Network error')
    }
    setSaving(false)
  }

  const deleteTask = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push(`/dashboard/projects/${projectId}`)
      } else {
        setSaveMsg('❌ Failed to delete')
      }
    } catch {
      setSaveMsg('❌ Network error')
    }
    setDeleting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => mobileView === 'editor' ? setMobileView('steps') : undefined}
              className="sm:hidden text-gray-500 shrink-0"
            >
              {mobileView === 'editor' ? '←' : ''}
            </button>
            <Link href={`/dashboard/projects/${projectId}`} className="text-gray-500 hover:text-gray-700 hidden sm:inline shrink-0">
              ← Back
            </Link>
            <span className="font-medium text-sm sm:text-base truncate">{taskName}</span>
            <span className="text-xs text-gray-400 hidden sm:inline">({taskSlug})</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {saveMsg && <span className="text-xs hidden sm:inline">{saveMsg}</span>}
            <button
              onClick={saveTask}
              disabled={saving}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg text-xs sm:text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <aside className={`
          w-full sm:w-80 bg-white border-r flex flex-col shrink-0
          ${mobileView === 'steps' ? 'flex' : 'hidden sm:flex'}
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
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input type="text" value={taskSlug} onChange={e => setTaskSlug(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Trigger</label>
                <select value={trigger} onChange={e => setTrigger(e.target.value as typeof trigger)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="manual">Manual</option>
                  <option value="auto">Auto</option>
                  <option value="first-visit">First Visit</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded" />
                  Enabled
                </label>
              </div>
            </div>
            <button onClick={deleteTask} disabled={deleting}
              className="text-xs text-red-500 hover:text-red-600">
              {deleting ? 'Deleting...' : 'Delete Task'}
            </button>
          </div>

          {/* Steps list */}
          <div className="p-3 sm:p-4 border-b">
            <button onClick={addStep} className="w-full py-2 rounded-lg text-sm font-medium border hover:bg-gray-50">
              + Add Step
            </button>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-xs font-medium text-gray-500">Steps ({steps.length})</span>
            </div>
            {steps.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No steps yet</div>
            ) : (
              steps.map((step, index) => (
                <div
                  key={step._id}
                  onClick={() => { setSelectedStep(step._id); setMobileView('editor') }}
                  className={`p-3 rounded-lg cursor-pointer mb-1.5 ${
                    selectedStep === step._id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center shrink-0">{index + 1}</span>
                    <span className="font-medium text-sm truncate flex-1">{step.title}</span>
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); moveStep(step._id, 'up') }} disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 text-xs">↑</button>
                      <button onClick={e => { e.stopPropagation(); moveStep(step._id, 'down') }} disabled={index === steps.length - 1}
                        className="text-gray-400 hover:text-gray-600 text-xs">↓</button>
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
                      Edit Step {steps.findIndex(s => s._id === currentStep._id) + 1}
                    </h2>
                    <button onClick={() => deleteStep(currentStep._id)}
                      className="text-red-500 hover:text-red-600 text-sm">Delete</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">CSS Selector</label>
                      <input type="text" value={currentStep.selector}
                        onChange={e => updateStep(currentStep._id, { selector: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm font-mono" placeholder="#element-id" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input type="text" value={currentStep.title}
                        onChange={e => updateStep(currentStep._id, { title: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea value={currentStep.content}
                        onChange={e => updateStep(currentStep._id, { content: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 h-20 sm:h-24 resize-none text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <select value={currentStep.position}
                          onChange={e => updateStep(currentStep._id, { position: e.target.value as Step['position'] })}
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
                            onChange={e => updateStep(currentStep._id, { spotlight: e.target.checked })}
                            className="rounded" />
                          Spotlight
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 sm:mt-6 bg-white rounded-lg border p-4 sm:p-6">
                  <h3 className="font-medium mb-3 text-sm">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4 sm:p-8 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-4 max-w-xs w-full border text-left">
                      <h4 className="font-bold mb-2 text-sm">{currentStep.title || 'Step Title'}</h4>
                      <p className="text-xs text-gray-600 mb-3">{currentStep.content || 'Description...'}</p>
                      <div className="flex justify-between">
                        <button className="text-xs text-gray-500">Skip</button>
                        <button className="text-xs bg-black text-white px-3 py-1 rounded">Next</button>
                      </div>
                    </div>
                  </div>
                </div>

                {saveMsg && <div className="mt-4 text-center text-sm sm:hidden">{saveMsg}</div>}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              <div className="text-center">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">Select a Step</h3>
                <p className="text-sm mb-4">Choose a step to edit, or add a new one.</p>
                <button onClick={addStep} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">+ Add Step</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
