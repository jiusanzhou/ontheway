'use client'

import { useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function DemoPage() {
  const [showFeatures, setShowFeatures] = useState(false)

  const startTour = () => {
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
          element: '#demo-sidebar', 
          popover: { 
            title: 'Navigation Panel', 
            description: 'Here you can access different sections of your app.',
            side: 'right'
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
            side: 'left'
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
      <header id="demo-header" className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🛤️ Demo App</h1>
        <div className="flex gap-4">
          <button 
            onClick={startTour}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Start Tour
          </button>
          <button className="text-gray-600">Profile</button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside id="demo-sidebar" className="w-64 bg-white border-r min-h-[calc(100vh-73px)] p-4">
          <nav className="space-y-2">
            <a href="#" className="block px-4 py-2 rounded-lg bg-gray-100">Dashboard</a>
            <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-50">Projects</a>
            <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-50">Team</a>
            <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-50">Reports</a>
            <a href="#" className="block px-4 py-2 rounded-lg hover:bg-gray-50">Settings</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main id="demo-main" className="flex-1 p-8">
          <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <button 
                id="demo-action"
                onClick={() => setShowFeatures(!showFeatures)}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                + New Project
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg border p-6">
                <div className="text-3xl font-bold">12</div>
                <div className="text-gray-500">Projects</div>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <div className="text-3xl font-bold">48</div>
                <div className="text-gray-500">Tasks</div>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <div className="text-3xl font-bold">89%</div>
                <div className="text-gray-500">Completion</div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-2">How it works</h3>
              <p className="text-blue-800 mb-4">
                This demo shows how OnTheWay product tours work. Click the &quot;Start Tour&quot; button 
                above to see a guided walkthrough of this page.
              </p>
              <p className="text-blue-700 text-sm">
                In production, you would record steps in your actual app using the OnTheWay recorder,
                then deploy them with a single script tag.
              </p>
            </div>

            {showFeatures && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-green-900 mb-2">🎉 New Project Created!</h3>
                <p className="text-green-800">
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
