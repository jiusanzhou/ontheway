import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy fetch API - Service Worker calls this to fetch external resources.
 * Avoids CORS issues by fetching server-side.
 */
export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url')
  const session = request.nextUrl.searchParams.get('session')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, {
      status: 400,
      headers: corsHeaders(),
    })
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'OnTheWay-Proxy/1.0',
        'Accept': request.headers.get('x-otw-original-accept') || '*/*',
        'Accept-Encoding': 'gzip, deflate',
      },
      redirect: 'follow',
    })

    // Read response
    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const body = await res.arrayBuffer()

    // Build response headers
    const headers: Record<string, string> = {
      ...corsHeaders(),
      'Content-Type': contentType,
      'X-OTW-Session': session || '',
      'X-OTW-Target': targetUrl,
    }

    // Forward cache headers
    const cacheControl = res.headers.get('cache-control')
    if (cacheControl) headers['Cache-Control'] = cacheControl

    return new NextResponse(body, {
      status: res.status,
      headers,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, {
      status: 502,
      headers: corsHeaders(),
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() })
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-OTW-Original-Accept',
  }
}
