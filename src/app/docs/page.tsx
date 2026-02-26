import Link from 'next/link'

function Code({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <code className={`bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono ${className}`}>
      {children}
    </code>
  )
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg overflow-hidden my-4">
      {title && (
        <div className="bg-gray-800 text-gray-400 text-xs px-4 py-2 border-b border-gray-700">
          {title}
        </div>
      )}
      <pre className="bg-gray-900 text-green-400 p-4 text-sm overflow-x-auto">
        {children}
      </pre>
    </div>
  )
}

function SectionAnchor({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold mb-4 mt-16 first:mt-0 scroll-mt-20">
      <a href={`#${id}`} className="hover:underline">{children}</a>
    </h2>
  )
}

function SubSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-semibold mb-3 mt-8 scroll-mt-20">
      <a href={`#${id}`} className="hover:underline">{children}</a>
    </h3>
  )
}

export default function DocsPage() {
  const toc = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'installation', label: 'Installation' },
    { id: 'react', label: 'React Integration' },
    { id: 'react-provider', label: '  Provider Setup', sub: true },
    { id: 'react-hook', label: '  useOnTheWay Hook', sub: true },
    { id: 'react-helpmenu', label: '  HelpMenu Component', sub: true },
    { id: 'react-helptrigger', label: '  HelpTrigger Component', sub: true },
    { id: 'vanilla', label: 'Vanilla JS' },
    { id: 'api-reference', label: 'API Reference' },
    { id: 'triggers', label: 'Trigger Types' },
    { id: 'events', label: 'Events & Callbacks' },
    { id: 'best-practices', label: 'Best Practices' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">🛤️ OnTheWay</Link>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/demo" className="hover:underline">Demo</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 flex">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0 py-12 pr-8 sticky top-16 self-start" style={{ maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">On this page</p>
          <nav className="space-y-1">
            {toc.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block text-sm hover:text-black transition-colors ${
                  item.sub ? 'pl-4 text-gray-400 hover:text-gray-600' : 'text-gray-600 font-medium'
                }`}
              >
                {item.label.trim()}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-12 lg:pl-8 lg:border-l">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-gray-500 mb-12">Everything you need to integrate OnTheWay into your product.</p>

          {/* ============ Quick Start ============ */}
          <SectionAnchor id="quick-start">Quick Start</SectionAnchor>
          <div className="bg-gray-50 rounded-lg p-6">
            <ol className="list-decimal list-inside space-y-4">
              <li>
                <strong>Create a project</strong> in the <Link href="/dashboard" className="underline">Dashboard</Link>
              </li>
              <li>
                <strong>Record your tour</strong> — enter your site URL, click through the elements you want to highlight
              </li>
              <li>
                <strong>Edit copy & positioning</strong> — adjust titles, descriptions, and popover placement
              </li>
              <li>
                <strong>Install the SDK</strong> — choose one of the methods below
              </li>
            </ol>
          </div>

          {/* ============ Installation ============ */}
          <SectionAnchor id="installation">Installation</SectionAnchor>

          <p className="text-gray-600 mb-4">Choose your integration method:</p>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <p className="font-semibold mb-1">📜 Script Tag</p>
              <p className="text-sm text-gray-500">One line, zero config. Good for static sites.</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-semibold mb-1">⚛️ React</p>
              <p className="text-sm text-gray-500">Provider + Hook + Components. Full control.</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-semibold mb-1">📦 NPM</p>
              <p className="text-sm text-gray-500">Import as module. Works with any bundler.</p>
            </div>
          </div>

          {/* Script Tag */}
          <SubSection id="install-script">Script Tag</SubSection>
          <p className="text-gray-600 mb-2">Add one line before <Code>{'</body>'}</Code>:</p>
          <CodeBlock>{`<script src="https://ontheway.zoe.im/sdk.js" 
        data-project="YOUR_PROJECT_ID"></script>`}</CodeBlock>
          <p className="text-gray-500 text-sm">The SDK auto-initializes and exposes <Code>window.ontheway</Code> globally.</p>

          {/* NPM */}
          <SubSection id="install-npm">NPM / Yarn / pnpm</SubSection>
          <CodeBlock title="Terminal">{`npm install @ontheway/sdk`}</CodeBlock>
          <CodeBlock title="app.js">{`import { OnTheWay } from '@ontheway/sdk'

const otw = new OnTheWay({ projectId: 'YOUR_PROJECT_ID' })

// Manually start a tour
otw.start('welcome-tour')`}</CodeBlock>

          {/* ============ React Integration ============ */}
          <SectionAnchor id="react">React Integration</SectionAnchor>
          <p className="text-gray-600 mb-6">
            OnTheWay provides first-class React support with a Provider, Hook, and pre-built components.
          </p>

          {/* Provider */}
          <SubSection id="react-provider">Provider Setup</SubSection>
          <p className="text-gray-600 mb-2">
            Wrap your app root with <Code>OnTheWayProvider</Code>. It initializes the SDK and makes it available to all child components.
          </p>
          <CodeBlock title="app/layout.tsx (Next.js) or App.tsx">{`import { OnTheWayProvider } from '@ontheway/sdk/react'

export default function RootLayout({ children }) {
  return (
    <OnTheWayProvider
      projectId="YOUR_PROJECT_ID"
      apiUrl="https://ontheway.zoe.im/api"  // optional, default
      onComplete={(taskId) => {
        console.log('Tour completed:', taskId)
        // e.g. track in analytics
      }}
      onSkip={(taskId, stepIndex) => {
        console.log('Tour skipped at step:', stepIndex)
      }}
    >
      {children}
    </OnTheWayProvider>
  )
}`}</CodeBlock>

          <div className="bg-gray-50 rounded-lg overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Prop</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Required</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-mono">projectId</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2">✅</td>
                  <td className="px-4 py-2 text-gray-600">Your project ID from Dashboard</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">apiUrl</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2 text-gray-600">API endpoint override</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">onComplete</td>
                  <td className="px-4 py-2 text-gray-500">(taskId) =&gt; void</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2 text-gray-600">Called when a tour finishes</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">onSkip</td>
                  <td className="px-4 py-2 text-gray-500">(taskId, step) =&gt; void</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2 text-gray-600">Called when user closes early</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Hook */}
          <SubSection id="react-hook">useOnTheWay Hook</SubSection>
          <p className="text-gray-600 mb-2">
            Access the SDK from any component. Most flexible approach.
          </p>
          <CodeBlock title="SettingsPage.tsx">{`import { useOnTheWay } from '@ontheway/sdk/react'

function SettingsPage() {
  const { otw, ready, start, reset, resetAll } = useOnTheWay()

  // Get all available tours
  const tasks = ready ? otw?.getTasks() ?? [] : []

  return (
    <div>
      <h2>Settings</h2>

      {/* Build a custom help menu */}
      <div className="help-section">
        <h3>Available Guides</h3>
        <ul>
          {tasks.map(task => (
            <li key={task.id}>
              <button onClick={() => start(task.slug)}>
                {task.slug} ({task.steps.length} steps)
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Trigger a specific tour */}
      <button onClick={() => start('settings-guide')}>
        Need help with settings?
      </button>

      {/* Reset controls */}
      <button onClick={() => reset('welcome')}>
        Replay welcome tour
      </button>
      <button onClick={resetAll}>
        Reset all tours
      </button>
    </div>
  )
}`}</CodeBlock>

          <div className="bg-gray-50 rounded-lg overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Return Value</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-mono">otw</td>
                  <td className="px-4 py-2 text-gray-500">OnTheWay | null</td>
                  <td className="px-4 py-2 text-gray-600">Raw SDK instance (access <Code>getTasks()</Code> etc.)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">ready</td>
                  <td className="px-4 py-2 text-gray-500">boolean</td>
                  <td className="px-4 py-2 text-gray-600">True when config is loaded</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">start(slug)</td>
                  <td className="px-4 py-2 text-gray-500">function</td>
                  <td className="px-4 py-2 text-gray-600">Start a tour by slug or ID</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">reset(slug)</td>
                  <td className="px-4 py-2 text-gray-500">function</td>
                  <td className="px-4 py-2 text-gray-600">Reset a specific tour</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">resetAll()</td>
                  <td className="px-4 py-2 text-gray-500">function</td>
                  <td className="px-4 py-2 text-gray-600">Reset all tours</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* HelpMenu */}
          <SubSection id="react-helpmenu">HelpMenu Component</SubSection>
          <p className="text-gray-600 mb-2">
            A ready-made floating help button. Renders a <Code>?</Code> button that opens a panel listing all available tours. Users click to start any tour.
          </p>
          <CodeBlock title="layout.tsx">{`import { OnTheWayProvider } from '@ontheway/sdk/react'
import { HelpMenu } from '@ontheway/sdk/components'

export default function Layout({ children }) {
  return (
    <OnTheWayProvider projectId="YOUR_PROJECT_ID">
      {children}
      <HelpMenu />
    </OnTheWayProvider>
  )
}`}</CodeBlock>

          <p className="text-gray-600 mt-4 mb-2">Customize appearance and position:</p>
          <CodeBlock>{`// Custom label, title, position
<HelpMenu
  label="💡"
  title="Product Guides"
  position="bottom-left"   // bottom-right | bottom-left | top-right | top-left
/>

// Custom button style via className
<HelpMenu
  label="Help"
  buttonClassName="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg"
/>

// Custom emoji label
<HelpMenu label={<span>📚</span>} />`}</CodeBlock>

          <div className="bg-gray-50 rounded-lg overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Prop</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Default</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-mono">label</td>
                  <td className="px-4 py-2 text-gray-500">ReactNode</td>
                  <td className="px-4 py-2 text-gray-400">&quot;?&quot;</td>
                  <td className="px-4 py-2 text-gray-600">Button content</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">title</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2 text-gray-400">&quot;Help &amp; Guides&quot;</td>
                  <td className="px-4 py-2 text-gray-600">Panel header text</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">position</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2 text-gray-400">&quot;bottom-right&quot;</td>
                  <td className="px-4 py-2 text-gray-600">Fixed position on screen</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">className</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2 text-gray-400">—</td>
                  <td className="px-4 py-2 text-gray-600">Wrapper class</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">buttonClassName</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2 text-gray-400">—</td>
                  <td className="px-4 py-2 text-gray-600">Custom button class (overrides default style)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* HelpTrigger */}
          <SubSection id="react-helptrigger">HelpTrigger Component</SubSection>
          <p className="text-gray-600 mb-2">
            Wrap any element to make it start a specific tour on click. Great for contextual help links.
          </p>
          <CodeBlock title="SettingsPage.tsx">{`import { HelpTrigger } from '@ontheway/sdk/components'

function SettingsPage() {
  return (
    <div>
      <h2>Settings</h2>

      {/* Wrap a link */}
      <HelpTrigger taskSlug="settings-guide">
        <a className="text-blue-500 cursor-pointer">
          Don't know where to start? Follow the guide →
        </a>
      </HelpTrigger>

      {/* Wrap a button */}
      <HelpTrigger taskSlug="billing-tour">
        <button className="btn">Billing Help</button>
      </HelpTrigger>

      {/* Wrap an icon */}
      <HelpTrigger taskSlug="export-guide">
        <span title="How to export">❓</span>
      </HelpTrigger>
    </div>
  )
}`}</CodeBlock>

          <div className="bg-gray-50 rounded-lg overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Prop</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-mono">taskSlug</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2 text-gray-600">Tour slug or ID to trigger</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">children</td>
                  <td className="px-4 py-2 text-gray-500">ReactNode</td>
                  <td className="px-4 py-2 text-gray-600">Clickable content</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">className</td>
                  <td className="px-4 py-2 text-gray-500">string</td>
                  <td className="px-4 py-2 text-gray-600">Optional wrapper class</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ============ Vanilla JS ============ */}
          <SectionAnchor id="vanilla">Vanilla JavaScript</SectionAnchor>
          <p className="text-gray-600 mb-2">For non-React projects, use the SDK class directly:</p>
          <CodeBlock title="app.js">{`import { OnTheWay } from '@ontheway/sdk'

const otw = new OnTheWay({
  projectId: 'YOUR_PROJECT_ID',
  onComplete: (taskId) => console.log('done:', taskId),
})

// Wait for ready
const check = setInterval(() => {
  if (otw.isReady()) {
    clearInterval(check)
    console.log('Tours available:', otw.getTasks())
  }
}, 100)

// Trigger manually
document.getElementById('help-btn')
  .addEventListener('click', () => otw.start('welcome'))

// Or build a menu
const tasks = otw.getTasks()
tasks.forEach(task => {
  const li = document.createElement('li')
  li.textContent = task.slug
  li.onclick = () => otw.start(task.slug)
  document.getElementById('help-list').appendChild(li)
})`}</CodeBlock>

          {/* ============ API Reference ============ */}
          <SectionAnchor id="api-reference">API Reference</SectionAnchor>

          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Method</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3 font-mono">start(slugOrId)</td>
                  <td className="px-4 py-3 text-gray-600">Start a tour by slug or task ID</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono">reset(slugOrId)</td>
                  <td className="px-4 py-3 text-gray-600">Reset a tour so it can show again</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono">resetAll()</td>
                  <td className="px-4 py-3 text-gray-600">Reset all tours for the project</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono">getTasks()</td>
                  <td className="px-4 py-3 text-gray-600">Get array of available <Code>TaskConfig</Code> objects</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono">isReady()</td>
                  <td className="px-4 py-3 text-gray-600">Check if SDK config has loaded</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ============ Triggers ============ */}
          <SectionAnchor id="triggers">Trigger Types</SectionAnchor>
          <p className="text-gray-600 mb-4">Configure when tours start in the Dashboard:</p>
          <div className="space-y-3">
            <div className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-xl">👆</span>
              <div>
                <p className="font-semibold">manual</p>
                <p className="text-sm text-gray-500">Only starts when you call <Code>start(slug)</Code>. Use for help menus, contextual triggers.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-xl">🔄</span>
              <div>
                <p className="font-semibold">auto</p>
                <p className="text-sm text-gray-500">Starts automatically on every matching page load. Stops after completion.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-xl">👋</span>
              <div>
                <p className="font-semibold">first-visit</p>
                <p className="text-sm text-gray-500">Starts once on the user&apos;s first visit. Uses localStorage to track.</p>
              </div>
            </div>
          </div>

          {/* ============ Events ============ */}
          <SectionAnchor id="events">Events &amp; Callbacks</SectionAnchor>
          <CodeBlock>{`const otw = new OnTheWay({
  projectId: 'YOUR_PROJECT_ID',

  // Called when a tour is fully completed
  onComplete: (taskId) => {
    console.log('Completed:', taskId)
    analytics.track('tour_completed', { taskId })
  },

  // Called when user closes/skips before finishing
  onSkip: (taskId, stepIndex) => {
    console.log(\`Skipped \${taskId} at step \${stepIndex}\`)
    analytics.track('tour_skipped', { taskId, stepIndex })
  },
})`}</CodeBlock>

          {/* ============ Best Practices ============ */}
          <SectionAnchor id="best-practices">Best Practices</SectionAnchor>
          <ul className="list-disc list-inside space-y-3 text-gray-600">
            <li><strong>Keep tours short</strong> — 3-5 steps max. Users lose interest after that.</li>
            <li><strong>Use clear, actionable copy</strong> — &quot;Click here to create a project&quot; &gt; &quot;This is the project button&quot;</li>
            <li><strong>Highlight interactive elements</strong> — buttons, inputs, links. Not static text.</li>
            <li><strong>Add stable selectors</strong> — Use <Code>data-ontheway-id=&quot;xxx&quot;</Code> attributes so tours survive CSS changes.</li>
            <li><strong>Test after UI changes</strong> — selectors can break. Check the Dashboard for step health.</li>
            <li><strong>Use URL targeting</strong> — restrict tours to specific pages via URL pattern matching.</li>
          </ul>

          {/* ============ Troubleshooting ============ */}
          <SectionAnchor id="troubleshooting">Troubleshooting</SectionAnchor>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Tour skips a step</h3>
              <p className="text-yellow-700 text-sm">
                The CSS selector can&apos;t find the element. Open the task editor to update the selector,
                or add a <Code className="bg-yellow-100">data-ontheway-id</Code> attribute to the target element.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Tour doesn&apos;t start</h3>
              <p className="text-yellow-700 text-sm">
                Check trigger type. For <Code className="bg-yellow-100">first-visit</Code> tours, the user may have
                already seen it. Call <Code className="bg-yellow-100">reset(slug)</Code> or <Code className="bg-yellow-100">resetAll()</Code> to clear state.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">SDK not loading</h3>
              <p className="text-yellow-700 text-sm">
                Verify your <Code className="bg-yellow-100">projectId</Code> is correct. Check the browser console
                for network errors. Ensure the API endpoint is accessible.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">useOnTheWay returns null</h3>
              <p className="text-yellow-700 text-sm">
                Make sure <Code className="bg-yellow-100">OnTheWayProvider</Code> wraps the component tree.
                The hook must be called inside a child of the Provider.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t mt-16 pt-8 text-center text-gray-400 text-sm">
            <p>Built by <a href="https://zoe.im" className="underline hover:text-gray-600">Zoe</a></p>
          </div>
        </main>
      </div>
    </div>
  )
}
