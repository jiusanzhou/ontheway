'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { OnTheWay, type TaskConfig } from './index'

// ---- Types ----

/** Context value exposed by the OnTheWay provider */
export interface OnTheWayContextValue {
  /** SDK instance, null before initialisation */
  otw: OnTheWay | null
  /** Whether the SDK has finished loading */
  ready: boolean
  /** Start a tour by slug or ID */
  start: (slugOrId: string) => void
  /** Reset a specific task */
  reset: (slugOrId: string) => void
  /** Reset all tasks */
  resetAll: () => void
  /**
   * Register a condition function for conditional triggers.
   * The function is evaluated during auto-start when the task trigger is `'condition'`.
   */
  registerCondition: (slug: string, fn: () => boolean) => void
  /**
   * Re-evaluate conditions and start eligible tours.
   * Call after state changes that might satisfy a condition.
   */
  checkConditions: () => void
  /** Check whether a given task has been completed */
  isTaskCompleted: (slugOrId: string) => boolean
}

/** Props for the OnTheWayProvider component */
export interface OnTheWayProviderProps {
  projectId: string
  apiUrl?: string
  /**
   * Local tasks — passed directly to the SDK, skipping server fetch.
   * Use this for local/offline mode.
   */
  tasks?: TaskConfig[]
  onComplete?: (taskId: string) => void
  onSkip?: (taskId: string, stepIndex: number) => void
  children: ReactNode
}

// ---- Context ----

const OnTheWayContext = createContext<OnTheWayContextValue>({
  otw: null,
  ready: false,
  start: () => {},
  reset: () => {},
  resetAll: () => {},
  registerCondition: () => {},
  checkConditions: () => {},
  isTaskCompleted: () => false,
})

// ---- Provider ----

/**
 * Provides the OnTheWay SDK to descendant components.
 *
 * Wrap your application (or a subtree) with this provider so that
 * `useOnTheWay()` returns the SDK instance.
 *
 * On mount the provider also checks for any pending cross-page tour
 * (persisted in `sessionStorage`) and resumes it automatically.
 *
 * @example
 * ```tsx
 * <OnTheWayProvider projectId="proj_abc">
 *   <App />
 * </OnTheWayProvider>
 * ```
 */
export function OnTheWayProvider({
  projectId,
  apiUrl,
  tasks,
  onComplete,
  onSkip,
  children,
}: OnTheWayProviderProps) {
  const [otw, setOtw] = useState<OnTheWay | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const instance = new OnTheWay({
      projectId,
      apiUrl,
      tasks,
      onComplete,
      onSkip,
    })

    setOtw(instance)

    // Poll until ready (cross-page resume happens inside init)
    const check = setInterval(() => {
      if (instance.isReady()) {
        setReady(true)
        clearInterval(check)
      }
    }, 100)

    return () => {
      clearInterval(check)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, apiUrl])

  const start = useCallback(
    (slugOrId: string) => otw?.start(slugOrId),
    [otw],
  )

  const reset = useCallback(
    (slugOrId: string) => otw?.reset(slugOrId),
    [otw],
  )

  const resetAll = useCallback(() => otw?.resetAll(), [otw])

  const registerCondition = useCallback(
    (slug: string, fn: () => boolean) => otw?.registerCondition(slug, fn),
    [otw],
  )

  const checkConditions = useCallback(() => otw?.checkConditions(), [otw])

  const isTaskCompleted = useCallback(
    (slugOrId: string) => otw?.isTaskCompleted(slugOrId) ?? false,
    [otw],
  )

  return (
    <OnTheWayContext.Provider
      value={{
        otw,
        ready,
        start,
        reset,
        resetAll,
        registerCondition,
        checkConditions,
        isTaskCompleted,
      }}
    >
      {children}
    </OnTheWayContext.Provider>
  )
}

// ---- Hook ----

/**
 * Access the OnTheWay SDK from any component wrapped by `<OnTheWayProvider>`.
 *
 * @example
 * ```tsx
 * function HelpButton() {
 *   const { start } = useOnTheWay()
 *   return <button onClick={() => start('welcome')}>Help</button>
 * }
 * ```
 */
export function useOnTheWay() {
  return useContext(OnTheWayContext)
}
