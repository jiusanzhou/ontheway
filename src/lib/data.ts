import { createClient } from '@/lib/supabase/server'
import type { Project, Task } from '@/types'

// ============ Projects ============

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createProject(data: { name: string; domain?: string }): Promise<Project> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name: data.name, domain: data.domain || null })
    .select()
    .single()

  if (error) throw error
  return project
}

export async function updateProject(id: string, data: { name?: string; domain?: string }): Promise<Project> {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.domain !== undefined) updates.domain = data.domain

  const { data: project, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return project
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ============ Tasks ============

export async function getTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getTask(taskId: string): Promise<Task | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) return null
  return data
}

export async function createTask(projectId: string, data: {
  name: string
  slug: string
  trigger?: string
  steps?: unknown[]
  targeting?: Record<string, unknown>
}): Promise<Task> {
  const supabase = await createClient()
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      name: data.name,
      slug: data.slug,
      trigger: data.trigger || 'manual',
      steps: data.steps || [],
      targeting: data.targeting || {},
    })
    .select()
    .single()

  if (error) throw error
  return task
}

export async function updateTask(taskId: string, data: {
  name?: string
  slug?: string
  trigger?: string
  steps?: unknown[]
  targeting?: Record<string, unknown>
  enabled?: boolean
}): Promise<Task> {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.slug !== undefined) updates.slug = data.slug
  if (data.trigger !== undefined) updates.trigger = data.trigger
  if (data.steps !== undefined) updates.steps = data.steps
  if (data.targeting !== undefined) updates.targeting = data.targeting
  if (data.enabled !== undefined) updates.enabled = data.enabled

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return task
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

// ============ Plans & Usage ============

export async function getUserPlan(userId: string): Promise<'free' | 'pro' | 'enterprise'> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', userId)
    .single()

  if (!data) return 'free'
  return data.plan as 'free' | 'pro' | 'enterprise'
}

// ============ Auth helpers ============

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
