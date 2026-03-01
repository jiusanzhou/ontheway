/**
 * OnTheWay SDK — IIFE entry point for <script> tag usage.
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/ontheway-sdk/dist/cdn.global.js"
 *           data-project="YOUR_PROJECT_ID"></script>
 *
 * Options via data attributes:
 *   data-project   (required) Project ID
 *   data-api-url   (optional) API endpoint override
 *
 * Exposes `window.ontheway` (OnTheWay instance).
 */

import { OnTheWay } from './index'

// Auto-initialize from script tag
function autoInit() {
  if (typeof document === 'undefined') return

  // Find the current script tag
  const scripts = document.querySelectorAll('script[data-project]')
  const script = scripts[scripts.length - 1] as HTMLScriptElement | null
  if (!script) return

  const projectId = script.getAttribute('data-project')
  if (!projectId) {
    console.warn('[OnTheWay] Missing data-project attribute on script tag')
    return
  }

  const apiUrl = script.getAttribute('data-api-url') || undefined

  const instance = new OnTheWay({
    projectId,
    apiUrl,
  })

  // Expose globally
  ;(window as any).ontheway = instance
}

// Export class for manual usage
;(window as any).OnTheWay = OnTheWay

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit)
} else {
  autoInit()
}

export { OnTheWay }
