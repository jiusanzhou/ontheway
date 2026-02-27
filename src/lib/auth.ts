import { cookies } from 'next/headers'
import { query, queryOne } from './db'

// ============ Password hashing with Web Crypto API ============

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // PBKDF2-like: SHA-256(salt + password) iterated
  // We'll use a simple but secure approach: SHA-256(salt || password) with multiple iterations
  const iterations = 10000
  let data = encoder.encode(saltHex + password)

  for (let i = 0; i < iterations; i++) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    data = new Uint8Array(hashBuffer)
  }

  const hashHex = Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `${saltHex}:${iterations}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, iterStr, expectedHash] = stored.split(':')
  if (!saltHex || !iterStr || !expectedHash) return false

  const encoder = new TextEncoder()
  const iterations = parseInt(iterStr, 10)
  let data = encoder.encode(saltHex + password)

  for (let i = 0; i < iterations; i++) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    data = new Uint8Array(hashBuffer)
  }

  const hashHex = Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hashHex === expectedHash
}

// ============ Session (HMAC-SHA256 signed cookie) ============

const SESSION_SECRET = process.env.SESSION_SECRET || 'ontheway-dev-secret-change-me'
const COOKIE_NAME = 'otw_session'

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function signSession(userId: string): Promise<string> {
  const sig = await hmacSign(userId)
  return `${userId}.${sig}`
}

async function verifySessionToken(token: string): Promise<string | null> {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return null

  const userId = token.substring(0, dotIndex)
  const sig = token.substring(dotIndex + 1)

  const expectedSig = await hmacSign(userId)
  if (sig !== expectedSig) return null

  return userId
}

// ============ Public API ============

export async function signUp(email: string,
  password: string
): Promise<{ userId: string } | { error: string }> {
  // Check if user already exists
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  )
  if (existing) {
    return { error: 'User already exists' }
  }

  const passwordHash = await hashPassword(password)
  const user = await queryOne<{ id: string }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [email.toLowerCase(), passwordHash]
  )

  if (!user) {
    return { error: 'Failed to create user' }
  }

  // Set session cookie
  const token = await signSession(user.id)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return { userId: user.id }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ userId: string } | { error: string }> {
  const user = await queryOne<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()]
  )

  if (!user) {
    return { error: 'Invalid email or password' }
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return { error: 'Invalid email or password' }
  }

  // Set session cookie
  const token = await signSession(user.id)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return { userId: user.id }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const userId = await verifySessionToken(token)
  if (!userId) return null

  const user = await queryOne<{ id: string; email: string }>(
    'SELECT id, email FROM users WHERE id = $1',
    [userId]
  )

  return user || null
}

export async function requireUser(): Promise<{ id: string; email: string }> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

// Export for middleware use (doesn't need DB, just verifies cookie signature)
export { verifySessionToken, COOKIE_NAME }
