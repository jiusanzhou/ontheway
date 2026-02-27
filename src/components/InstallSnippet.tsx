'use client'

export function InstallSnippet({ projectId }: { projectId: string }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://YOUR_DOMAIN'
  return (
    <div className="mt-4">
      <span className="text-sm font-medium block mb-2">Installation</span>
      <pre className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
{`<script src="${origin}/sdk.js"
        data-project="${projectId}"></script>`}
      </pre>
    </div>
  )
}
