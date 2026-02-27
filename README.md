<p align="center">
  <img src="public/logo.svg" width="80" height="80" alt="OnTheWay" />
</p>

<h1 align="center">OnTheWay</h1>

<p align="center">
  <strong>User onboarding, simplified.</strong><br/>
  Record, AI-generate, and deploy interactive product tours with one line of code.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#sdk">SDK</a> ·
  <a href="#self-hosting">Self-Hosting</a> ·
  <a href="#architecture">Architecture</a>
</p>

---

## What is OnTheWay?

OnTheWay is an open-source onboarding SaaS that helps you build interactive product tours for your web app. Instead of writing custom tooltip code, you **record steps visually**, **let AI generate them**, or **define them in code** — then deploy with a single `<script>` tag.

Built on [Driver.js](https://driverjs.com) (~5KB gzipped), it's lightweight and works with any framework.

## Features

### Three Ways to Create Tours

| Method | Description |
|--------|-------------|
| **✨ AI Generate** | Describe your intent in plain language. AI analyzes your page DOM and generates steps automatically. |
| **⏺ Visual Recorder** | Click through your app to capture steps. Elements are highlighted, selectors auto-generated. |
| **📝 Code & Config** | Full control via React SDK, vanilla JS API, or the dashboard editor. |

### Recording Modes

| Mode | Best For |
|------|----------|
| **DevTools** (npm) | Local development — floating panel in your app |
| **Snippet** (paste JS) | Quick recording without installing anything |
| **Proxy** (Service Worker) | Recording on external sites you don't own |

### Core Capabilities

- 🎯 **Smart Selectors** — Auto-generates stable CSS selectors with `data-*`, `id`, and class fallbacks
- 🔄 **Trigger Modes** — Auto-start, first-visit only, manual, or URL pattern matching
- 📊 **Completion Tracking** — Track how many users complete each tour, find drop-off points
- ⚛️ **React SDK** — Provider, hooks, `HelpMenu` and `HelpTrigger` components
- 🌐 **Universal** — Works with React, Vue, Angular, vanilla JS, or any framework
- ⚡ **Tiny Footprint** — ~5KB SDK, loads Driver.js on demand from CDN
- 🔐 **Auth & RLS** — Supabase Auth with Row Level Security policies
- 🤖 **AI-Powered** — OpenAI-compatible API for automatic step generation

## Quick Start

### 1. Install the SDK

**Script tag** (simplest):

```html
<script src="https://your-domain.com/sdk.js"
        data-project="YOUR_PROJECT_ID"></script>
```

**NPM**:

```bash
npm install @ontheway/sdk
```

```js
import { OnTheWay } from '@ontheway/sdk'

const otw = new OnTheWay({ projectId: 'YOUR_PROJECT_ID' })
otw.start('welcome-tour')
```

### 2. React Integration

```tsx
import { OnTheWayProvider, useOnTheWay } from '@ontheway/sdk/react'
import { HelpMenu } from '@ontheway/sdk/components'

function App() {
  return (
    <OnTheWayProvider projectId="YOUR_PROJECT_ID">
      <YourApp />
      <HelpMenu />
    </OnTheWayProvider>
  )
}

function StartButton() {
  const { start } = useOnTheWay()
  return <button onClick={() => start('welcome')}>Help</button>
}
```

### 3. DevTools (Development Only)

```tsx
import { OnTheWayDevToolsPanel } from '@ontheway/sdk/devtools'

// Add to your app root — only in development
{process.env.NODE_ENV === 'development' && (
  <OnTheWayDevToolsPanel
    projectId="YOUR_PROJECT_ID"
    apiKey="otw_xxx"
  />
)}
```

A floating 🛤️ panel appears with recording, AI generation, and task management.

## SDK

### API

```js
// Start a tour
ontheway.start('tour-slug')

// Reset a tour (allow it to show again)
ontheway.reset('tour-slug')

// Reset all tours
ontheway.resetAll()

// Get available tasks
ontheway.getTasks()

// Check if SDK is ready
ontheway.isReady()
```

### Triggers

| Trigger | Behavior |
|---------|----------|
| `manual` | Only starts when you call `otw.start()` |
| `auto` | Starts automatically on page load |
| `first-visit` | Starts once per visitor, then never again |

### Events

```js
const otw = new OnTheWay({
  projectId: 'xxx',
  onComplete: (taskId) => console.log('Completed:', taskId),
  onSkip: (taskId, stepIndex) => console.log('Skipped at step:', stepIndex),
})
```

## Self-Hosting

### Prerequisites

- Node.js 18+
- Supabase account (or local Supabase)

### Setup

```bash
# Clone
git clone https://github.com/jiusanzhou/ontheway.git
cd ontheway

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
pnpm supabase db push

# Start dev server
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Optional: AI step generation
AI_API_KEY=sk-xxx
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jiusanzhou/ontheway)

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── ai/generate/       # AI step generation endpoint
│   │   ├── projects/          # CRUD API for projects & tasks
│   │   ├── proxy/             # Service Worker proxy for recording
│   │   ├── recorder/ws/       # SSE hub for recorder ↔ dashboard
│   │   └── sdk/               # Public SDK config & tracking APIs
│   ├── dashboard/             # Dashboard (projects, tasks, editor)
│   ├── demo/                  # Interactive demo page
│   ├── docs/                  # Documentation
│   └── login/                 # Auth pages
├── components/                # Shared UI components
├── lib/
│   ├── data.ts                # Supabase data access layer
│   ├── supabase/              # Supabase client/server helpers
│   └── sdk/
│       ├── index.ts           # SDK core (OnTheWay class)
│       ├── react.tsx          # React bindings (Provider, hooks)
│       ├── components.tsx     # React components (HelpMenu, HelpTrigger)
│       └── devtools.tsx       # DevTools recording panel
├── types/                     # TypeScript types
public/
├── sdk.js                     # Standalone SDK for CDN / <script> tag
├── recorder-snippet.js        # Recording script (paste in console)
└── proxy-sw.js                # Service Worker for proxy recording
```

### Database Schema

Three tables with Row Level Security:

- **projects** — User projects with API keys and domain settings
- **tasks** — Onboarding tasks with steps (JSON), triggers, and targeting
- **task_completions** — Analytics: visitor completion tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15, React 19 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Tour Engine | Driver.js |
| Styling | Tailwind CSS |
| AI | OpenAI-compatible API (optional) |

## Roadmap

- [ ] npm package: `@ontheway/sdk`
- [ ] Analytics dashboard (completion rates, drop-off charts)
- [ ] A/B testing for tours
- [ ] Team collaboration
- [ ] Multi-language support
- [ ] Webhooks on completion

## License

MIT

---

<p align="center">
  Built by <a href="https://zoe.im">Zoe</a>
</p>
