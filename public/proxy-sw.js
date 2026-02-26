/**
 * OnTheWay Proxy Service Worker
 * 
 * Intercepts all requests within the recording scope and rewrites them
 * through the OnTheWay proxy API. This eliminates URL rewriting issues
 * in HTML/CSS/JS that server-side proxying suffers from.
 * 
 * Architecture:
 *   Browser ──fetch──► Service Worker ──rewrite──► /api/proxy/fetch?url=TARGET
 */

const CONFIG_KEY = 'otw-proxy-config';

// Set during SW registration via message
let proxyConfig = {
  session: '',
  baseUrl: '',      // e.g. https://example.com
  apiOrigin: '',    // e.g. http://localhost:3000
  prefix: '',       // e.g. /record/session123/https/example.com
};

// ---- Install / Activate ----
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ---- Config from main page ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'otw-proxy-config') {
    proxyConfig = event.data.config;
    // Store in case of SW restart
    // (IndexedDB would be better but this is simpler for now)
  }
});

// ---- Fetch interception ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip our own API calls and SW scripts
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') ||
      url.pathname === '/recorder-snippet.js' || url.pathname === '/proxy-sw.js' ||
      url.pathname === '/proxy-loader.html') {
    return;
  }

  // Skip non-http
  if (!url.protocol.startsWith('http')) return;

  // If request is to our proxy prefix, extract the real URL
  if (url.pathname.startsWith('/record/')) {
    const match = url.pathname.match(/^\/record\/[^/]+\/(https?)\/(.+)$/);
    if (match) {
      const targetUrl = match[1] + '://' + match[2] + url.search;
      event.respondWith(proxyFetch(targetUrl, event.request));
      return;
    }
  }

  // If request is to the target origin, proxy it
  const targetOrigin = proxyConfig.baseUrl ? new URL(proxyConfig.baseUrl).origin : '';
  if (targetOrigin && url.origin === targetOrigin) {
    const targetUrl = url.href;
    event.respondWith(proxyFetch(targetUrl, event.request));
    return;
  }

  // If request is to our own origin but not an API/asset, it might be a relative URL
  // that the target page requested - resolve against target base
  if (proxyConfig.baseUrl && url.origin === (proxyConfig.apiOrigin || self.location.origin)) {
    // Check if this looks like a page resource (not our app routes)
    if (!url.pathname.startsWith('/dashboard') && !url.pathname.startsWith('/login') &&
        !url.pathname.startsWith('/docs') && !url.pathname.startsWith('/demo') &&
        url.pathname !== '/') {
      const targetUrl = new URL(url.pathname + url.search, proxyConfig.baseUrl).href;
      event.respondWith(proxyFetch(targetUrl, event.request));
      return;
    }
  }
});

// ---- Proxy fetch through our API ----
async function proxyFetch(targetUrl, originalRequest) {
  const apiUrl = (proxyConfig.apiOrigin || '') +
    '/api/proxy/fetch?url=' + encodeURIComponent(targetUrl) +
    '&session=' + encodeURIComponent(proxyConfig.session);

  try {
    const res = await fetch(apiUrl, {
      method: originalRequest.method,
      headers: {
        'X-OTW-Original-Accept': originalRequest.headers.get('Accept') || '*/*',
      },
      // Don't forward body for GET/HEAD
      body: ['GET', 'HEAD'].includes(originalRequest.method) ? undefined : originalRequest.body,
    });

    // Clone response with CORS-safe headers
    const headers = new Headers();
    // Copy safe headers
    for (const [key, value] of res.headers) {
      if (!key.startsWith('x-otw-')) {
        headers.set(key, value);
      }
    }

    // Get content type from response
    const contentType = res.headers.get('content-type') || '';
    const isHTML = contentType.includes('text/html');

    if (isHTML) {
      // Inject recorder script into HTML
      let html = await res.text();
      const injectScript = `
<script>
  window.__OTW_PROXY__ = {
    session: "${proxyConfig.session}",
    baseUrl: "${proxyConfig.baseUrl}",
    apiOrigin: "${proxyConfig.apiOrigin}"
  };
</script>
<script src="${proxyConfig.apiOrigin || ''}/recorder-snippet.js"
        data-session="${proxyConfig.session}"
        data-server="${proxyConfig.apiOrigin || ''}"></script>
`;
      // Inject before </head> or at start
      if (html.includes('</head>')) {
        html = html.replace('</head>', injectScript + '</head>');
      } else {
        html = injectScript + html;
      }

      return new Response(html, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (err) {
    return new Response('Proxy Error: ' + err.message, { status: 502 });
  }
}
