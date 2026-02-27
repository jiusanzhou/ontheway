import { query, queryOne, queryCount } from './db'

export const PLAN_LIMITS = {
  free: { projects: 3, tasks: 5, views: 1000 },
  pro: { projects: -1, tasks: -1, views: 50000 },
  enterprise: { projects: -1, tasks: -1, views: -1 },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export async function getPlan(userId: string): Promise<PlanType> {
  const row = await queryOne<{ plan: string }>(
    'SELECT plan FROM user_plans WHERE user_id = $1',
    [userId]
  )

  if (!row) return 'free'
  return row.plan as PlanType
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function checkLimit(
  userId: string,
  resource: 'projects' | 'views'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getPlan(userId)
  const limits = PLAN_LIMITS[plan]

  if (resource === 'projects') {
    const current = await queryCount(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [userId]
    )
    const limit = limits.projects
    return {
      allowed: limit === -1 || current < limit,
      current,
      limit,
    }
  }

  if (resource === 'views') {
    const month = getCurrentMonth()
    const row = await queryOne<{ sdk_views: number | string }>(
      'SELECT sdk_views FROM usage_records WHERE user_id = $1 AND month = $2',
      [userId, month]
    )

    const current = row ? (typeof row.sdk_views === 'string' ? parseInt(row.sdk_views, 10) : row.sdk_views) : 0
    const limit = limits.views
    return {
      allowed: limit === -1 || current < limit,
      current,
      limit,
    }
  }

  return { allowed: true, current: 0, limit: -1 }
}

export async function incrementViews(userId: string): Promise<void> {
  const month = getCurrentMonth()

  const existing = await queryOne<{ id: string; sdk_views: number | string }>(
    'SELECT id, sdk_views FROM usage_records WHERE user_id = $1 AND month = $2',
    [userId, month]
  )

  if (existing) {
    const currentViews = typeof existing.sdk_views === 'string' ? parseInt(existing.sdk_views, 10) : existing.sdk_views
    await query(
      'UPDATE usage_records SET sdk_views = $1 WHERE id = $2',
      [currentViews + 1, existing.id]
    )
  } else {
    await query(
      'INSERT INTO usage_records (user_id, month, sdk_views) VALUES ($1, $2, 1)',
      [userId, month]
    )
  }
}
