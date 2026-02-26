'use client'

import { useEffect, useState, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const ONBOARDING_KEY = 'otw_dashboard_onboarded'

// 全局事件，用于外部触发 replay
const REPLAY_EVENT = 'otw:replay-onboarding'

export function DashboardOnboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // 新用户自动触发
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      const timer = setTimeout(() => setShow(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // 监听 replay 事件
  useEffect(() => {
    const handler = () => setShow(true)
    window.addEventListener(REPLAY_EVENT, handler)
    return () => window.removeEventListener(REPLAY_EVENT, handler)
  }, [])

  useEffect(() => {
    if (!show) return

    const d = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.6,
      smoothScroll: true,
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Get Started!',
      steps: [
        {
          element: '#otw-logo',
          popover: {
            title: '👋 Welcome to OnTheWay!',
            description: 'This is your onboarding command center. Let me show you how to create your first product tour.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#otw-new-project',
          popover: {
            title: '1️⃣ Create a Project',
            description: 'Start by creating a project for your website. Each project gets a unique SDK key.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#otw-projects-grid',
          popover: {
            title: '2️⃣ Your Projects',
            description: 'All your projects appear here. Click any project to manage its onboarding tasks.',
            side: 'top',
          },
        },
        {
          element: '#otw-add-project',
          popover: {
            title: '3️⃣ Record a Tour',
            description: 'Inside a project, create a Task → enter your site URL → our proxy recorder opens your site and captures clicks as tour steps.',
            side: 'top',
          },
        },
        {
          element: '#otw-user-menu',
          popover: {
            title: '4️⃣ Install & Go',
            description: 'Copy the one-line SDK snippet from your project page, paste it into your site, and your users will see the tours. That\'s it!',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          popover: {
            title: '🚀 You\'re Ready!',
            description: 'Create your first project and start building beautiful onboarding tours. This dialog you just saw? It was built with OnTheWay — meta, right?',
          },
        },
      ],
      onDestroyStarted: () => {
        localStorage.setItem(ONBOARDING_KEY, '1')
        d.destroy()
      },
    })

    d.drive()
  }, [show])

  return null
}

/**
 * 重置并重播 onboarding
 */
export function ReplayOnboardingButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem(ONBOARDING_KEY)
        window.dispatchEvent(new Event(REPLAY_EVENT))
      }}
      className="text-xs text-gray-400 hover:text-gray-600"
    >
      Replay tour
    </button>
  )
}

/**
 * 浮动帮助菜单
 */
export function HelpFloatingMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const startTour = () => {
    setOpen(false)
    localStorage.removeItem(ONBOARDING_KEY)
    window.dispatchEvent(new Event(REPLAY_EVENT))
  }

  return (
    <div
      ref={menuRef}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
    >
      {open && (
        <div className="absolute bottom-14 right-0 w-56 bg-white rounded-xl shadow-xl border overflow-hidden mb-2">
          <div className="px-4 py-3 border-b font-medium text-sm">Help & Guides</div>
          <div className="py-1">
            <button
              onClick={startTour}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span>🛤️</span>
              <div>
                <div className="font-medium">Product Tour</div>
                <div className="text-xs text-gray-400">Learn how OnTheWay works</div>
              </div>
            </button>
            <a
              href="/docs"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span>📖</span>
              <div>
                <div className="font-medium">Documentation</div>
                <div className="text-xs text-gray-400">SDK reference & guides</div>
              </div>
            </a>
            <a
              href="/demo"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span>🎯</span>
              <div>
                <div className="font-medium">Live Demo</div>
                <div className="text-xs text-gray-400">See a tour in action</div>
              </div>
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-lg"
        aria-label="Help"
      >
        ?
      </button>
    </div>
  )
}
