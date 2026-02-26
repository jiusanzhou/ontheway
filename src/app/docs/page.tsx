import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">🛤️ OnTheWay</Link>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/demo" className="hover:underline">Demo</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Documentation</h1>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <ol className="list-decimal list-inside space-y-4">
              <li>
                <strong>Create a project</strong> in the Dashboard
              </li>
              <li>
                <strong>Record your tour</strong> by clicking through your app
              </li>
              <li>
                <strong>Add the SDK</strong> to your website:
                <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`<script src="https://ontheway.zoe.im/sdk.js" 
        data-project="YOUR_PROJECT_ID"></script>`}
                </pre>
              </li>
            </ol>
          </div>
        </section>

        {/* SDK Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">SDK Reference</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Installation</h3>
              <p className="text-gray-600 mb-2">Script tag (recommended):</p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`<script src="https://ontheway.zoe.im/sdk.js" 
        data-project="YOUR_PROJECT_ID"></script>`}
              </pre>
              
              <p className="text-gray-600 mt-4 mb-2">Or via NPM:</p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`npm install @ontheway/sdk

import { OnTheWay } from '@ontheway/sdk'
const otw = new OnTheWay({ projectId: 'YOUR_PROJECT_ID' })`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Methods</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Method</th>
                      <th className="text-left px-4 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-mono text-sm">ontheway.start(slug)</td>
                      <td className="px-4 py-3 text-gray-600">Start a tour by slug or ID</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-mono text-sm">ontheway.reset(slug)</td>
                      <td className="px-4 py-3 text-gray-600">Reset a tour (allow it to show again)</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-mono text-sm">ontheway.resetAll()</td>
                      <td className="px-4 py-3 text-gray-600">Reset all tours</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-mono text-sm">ontheway.getTasks()</td>
                      <td className="px-4 py-3 text-gray-600">Get list of available tours</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-mono text-sm">ontheway.isReady()</td>
                      <td className="px-4 py-3 text-gray-600">Check if SDK is loaded</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Trigger Types</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>manual</strong> - Only starts when you call <code>ontheway.start()</code></li>
                <li><strong>auto</strong> - Starts automatically on every page load</li>
                <li><strong>first-visit</strong> - Starts only on the user&apos;s first visit</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Events</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`const otw = new OnTheWay({
  projectId: 'YOUR_PROJECT_ID',
  onComplete: (taskId) => {
    console.log('Tour completed:', taskId)
  },
  onSkip: (taskId, stepIndex) => {
    console.log('Tour skipped at step:', stepIndex)
  }
})`}
              </pre>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <ul className="list-disc list-inside space-y-3 text-gray-600">
            <li>Keep tours short (3-5 steps max)</li>
            <li>Use clear, actionable language</li>
            <li>Highlight interactive elements</li>
            <li>Add <code>data-ontheway-id</code> attributes for stable selectors</li>
            <li>Test tours after UI changes</li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Element not found</h3>
              <p className="text-yellow-700 text-sm">
                If the tour skips a step, the CSS selector may be invalid. 
                Use the task editor to update the selector, or add a stable 
                <code className="bg-yellow-100 px-1 rounded">data-ontheway-id</code> attribute.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Tour not starting</h3>
              <p className="text-yellow-700 text-sm">
                Check if the tour trigger is set correctly. For &quot;first-visit&quot; tours, 
                clear localStorage or use <code className="bg-yellow-100 px-1 rounded">ontheway.reset()</code>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
          <p>Built by <a href="https://zoe.im" className="underline">Zoe</a></p>
        </div>
      </footer>
    </div>
  )
}
