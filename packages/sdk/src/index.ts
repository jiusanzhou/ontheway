/**
 * OnTheWay SDK
 * Lightweight onboarding SDK based on Driver.js
 *
 * Usage:
 * import { OnTheWay } from '@ontheway/sdk'
 * const otw = new OnTheWay({ projectId: 'PROJECT_ID' })
 * otw.start('task-slug')
 */

import { driver, type Driver, type DriveStep } from 'driver.js'

// ---- Runtime CSS injection ----

const DRIVER_CSS_CDN = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css'

function loadDriverCSS() {
  if (typeof document === 'undefined') return
  if (document.querySelector('link[data-otw-driver-css]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = DRIVER_CSS_CDN
  link.setAttribute('data-otw-driver-css', '1')
  document.head.appendChild(link)
}

// ---- Cross-page Tour Storage ----

/** @internal Key used in sessionStorage for persisting active cross-page tour state */
const CROSS_PAGE_KEY = 'otw_active_tour'

/**
 * State persisted to sessionStorage so a tour can survive page navigations.
 */
export interface CrossPageTourState {
  /** Task slug that is currently running */
  taskSlug: string
  /** Index of the step to resume from */
  stepIndex: number
  /** ISO timestamp when the tour started */
  startedAt: string
}

// ---- Types ----

/** Configuration passed to the OnTheWay constructor */
export interface OnTheWayConfig {
  projectId: string
  apiUrl?: string
  /** Custom Driver.js CSS URL. Set to `false` to disable auto-injection. */
  driverCssUrl?: string | false
  /**
   * Local tasks to use instead of fetching from server.
   * When provided, the SDK skips the server fetch entirely.
   * Ideal for self-contained integrations.
   */
  tasks?: TaskConfig[]
  onComplete?: (taskId: string) => void
  onSkip?: (taskId: string, stepIndex: number) => void
}

/** A single task returned by the server or configured locally */
export interface TaskConfig {
  id: string
  slug: string
  trigger: 'auto' | 'manual' | 'first-visit' | 'condition'
  steps: StepConfig[]
  targeting?: {
    urlPattern?: string
    newUsersOnly?: boolean
    /**
     * Condition callback evaluated at auto-start time.
     * Return `true` to trigger the tour.
     * Only used when `trigger === 'condition'`.
     */
    condition?: () => boolean
  }
}

/** Configuration for a single step in a tour */
export interface StepConfig {
  element: string
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
  }
  /**
   * Optional URL this step should be shown on.
   * If the current page does not match, the SDK will navigate to it and
   * resume the tour after the page loads.
   */
  url?: string
  /**
   * When true, clicking the highlighted element itself will advance to
   * the next step (or complete the tour if it's the last step).
   * Default: true
   */
  advanceOnClick?: boolean
}

/** @internal Runtime state of the SDK */
export interface SDKState {
  loaded: boolean
  tasks: TaskConfig[]
  completedTasks: Set<string>
}

export class OnTheWay {
  private config: OnTheWayConfig
  private state: SDKState
  private driverInstance: Driver | null = null
  private visitorId: string
  /** Condition functions registered via `registerCondition` */
  private conditions: Map<string, () => boolean> = new Map()

  constructor(config: OnTheWayConfig) {
    this.config = {
      apiUrl: '/api',
      ...config,
    }
    this.state = {
      loaded: false,
      tasks: [],
      completedTasks: new Set(),
    }

    // Inject driver.js CSS at runtime (unless explicitly disabled)
    if (config.driverCssUrl !== false) {
      if (config.driverCssUrl) {
        // User provided a custom CSS URL
        if (typeof document !== 'undefined' && !document.querySelector('link[data-otw-driver-css]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = config.driverCssUrl
          link.setAttribute('data-otw-driver-css', '1')
          document.head.appendChild(link)
        }
      } else {
        loadDriverCSS()
      }
    }

    this.visitorId = this.getOrCreateVisitorId()
    this.init()
  }

  private async init() {
    // Load completed tasks from localStorage
    this.loadCompletedTasks()

    // Use local tasks if provided, otherwise fetch from server
    if (this.config.tasks && this.config.tasks.length > 0) {
      this.state.tasks = this.config.tasks
    } else if (this.config.apiUrl) {
      await this.fetchTasks()
    }

    this.state.loaded = true

    // Check for cross-page tour resume before auto-start
    if (!this.resumeCrossPageTour()) {
      // Auto-start tasks if configured
      this.handleAutoStart()
    }
  }

  private getOrCreateVisitorId(): string {
    if (typeof localStorage === 'undefined') return 'v_ssr'
    const key = 'otw_visitor_id'
    let id = localStorage.getItem(key)
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem(key, id)
    }
    return id
  }

  private loadCompletedTasks() {
    if (typeof localStorage === 'undefined') return
    const key = `otw_completed_${this.config.projectId}`
    const completed = localStorage.getItem(key)
    if (completed) {
      this.state.completedTasks = new Set(JSON.parse(completed))
    }
  }

  private saveCompletedTask(taskId: string) {
    this.state.completedTasks.add(taskId)
    if (typeof localStorage === 'undefined') return
    const key = `otw_completed_${this.config.projectId}`
    localStorage.setItem(key, JSON.stringify([...this.state.completedTasks]))
  }

  private async fetchTasks() {
    try {
      const res = await fetch(`${this.config.apiUrl}/sdk/${this.config.projectId}/config`)
      if (!res.ok) throw new Error('Failed to fetch config')
      const data = await res.json()
      this.state.tasks = data.tasks || []
    } catch (error) {
      console.warn('[OnTheWay] Failed to load config:', error)
    }
  }

  private handleAutoStart() {
    if (typeof window === 'undefined') return
    const currentUrl = window.location.href

    for (const task of this.state.tasks) {
      // Skip completed tasks
      if (this.state.completedTasks.has(task.id)) continue

      // Check URL targeting
      if (task.targeting?.urlPattern) {
        const pattern = new RegExp(task.targeting.urlPattern)
        if (!pattern.test(currentUrl)) continue
      }

      // Handle trigger types
      if (task.trigger === 'auto') {
        this.start(task.slug)
        break // Only one auto task at a time
      } else if (task.trigger === 'first-visit') {
        if (typeof localStorage === 'undefined') continue
        const visitKey = `otw_visited_${task.id}`
        if (!localStorage.getItem(visitKey)) {
          localStorage.setItem(visitKey, 'true')
          this.start(task.slug)
          break
        }
      } else if (task.trigger === 'condition') {
        // Check registered condition or inline condition
        const conditionFn =
          this.conditions.get(task.slug) ?? task.targeting?.condition
        if (conditionFn && conditionFn()) {
          this.start(task.slug)
          break
        }
      }
    }
  }

  // ---- Cross-page tour helpers ----

  /**
   * Save cross-page tour state so it survives navigation.
   * @internal
   */
  private saveCrossPageState(taskSlug: string, stepIndex: number) {
    if (typeof sessionStorage === 'undefined') return
    const state: CrossPageTourState = {
      taskSlug,
      stepIndex,
      startedAt: new Date().toISOString(),
    }
    sessionStorage.setItem(CROSS_PAGE_KEY, JSON.stringify(state))
  }

  /**
   * Clear cross-page tour state.
   * @internal
   */
  private clearCrossPageState() {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.removeItem(CROSS_PAGE_KEY)
  }

  /**
   * Attempt to resume a cross-page tour from sessionStorage.
   * @returns `true` if a tour was resumed, `false` otherwise.
   * @internal
   */
  private resumeCrossPageTour(): boolean {
    if (typeof sessionStorage === 'undefined') return false
    const raw = sessionStorage.getItem(CROSS_PAGE_KEY)
    if (!raw) return false

    try {
      const state: CrossPageTourState = JSON.parse(raw)
      const task = this.state.tasks.find(t => t.slug === state.taskSlug)
      if (!task) {
        this.clearCrossPageState()
        return false
      }
      // Resume from the saved step index
      this.startAtStep(task, state.stepIndex)
      return true
    } catch {
      this.clearCrossPageState()
      return false
    }
  }

  /**
   * Check whether a step's URL matches the current page.
   * @internal
   */
  private stepUrlMatches(stepUrl: string | undefined): boolean {
    if (!stepUrl) return true // no url constraint = always matches
    if (typeof window === 'undefined') return true
    const current = window.location.pathname + window.location.search
    // Support both full URLs and path-only
    try {
      const parsed = new URL(stepUrl, window.location.origin)
      return (
        parsed.pathname === window.location.pathname &&
        parsed.search === window.location.search
      )
    } catch {
      return current === stepUrl
    }
  }

  /**
   * Start a task at a specific step index (used for cross-page resume).
   * @internal
   */
  private startAtStep(task: TaskConfig, fromIndex: number) {
    const allSteps = task.steps

    // Check if the target step's URL matches the current page
    const targetStep = allSteps[fromIndex]
    if (targetStep?.url && !this.stepUrlMatches(targetStep.url)) {
      // Need to navigate — save state and redirect
      this.saveCrossPageState(task.slug, fromIndex)
      window.location.href = targetStep.url
      return
    }

    // Build Driver.js steps from fromIndex onward
    const steps: DriveStep[] = allSteps.slice(fromIndex).map(step => ({
      element: step.element,
      popover: {
        title: step.popover.title,
        description: step.popover.description,
        side: step.popover.side,
      },
    }))

    const totalSteps = allSteps.length

    // Track element click listeners for cleanup
    const clickCleanups: (() => void)[] = []

    const cleanupClickListeners = () => {
      clickCleanups.forEach(fn => fn())
      clickCleanups.length = 0
    }

    const setupClickListener = (relativeIndex: number) => {
      cleanupClickListeners()
      const absoluteIndex = fromIndex + relativeIndex
      const stepConfig = allSteps[absoluteIndex]
      // advanceOnClick defaults to true
      if (stepConfig && stepConfig.advanceOnClick !== false) {
        const el = document.querySelector(stepConfig.element)
        if (el) {
          const handler = () => {
            if (!this.driverInstance) return
            cleanupClickListeners()
            // Delay to let click's native action (navigation, dialog open) proceed
            setTimeout(() => {
              if (!this.driverInstance) return
              if (this.driverInstance.hasNextStep()) {
                const nextAbsolute = absoluteIndex + 1
                if (nextAbsolute < allSteps.length) {
                  const nextStep = allSteps[nextAbsolute]
                  if (nextStep.url && !this.stepUrlMatches(nextStep.url)) {
                    this.saveCrossPageState(task.slug, nextAbsolute)
                    this.driverInstance.destroy()
                    window.location.href = nextStep.url
                    return
                  }
                  // Wait for next element, then use moveTo for reliable positioning
                  const nextRelative = this.driverInstance.getActiveIndex()! + 1
                  this.waitForElement(nextStep.element, 3000).then((el) => {
                    if (!this.driverInstance || !el) return
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        this.driverInstance?.moveTo(nextRelative)
                      })
                    })
                  })
                  return
                }
                this.driverInstance.moveNext()
              } else {
                this.driverInstance.destroy()
              }
            }, 150)
          }
          el.addEventListener('click', handler, { once: true })
          clickCleanups.push(() => el.removeEventListener('click', handler))
        }
      }
    }

    this.driverInstance = driver({
      showProgress: true,
      allowClose: true,
      steps,
      onHighlightStarted: (_el, _step, opts) => {
        const relativeIndex = opts.state.activeIndex ?? 0
        setupClickListener(relativeIndex)
      },
      onNextClick: (_el, _step, { driver: drv }) => {
        if (!this.driverInstance) return
        cleanupClickListeners()
        const relativeIndex = this.driverInstance.getActiveIndex() ?? 0
        const absoluteIndex = fromIndex + relativeIndex + 1

        // Check if next step requires a different page
        if (absoluteIndex < allSteps.length) {
          const nextStep = allSteps[absoluteIndex]
          if (nextStep.url && !this.stepUrlMatches(nextStep.url)) {
            this.saveCrossPageState(task.slug, absoluteIndex)
            this.driverInstance.destroy()
            window.location.href = nextStep.url
            return
          }

          // Destroy current highlight, wait for element, then re-highlight
          const nextRelative = relativeIndex + 1
          this.waitForElement(nextStep.element, 3000).then((el) => {
            if (!this.driverInstance || !el) return
            // Use requestAnimationFrame to ensure layout is settled
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                this.driverInstance?.moveTo(nextRelative)
              })
            })
          })
        } else {
          this.driverInstance.moveNext()
        }
      },
      onDestroyStarted: () => {
        if (this.driverInstance?.hasNextStep()) {
          // Skipped
          const relativeIndex = this.driverInstance.getActiveIndex() || 0
          const currentIndex = fromIndex + relativeIndex
          this.config.onSkip?.(task.id, currentIndex)
          this.trackCompletion(task.id, currentIndex, totalSteps, false)
          this.clearCrossPageState()
          cleanupClickListeners()
        } else {
          // Completed
          this.saveCompletedTask(task.id)
          this.config.onComplete?.(task.id)
          this.trackCompletion(task.id, totalSteps, totalSteps, true)
          this.clearCrossPageState()
          cleanupClickListeners()
        }
        this.driverInstance?.destroy()
      },
    })

    this.driverInstance.drive()
  }

  /**
   * Wait for a DOM element to appear, with timeout.
   * Resolves immediately if element exists, otherwise polls via MutationObserver.
   * @internal
   */
  private waitForElement(selector: string, timeoutMs: number = 3000): Promise<Element | null> {
    return new Promise((resolve) => {
      const el = document.querySelector(selector)
      if (el) {
        resolve(el)
        return
      }

      let resolved = false
      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector)
        if (found && !resolved) {
          resolved = true
          observer.disconnect()
          // Small delay to let layout settle
          setTimeout(() => resolve(found), 50)
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })

      setTimeout(() => {
        if (!resolved) {
          resolved = true
          observer.disconnect()
          // Try one last time
          resolve(document.querySelector(selector))
        }
      }, timeoutMs)
    })
  }

  /**
   * Register a condition function for a task slug.
   * When the task trigger is `'condition'`, this function will be evaluated
   * during auto-start to decide whether to show the tour.
   *
   * @param slug - Task slug to attach the condition to
   * @param fn - Predicate that returns `true` to trigger the tour
   */
  public registerCondition(slug: string, fn: () => boolean) {
    this.conditions.set(slug, fn)
  }

  /**
   * Re-evaluate conditions and auto-start eligible tasks.
   * Call this when application state changes (e.g. data loaded) and
   * condition-based tours should be re-checked.
   */
  public checkConditions() {
    this.handleAutoStart()
  }

  /**
   * Start a task by slug or ID
   */
  public start(slugOrId: string) {
    const task = this.state.tasks.find(t => t.slug === slugOrId || t.id === slugOrId)
    if (!task) {
      console.warn(`[OnTheWay] Task not found: ${slugOrId}`)
      return
    }

    this.startAtStep(task, 0)
  }

  /**
   * Reset a task (allow it to show again)
   */
  public reset(slugOrId: string) {
    const task = this.state.tasks.find(t => t.slug === slugOrId || t.id === slugOrId)
    if (task) {
      this.state.completedTasks.delete(task.id)
      if (typeof localStorage !== 'undefined') {
        const key = `otw_completed_${this.config.projectId}`
        localStorage.setItem(key, JSON.stringify([...this.state.completedTasks]))
        // Also reset first-visit flag
        localStorage.removeItem(`otw_visited_${task.id}`)
      }
    }
  }

  /**
   * Reset all tasks for this project
   */
  public resetAll() {
    this.state.completedTasks.clear()
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`otw_completed_${this.config.projectId}`)
      this.state.tasks.forEach(task => {
        localStorage.removeItem(`otw_visited_${task.id}`)
      })
    }
  }

  private async trackCompletion(
    taskId: string,
    stepsCompleted: number,
    totalSteps: number,
    completed: boolean,
  ) {
    // Skip tracking in local mode (no apiUrl or local tasks)
    if (!this.config.apiUrl || this.config.tasks) return
    try {
      await fetch(`${this.config.apiUrl}/sdk/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          visitor_id: this.visitorId,
          steps_completed: stepsCompleted,
          total_steps: totalSteps,
          completed,
        }),
      })
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Get the project ID this SDK instance was configured with.
   */
  public getProjectId(): string {
    return this.config.projectId
  }

  /**
   * Check if SDK is loaded
   */
  public isReady(): boolean {
    return this.state.loaded
  }

  /**
   * Check if a task has been completed
   */
  public isTaskCompleted(slugOrId: string): boolean {
    const task = this.state.tasks.find(t => t.slug === slugOrId || t.id === slugOrId)
    if (!task) return false
    return this.state.completedTasks.has(task.id)
  }

  /**
   * Get list of available tasks
   */
  public getTasks(): TaskConfig[] {
    return [...this.state.tasks]
  }

  /**
   * Get the set of completed task IDs
   */
  public getCompletedTaskIds(): Set<string> {
    return new Set(this.state.completedTasks)
  }

  /**
   * Get pending cross-page tour state, if any.
   * Useful for the React provider to check on mount.
   */
  public static getCrossPageState(): CrossPageTourState | null {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(CROSS_PAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
}

export default OnTheWay
