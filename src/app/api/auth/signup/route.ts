import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const result = await signUp(email, password)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ success: true, userId: result.userId }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
