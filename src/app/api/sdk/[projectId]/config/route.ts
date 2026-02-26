import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public API - no auth required, uses API key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  
  // Create service client for public API
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Fetch project and enabled tasks
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()
  
  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { 
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, slug, trigger, steps, targeting')
    .eq('project_id', projectId)
    .eq('enabled', true)
  
  if (tasksError) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  // Transform steps to SDK format
  const sdkTasks = (tasks || []).map(task => ({
    id: task.id,
    slug: task.slug,
    trigger: task.trigger,
    targeting: task.targeting || {},
    steps: (task.steps as Array<{
      selector: string
      title: string
      content: string
      position?: string
    }>).map(step => ({
      element: step.selector,
      popover: {
        title: step.title,
        description: step.content,
        side: step.position || 'auto'
      }
    }))
  }))
  
  return NextResponse.json({
    project_id: projectId,
    tasks: sdkTasks
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=300'
    }
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
