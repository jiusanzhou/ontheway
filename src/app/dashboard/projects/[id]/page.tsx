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
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold">🛤️ OnTheWay</Link>
            <span className="text-gray-400">/</span>
            <span className="font-medium">{mockProject.name}</span>
          </div>
          <button className="text-sm text-gray-500 hover:text-gray-700">Settings</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Project info */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">{mockProject.name}</h1>
          <p className="text-gray-500 mb-4">{mockProject.domain}</p>
          
          {/* API Key */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">API Key</span>
              <button 
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <code className="text-sm">
              {showApiKey ? mockProject.api_key : '••••••••••••••••'}
            </code>
          </div>

          {/* Installation snippet */}
          <div className="mt-4">
            <span className="text-sm font-medium block mb-2">Installation</span>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`<script src="https://ontheway.zoe.im/sdk.js" 
        data-project="${mockProject.id}"></script>`}
            </pre>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Tasks</h2>
          <Link 
            href={`/dashboard/projects/${mockProject.id}/tasks/new`}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            + New Task
          </Link>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Trigger</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Steps</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {mockTasks.map(task => (
                <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-500">{task.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                      {task.trigger}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{task.steps} steps</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm px-2 py-1 rounded ${
                      task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {task.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
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
      </main>
    </div>
  )
}
