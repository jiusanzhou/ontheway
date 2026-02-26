/**
 * 录制器注入脚本
 * 用户在自己网站的控制台运行，或通过 Bookmarklet 注入
 * 
 * 使用方式:
 * 1. Bookmarklet: javascript:(function(){...})()
 * 2. Console: 直接粘贴运行
 * 3. Script tag: <script src="https://ontheway.zoe.im/recorder.js?session=xxx"></script>
 */

(function() {
  // 防止重复注入
  if (window.__OTW_RECORDER_ACTIVE__) {
    console.log('[OnTheWay] Recorder already active');
    return;
  }
  window.__OTW_RECORDER_ACTIVE__ = true;

  // 从多个来源获取 session ID
  const getSessionId = () => {
    // 1. 代理模式注入的全局变量
    if (window.__OTW_SESSION__) {
      return window.__OTW_SESSION__;
    }
    // 2. 从 script src 获取
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src.includes('recorder.js')) {
        const match = src.match(/session=([^&]+)/);
        if (match) return match[1];
      }
    }
    // 3. 从 URL hash 获取 (Bookmarklet 方式)
    const hash = window.location.hash;
    const match = hash.match(/otw_session=([^&]+)/);
    if (match) return match[1];
    // 4. 从 localStorage 获取
    return localStorage.getItem('__otw_session__');
  };

  const SESSION_ID = getSessionId();
  const IS_PROXY_MODE = !!window.__OTW_PROXY_MODE__;
  
  // WebSocket URL - 代理模式下使用相对路径
  const getWsUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/recorder/ws`;
  };
  const WS_URL = getWsUrl();

  if (!SESSION_ID) {
    console.error('[OnTheWay] No session ID found. Please start recording from the dashboard first.');
    return;
  }
  
  console.log('[OnTheWay] Mode:', IS_PROXY_MODE ? 'Proxy' : 'Direct');

  let ws = null;
  let isConnected = false;
  let reconnectAttempts = 0;
  const MAX_RECONNECT = 5;
  
  // 使用 SSE 代替 WebSocket (Next.js App Router 兼容)
  let eventSource = null;

  // 创建控制面板 UI
  const createPanel = () => {
    const panel = document.createElement('div');
    panel.id = '__otw_panel__';
    panel.innerHTML = `
      <style>
        #__otw_panel__ {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #1a1a2e;
          color: white;
          padding: 16px;
          border-radius: 12px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          z-index: 2147483647;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          min-width: 200px;
        }
        #__otw_panel__ .otw-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        #__otw_panel__ .otw-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffd700;
        }
        #__otw_panel__ .otw-status.connected {
          background: #00ff88;
          animation: pulse 2s infinite;
        }
        #__otw_panel__ .otw-count {
          color: #888;
          font-size: 12px;
        }
        #__otw_panel__ .otw-btn {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          margin-top: 8px;
        }
        #__otw_panel__ .otw-stop {
          background: #ff4757;
          color: white;
        }
        #__otw_panel__ .otw-stop:hover {
          background: #ff3344;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .__otw_highlight__ {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
          background: rgba(59, 130, 246, 0.1) !important;
        }
      </style>
      <div class="otw-header">
        <div class="otw-status" id="__otw_status__"></div>
        <span>🛤️ OnTheWay Recording</span>
      </div>
      <div class="otw-count" id="__otw_count__">Connecting...</div>
      <button class="otw-btn otw-stop" id="__otw_stop__">Stop Recording</button>
    `;
    document.body.appendChild(panel);
    
    document.getElementById('__otw_stop__').onclick = stopRecording;
    return panel;
  };

  // 生成稳定的 CSS 选择器
  const getSelector = (el) => {
    // 优先使用 data-otw-id
    if (el.dataset.otwId) {
      return `[data-otw-id="${el.dataset.otwId}"]`;
    }
    // 使用 id
    if (el.id && !el.id.match(/^[0-9]/)) {
      return `#${el.id}`;
    }
    // 使用 data-testid (常见测试属性)
    if (el.dataset.testid) {
      return `[data-testid="${el.dataset.testid}"]`;
    }
    // 构建路径
    const path = [];
    let current = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id && !current.id.match(/^[0-9]/)) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      path.unshift(selector);
      current = parent;
    }
    return path.join(' > ');
  };

  // HTTP POST 发送数据 (替代 WebSocket)
  const send = (data) => {
    fetch(`/api/recorder/ws?session=${SESSION_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.warn('[OnTheWay] Send failed:', err));
  };

  // 连接 (使用 SSE 监听，HTTP POST 发送)
  const connect = () => {
    // 发送初始信息
    send({
      type: 'init',
      data: {
        url: IS_PROXY_MODE ? window.__OTW_ORIGIN__ + window.location.pathname.replace(`/record/${SESSION_ID}`, '') : window.location.href,
        title: document.title,
        timestamp: Date.now()
      }
    });
    
    isConnected = true;
    reconnectAttempts = 0;
    updateStatus(true);
    console.log('[OnTheWay] Connected');
  };

  const updateStatus = (connected) => {
    const status = document.getElementById('__otw_status__');
    const count = document.getElementById('__otw_count__');
    if (status) {
      status.className = connected ? 'otw-status connected' : 'otw-status';
    }
    if (count) {
      count.textContent = connected ? `${stepCount} steps captured` : 'Reconnecting...';
    }
  };

  let stepCount = 0;
  let lastHighlighted = null;

  // 点击处理
  const handleClick = (e) => {
    // 忽略面板上的点击
    if (e.target.closest('#__otw_panel__')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const el = e.target;
    const rect = el.getBoundingClientRect();
    
    stepCount++;
    updateStatus(true);
    
    send({
      type: 'step',
      data: {
        selector: getSelector(el),
        tagName: el.tagName,
        innerText: el.innerText?.slice(0, 100),
        placeholder: el.placeholder,
        ariaLabel: el.getAttribute('aria-label'),
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        },
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        timestamp: Date.now()
      }
    });
    
    // 视觉反馈
    el.style.outline = '3px solid #00ff88';
    setTimeout(() => {
      el.style.outline = '';
    }, 300);
  };

  // Hover 高亮
  const handleMouseOver = (e) => {
    if (e.target.closest('#__otw_panel__')) return;
    
    if (lastHighlighted) {
      lastHighlighted.classList.remove('__otw_highlight__');
    }
    e.target.classList.add('__otw_highlight__');
    lastHighlighted = e.target;
  };

  const handleMouseOut = (e) => {
    e.target.classList.remove('__otw_highlight__');
  };

  // 停止录制
  const stopRecording = () => {
    send({ type: 'stop' });
    
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    
    const panel = document.getElementById('__otw_panel__');
    if (panel) panel.remove();
    
    if (lastHighlighted) {
      lastHighlighted.classList.remove('__otw_highlight__');
    }
    
    window.__OTW_RECORDER_ACTIVE__ = false;
    localStorage.removeItem('__otw_session__');
    
    // 代理模式下跳转回 dashboard
    if (IS_PROXY_MODE) {
      window.location.href = `/dashboard/projects/1/tasks/new?session=${SESSION_ID}`;
    }
    
    console.log('[OnTheWay] Recording stopped');
  };

  // 初始化
  createPanel();
  connect();
  
  document.addEventListener('click', handleClick, true);
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  
  console.log('[OnTheWay] Recorder started. Click elements to capture steps.');
})();
