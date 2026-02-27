import { NextRequest, NextResponse } from 'next/server'

// Inline session verification for middleware (can't use Node.js crypto, use Web Crypto API)
const SESSION_SECRET = process.env.SESSION_SECRET || 'ontheway-dev-secret-change-me'
const COOKIE_NAME = 'otw_session'

async function verifySessionInMiddleware(token: string): Promise<string | null> {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return null

  const userId = token.substring(0, dotIndex)
  const sig = token.substring(dotIndex + 1)

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(userId))
  const expectedSig = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (sig !== expectedSig) return null
  return userId
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ---- Proxy recording routes ----
  const match = pathname.match(/^\/record\/([^/]+)\/(https?)\/(.+)$/)
  if (match) {
    const [, session, protocol, hostAndPath] = match
    const targetUrl = `${protocol}://${hostAndPath}`
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-otw-session', session)
    requestHeaders.set('x-otw-url', targetUrl)
    return NextResponse.rewrite(new URL('/api/proxy', request.url), { headers: requestHeaders })
  }

  const singleSlashMatch = pathname.match(/^\/record\/([^/]+)\/(https?):\/([^/].*)$/)
  if (singleSlashMatch) {
    const [, session, protocol, hostAndPath] = singleSlashMatch
    const targetUrl = `${protocol}://${hostAndPath}`
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-otw-session', session)
    requestHeaders.set('x-otw-url', targetUrl)
    return NextResponse.rewrite(new URL('/api/proxy', request.url), { headers: requestHeaders })
  }

  // ---- Auth: verify session cookie ----
  const token = request.cookies.get(COOKIE_NAME)?.value
  let userId: string | null = null

  if (token) {
    userId = await verifySessionInMiddleware(token)
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users from login page
  if (pathname === '/login' && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/record/:path*', '/dashboard/:path*', '/login'],
}
