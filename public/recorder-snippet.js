/**
 * OnTheWay Recorder Script (Snippet Mode)
 * 
 * Communication: HTTP POST to OnTheWay server + BroadcastChannel (same-origin fallback)
 * 
 * Install via console:
 *   (function(){var s=document.createElement('script');s.src='https://ontheway.zoe.im/recorder-snippet.js';s.dataset.session='SESSION_ID';s.dataset.server='https://ontheway.zoe.im';document.head.appendChild(s)})()
 */

(function() {
  'use strict';

  var GLOW_COLOR = '#22c55e';
  var SESSION_KEY = 'otw_recorder_session';
  var SERVER_KEY = 'otw_recorder_server';
  var CHANNEL_NAME = 'otw-recorder';

  // ---- Config from script tag or sessionStorage ----
  var scriptEl = document.currentScript;
  var sessionId = (scriptEl && scriptEl.getAttribute('data-session')) || sessionStorage.getItem(SESSION_KEY);
  var serverUrl = (scriptEl && scriptEl.getAttribute('data-server')) || sessionStorage.getItem(SERVER_KEY) || '';

  if (!sessionId) {
    console.warn('[OnTheWay] No session ID.');
    return;
  }

  // Persist for navigation
  sessionStorage.setItem(SESSION_KEY, sessionId);
  if (serverUrl) sessionStorage.setItem(SERVER_KEY, serverUrl);

  var stepIndex = parseInt(sessionStorage.getItem('otw_step_index') || '0', 10);

  // ---- Communication: HTTP POST (primary) + BroadcastChannel (bonus) ----
  var channel = null;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch(e) {}

  function send(type, data) {
    var payload = Object.assign({ type: type, session: sessionId }, data);

    // BroadcastChannel (same-origin)
    if (channel) {
      try { channel.postMessage(payload); } catch(e) {}
    }

    // HTTP POST (cross-origin, primary)
    var url = (serverUrl || '') + '/api/recorder/ws?session=' + encodeURIComponent(sessionId);
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      }).catch(function() {});
    } catch(e) {}
  }

  // Listen for stop command from BroadcastChannel
  if (channel) {
    channel.onmessage = function(e) {
      var msg = e.data;
      if (msg.session !== sessionId) return;
      if (msg.type === 'ping') send('pong', { url: location.href });
      if (msg.type === 'stop') cleanup();
    };
  }

  // ---- Glow Border ----
  var glowEl = document.createElement('div');
  glowEl.id = 'otw-glow-border';
  var style = document.createElement('style');
  style.textContent = [
    '#otw-glow-border{position:fixed;inset:0;pointer-events:none;z-index:2147483647;',
    'border:3px solid ' + GLOW_COLOR + ';',
    'box-shadow:inset 0 0 20px ' + GLOW_COLOR + '44,0 0 20px ' + GLOW_COLOR + '44;',
    'animation:otw-glow 2s ease-in-out 3}',
    '#otw-glow-border.otw-steady{animation:none;opacity:0.3;border-width:2px}',
    '@keyframes otw-glow{0%,100%{opacity:0.4}50%{opacity:1}}',
    '#otw-badge{position:fixed;top:8px;left:50%;transform:translateX(-50%);',
    'background:' + GLOW_COLOR + ';color:#fff;font:bold 12px/1 system-ui,sans-serif;',
    'padding:6px 16px;border-radius:100px;z-index:2147483647;pointer-events:auto;',
    'cursor:pointer;box-shadow:0 2px 12px ' + GLOW_COLOR + '66;display:flex;align-items:center;gap:6px;user-select:none}',
    '#otw-badge .dot{width:8px;height:8px;background:#fff;border-radius:50%;animation:otw-blink 1s ease-in-out infinite}',
    '@keyframes otw-blink{0%,100%{opacity:1}50%{opacity:0.3}}',
    '#otw-highlight{position:fixed;pointer-events:none;z-index:2147483646;',
    'border:2px solid #3b82f6;background:#3b82f644;border-radius:4px;',
    'transition:all .1s ease;display:none}',
  ].join('\n');
  document.documentElement.appendChild(style);
  document.documentElement.appendChild(glowEl);
  setTimeout(function() { glowEl.classList.add('otw-steady'); }, 6000);

  // ---- Badge ----
  var badge = document.createElement('div');
  badge.id = 'otw-badge';
  badge.innerHTML = '<span class="dot"></span> Recording';
  badge.title = 'Click to stop recording';
  badge.onclick = function() {
    if (confirm('Stop recording?')) {
      send('stop', {});
      cleanup();
    }
  };
  document.documentElement.appendChild(badge);

  // ---- Hover Highlight ----
  var highlight = document.createElement('div');
  highlight.id = 'otw-highlight';
  document.documentElement.appendChild(highlight);

  var hoveredEl = null;

  function isOurs(el) {
    return el && (el.id === 'otw-glow-border' || el.id === 'otw-badge' || el.id === 'otw-highlight' ||
      (el.closest && el.closest('#otw-glow-border,#otw-badge,#otw-highlight')));
  }

  function onMove(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === hoveredEl || isOurs(el)) return;
    hoveredEl = el;
    var r = el.getBoundingClientRect();
    highlight.style.display = 'block';
    highlight.style.top = r.top + 'px';
    highlight.style.left = r.left + 'px';
    highlight.style.width = r.width + 'px';
    highlight.style.height = r.height + 'px';
  }

  function onLeave() {
    highlight.style.display = 'none';
    hoveredEl = null;
  }

  // ---- Click Capture ----
  function onClick(e) {
    var el = e.target;
    if (isOurs(el)) return;
    e.preventDefault();
    e.stopPropagation();

    stepIndex++;
    sessionStorage.setItem('otw_step_index', String(stepIndex));
    var r = el.getBoundingClientRect();

    var step = {
      id: 'step_' + Date.now(),
      index: stepIndex,
      selector: genSelector(el),
      tagName: el.tagName.toLowerCase(),
      innerText: (el.innerText || '').substring(0, 100).trim(),
      rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      url: location.href,
      timestamp: Date.now(),
    };

    send('step', { step: step });

    // Flash
    var orig = el.style.outline;
    el.style.outline = '3px solid ' + GLOW_COLOR;
    setTimeout(function() { el.style.outline = orig; }, 500);
  }

  // ---- Selector Generator ----
  function genSelector(el) {
    if (el.dataset && el.dataset.onthewayId) return '[data-ontheway-id="' + el.dataset.onthewayId + '"]';

    if (el.id && !/^[\d:]/.test(el.id)) {
      try { if (document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id); } catch(e) {}
    }

    var parts = [], cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement && parts.length < 4) {
      var p = cur.tagName.toLowerCase();
      if (cur.id && !/^[\d:]/.test(cur.id)) { parts.unshift('#' + CSS.escape(cur.id)); break; }
      var cls = Array.from(cur.classList || [])
        .filter(function(c) { return !/^(w-|h-|p-|m-|text-|bg-|flex|grid|border|rounded|hover:|focus:|sm:|md:|lg:|xl:)/.test(c); })
        .slice(0, 2);
      if (cls.length) p += '.' + cls.map(function(c) { return CSS.escape(c); }).join('.');
      var parent = cur.parentElement;
      if (parent) {
        var sibs = Array.from(parent.children).filter(function(s) { return s.tagName === cur.tagName; });
        if (sibs.length > 1) p += ':nth-child(' + (sibs.indexOf(cur) + 1) + ')';
      }
      parts.unshift(p);
      cur = cur.parentElement;
    }

    var sel = parts.join(' > ');
    try { if (document.querySelector(sel) === el) return sel; } catch(e) {}

    // Fallback
    parts = []; cur = el;
    while (cur && cur !== document.body) {
      var par = cur.parentElement;
      if (!par) break;
      parts.unshift(cur.tagName.toLowerCase() + ':nth-child(' + (Array.from(par.children).indexOf(cur) + 1) + ')');
      cur = par;
    }
    return 'body > ' + parts.join(' > ');
  }

  // ---- Events ----
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('mouseleave', onLeave, true);
  document.addEventListener('click', onClick, true);

  // ---- Notify server ----
  send('connected', { url: location.href, title: document.title });

  // ---- Cleanup ----
  function cleanup() {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('mouseleave', onLeave, true);
    document.removeEventListener('click', onClick, true);
    glowEl.remove(); badge.remove(); highlight.remove(); style.remove();
    if (channel) channel.close();
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SERVER_KEY);
    sessionStorage.removeItem('otw_step_index');
  }

  window.__otw_stop_recording = cleanup;

  console.log(
    '%c🛤️ OnTheWay Recorder Active %c Session: ' + sessionId + ' | Server: ' + (serverUrl || 'same-origin'),
    'background:#22c55e;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold',
    'color:#666'
  );
})();
