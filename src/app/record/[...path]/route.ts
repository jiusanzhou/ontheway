import { NextRequest, NextResponse } from 'next/server'

/**
 * 代理模式录制器
 * 
 * 访问: /record/[session]/https://example.com/path
 * 代理用户网站并自动注入录制脚本
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  
  // path[0] = session ID, path[1...] = 目标 URL
  const sessionId = path[0]
  const targetUrl = path.slice(1).join('/')
  
  if (!sessionId || !targetUrl) {
    return new NextResponse('Usage: /record/[session]/https://example.com', { status: 400 })
  }

  // 修复 URL (Next.js 会把 :// 变成 :/)
  const fixedUrl = targetUrl.replace(/^(https?):\/([^/])/, '$1://$2')
  
  try {
    const url = new URL(fixedUrl)
    
    // 代理请求
    const response = await fetch(url.href, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'text/html',
        'Accept-Language': request.headers.get('accept-language') || '',
        'Cookie': request.headers.get('cookie') || '',
      },
      redirect: 'follow',
    })

    const contentType = response.headers.get('content-type') || ''
    
    // 只对 HTML 页面注入脚本
    if (contentType.includes('text/html')) {
      let html = await response.text()
      
      // 注入录制脚本和代理配置
      const injectionScript = `
<script>
  // OnTheWay Recorder Config
  window.__OTW_PROXY_MODE__ = true;
  window.__OTW_SESSION__ = '${sessionId}';
  window.__OTW_ORIGIN__ = '${url.origin}';
  window.__OTW_PROXY_BASE__ = '/record/${sessionId}';
  
  // 拦截所有链接点击，改写为代理 URL
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // 跳过外部链接和特殊协议
    if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('#')) {
      return;
    }
    
    e.preventDefault();
    
    let targetUrl;
    if (href.startsWith('http')) {
      targetUrl = href;
    } else if (href.startsWith('//')) {
      targetUrl = 'https:' + href;
    } else if (href.startsWith('/')) {
      targetUrl = window.__OTW_ORIGIN__ + href;
    } else {
      targetUrl = window.__OTW_ORIGIN__ + '/' + href;
    }
    
    window.location.href = window.__OTW_PROXY_BASE__ + '/' + targetUrl;
  }, true);
  
  // 拦截表单提交
  document.addEventListener('submit', function(e) {
    const form = e.target;
    const action = form.getAttribute('action') || '';
    
    if (action.startsWith('http')) {
      form.setAttribute('action', window.__OTW_PROXY_BASE__ + '/' + action);
    } else if (action.startsWith('/')) {
      form.setAttribute('action', window.__OTW_PROXY_BASE__ + '/' + window.__OTW_ORIGIN__ + action);
    } else if (action) {
      form.setAttribute('action', window.__OTW_PROXY_BASE__ + '/' + window.__OTW_ORIGIN__ + '/' + action);
    }
  }, true);
</script>
<script src="/recorder.js"></script>
`
      // 在 </head> 或 <body> 前注入
      if (html.includes('</head>')) {
        html = html.replace('</head>', injectionScript + '</head>')
      } else if (html.includes('<body')) {
        html = html.replace(/<body/i, injectionScript + '<body')
      } else {
        html = injectionScript + html
      }
      
      // 改写 HTML 中的资源 URL (CSS, JS, 图片等)
      html = rewriteResourceUrls(html, url.origin, sessionId)
      
      return new NextResponse(html, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
    
    // 非 HTML 内容直接代理
    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': response.headers.get('cache-control') || 'public, max-age=3600',
      },
    })
    
  } catch (error) {
    console.error('[Proxy Error]', error)
    return new NextResponse(`Failed to load: ${fixedUrl}`, { status: 502 })
  }
}

/**
 * 改写资源 URL
 * 将相对路径和绝对路径都改写为代理路径
 */
function rewriteResourceUrls(html: string, origin: string, sessionId: string): string {
  const proxyBase = `/record/${sessionId}`
  
  // 改写 src 和 href 属性中的 URL
  // 匹配: src="/path" href="/path" src="https://..." 等
  html = html.replace(
    /(src|href|action)=(["'])((?:https?:)?\/\/[^"']+|\/[^"']*)(["'])/gi,
    (match, attr, q1, url, q2) => {
      // 跳过 data: 和 javascript: URL
      if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) {
        return match
      }
      
      let fullUrl: string
      if (url.startsWith('http')) {
        fullUrl = url
      } else if (url.startsWith('//')) {
        fullUrl = 'https:' + url
      } else {
        fullUrl = origin + url
      }
      
      return `${attr}=${q1}${proxyBase}/${fullUrl}${q2}`
    }
  )
  
  // 改写 CSS url() 中的路径
  html = html.replace(
    /url\((["']?)((?:https?:)?\/\/[^)"']+|\/[^)"']*)(["']?)\)/gi,
    (match, q1, url, q2) => {
      if (url.startsWith('data:')) return match
      
      let fullUrl: string
      if (url.startsWith('http')) {
        fullUrl = url
      } else if (url.startsWith('//')) {
        fullUrl = 'https:' + url
      } else {
        fullUrl = origin + url
      }
      
      return `url(${q1}${proxyBase}/${fullUrl}${q2})`
    }
  )
  
  return html
}

// 处理 POST 请求（表单提交）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const sessionId = path[0]
  const targetUrl = path.slice(1).join('/').replace(/^(https?):\/([^/])/, '$1://$2')
  
  try {
    const body = await request.text()
    const contentType = request.headers.get('content-type') || ''
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'User-Agent': request.headers.get('user-agent') || '',
        'Cookie': request.headers.get('cookie') || '',
      },
      body,
      redirect: 'follow',
    })
    
    // 处理重定向
    if (response.redirected) {
      const redirectUrl = `/record/${sessionId}/${response.url}`
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    
    const responseContentType = response.headers.get('content-type') || ''
    
    if (responseContentType.includes('text/html')) {
      let html = await response.text()
      const url = new URL(targetUrl)
      html = rewriteResourceUrls(html, url.origin, sessionId)
      
      return new NextResponse(html, {
        status: response.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
    
    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: { 'Content-Type': responseContentType },
    })
    
  } catch (error) {
    console.error('[Proxy POST Error]', error)
    return new NextResponse('Proxy error', { status: 502 })
  }
}
