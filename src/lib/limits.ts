import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export const PLAN_LIMITS = {
  free: { projects: 3, tasks: 5, views: 1000 },
  pro: { projects: -1, tasks: -1, views: 50000 },
  enterprise: { projects: -1, tasks: -1, views: -1 },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export async function getPlan(userId: string): Promise<PlanType> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', userId)
    .single()

  if (!data) return 'free'
  return data.plan as PlanType
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

  const supabase = getServiceClient()

  if (resource === 'projects') {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const current = count || 0
    const limit = limits.projects
    return {
      allowed: limit === -1 || current < limit,
      current,
      limit,
    }
  }

  if (resource === 'views') {
    const month = getCurrentMonth()
    const { data } = await supabase
      .from('usage_records')
      .select('sdk_views')
      .eq('user_id', userId)
      .eq('month', month)
      .single()

    const current = data?.sdk_views || 0
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
  const supabase = getServiceClient()
  const month = getCurrentMonth()

  // Upsert: insert or increment
  const { data: existing } = await supabase
    .from('usage_records')
    .select('id, sdk_views')
    .eq('user_id', userId)
    .eq('month', month)
    .single()

  if (existing) {
    await supabase
      .from('usage_records')
      .update({ sdk_views: existing.sdk_views + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('usage_records')
      .insert({ user_id: userId, month, sdk_views: 1 })
  }
}
