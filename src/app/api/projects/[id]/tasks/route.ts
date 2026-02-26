import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/tasks - List tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ tasks })
}

// POST /api/projects/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  
  const body = await request.json()
  const { name, slug, trigger = 'manual', steps = [], targeting = {} } = body
  
  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }
  
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      name,
      slug,
      trigger,
      steps,
      targeting
    })
    .select()
    .single()
  
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists in this project' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ task }, { status: 201 })
}
