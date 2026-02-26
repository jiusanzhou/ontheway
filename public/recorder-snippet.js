/**
 * OnTheWay Recorder Script (Snippet Mode)
 * 
 * Usage: User copies a <script> tag into their page's console or HTML.
 * Communicates with Dashboard via BroadcastChannel.
 * 
 * Features:
 * - Green glow border on activation
 * - Hover highlight on elements  
 * - Click to capture step (CSS selector + metadata)
 * - BroadcastChannel for tab-to-tab communication
 * - Survives page navigation via sessionStorage
 * - Visual feedback for all states
 */

(function() {
  'use strict';

  // ---- Config ----
  const CHANNEL_NAME = 'otw-recorder';
  const SESSION_KEY = 'otw_recorder_session';
  const GLOW_COLOR = '#22c55e';

  // Get session from script attribute or sessionStorage
  const scriptEl = document.currentScript;
  let sessionId = scriptEl?.getAttribute('data-session') || sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    console.warn('[OnTheWay] No session ID. Use data-session attribute.');
    return;
  }

  // Persist session for navigation
  sessionStorage.setItem(SESSION_KEY, sessionId);

  // ---- BroadcastChannel ----
  const channel = new BroadcastChannel(CHANNEL_NAME);
  let stepIndex = 0;

  function send(type, data) {
    channel.postMessage({ type, session: sessionId, ...data });
  }

  // Listen for commands from Dashboard
  channel.onmessage = function(e) {
    const msg = e.data;
    if (msg.session !== sessionId) return;

    if (msg.type === 'ping') {
      send('pong', { url: location.href });
    } else if (msg.type === 'stop') {
      cleanup();
    }
  };

  // ---- Glow Border (activation indicator) ----
  const glowEl = document.createElement('div');
  glowEl.id = 'otw-glow-border';
  glowEl.innerHTML = `
    <style>
      #otw-glow-border {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483647;
        border: 3px solid ${GLOW_COLOR};
        box-shadow: inset 0 0 20px ${GLOW_COLOR}44, 0 0 20px ${GLOW_COLOR}44;
        animation: otw-glow-pulse 2s ease-in-out 3;
      }
      @keyframes otw-glow-pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      #otw-glow-border.otw-glow-steady {
        animation: none;
        opacity: 0.3;
        border-width: 2px;
      }
      #otw-recorder-badge {
        position: fixed;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: ${GLOW_COLOR};
        color: white;
        font: bold 12px/1 system-ui, sans-serif;
        padding: 6px 16px;
        border-radius: 100px;
        z-index: 2147483647;
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 2px 12px ${GLOW_COLOR}66;
        display: flex;
        align-items: center;
        gap: 6px;
        user-select: none;
      }
      #otw-recorder-badge .otw-dot {
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        animation: otw-dot-blink 1s ease-in-out infinite;
      }
      @keyframes otw-dot-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      #otw-hover-highlight {
        position: fixed;
        pointer-events: none;
        z-index: 2147483646;
        border: 2px solid #3b82f6;
        background: #3b82f644;
        border-radius: 4px;
        transition: all 0.1s ease;
        display: none;
      }
    </style>
  `;
  document.documentElement.appendChild(glowEl);

  // After 3 pulses, switch to steady subtle border
  setTimeout(function() {
    glowEl.classList.add('otw-glow-steady');
  }, 6000);

  // ---- Recording Badge ----
  const badge = document.createElement('div');
  badge.id = 'otw-recorder-badge';
  badge.innerHTML = '<span class="otw-dot"></span> Recording';
  badge.title = 'OnTheWay Recorder — Click to stop';
  badge.onclick = function() {
    if (confirm('Stop recording?')) {
      send('stop', {});
      cleanup();
    }
  };
  document.documentElement.appendChild(badge);

  // ---- Hover Highlight ----
  const highlight = document.createElement('div');
  highlight.id = 'otw-hover-highlight';
  document.documentElement.appendChild(highlight);

  let hoveredEl = null;

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === hoveredEl || isRecorderUI(el)) return;
    hoveredEl = el;

    const rect = el.getBoundingClientRect();
    highlight.style.display = 'block';
    highlight.style.top = rect.top + 'px';
    highlight.style.left = rect.left + 'px';
    highlight.style.width = rect.width + 'px';
    highlight.style.height = rect.height + 'px';
  }

  function onMouseLeave() {
    highlight.style.display = 'none';
    hoveredEl = null;
  }

  function isRecorderUI(el) {
    return el.closest('#otw-glow-border, #otw-recorder-badge, #otw-hover-highlight');
  }

  // ---- Click Capture ----
  function onClick(e) {
    const el = e.target;
    if (isRecorderUI(el)) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = generateSelector(el);
    const rect = el.getBoundingClientRect();

    stepIndex++;
    const step = {
      id: 'step_' + Date.now(),
      index: stepIndex,
      selector: selector,
      tagName: el.tagName.toLowerCase(),
      innerText: (el.innerText || '').substring(0, 100).trim(),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      url: location.href,
      timestamp: Date.now(),
    };

    send('step', { step: step });

    // Flash green on captured element
    const origOutline = el.style.outline;
    el.style.outline = '3px solid ' + GLOW_COLOR;
    setTimeout(function() {
      el.style.outline = origOutline;
    }, 500);
  }

  // ---- CSS Selector Generator ----
  function generateSelector(el) {
    // data-ontheway-id takes priority
    if (el.dataset.onthewayId) {
      return '[data-ontheway-id="' + el.dataset.onthewayId + '"]';
    }

    // ID
    if (el.id && !el.id.match(/^[\d:]/) && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) {
      return '#' + CSS.escape(el.id);
    }

    // Build path
    const parts = [];
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      let part = current.tagName.toLowerCase();

      if (current.id && !current.id.match(/^[\d:]/)) {
        parts.unshift('#' + CSS.escape(current.id));
        break;
      }

      // Use meaningful classes (skip utility classes)
      const classes = Array.from(current.classList)
        .filter(c => !c.match(/^(w-|h-|p-|m-|text-|bg-|flex|grid|border|rounded|hover:|focus:|sm:|md:|lg:|xl:)/))
        .slice(0, 2);

      if (classes.length) {
        part += '.' + classes.map(c => CSS.escape(c)).join('.');
      }

      // nth-child if needed
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(s => s.tagName === current.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(current) + 1;
          part += ':nth-child(' + idx + ')';
        }
      }

      parts.unshift(part);
      current = current.parentElement;

      // Keep selector short
      if (parts.length >= 4) break;
    }

    const selector = parts.join(' > ');

    // Validate
    try {
      if (document.querySelector(selector) === el) return selector;
    } catch {}

    // Fallback: full path
    return buildFullPath(el);
  }

  function buildFullPath(el) {
    const path = [];
    let current = el;
    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (!parent) break;
      const idx = Array.from(parent.children).indexOf(current) + 1;
      path.unshift(current.tagName.toLowerCase() + ':nth-child(' + idx + ')');
      current = parent;
    }
    return 'body > ' + path.join(' > ');
  }

  // ---- Event Listeners ----
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('mouseleave', onMouseLeave, true);
  document.addEventListener('click', onClick, true);

  // ---- Notify Dashboard ----
  send('connected', { url: location.href, title: document.title });

  // ---- Cleanup ----
  function cleanup() {
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('mouseleave', onMouseLeave, true);
    document.removeEventListener('click', onClick, true);
    glowEl.remove();
    badge.remove();
    highlight.remove();
    channel.close();
    sessionStorage.removeItem(SESSION_KEY);
  }

  // Expose cleanup
  window.__otw_stop_recording = cleanup;

  console.log(
    '%c🛤️ OnTheWay Recorder Active %c Session: ' + sessionId,
    'background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
    'color: #666;'
  );
})();
