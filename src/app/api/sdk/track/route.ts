import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface TrackPayload {
  task_id: string
  visitor_id: string
  steps_completed: number
  total_steps: number
  completed: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackPayload = await request.json()

    await query(
      `INSERT INTO task_completions (task_id, visitor_id, steps_completed, total_steps, completed)
       VALUES ($1, $2, $3, $4, $5)`,
      [body.task_id, body.visitor_id, body.steps_completed, body.total_steps, body.completed]
    ).catch((err) => {
      console.error('[Track Error]', err)
      // Still return success - analytics shouldn't block UX
    })

    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
