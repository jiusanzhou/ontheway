import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/tasks/[taskId] - Get task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, projects!inner(user_id)')
    .eq('id', taskId)
    .single()
  
  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }
  
  return NextResponse.json({ task })
}

// PATCH /api/projects/[id]/tasks/[taskId] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { name, slug, trigger, steps, targeting, enabled } = body
  
  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (slug !== undefined) updates.slug = slug
  if (trigger !== undefined) updates.trigger = trigger
  if (steps !== undefined) updates.steps = steps
  if (targeting !== undefined) updates.targeting = targeting
  if (enabled !== undefined) updates.enabled = enabled
  
  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ task })
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
