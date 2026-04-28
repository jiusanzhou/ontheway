import { queryOne } from './db'

const OAUTH_SECRET = process.env.SESSION_SECRET || 'ontheway-dev-secret-change-me'

// ============ State signing (CSRF protection) ============

async function hmac(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(OAUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function signState(payload: Record<string, string>): Promise<string> {
  // Simple json + hmac, base64url-encoded
  const body = btoa(JSON.stringify({ ...payload, ts: Date.now() }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const sig = await hmac(body)
  return `${body}.${sig}`
}

export async function verifyState(
  token: string,
  maxAgeMs = 10 * 60 * 1000
): Promise<Record<string, string> | null> {
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const body = token.substring(0, dot)
  const sig = token.substring(dot + 1)
  const expected = await hmac(body)
  if (sig !== expected) return null

  try {
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'))
    const data = JSON.parse(json) as Record<string, string | number>
    const ts = Number(data.ts || 0)
    if (!ts || Date.now() - ts > maxAgeMs) return null
    return data as Record<string, string>
  } catch {
    return null
  }
}

// ============ Provider config ============

export type Provider = 'github' | 'google'

export interface ProviderConfig {
  authorizeUrl: string
  tokenUrl: string
  userUrl: string
  clientId: string
  clientSecret: string
  scope: string
  // Optional extra endpoint (github needs /user/emails for private emails)
  emailsUrl?: string
}

export function getProviderConfig(provider: Provider): ProviderConfig | null {
  if (provider === 'github') {
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    if (!clientId || !clientSecret) return null
    return {
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userUrl: 'https://api.github.com/user',
      emailsUrl: 'https://api.github.com/user/emails',
      clientId,
      clientSecret,
      scope: 'read:user user:email',
    }
  }
  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) return null
    return {
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      clientId,
      clientSecret,
      scope: 'openid email profile',
    }
  }
  return null
}

export function getRedirectUri(origin: string, provider: Provider): string {
  return `${origin}/api/auth/oauth/${provider}/callback`
}

// ============ Normalized profile ============

export interface OAuthProfile {
  providerAccountId: string
  email: string | null
  name: string | null
  avatarUrl: string | null
}

// ============ User linking / creation ============

export async function findOrCreateUserByOAuth(
  provider: Provider,
  profile: OAuthProfile
): Promise<{ userId: string } | { error: string }> {
  // 1. Existing link?
  const linked = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_account_id = $2',
    [provider, profile.providerAccountId]
  )
  if (linked) return { userId: linked.user_id }

  // 2. Match by verified email → link to that user
  if (profile.email) {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [profile.email.toLowerCase()]
    )
    if (existing) {
      await queryOne(
        'INSERT INTO oauth_accounts (user_id, provider, provider_account_id, email) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [existing.id, provider, profile.providerAccountId, profile.email.toLowerCase()]
      )
      // Opportunistically backfill name / avatar when missing
      if (profile.name || profile.avatarUrl) {
        await queryOne(
          `UPDATE users
             SET name = COALESCE(name, $1),
                 avatar_url = COALESCE(avatar_url, $2)
           WHERE id = $3`,
          [profile.name, profile.avatarUrl, existing.id]
        )
      }
      return { userId: existing.id }
    }
  }

  // 3. Create new user (no password) + link
  if (!profile.email) {
    return { error: 'Provider did not return an email. Please add one and retry.' }
  }
  const created = await queryOne<{ id: string }>(
    'INSERT INTO users (email, password_hash, name, avatar_url) VALUES ($1, NULL, $2, $3) RETURNING id',
    [profile.email.toLowerCase(), profile.name, profile.avatarUrl]
  )
  if (!created) return { error: 'Failed to create user' }

  await queryOne(
    'INSERT INTO oauth_accounts (user_id, provider, provider_account_id, email) VALUES ($1, $2, $3, $4)',
    [created.id, provider, profile.providerAccountId, profile.email.toLowerCase()]
  )

  return { userId: created.id }
}

// ============ Provider profile fetch helpers ============

export async function exchangeCodeForToken(
  provider: Provider,
  code: string,
  redirectUri: string
): Promise<string | null> {
  const cfg = getProviderConfig(provider)
  if (!cfg) return null

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) return null

  const data = (await res.json()) as { access_token?: string }
  return data.access_token || null
}

export async function fetchProfile(
  provider: Provider,
  accessToken: string
): Promise<OAuthProfile | null> {
  const cfg = getProviderConfig(provider)
  if (!cfg) return null

  if (provider === 'github') {
    const userRes = await fetch(cfg.userUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ontheway',
      },
    })
    if (!userRes.ok) return null
    const user = (await userRes.json()) as {
      id: number
      email: string | null
      name: string | null
      login: string
      avatar_url: string | null
    }

    let email = user.email
    if (!email && cfg.emailsUrl) {
      const emailsRes = await fetch(cfg.emailsUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'ontheway',
        },
      })
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string
          primary: boolean
          verified: boolean
        }>
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)
        email = primary?.email || null
      }
    }

    return {
      providerAccountId: String(user.id),
      email,
      name: user.name || user.login,
      avatarUrl: user.avatar_url,
    }
  }

  if (provider === 'google') {
    const res = await fetch(cfg.userUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const user = (await res.json()) as {
      id: string
      email: string
      name?: string
      picture?: string
      verified_email?: boolean
    }
    if (user.verified_email === false) return null
    return {
      providerAccountId: user.id,
      email: user.email || null,
      name: user.name || null,
      avatarUrl: user.picture || null,
    }
  }

  return null
}
