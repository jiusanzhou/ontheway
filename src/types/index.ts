// OnTheWay 核心类型定义

export interface Project {
  id: string
  user_id: string
  name: string
  domain: string
  api_key: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  name: string
  slug: string
  trigger: 'auto' | 'manual' | 'first-visit'
  steps: Step[]
  targeting: Targeting
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface Step {
  id: string
  order: number
  selector: string
  fallback_selectors?: string[]
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  action: 'click' | 'next' | 'input'
  spotlight: boolean
  // Driver.js specific options
  popover_class?: string
  highlight_class?: string
}

export interface Targeting {
  new_users_only?: boolean
  url_pattern?: string
  user_segment?: string
}

// 录制器捕获的原始数据
export interface CapturedStep {
  selector: string
  tag_name: string
  inner_text?: string
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  timestamp: number
}

// SDK 配置
export interface SDKConfig {
  project_id: string
  tasks: TaskConfig[]
}

export interface TaskConfig {
  id: string
  slug: string
  trigger: Task['trigger']
  steps: StepConfig[]
  targeting: Targeting
}

export interface StepConfig {
  element: string
  popover: {
    title: string
    description: string
    side: Step['position']
  }
}
