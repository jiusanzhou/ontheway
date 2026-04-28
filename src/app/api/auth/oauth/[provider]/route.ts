import { NextRequest, NextResponse } from 'next/server'
import { getProviderConfig, getRedirectUri, signState, type Provider } from '@/lib/oauth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: p } = await params
  if (p !== 'github' && p !== 'google') {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  }
  const provider = p as Provider

  const cfg = getProviderConfig(provider)
  if (!cfg) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured on this server` },
      { status: 500 }
    )
  }

  // Use configured public URL if available, else request origin
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  const redirectUri = getRedirectUri(origin, provider)

  // Preserve intended post-login destination (e.g. /dashboard)
  const next = req.nextUrl.searchParams.get('next') || '/dashboard'
  const state = await signState({ provider, next })

  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', cfg.scope)
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')
  if (provider === 'google') {
    url.searchParams.set('access_type', 'online')
    url.searchParams.set('prompt', 'select_account')
  }

  return NextResponse.redirect(url.toString())
}
