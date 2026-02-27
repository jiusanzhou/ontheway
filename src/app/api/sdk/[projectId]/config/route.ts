import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { incrementViews } from '@/lib/limits'

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

  // Fetch project
  const projects = await query<{ id: string; name: string; domain: string; user_id: string }>(
    'SELECT id, name, domain, user_id FROM projects WHERE id = $1',
    [projectId]
  )
  const project = projects[0]

  if (!project) {
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

  const tasks = await query<{
    id: string
    slug: string
    trigger: string
    steps: unknown
    targeting: unknown
  }>(
    'SELECT id, slug, trigger, steps, targeting FROM tasks WHERE project_id = $1 AND enabled = true',
    [projectId]
  )

  // Increment views count (fire-and-forget, don't block response)
  incrementViews(project.user_id).catch(() => {})

  // Transform steps to SDK format
  const sdkTasks = (tasks || []).map(task => {
    const steps = typeof task.steps === 'string' ? JSON.parse(task.steps) : (task.steps || [])
    const targeting = typeof task.targeting === 'string' ? JSON.parse(task.targeting) : (task.targeting || {})

    return {
      id: task.id,
      slug: task.slug,
      trigger: task.trigger,
      targeting,
      steps: (steps as Array<{
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
    }
  })

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
