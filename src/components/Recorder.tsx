'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface RecordedStep {
  id: string
  selector: string
  tagName: string
  innerText?: string
  rect: DOMRect
  timestamp: number
}

interface RecorderProps {
  targetUrl: string
  onStepRecorded: (step: RecordedStep) => void
  onStop: () => void
  isRecording: boolean
}

/**
 * 录制器组件 - 通过 iframe 嵌入用户网站并捕获点击
 * 
 * 工作原理:
 * 1. 用户网站在 iframe 中加载
 * 2. 注入录制脚本监听点击
 * 3. 通过 postMessage 传递点击信息
 */
export function Recorder({ targetUrl, onStepRecorded, onStop, isRecording }: RecorderProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // 生成稳定的 CSS 选择器
  const generateSelector = useCallback((path: string[]): string => {
    // path 是从目标元素到根的标签路径
    // 尝试用 id, 否则用 nth-child
    return path.join(' > ')
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 验证来源
      if (!targetUrl.includes(event.origin)) return
      
      const { type, data } = event.data
      
      if (type === 'OTW_RECORDER_READY') {
        setLoaded(true)
        setError(null)
      } else if (type === 'OTW_ELEMENT_CLICKED' && isRecording) {
        const step: RecordedStep = {
          id: Date.now().toString(),
          selector: data.selector,
          tagName: data.tagName,
          innerText: data.innerText?.slice(0, 50),
          rect: data.rect,
          timestamp: Date.now()
        }
        onStepRecorded(step)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [targetUrl, isRecording, onStepRecorded])

  // 注入录制脚本到 iframe
  const injectRecorderScript = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return

    try {
      // 注入录制脚本
      const script = `
        (function() {
          if (window.__OTW_RECORDER__) return;
          window.__OTW_RECORDER__ = true;
          
          // 通知父窗口已就绪
          window.parent.postMessage({ type: 'OTW_RECORDER_READY' }, '*');
          
          // 生成唯一选择器
          function getSelector(el) {
            if (el.id) return '#' + el.id;
            if (el === document.body) return 'body';
            
            const parent = el.parentElement;
            if (!parent) return el.tagName.toLowerCase();
            
            const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
            const index = siblings.indexOf(el);
            const tagName = el.tagName.toLowerCase();
            
            if (siblings.length === 1) {
              return getSelector(parent) + ' > ' + tagName;
            }
            return getSelector(parent) + ' > ' + tagName + ':nth-child(' + (index + 1) + ')';
          }
          
          // 监听点击
          document.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const el = e.target;
            const rect = el.getBoundingClientRect();
            
            window.parent.postMessage({
              type: 'OTW_ELEMENT_CLICKED',
              data: {
                selector: getSelector(el),
                tagName: el.tagName,
                innerText: el.innerText,
                rect: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                }
              }
            }, '*');
          }, true);
          
          // 高亮 hover 元素
          const highlight = document.createElement('div');
          highlight.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);z-index:999999;transition:all 0.1s;';
          document.body.appendChild(highlight);
          
          document.addEventListener('mousemove', function(e) {
            const el = e.target;
            const rect = el.getBoundingClientRect();
            highlight.style.top = rect.top + 'px';
            highlight.style.left = rect.left + 'px';
            highlight.style.width = rect.width + 'px';
            highlight.style.height = rect.height + 'px';
          });
        })();
      `
      
      iframe.contentWindow.postMessage({ 
        type: 'OTW_INJECT_SCRIPT', 
        script 
      }, '*')
    } catch (err) {
      setError('无法注入录制脚本，目标网站可能禁止跨域访问')
    }
  }, [])

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="absolute top-0 left-0 right-0 bg-white border-b px-4 py-2 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="flex items-center gap-1 text-red-500 text-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Recording
            </span>
          )}
          <span className="text-sm text-gray-500 truncate max-w-md">{targetUrl}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={injectRecorderScript}
            className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            disabled={!loaded}
          >
            🔄 Reinject
          </button>
          <button 
            onClick={onStop}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute top-12 left-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm z-10">
          {error}
          <div className="mt-2 text-xs">
            提示: 使用 Chrome Extension 模式可以绕过跨域限制
          </div>
        </div>
      )}

      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={targetUrl}
        className="w-full h-full pt-12"
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={injectRecorderScript}
        onError={() => setError('无法加载目标网站')}
      />

      {/* Loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Recorder
