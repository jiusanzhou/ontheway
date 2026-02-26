import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface TrackPayload {
  task_id: string
  visitor_id: string
  steps_completed: number
  total_steps: number
  completed: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body: TrackPayload = await request.json()
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase.from('task_completions').insert({
      task_id: body.task_id,
      visitor_id: body.visitor_id,
      steps_completed: body.steps_completed,
      total_steps: body.total_steps,
      completed: body.completed
    })
    
    if (error) {
      console.error('[Track Error]', error)
      // Still return success - analytics shouldn't block UX
    }
    
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
