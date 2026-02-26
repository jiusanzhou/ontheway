import { NextRequest } from 'next/server'

// 内存存储活跃的录制会话 (生产环境用 Redis)
const sessions = new Map<string, {
  steps: StepData[]
  clients: Set<ReadableStreamDefaultController>
  createdAt: number
  connectedUrl?: string
}>()

interface StepData {
  id: string
  index: number
  selector: string
  tagName: string
  innerText?: string
  rect: { x: number; y: number; width: number; height: number }
  url: string
  timestamp: number
}

function getSession(sessionId: string) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      steps: [],
      clients: new Set(),
      createdAt: Date.now(),
    })
  }
  return sessions.get(sessionId)!
}

function broadcast(session: ReturnType<typeof getSession>, message: string) {
  for (const client of session.clients) {
    try {
      client.enqueue(`data: ${message}\n\n`)
    } catch {
      session.clients.delete(client)
    }
  }
}

// ---- SSE: Dashboard listens ----
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  if (!sessionId) {
    return new Response('Missing session', { status: 400 })
  }

  const session = getSession(sessionId)

  const stream = new ReadableStream({
    start(controller) {
      session.clients.add(controller)

      // Send existing state
      if (session.connectedUrl) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', url: session.connectedUrl })}\n\n`)
      }
      if (session.steps.length > 0) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'sync', steps: session.steps })}\n\n`)
      }

      // Heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(': heartbeat\n\n')
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        session.clients.delete(controller)
        // Cleanup after 30 min with no clients
        if (session.clients.size === 0) {
          setTimeout(() => {
            const s = sessions.get(sessionId)
            if (s && s.clients.size === 0) sessions.delete(sessionId)
          }, 30 * 60 * 1000)
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// ---- POST: Recorder reports events ----
export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  if (!sessionId) {
    return Response.json({ error: 'Missing session' }, {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  const body = await request.json()
  const { type } = body
  const session = getSession(sessionId)

  if (type === 'connected') {
    session.connectedUrl = body.url || ''
    broadcast(session, JSON.stringify({ type: 'connected', url: body.url, title: body.title }))
  } else if (type === 'step') {
    const step = body.step as StepData
    session.steps.push(step)
    broadcast(session, JSON.stringify({ type: 'step', step }))
  } else if (type === 'stop') {
    broadcast(session, JSON.stringify({ type: 'stop', steps: session.steps }))
  } else if (type === 'pong') {
    session.connectedUrl = body.url || session.connectedUrl
    broadcast(session, JSON.stringify({ type: 'connected', url: body.url }))
  }

  return Response.json(
    { success: true, stepCount: session.steps.length },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  )
}

// ---- CORS preflight ----
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
