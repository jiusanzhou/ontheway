import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 匹配 /record/session/https/host/path
  const match = pathname.match(/^\/record\/([^/]+)\/(https?)\/(.+)$/)
  
  if (match) {
    const [, session, protocol, hostAndPath] = match
    const targetUrl = `${protocol}://${hostAndPath}`
    
    // 直接修改 headers 传递参数
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-otw-session', session)
    requestHeaders.set('x-otw-url', targetUrl)
    
    return NextResponse.rewrite(
      new URL('/api/proxy', request.url),
      { headers: requestHeaders }
    )
  }
  
  // 处理被 Next.js 转换后的格式 https:/host
  const singleSlashMatch = pathname.match(/^\/record\/([^/]+)\/(https?):\/([^/].*)$/)
  if (singleSlashMatch) {
    const [, session, protocol, hostAndPath] = singleSlashMatch
    const targetUrl = `${protocol}://${hostAndPath}`
    
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-otw-session', session)
    requestHeaders.set('x-otw-url', targetUrl)
    
    return NextResponse.rewrite(
      new URL('/api/proxy', request.url),
      { headers: requestHeaders }
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/record/:path*',
}
