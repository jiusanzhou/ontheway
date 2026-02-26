'use client'

import { useState } from 'react'
import Link from 'next/link'

// Mock data
const mockProject = { id: '1', name: 'My App', domain: 'myapp.com', api_key: 'otw_abc123def456' }
const mockTasks = [
  { id: '1', name: 'Welcome Tour', slug: 'welcome', trigger: 'first-visit', steps: 5, enabled: true },
  { id: '2', name: 'Feature Guide', slug: 'feature-guide', trigger: 'manual', steps: 3, enabled: true },
  { id: '3', name: 'Settings Help', slug: 'settings', trigger: 'manual', steps: 4, enabled: false },
]

export default function ProjectPage() {
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard" className="text-lg sm:text-xl font-bold shrink-0">🛤️</Link>
            <span className="text-gray-300 hidden sm:inline">/</span>
            <span className="font-medium truncate text-sm sm:text-base">{mockProject.name}</span>
          </div>
          <button className="text-sm text-gray-500 hover:text-gray-700 shrink-0">Settings</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Project info */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{mockProject.name}</h1>
          <p className="text-gray-500 text-sm sm:text-base mb-4">{mockProject.domain}</p>
          
          {/* API Key */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">API Key</span>
              <button 
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <code className="text-xs sm:text-sm break-all">
              {showApiKey ? mockProject.api_key : '••••••••••••••••'}
            </code>
          </div>

          {/* Installation snippet */}
          <div className="mt-4">
            <span className="text-sm font-medium block mb-2">Installation</span>
            <pre className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
{`<script src="https://ontheway.zoe.im/sdk.js" 
        data-project="${mockProject.id}"></script>`}
            </pre>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold">Tasks</h2>
          <Link 
            href={`/dashboard/projects/${mockProject.id}/tasks/new`}
            className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
          >
            + New Task
          </Link>
        </div>

        {/* Mobile: card view */}
        <div className="sm:hidden space-y-3">
          {mockTasks.map(task => (
            <Link
              key={task.id}
              href={`/dashboard/projects/${mockProject.id}/tasks/${task.id}`}
              className="block bg-white rounded-lg border p-4 active:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{task.name}</div>
                  <div className="text-xs text-gray-500">{task.slug}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded shrink-0 ml-2 ${
                  task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {task.enabled ? 'Active' : 'Off'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded">{task.trigger}</span>
                <span>{task.steps} steps</span>
                <span className="ml-auto text-blue-600">Edit →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop: table view */}
        <div className="hidden sm:block bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Trigger</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Steps</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 sm:px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {mockTasks.map(task => (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-gray-500">{task.slug}</div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                        {task.trigger}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">{task.steps} steps</td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`text-sm px-2 py-1 rounded ${
                        task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {task.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/projects/${mockProject.id}/tasks/${task.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
