# @ontheway/sdk

Lightweight onboarding SDK based on [Driver.js](https://driverjs.com/). Create interactive product tours and onboarding flows.

## Installation

```bash
npm install @ontheway/sdk driver.js
# or
pnpm add @ontheway/sdk driver.js
```

> **Note:** `driver.js` is a peer dependency. The SDK automatically injects Driver.js CSS from CDN at runtime. To disable this behavior, pass `driverCssUrl: false` and import the CSS yourself.

## Usage

### Vanilla JavaScript / TypeScript

```ts
import { OnTheWay } from '@ontheway/sdk'

const otw = new OnTheWay({
  projectId: 'YOUR_PROJECT_ID',
  apiUrl: 'https://your-api.com/api',
  onComplete: (taskId) => console.log('Completed:', taskId),
  onSkip: (taskId, stepIndex) => console.log('Skipped:', taskId, 'at step', stepIndex),
})

// Start a specific tour
otw.start('welcome-tour')

// Reset a task
otw.reset('welcome-tour')

// Reset all tasks
otw.resetAll()
```

### React

```tsx
import { OnTheWayProvider, useOnTheWay } from '@ontheway/sdk/react'

function App() {
  return (
    <OnTheWayProvider projectId="YOUR_PROJECT_ID">
      <YourApp />
    </OnTheWayProvider>
  )
}

function HelpButton() {
  const { start, ready } = useOnTheWay()
  return (
    <button onClick={() => start('welcome-tour')} disabled={!ready}>
      Show Tour
    </button>
  )
}
```

### Components

```tsx
import { HelpMenu, HelpTrigger } from '@ontheway/sdk/components'

// Floating help menu with all available tours
<HelpMenu position="bottom-right" />

// Inline trigger for a specific tour
<HelpTrigger taskSlug="welcome-tour">
  <button>Need help?</button>
</HelpTrigger>
```

### DevTools (Development Only)

```tsx
import { OnTheWayDevToolsPanel } from '@ontheway/sdk/devtools'

// Add to your app root in development
{process.env.NODE_ENV === 'development' && (
  <OnTheWayDevToolsPanel
    projectId="YOUR_PROJECT_ID"
    apiKey="otw_YOUR_API_KEY"
  />
)}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | `string` | — | **Required.** Your project ID |
| `apiUrl` | `string` | `'/api'` | API base URL |
| `driverCssUrl` | `string \| false` | CDN URL | Custom CSS URL, or `false` to disable auto-injection |
| `onComplete` | `(taskId: string) => void` | — | Callback when a task is completed |
| `onSkip` | `(taskId: string, stepIndex: number) => void` | — | Callback when a task is skipped |

## Driver.js CSS

By default, the SDK injects the Driver.js CSS from CDN at runtime. You can:

1. **Let it auto-inject** (default behavior, no action needed)
2. **Provide a custom URL**: `new OnTheWay({ projectId: '...', driverCssUrl: 'https://...' })`
3. **Disable and import manually**: `new OnTheWay({ projectId: '...', driverCssUrl: false })` then add `import 'driver.js/dist/driver.css'` yourself

## License

MIT
