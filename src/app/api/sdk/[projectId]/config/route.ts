import { NextRequest, NextResponse } from 'next/server'

// Mock data - replace with Supabase
const mockTasks = [
  {
    id: '1',
    slug: 'welcome',
    trigger: 'first-visit',
    steps: [
      { element: '#header', popover: { title: 'Welcome!', description: 'Let me show you around.' } },
      { element: '.nav-menu', popover: { title: 'Navigation', description: 'Use this menu to get around.' } },
    ],
    targeting: {}
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  
  // TODO: Fetch from Supabase based on projectId
  // For now return mock data
  
  return NextResponse.json({
    project_id: projectId,
    tasks: mockTasks
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    }
  })
}
