'use client'

import { useState } from 'react'

export function InstallSnippet({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://YOUR_DOMAIN'
  const code = `<script src="${origin}/sdk.js"\n        data-project="${projectId}"></script>`

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Installation</span>
        <button onClick={copy} className="text-xs text-blue-600 hover:text-blue-700">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
{code}
      </pre>
    </div>
  )
}
