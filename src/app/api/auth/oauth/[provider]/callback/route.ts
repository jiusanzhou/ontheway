import { NextRequest, NextResponse } from 'next/server'
import {
  verifyState,
  exchangeCodeForToken,
  fetchProfile,
  findOrCreateUserByOAuth,
  getRedirectUri,
  type Provider,
} from '@/lib/oauth'
import { createSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: p } = await params
  if (p !== 'github' && p !== 'google') {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  }
  const provider = p as Provider

  const search = req.nextUrl.searchParams
  const code = search.get('code')
  const stateToken = search.get('state')
  const error = search.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, req.url)
    )
  }

  if (!code || !stateToken) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code_or_state', req.url)
    )
  }

  const stateData = await verifyState(stateToken)
  if (!stateData || stateData.provider !== provider) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_state', req.url)
    )
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  const accessToken = await exchangeCodeForToken(provider, code, getRedirectUri(origin, provider))
  if (!accessToken) {
    return NextResponse.redirect(
      new URL('/login?error=token_exchange_failed', req.url)
    )
  }

  const profile = await fetchProfile(provider, accessToken)
  if (!profile) {
    return NextResponse.redirect(
      new URL('/login?error=fetch_profile_failed', req.url)
    )
  }

  const result = await findOrCreateUserByOAuth(provider, profile)
  if ('error' in result) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(result.error)}`, req.url)
    )
  }

  // Set session and redirect
  await createSession(result.userId)

  const next = stateData.next || '/dashboard'
  const redirectUrl = new URL(next, origin)
  return NextResponse.redirect(redirectUrl.toString())
}
