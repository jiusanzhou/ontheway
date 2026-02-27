import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/data'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.zoe.im'
    const session = await createCheckoutSession(
      user.id,
      'pro',
      `${baseUrl}/dashboard?upgraded=true`,
      `${baseUrl}/dashboard`
    )

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}

// Also support GET for simple redirect
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.zoe.im'))
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.zoe.im'
    const session = await createCheckoutSession(
      user.id,
      'pro',
      `${baseUrl}/dashboard?upgraded=true`,
      `${baseUrl}/dashboard`
    )

    return NextResponse.redirect(session.url)
  } catch (e: unknown) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent((e as Error).message)}`, process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.zoe.im')
    )
  }
}
