'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { OnTheWay } from './index'

// ---- Types ----

interface OnTheWayContextValue {
  /** SDK 实例，null 表示尚未初始化 */
  otw: OnTheWay | null
  /** SDK 是否已加载完成 */
  ready: boolean
  /** 启动指定任务 */
  start: (slugOrId: string) => void
  /** 重置指定任务 */
  reset: (slugOrId: string) => void
  /** 重置所有任务 */
  resetAll: () => void
}

interface OnTheWayProviderProps {
  projectId: string
  apiUrl?: string
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
})

// ---- Provider ----

export function OnTheWayProvider({
  projectId,
  apiUrl,
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
      onComplete,
      onSkip,
    })

    setOtw(instance)

    // 轮询等待 ready
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

  return (
    <OnTheWayContext.Provider value={{ otw, ready, start, reset, resetAll }}>
      {children}
    </OnTheWayContext.Provider>
  )
}

// ---- Hook ----

/**
 * 在任意组件中获取 OnTheWay SDK
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
