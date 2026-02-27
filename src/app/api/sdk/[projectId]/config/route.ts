import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { incrementViews } from '@/lib/limits'

// Public API - no auth required, uses API key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function isDev(origin: string | null, referer: string | null): boolean {
  const check = (url: string) => {
    try {
      const hostname = new URL(url).hostname
      return hostname === 'localhost' || hostname === '127.0.0.1'
    } catch {
      return false
    }
  }
  return (origin != null && check(origin)) || (referer != null && check(referer))
}

function domainMatches(projectDomain: string, origin: string | null, referer: string | null): boolean {
  const check = (url: string) => {
    try {
      const hostname = new URL(url).hostname
      // exact match or subdomain match
      return hostname === projectDomain || hostname.endsWith(`.${projectDomain}`)
    } catch {
      return false
    }
  }
  if (origin && check(origin)) return true
  if (referer && check(referer)) return true
  return false
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  
  // Create service client for public API
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Fetch project (include domain and user_id for validation/usage)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, domain, user_id')
    .eq('id', projectId)
    .single()
  
  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { 
      status: 404,
      headers: CORS_HEADERS,
    })
  }

  // Domain whitelist check
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (project.domain && !isDev(origin, referer)) {
    if (!domainMatches(project.domain, origin, referer)) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403, headers: CORS_HEADERS }
      )
    }
  }
  
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, slug, trigger, steps, targeting')
    .eq('project_id', projectId)
    .eq('enabled', true)
  
  if (tasksError) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { 
      status: 500,
      headers: CORS_HEADERS,
    })
  }

  // Increment views count (fire-and-forget, don't block response)
  incrementViews(project.user_id).catch(() => {})
  
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
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=60, s-maxage=300'
    }
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: CORS_HEADERS,
  })
}
