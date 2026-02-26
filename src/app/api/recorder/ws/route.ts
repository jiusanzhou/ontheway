import { NextRequest } from 'next/server'

/**
 * WebSocket 录制器实时通信
 * 
 * 由于 Next.js App Router 不原生支持 WebSocket，
 * 这里用 Server-Sent Events (SSE) 作为替代方案
 * 
 * 实际生产中可以用:
 * 1. 独立的 WebSocket 服务器 (推荐)
 * 2. Vercel 的 Edge Runtime + Durable Objects
 * 3. 第三方服务如 Pusher/Ably
 */

// 内存存储活跃的录制会话 (生产环境用 Redis)
const sessions = new Map<string, {
  steps: StepData[]
  clients: Set<ReadableStreamDefaultController>
  createdAt: number
}>()

interface StepData {
  selector: string
  tagName: string
  innerText?: string
  rect: { x: number; y: number; width: number; height: number }
  timestamp: number
}

// SSE 长连接 - Dashboard 端监听
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  
  if (!sessionId) {
    return new Response('Missing session', { status: 400 })
  }

  // 初始化 session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      steps: [],
      clients: new Set(),
      createdAt: Date.now()
    })
  }

  const session = sessions.get(sessionId)!

  const stream = new ReadableStream({
    start(controller) {
      // 注册客户端
      session.clients.add(controller)
      
      // 发送已有的步骤
      if (session.steps.length > 0) {
        const data = JSON.stringify({ type: 'sync', steps: session.steps })
        controller.enqueue(`data: ${data}\n\n`)
      }
      
      // 心跳保持连接
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(': heartbeat\n\n')
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)
      
      // 清理
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        session.clients.delete(controller)
        
        // 如果没有客户端了，30分钟后清理 session
        if (session.clients.size === 0) {
          setTimeout(() => {
            const s = sessions.get(sessionId)
            if (s && s.clients.size === 0) {
              sessions.delete(sessionId)
            }
          }, 30 * 60 * 1000)
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

// 接收录制器发送的步骤
export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  
  if (!sessionId) {
    return Response.json({ error: 'Missing session' }, { status: 400 })
  }

  const body = await request.json()
  const { type, data } = body

  // 初始化 session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      steps: [],
      clients: new Set(),
      createdAt: Date.now()
    })
  }

  const session = sessions.get(sessionId)!

  if (type === 'step') {
    session.steps.push(data)
    
    // 广播给所有监听的客户端
    const message = JSON.stringify({ type: 'step', data })
    for (const client of session.clients) {
      try {
        client.enqueue(`data: ${message}\n\n`)
      } catch {
        session.clients.delete(client)
      }
    }
  } else if (type === 'init') {
    // 录制器初始化
    const message = JSON.stringify({ type: 'init', data })
    for (const client of session.clients) {
      try {
        client.enqueue(`data: ${message}\n\n`)
      } catch {
        session.clients.delete(client)
      }
    }
  } else if (type === 'stop') {
    // 录制结束
    const message = JSON.stringify({ type: 'stop', steps: session.steps })
    for (const client of session.clients) {
      try {
        client.enqueue(`data: ${message}\n\n`)
      } catch {
        session.clients.delete(client)
      }
    }
  }

  return Response.json({ success: true, stepCount: session.steps.length })
}

// 获取 session 状态
export async function OPTIONS(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!
    return Response.json({
      exists: true,
      stepCount: session.steps.length,
      clientCount: session.clients.size,
      createdAt: session.createdAt
    })
  }
  
  return Response.json({ exists: false })
}
