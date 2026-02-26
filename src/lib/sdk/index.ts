/**
 * OnTheWay SDK
 * Lightweight onboarding SDK based on Driver.js
 * 
 * Usage:
 * <script src="https://ontheway.zoe.im/sdk.js" data-project="PROJECT_ID"></script>
 * 
 * Or:
 * import { OnTheWay } from '@ontheway/sdk'
 * const otw = new OnTheWay({ projectId: 'PROJECT_ID' })
 * otw.start('task-slug')
 */

import { driver, type Driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

interface OnTheWayConfig {
  projectId: string
  apiUrl?: string
  onComplete?: (taskId: string) => void
  onSkip?: (taskId: string, stepIndex: number) => void
}

interface TaskConfig {
  id: string
  slug: string
  trigger: 'auto' | 'manual' | 'first-visit'
  steps: StepConfig[]
  targeting?: {
    urlPattern?: string
    newUsersOnly?: boolean
  }
}

interface StepConfig {
  element: string
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
  }
}

interface SDKState {
  loaded: boolean
  tasks: TaskConfig[]
  completedTasks: Set<string>
}

export class OnTheWay {
  private config: OnTheWayConfig
  private state: SDKState
  private driverInstance: Driver | null = null
  private visitorId: string

  constructor(config: OnTheWayConfig) {
    this.config = {
      apiUrl: 'https://ontheway.zoe.im/api',
      ...config
    }
    this.state = {
      loaded: false,
      tasks: [],
      completedTasks: new Set()
    }
    this.visitorId = this.getOrCreateVisitorId()
    this.init()
  }

  private async init() {
    // Load completed tasks from localStorage
    this.loadCompletedTasks()
    
    // Fetch task configs
    await this.fetchTasks()
    
    // Auto-start tasks if configured
    this.handleAutoStart()
    
    this.state.loaded = true
  }

  private getOrCreateVisitorId(): string {
    const key = 'otw_visitor_id'
    let id = localStorage.getItem(key)
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem(key, id)
    }
    return id
  }

  private loadCompletedTasks() {
    const key = `otw_completed_${this.config.projectId}`
    const completed = localStorage.getItem(key)
    if (completed) {
      this.state.completedTasks = new Set(JSON.parse(completed))
    }
  }

  private saveCompletedTask(taskId: string) {
    this.state.completedTasks.add(taskId)
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
        const visitKey = `otw_visited_${task.id}`
        if (!localStorage.getItem(visitKey)) {
          localStorage.setItem(visitKey, 'true')
          this.start(task.slug)
          break
        }
      }
    }
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

    // Convert to Driver.js steps
    const steps: DriveStep[] = task.steps.map(step => ({
      element: step.element,
      popover: {
        title: step.popover.title,
        description: step.popover.description,
        side: step.popover.side,
      }
    }))

    // Initialize driver
    this.driverInstance = driver({
      showProgress: true,
      steps,
      onDestroyStarted: () => {
        // User clicked close or completed
        if (this.driverInstance?.hasNextStep()) {
          // Skipped
          const currentIndex = this.driverInstance.getActiveIndex() || 0
          this.config.onSkip?.(task.id, currentIndex)
          this.trackCompletion(task.id, currentIndex, task.steps.length, false)
        } else {
          // Completed
          this.saveCompletedTask(task.id)
          this.config.onComplete?.(task.id)
          this.trackCompletion(task.id, task.steps.length, task.steps.length, true)
        }
        this.driverInstance?.destroy()
      }
    })

    this.driverInstance.drive()
  }

  /**
   * Reset a task (allow it to show again)
   */
  public reset(slugOrId: string) {
    const task = this.state.tasks.find(t => t.slug === slugOrId || t.id === slugOrId)
    if (task) {
      this.state.completedTasks.delete(task.id)
      const key = `otw_completed_${this.config.projectId}`
      localStorage.setItem(key, JSON.stringify([...this.state.completedTasks]))
      
      // Also reset first-visit flag
      localStorage.removeItem(`otw_visited_${task.id}`)
    }
  }

  /**
   * Reset all tasks for this project
   */
  public resetAll() {
    this.state.completedTasks.clear()
    localStorage.removeItem(`otw_completed_${this.config.projectId}`)
    this.state.tasks.forEach(task => {
      localStorage.removeItem(`otw_visited_${task.id}`)
    })
  }

  private async trackCompletion(
    taskId: string, 
    stepsCompleted: number, 
    totalSteps: number, 
    completed: boolean
  ) {
    try {
      await fetch(`${this.config.apiUrl}/sdk/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          visitor_id: this.visitorId,
          steps_completed: stepsCompleted,
          total_steps: totalSteps,
          completed
        })
      })
    } catch {
      // Silent fail for analytics
    }
  }

  /**
   * Check if SDK is loaded
   */
  public isReady(): boolean {
    return this.state.loaded
  }

  /**
   * Get list of available tasks
   */
  public getTasks(): TaskConfig[] {
    return [...this.state.tasks]
  }
}

// Auto-init from script tag
if (typeof window !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement
  const projectId = script?.dataset?.project

  if (projectId) {
    const instance = new OnTheWay({ projectId })
    // Expose globally
    ;(window as any).ontheway = instance
  }
}

export default OnTheWay
