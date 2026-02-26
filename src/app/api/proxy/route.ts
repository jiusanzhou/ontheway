import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy API route - called by middleware rewrite for /record/session/https/host/path
 * 
 * Two modes:
 * 1. Initial HTML page: returns proxy-loader.html which registers the Service Worker
 * 2. Subsequent requests (via SW): handled by /api/proxy/fetch
 * 
 * Fallback: if SW is not supported, this route does server-side HTML injection.
 */

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('x-otw-session')
  const targetUrl = request.headers.get('x-otw-url')

  if (!sessionId || !targetUrl) {
    return new NextResponse('Usage: /record/[session]/https/example.com', { status: 400 })
  }

  // Fix URL format
  let fixedUrl = targetUrl
  if (/^https?:\/[^/]/.test(fixedUrl)) {
    fixedUrl = fixedUrl.replace(/^(https?):\/([^/])/, '$1://$2')
  }

  let url: URL
  try {
    url = new URL(fixedUrl)
  } catch {
    return new NextResponse('Invalid URL: ' + fixedUrl, { status: 400 })
  }

  const apiOrigin = request.nextUrl.origin
  const prefix = `/record/${sessionId}`

  // Return the SW loader page - it registers the SW, then navigates to the target
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OnTheWay Recorder — Loading...</title>
<style>
  body {
    margin: 0; display: flex; align-items: center; justify-content: center;
    height: 100vh; font-family: system-ui, sans-serif; background: #f9fafb;
    color: #374151;
  }
  .loader {
    text-align: center; max-width: 400px; padding: 24px;
  }
  .spinner {
    width: 40px; height: 40px; border: 3px solid #e5e7eb;
    border-top-color: #22c55e; border-radius: 50%;
    animation: spin 0.8s linear infinite; margin: 0 auto 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  h2 { margin: 0 0 8px; font-size: 18px; }
  p { margin: 0; font-size: 14px; color: #6b7280; }
  .error { color: #dc2626; display: none; margin-top: 12px; font-size: 13px; }
  .fallback { margin-top: 16px; display: none; }
  .fallback a {
    display: inline-block; padding: 8px 20px; background: #111; color: #fff;
    border-radius: 8px; text-decoration: none; font-size: 14px;
  }
</style>
</head>
<body>
<div class="loader">
  <div class="spinner" id="spinner"></div>
  <h2>🛤️ OnTheWay Recorder</h2>
  <p id="status">Initializing proxy...</p>
  <div class="error" id="error"></div>
  <div class="fallback" id="fallback">
    <p style="margin-bottom:12px">Service Worker not available. Using server-side proxy instead.</p>
    <a id="fallback-link" href="#">Continue →</a>
  </div>
</div>
<script>
(function() {
  var config = {
    session: ${JSON.stringify(sessionId)},
    baseUrl: ${JSON.stringify(url.origin)},
    apiOrigin: ${JSON.stringify(apiOrigin)},
    prefix: ${JSON.stringify(prefix)},
    targetUrl: ${JSON.stringify(url.href)},
  };

  var statusEl = document.getElementById('status');
  var errorEl = document.getElementById('error');
  var fallbackEl = document.getElementById('fallback');
  var spinnerEl = document.getElementById('spinner');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function showFallback() {
    spinnerEl.style.display = 'none';
    fallbackEl.style.display = 'block';
    var fallbackUrl = config.prefix + '/' + config.targetUrl.replace(/^https?:\\/\\//, function(m) {
      return m.replace('://', '/');
    });
    // Actually, just use server-side proxy directly
    document.getElementById('fallback-link').href = '/api/proxy/fetch?url=' + encodeURIComponent(config.targetUrl) + '&session=' + encodeURIComponent(config.session);
  }

  if (!('serviceWorker' in navigator)) {
    statusEl.textContent = 'Service Worker not supported.';
    showFallback();
    return;
  }

  statusEl.textContent = 'Registering Service Worker...';

  // Register SW at the /record/session/ scope
  navigator.serviceWorker.register('/proxy-sw.js', {
    scope: config.prefix + '/'
  })
  .then(function(reg) {
    statusEl.textContent = 'Service Worker registered, waiting for activation...';

    var sw = reg.installing || reg.waiting || reg.active;

    function onActive() {
      statusEl.textContent = 'Sending proxy config...';

      // Send config to SW
      if (reg.active) {
        reg.active.postMessage({
          type: 'otw-proxy-config',
          config: config
        });
      }

      // Small delay for SW to process config
      setTimeout(function() {
        statusEl.textContent = 'Redirecting to target site...';
        // Navigate to the target URL through the proxy scope
        // The SW will intercept this and proxy it
        window.location.href = config.prefix + '/' + config.targetUrl.replace('://', '/');
      }, 300);
    }

    if (sw && sw.state === 'activated') {
      onActive();
    } else if (sw) {
      sw.addEventListener('statechange', function() {
        if (sw.state === 'activated') onActive();
      });
    }

    // Timeout fallback
    setTimeout(function() {
      if (!reg.active) {
        statusEl.textContent = 'Service Worker activation timed out.';
        showFallback();
      }
    }, 10000);
  })
  .catch(function(err) {
    statusEl.textContent = 'Failed to register Service Worker.';
    showError(err.message);
    showFallback();
  });
})();
</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Allow SW to register at this scope
      'Service-Worker-Allowed': prefix + '/',
    },
  })
}
