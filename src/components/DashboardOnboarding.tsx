'use client'

import { useEffect, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const ONBOARDING_KEY = 'otw_dashboard_onboarded'

export function DashboardOnboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // 只对新用户展示
    if (localStorage.getItem(ONBOARDING_KEY)) return
    // 等页面渲染完
    const timer = setTimeout(() => setShow(true), 500)
    return () => clearTimeout(timer)
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
 * 重置 onboarding 状态（用于测试）
 */
export function ReplayOnboardingButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem(ONBOARDING_KEY)
        window.location.reload()
      }}
      className="text-xs text-gray-400 hover:text-gray-600"
    >
      Replay tour
    </button>
  )
}
