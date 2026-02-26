import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask, getProject, getCurrentUser } from '@/lib/data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await getProject(id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  try {
    const tasks = await getTasks(id)
    return NextResponse.json({ tasks })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await getProject(id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = await request.json()
  const { name, slug, trigger, steps, targeting } = body
  if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })

  try {
    const task = await createTask(id, { name, slug, trigger, steps, targeting })
    return NextResponse.json({ task }, { status: 201 })
  } catch (e: unknown) {
    const msg = (e as Error).message
    if (msg.includes('23505')) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
