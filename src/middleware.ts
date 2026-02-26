import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  // ---- Auth: refresh session on every request ----
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users from login page
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/record/:path*', '/dashboard/:path*', '/login'],
}
