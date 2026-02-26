'use client'

import { useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function DemoPage() {
  const [showFeatures, setShowFeatures] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const startTour = () => {
    // 移动端先关闭侧边栏
    setSidebarOpen(false)

    const driverObj = driver({
      showProgress: true,
      steps: [
        { 
          element: '#demo-header', 
          popover: { 
            title: 'Welcome to the Demo!', 
            description: 'This is how OnTheWay tours work. Click Next to continue.',
            side: 'bottom'
          } 
        },
        { 
          element: '#demo-stats', 
          popover: { 
            title: 'Key Metrics', 
            description: 'Track your projects, tasks and completion rates at a glance.',
            side: 'bottom'
          } 
        },
        { 
          element: '#demo-main', 
          popover: { 
            title: 'Main Content', 
            description: 'This is where your main content lives.',
            side: 'top'
          } 
        },
        { 
          element: '#demo-action', 
          popover: { 
            title: 'Take Action!', 
            description: 'Click this button to perform the main action. Tour complete!',
            side: 'bottom'
          } 
        },
      ],
      onDestroyStarted: () => {
        driverObj.destroy()
      }
    })
    driverObj.drive()
  }

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
          <h1 className="text-lg sm:text-xl font-bold">🛤️ Demo App</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={startTour}
            className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Start Tour
          </button>
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
                This demo shows how OnTheWay product tours work. Click the &quot;Start Tour&quot; button 
                above to see a guided walkthrough of this page.
              </p>
              <p className="text-blue-700 text-xs sm:text-sm">
                In production, you would record steps in your actual app using the OnTheWay recorder,
                then deploy them with a single script tag.
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
    </div>
  )
}
