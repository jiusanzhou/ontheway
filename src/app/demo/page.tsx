'use client'

import { useState } from 'react'
import { OnTheWayProvider } from '@/lib/sdk/react'
import { HelpMenu } from '@/lib/sdk/components'
import dynamic from 'next/dynamic'

const OnTheWayDevToolsPanel = dynamic(() => import('@/lib/sdk/devtools'), { ssr: false })

// Local task definitions for demo (no server needed)
const DEMO_TASKS = [
  {
    id: 'demo-welcome',
    slug: 'welcome-tour',
    trigger: 'manual' as const,
    steps: [
      {
        element: '#demo-header',
        popover: {
          title: 'Welcome to the Demo!',
          description: 'This is how OnTheWay tours work. Click Next to continue.',
          side: 'bottom' as const,
        },
      },
      {
        element: '#demo-stats',
        popover: {
          title: 'Key Metrics',
          description: 'Track your projects, tasks and completion rates at a glance.',
          side: 'bottom' as const,
        },
      },
      {
        element: '#demo-main',
        popover: {
          title: 'Main Content',
          description: 'This is where your main content lives.',
          side: 'top' as const,
        },
      },
      {
        element: '#demo-action',
        popover: {
          title: 'Take Action!',
          description: 'Click this button to perform the main action. Tour complete!',
          side: 'bottom' as const,
        },
      },
    ],
  },
  {
    id: 'demo-sidebar',
    slug: 'sidebar-tour',
    trigger: 'manual' as const,
    steps: [
      {
        element: '#demo-sidebar',
        popover: {
          title: 'Navigation Sidebar',
          description: 'Use the sidebar to navigate between different sections of the app.',
          side: 'right' as const,
        },
      },
    ],
  },
]

function DemoContent() {
  const [showFeatures, setShowFeatures] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Header */}
      <header id="demo-header" className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <img src="/logo.svg" alt="OnTheWay" className="w-7 h-7" />
            Demo App
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="text-gray-600 hidden sm:block">Profile</button>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          id="demo-sidebar" 
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-white border-r p-4 pt-20 lg:pt-4
            transform transition-transform duration-200 ease-in-out
            lg:transform-none lg:min-h-[calc(100vh-57px)]
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="space-y-1">
            <a href="#" className="block px-4 py-2.5 rounded-lg bg-gray-100 font-medium text-sm">Dashboard</a>
            <a href="#" className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600">Projects</a>
            <a href="#" className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600">Team</a>
            <a href="#" className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600">Reports</a>
            <a href="#" className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600">Settings</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main id="demo-main" className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold">Dashboard</h2>
              <button 
                id="demo-action"
                onClick={() => setShowFeatures(!showFeatures)}
                className="bg-black text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-800 text-sm sm:text-base w-full sm:w-auto"
              >
                + New Project
              </button>
            </div>

            {/* Stats */}
            <div id="demo-stats" className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white rounded-lg border p-3 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold">12</div>
                <div className="text-gray-500 text-xs sm:text-base">Projects</div>
              </div>
              <div className="bg-white rounded-lg border p-3 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold">48</div>
                <div className="text-gray-500 text-xs sm:text-base">Tasks</div>
              </div>
              <div className="bg-white rounded-lg border p-3 sm:p-6">
                <div className="text-xl sm:text-3xl font-bold">89%</div>
                <div className="text-gray-500 text-xs sm:text-base">Completion</div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">How it works</h3>
              <p className="text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">
                This demo shows how OnTheWay product tours work. Click the <strong>&quot;?&quot; button</strong> in 
                the bottom-right corner to see available tours and start a guided walkthrough.
              </p>
              <p className="text-blue-700 text-xs sm:text-sm">
                This page uses the OnTheWay SDK in <strong>local mode</strong> — tours are defined in code 
                with no server needed. You can also try the <strong>DevTools panel</strong> below to 
                record new steps visually.
              </p>
            </div>

            {showFeatures && (
              <div className="mt-6 sm:mt-8 bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                <h3 className="font-bold text-green-900 mb-2">🎉 New Project Created!</h3>
                <p className="text-green-800 text-sm sm:text-base">
                  This is just a demo, but in a real app this would create a new project.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* HelpMenu from SDK — shows available tours */}
      <HelpMenu />

      {/* DevTools — visible on demo page so users can try recording */}
      <OnTheWayDevToolsPanel
        projectId="demo-project"
        apiKey="demo"
      />
    </div>
  )
}

export default function DemoPage() {
  return (
    <OnTheWayProvider
      projectId="demo-project"
      tasks={DEMO_TASKS}
      onComplete={(taskId) => console.log('Tour completed:', taskId)}
      onSkip={(taskId, stepIndex) => console.log('Tour skipped at step:', stepIndex)}
    >
      <DemoContent />
    </OnTheWayProvider>
  )
}
