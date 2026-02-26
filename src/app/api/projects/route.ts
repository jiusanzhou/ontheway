import { NextRequest, NextResponse } from 'next/server'
import { getProjects, createProject, getCurrentUser } from '@/lib/data'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const projects = await getProjects()
    return NextResponse.json({ projects })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, domain } = await request.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  try {
    const project = await createProject({ name, domain })
    return NextResponse.json({ project }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
