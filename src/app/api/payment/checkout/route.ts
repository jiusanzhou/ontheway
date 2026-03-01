import { NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payment'
import { getCurrentUser } from '@/lib/data'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.wencai.app'
    const provider = getPaymentProvider()
    const session = await provider.createCheckoutSession({
      userId: user.id,
      plan: 'pro',
      priceId: '', // Uses default from provider config
      successUrl: `${baseUrl}/dashboard?upgraded=true`,
      cancelUrl: `${baseUrl}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.wencai.app'))
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.wencai.app'
    const provider = getPaymentProvider()
    const session = await provider.createCheckoutSession({
      userId: user.id,
      plan: 'pro',
      priceId: '',
      successUrl: `${baseUrl}/dashboard?upgraded=true`,
      cancelUrl: `${baseUrl}/dashboard`,
    })

    return NextResponse.redirect(session.url)
  } catch (e: unknown) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent((e as Error).message)}`, process.env.NEXT_PUBLIC_APP_URL || 'https://ontheway.wencai.app')
    )
  }
}
