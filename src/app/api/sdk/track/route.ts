import { NextRequest, NextResponse } from 'next/server'

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
    
    // TODO: Save to Supabase
    // const supabase = createClient()
    // await supabase.from('task_completions').insert({
    //   task_id: body.task_id,
    //   visitor_id: body.visitor_id,
    //   steps_completed: body.steps_completed,
    //   total_steps: body.total_steps,
    //   completed: body.completed
    // })
    
    console.log('[Track]', body)
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
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
