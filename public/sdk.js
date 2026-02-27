// CDN: https://cdn.jsdelivr.net/gh/jiusanzhou/ontheway@main/public/sdk.js
/**
 * OnTheWay SDK (standalone, CDN-ready)
 * 
 * Usage:
 *   <script src="https://ontheway.zoe.im/sdk.js" data-project="PROJECT_ID"></script>
 *
 * Or manually:
 *   <script src="https://ontheway.zoe.im/sdk.js"></script>
 *   <script>
 *     var otw = new OnTheWay({ projectId: 'PROJECT_ID' });
 *     otw.start('welcome-tour');
 *   </script>
 */
(function(global) {
  'use strict';

  var DRIVER_JS_CDN = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';
  var DRIVER_CSS_CDN = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';

  // ---- Driver.js loader ----
  var driverReady = false;
  var driverQueue = [];

  function loadDriverCSS() {
    if (document.querySelector('link[data-otw-driver-css]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = DRIVER_CSS_CDN;
    link.setAttribute('data-otw-driver-css', '1');
    document.head.appendChild(link);
  }

  function loadDriverJS(callback) {
    if (getDriverFn()) {
      driverReady = true;
      callback();
      return;
    }
    // Check if already loading
    if (document.querySelector('script[data-otw-driver-js]')) {
      driverQueue.push(callback);
      return;
    }
    var script = document.createElement('script');
    script.src = DRIVER_JS_CDN;
    script.setAttribute('data-otw-driver-js', '1');
    script.onload = function() {
      driverReady = true;
      callback();
      for (var i = 0; i < driverQueue.length; i++) {
        driverQueue[i]();
      }
      driverQueue = [];
    };
    script.onerror = function() {
      console.error('[OnTheWay] Failed to load Driver.js from CDN');
    };
    document.head.appendChild(script);
  }

  function getDriverFn() {
    // IIFE版: window.driver.js.driver (注意 .js 是属性名)
    if (global.driver) {
      var d = global.driver;
      if (typeof d.driver === 'function') return d.driver;
      if (d.js && typeof d.js.driver === 'function') return d.js.driver;
    }
    return null;
  }

  function ensureDriver(callback) {
    loadDriverCSS();
    if (getDriverFn()) {
      driverReady = true;
      callback();
    } else {
      loadDriverJS(callback);
    }
  }

  // ---- OnTheWay class ----
  function OnTheWay(config) {
    if (!config || !config.projectId) {
      console.error('[OnTheWay] projectId is required');
      return;
    }

    this.projectId = config.projectId;
    this.apiUrl = config.apiUrl || this._detectApiUrl();
    this.onComplete = config.onComplete || null;
    this.onSkip = config.onSkip || null;

    this.tasks = [];
    this.completedTasks = {};
    this.loaded = false;
    this.driverInstance = null;
    this.visitorId = this._getVisitorId();

    this._loadCompleted();
    this._fetchAndInit();
  }

  OnTheWay.prototype._detectApiUrl = function() {
    // If loaded from a script tag, use same origin
    var scripts = document.querySelectorAll('script[src*="sdk.js"]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      try {
        var url = new URL(src);
        return url.origin + '/api';
      } catch(e) {}
    }
    return '/api';
  };

  OnTheWay.prototype._getVisitorId = function() {
    var key = 'otw_visitor_id';
    var id = localStorage.getItem(key);
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  };

  OnTheWay.prototype._loadCompleted = function() {
    var key = 'otw_completed_' + this.projectId;
    try {
      var data = localStorage.getItem(key);
      this.completedTasks = data ? JSON.parse(data) : {};
    } catch(e) {
      this.completedTasks = {};
    }
  };

  OnTheWay.prototype._saveCompleted = function(taskId) {
    this.completedTasks[taskId] = Date.now();
    var key = 'otw_completed_' + this.projectId;
    localStorage.setItem(key, JSON.stringify(this.completedTasks));
  };

  OnTheWay.prototype._fetchAndInit = function() {
    var self = this;
    var url = this.apiUrl + '/sdk/' + this.projectId + '/config';

    fetch(url)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        self.tasks = data.tasks || [];
        self.loaded = true;
        self._handleAutoStart();
      })
      .catch(function(err) {
        console.warn('[OnTheWay] Failed to load config:', err);
      });
  };

  OnTheWay.prototype._handleAutoStart = function() {
    var currentUrl = location.href;

    for (var i = 0; i < this.tasks.length; i++) {
      var task = this.tasks[i];
      if (this.completedTasks[task.id]) continue;

      // URL targeting
      if (task.targeting && task.targeting.urlPattern) {
        try {
          if (!(new RegExp(task.targeting.urlPattern)).test(currentUrl)) continue;
        } catch(e) { continue; }
      }

      if (task.trigger === 'auto') {
        this.start(task.slug);
        break;
      } else if (task.trigger === 'first-visit') {
        var visitKey = 'otw_visited_' + task.id;
        if (!localStorage.getItem(visitKey)) {
          localStorage.setItem(visitKey, '1');
          this.start(task.slug);
          break;
        }
      }
    }
  };

  OnTheWay.prototype.start = function(slugOrId) {
    var task = null;
    for (var i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].slug === slugOrId || this.tasks[i].id === slugOrId) {
        task = this.tasks[i];
        break;
      }
    }
    if (!task) {
      console.warn('[OnTheWay] Task not found: ' + slugOrId);
      return;
    }

    var self = this;
    var taskRef = task;

    ensureDriver(function() {
      var driverFn = getDriverFn();
      if (!driverFn) {
        console.error('[OnTheWay] Driver.js not available');
        return;
      }

      var steps = taskRef.steps.map(function(s) {
        return {
          element: s.element,
          popover: {
            title: s.popover.title,
            description: s.popover.description,
            side: s.popover.side || undefined,
          }
        };
      });

      self.driverInstance = driverFn({
        showProgress: true,
        steps: steps,
        onDestroyStarted: function() {
          if (self.driverInstance.hasNextStep()) {
            var idx = self.driverInstance.getActiveIndex() || 0;
            if (self.onSkip) self.onSkip(taskRef.id, idx);
            self._track(taskRef.id, idx, taskRef.steps.length, false);
          } else {
            self._saveCompleted(taskRef.id);
            if (self.onComplete) self.onComplete(taskRef.id);
            self._track(taskRef.id, taskRef.steps.length, taskRef.steps.length, true);
          }
          self.driverInstance.destroy();
        }
      });

      self.driverInstance.drive();
    });
  };

  OnTheWay.prototype.reset = function(slugOrId) {
    for (var i = 0; i < this.tasks.length; i++) {
      var t = this.tasks[i];
      if (t.slug === slugOrId || t.id === slugOrId) {
        delete this.completedTasks[t.id];
        var key = 'otw_completed_' + this.projectId;
        localStorage.setItem(key, JSON.stringify(this.completedTasks));
        localStorage.removeItem('otw_visited_' + t.id);
        break;
      }
    }
  };

  OnTheWay.prototype.resetAll = function() {
    this.completedTasks = {};
    localStorage.removeItem('otw_completed_' + this.projectId);
    for (var i = 0; i < this.tasks.length; i++) {
      localStorage.removeItem('otw_visited_' + this.tasks[i].id);
    }
  };

  OnTheWay.prototype.getTasks = function() {
    return this.tasks.slice();
  };

  OnTheWay.prototype.isReady = function() {
    return this.loaded;
  };

  OnTheWay.prototype._track = function(taskId, stepsCompleted, totalSteps, completed) {
    try {
      fetch(this.apiUrl + '/sdk/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          visitor_id: this.visitorId,
          steps_completed: stepsCompleted,
          total_steps: totalSteps,
          completed: completed
        })
      }).catch(function() {});
    } catch(e) {}
  };

  // ---- Expose ----
  global.OnTheWay = OnTheWay;

  // ---- Auto-init from script tag ----
  var currentScript = document.currentScript;
  if (currentScript) {
    var projectId = currentScript.getAttribute('data-project');
    if (projectId) {
      var apiUrl = currentScript.getAttribute('data-api') || undefined;
      global.ontheway = new OnTheWay({ projectId: projectId, apiUrl: apiUrl });
    }
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
