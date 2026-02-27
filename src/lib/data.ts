import { query, queryOne } from './db'
import { getCurrentUser as getUser, requireUser as reqUser } from './auth'
import type { Project, Task } from '@/types'

// Re-export auth helpers so existing imports from '@/lib/data' still work
export const getCurrentUser = getUser
export const requireUser = reqUser

// ============ Projects ============

export async function getProjects(): Promise<Project[]> {
  const user = await getUser()
  if (!user) return []

  return query<Project>(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
    [user.id]
  )
}

export async function getProject(id: string): Promise<Project | null> {
  return queryOne<Project>(
    'SELECT * FROM projects WHERE id = $1',
    [id]
  )
}

export async function createProject(data: { name: string; domain?: string }): Promise<Project> {
  const user = await reqUser()

  const project = await queryOne<Project>(
    `INSERT INTO projects (user_id, name, domain)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [user.id, data.name, data.domain || null]
  )

  if (!project) throw new Error('Failed to create project')
  return project
}

export async function updateProject(id: string, data: { name?: string; domain?: string }): Promise<Project> {
  // Build dynamic SET clause
  const setClauses: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`)
    params.push(data.name)
  }
  if (data.domain !== undefined) {
    setClauses.push(`domain = $${paramIndex++}`)
    params.push(data.domain)
  }

  if (setClauses.length === 0) {
    const existing = await getProject(id)
    if (!existing) throw new Error('Project not found')
    return existing
  }

  setClauses.push(`updated_at = now()`)
  params.push(id)

  const project = await queryOne<Project>(
    `UPDATE projects SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  )

  if (!project) throw new Error('Project not found')
  return project
}

export async function deleteProject(id: string): Promise<void> {
  await query('DELETE FROM projects WHERE id = $1', [id])
}

// ============ Tasks ============

export async function getTasks(projectId: string): Promise<Task[]> {
  const rows = await query<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC',
    [projectId]
  )
  return rows.map(parseTask)
}

export async function getTask(taskId: string): Promise<Task | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE id = $1',
    [taskId]
  )
  if (!row) return null
  return parseTask(row)
}

export async function createTask(projectId: string, data: {
  name: string
  slug: string
  trigger?: string
  steps?: unknown[]
  targeting?: Record<string, unknown>
}): Promise<Task> {
  const row = await queryOne<Record<string, unknown>>(
    `INSERT INTO tasks (project_id, name, slug, trigger, steps, targeting)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      projectId,
      data.name,
      data.slug,
      data.trigger || 'manual',
      JSON.stringify(data.steps || []),
      JSON.stringify(data.targeting || {}),
    ]
  )

  if (!row) throw new Error('Failed to create task')
  return parseTask(row)
}

export async function updateTask(taskId: string, data: {
  name?: string
  slug?: string
  trigger?: string
  steps?: unknown[]
  targeting?: Record<string, unknown>
  enabled?: boolean
}): Promise<Task> {
  const setClauses: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`)
    params.push(data.name)
  }
  if (data.slug !== undefined) {
    setClauses.push(`slug = $${paramIndex++}`)
    params.push(data.slug)
  }
  if (data.trigger !== undefined) {
    setClauses.push(`trigger = $${paramIndex++}`)
    params.push(data.trigger)
  }
  if (data.steps !== undefined) {
    setClauses.push(`steps = $${paramIndex++}`)
    params.push(JSON.stringify(data.steps))
  }
  if (data.targeting !== undefined) {
    setClauses.push(`targeting = $${paramIndex++}`)
    params.push(JSON.stringify(data.targeting))
  }
  if (data.enabled !== undefined) {
    setClauses.push(`enabled = $${paramIndex++}`)
    params.push(data.enabled)
  }

  if (setClauses.length === 0) {
    const existing = await getTask(taskId)
    if (!existing) throw new Error('Task not found')
    return existing
  }

  setClauses.push(`updated_at = now()`)
  params.push(taskId)

  const row = await queryOne<Record<string, unknown>>(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  )

  if (!row) throw new Error('Task not found')
  return parseTask(row)
}

export async function deleteTask(taskId: string): Promise<void> {
  await query('DELETE FROM tasks WHERE id = $1', [taskId])
}

// ============ Plans & Usage ============

export async function getUserPlan(userId: string): Promise<'free' | 'pro' | 'enterprise'> {
  const row = await queryOne<{ plan: string }>(
    'SELECT plan FROM user_plans WHERE user_id = $1',
    [userId]
  )

  if (!row) return 'free'
  return row.plan as 'free' | 'pro' | 'enterprise'
}

// ============ Helpers ============

// Neon returns JSONB as strings, so we need to parse them
function parseTask(row: Record<string, unknown>): Task {
  return {
    ...row,
    steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : (row.steps || []),
    targeting: typeof row.targeting === 'string' ? JSON.parse(row.targeting) : (row.targeting || {}),
  } as Task
}
