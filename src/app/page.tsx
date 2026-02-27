import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold">🛤️ OnTheWay</h1>
          <nav className="flex items-center gap-3 sm:gap-6 text-sm">
            <Link href="/demo" className="text-gray-600 hover:text-black transition-colors">Demo</Link>
            <Link href="/docs" className="text-gray-600 hover:text-black transition-colors">Docs</Link>
            <Link href="/dashboard" className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">Dashboard</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-16 sm:pt-24 pb-12 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Now with AI-powered step generation
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold mb-5 sm:mb-6 leading-[1.1] tracking-tight">
            User Onboarding<br />
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Without the Hassle</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            Record interactive product tours by clicking through your app. Deploy with one line of code. Powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="bg-black text-white px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-all text-base font-medium shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15">
              Start Building — Free
            </Link>
            <Link href="/demo" className="border border-gray-300 px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all text-base text-gray-700">
              See Live Demo →
            </Link>
          </div>

          {/* Code snippet preview */}
          <div className="mt-12 sm:mt-16 max-w-lg mx-auto">
            <div className="bg-gray-950 rounded-xl p-4 text-left shadow-2xl">
              <div className="flex gap-1.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <code className="text-sm sm:text-[13px] leading-relaxed">
                <span className="text-gray-500">{'<!-- One line to activate -->'}</span>{'\n'}
                <span className="text-pink-400">{'<script'}</span>{' '}
                <span className="text-sky-300">src</span><span className="text-gray-500">=</span><span className="text-green-300">{'"https://ontheway.zoe.im/sdk.js"'}</span>{'\n'}
                {'  '}<span className="text-sky-300">data-project</span><span className="text-gray-500">=</span><span className="text-green-300">{'"YOUR_PROJECT_ID"'}</span>
                <span className="text-pink-400">{'>'}</span>
                <span className="text-pink-400">{'</script>'}</span>
              </code>
            </div>
            <p className="text-xs text-gray-400 mt-3">~5KB gzipped · Zero dependencies · Works everywhere</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-4xl font-bold mb-3">Three ways to create tours</h3>
            <p className="text-gray-500 text-base sm:text-lg">Choose the method that fits your workflow</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-4">✨</div>
              <h4 className="font-bold text-lg mb-2">AI Generate</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Describe what the tour should do in plain language. AI analyzes your page and generates steps automatically.
              </p>
              <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600">
                &quot;Guide users to create their first project&quot;
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">⏺</div>
              <h4 className="font-bold text-lg mb-2">Visual Recorder</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Click through your app to capture steps. Elements are highlighted and selectors are auto-generated.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">DevTools</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Snippet</span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Proxy</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4">📝</div>
              <h4 className="font-bold text-lg mb-2">Code & Config</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Full control via React SDK, vanilla JS API, or JSON config. Build complex flows programmatically.
              </p>
              <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600">
                otw.start(&apos;welcome-tour&apos;)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-4xl font-bold mb-3">Everything you need</h3>
            <p className="text-gray-500 text-base sm:text-lg">Built for developers who ship fast</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Tiny SDK', desc: '~5KB gzipped. Loads Driver.js from CDN on demand. Zero impact on your bundle.' },
              { icon: '🎯', title: 'Smart Selectors', desc: 'Auto-generates stable CSS selectors. Supports data attributes, IDs, and class fallbacks.' },
              { icon: '🔄', title: 'Trigger Modes', desc: 'Auto-start, first-visit only, or manual trigger. URL pattern matching for targeted tours.' },
              { icon: '📊', title: 'Completion Tracking', desc: 'Know how many users complete each tour. Track drop-off points and optimize.' },
              { icon: '⚛️', title: 'React SDK', desc: 'Provider, hooks, HelpMenu and HelpTrigger components. First-class React support.' },
              { icon: '🌐', title: 'Works Everywhere', desc: 'Vanilla JS, React, Vue, Angular. Any framework, any site. Just a script tag.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-4 sm:p-5 rounded-xl border hover:bg-gray-50 transition-colors">
                <div className="text-2xl shrink-0">{f.icon}</div>
                <div>
                  <h4 className="font-semibold mb-1">{f.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration / Install */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-4xl font-bold mb-3">Install in 30 seconds</h3>
            <p className="text-gray-500 text-base sm:text-lg">Choose your integration method</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Script tag */}
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold mb-1">Script Tag</h4>
              <p className="text-sm text-gray-500 mb-4">Just paste in your HTML</p>
              <div className="bg-gray-950 rounded-lg p-4 text-xs font-mono text-green-300 overflow-x-auto">
                {'<script src="…/sdk.js"'}<br />{'  data-project="ID">'}<br />{'</script>'}
              </div>
            </div>
            {/* NPM */}
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold mb-1">NPM Package</h4>
              <p className="text-sm text-gray-500 mb-4">For React / Next.js / Node apps</p>
              <div className="bg-gray-950 rounded-lg p-4 text-xs font-mono overflow-x-auto space-y-2">
                <div className="text-gray-400">$ npm install @ontheway/sdk</div>
                <div className="text-sky-300">{'import { OnTheWay } from "@ontheway/sdk"'}</div>
              </div>
            </div>
            {/* React */}
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold mb-1">React Provider</h4>
              <p className="text-sm text-gray-500 mb-4">Hooks & components</p>
              <div className="bg-gray-950 rounded-lg p-4 text-xs font-mono text-sky-300 overflow-x-auto">
                {'<OnTheWayProvider projectId="ID">'}<br />{'  <App />'}<br />{'</OnTheWayProvider>'}
              </div>
            </div>
            {/* DevTools */}
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold mb-1">DevTools</h4>
              <p className="text-sm text-gray-500 mb-4">Record tours in your dev environment</p>
              <div className="bg-gray-950 rounded-lg p-4 text-xs font-mono text-purple-300 overflow-x-auto">
                {'<OnTheWayDevToolsPanel'}<br />{'  projectId="ID"'}<br />{'  apiKey="otw_…" />'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h3 className="text-2xl sm:text-4xl font-bold mb-4">Ready to onboard smarter?</h3>
          <p className="text-gray-500 mb-8 text-base sm:text-lg">
            Stop losing users to confusing UIs. Start building product tours in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="bg-black text-white px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg">
              Get Started — Free
            </Link>
            <Link href="/docs" className="border border-gray-300 px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all text-gray-700">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            🛤️ OnTheWay · Built by <a href="https://zoe.im" className="underline hover:text-black transition-colors">Zoe</a>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-black transition-colors">Docs</Link>
            <Link href="/demo" className="hover:text-black transition-colors">Demo</Link>
            <a href="https://github.com/nicoleoliver28/ontheway" className="hover:text-black transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
