'use client'

import { useState, useRef, useEffect } from 'react'
import { useOnTheWay } from './react'

// ---- Types ----

interface HelpMenuProps {
  /** 按钮文字，默认 "?" */
  label?: string | React.ReactNode
  /** 菜单标题 */
  title?: string
  /** 自定义位置 */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** 自定义样式类 */
  className?: string
  /** 自定义按钮样式类 */
  buttonClassName?: string
}

/**
 * 帮助菜单组件 - 显示所有可用的 onboarding 任务
 *
 * @example
 * ```tsx
 * // 基础用法
 * <HelpMenu />
 *
 * // 自定义
 * <HelpMenu label="Need help?" title="Guides" position="bottom-left" />
 * ```
 */
export function HelpMenu({
  label = '?',
  title = 'Help & Guides',
  position = 'bottom-right',
  className = '',
  buttonClassName = '',
}: HelpMenuProps) {
  const { otw, ready, start } = useOnTheWay()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const tasks = ready ? otw?.getTasks() ?? [] : []

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { position: 'fixed', bottom: 24, right: 24 },
    'bottom-left': { position: 'fixed', bottom: 24, left: 24 },
    'top-right': { position: 'fixed', top: 24, right: 24 },
    'top-left': { position: 'fixed', top: 24, left: 24 },
  }

  const menuPosition: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: '100%', right: 0, marginBottom: 8 },
    'bottom-left': { bottom: '100%', left: 0, marginBottom: 8 },
    'top-right': { top: '100%', right: 0, marginTop: 8 },
    'top-left': { top: '100%', left: 0, marginTop: 8 },
  }

  const triggerLabels: Record<string, string> = {
    auto: '🔄',
    manual: '👆',
    'first-visit': '👋',
  }

  return (
    <div
      ref={menuRef}
      style={{ ...positionStyles[position], zIndex: 2147483640 }}
      className={className}
    >
      {/* 菜单面板 */}
      {open && (
        <div
          style={{
            position: 'absolute',
            ...menuPosition[position],
            width: 280,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f3f4f6',
              fontWeight: 600,
              fontSize: 14,
              color: '#111',
            }}
          >
            {title}
          </div>

          {/* Task list */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {tasks.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: 13,
                }}
              >
                {ready ? 'No guides available' : 'Loading...'}
              </div>
            ) : (
              tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    start(task.slug)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 14,
                    color: '#374151',
                    borderBottom: '1px solid #f9fafb',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#f9fafb')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  <span style={{ fontSize: 16 }}>
                    {triggerLabels[task.trigger] ?? '📖'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {task.slug
                        .replace(/[-_]/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {task.steps.length} steps
                    </div>
                  </div>
                  <span style={{ color: '#d1d5db', fontSize: 18 }}>›</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className={buttonClassName}
        style={
          buttonClassName
            ? undefined
            : {
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: 'none',
                background: '#111',
                color: '#fff',
                fontSize: 20,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }
        }
        onMouseEnter={(e) => {
          if (!buttonClassName) {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'
          }
        }}
        onMouseLeave={(e) => {
          if (!buttonClassName) {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)'
          }
        }}
        aria-label="Help menu"
      >
        {label}
      </button>
    </div>
  )
}

// ---- Inline trigger ----

interface HelpTriggerProps {
  /** 要触发的任务 slug */
  taskSlug: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * 内联触发按钮 - 包裹任何元素，点击启动指定任务
 *
 * @example
 * ```tsx
 * <HelpTrigger taskSlug="welcome">
 *   <button>Show Tour</button>
 * </HelpTrigger>
 *
 * <HelpTrigger taskSlug="settings-guide">
 *   <span className="text-blue-500 cursor-pointer">Learn more</span>
 * </HelpTrigger>
 * ```
 */
export function HelpTrigger({
  taskSlug,
  children,
  className,
  style,
}: HelpTriggerProps) {
  const { start, ready } = useOnTheWay()

  return (
    <span
      onClick={() => ready && start(taskSlug)}
      className={className}
      style={{ cursor: ready ? 'pointer' : 'default', ...style }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          ready && start(taskSlug)
        }
      }}
    >
      {children}
    </span>
  )
}

export default HelpMenu
