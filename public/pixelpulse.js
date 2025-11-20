/**
 * PixelPulse - Lightweight User Analytics
 * Drop this snippet → instant insights
 */
(function() {
  'use strict';

  // Auto-detect endpoint from script src, or use PIXELPULSE_ENDPOINT, or fallback
  let endpoint = window.PIXELPULSE_ENDPOINT;
  if (!endpoint) {
    // Try to find this script tag and extract the origin
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes('pixelpulse.js')) {
        try {
          const url = new URL(src);
          endpoint = url.origin + '/api/pp';
          break;
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }
  }
  // Final fallback (shouldn't be needed if script is loaded correctly)
  if (!endpoint || endpoint === 'https://inkpulse-liard.vercel.app/api/pp') {
    endpoint = window.location.origin + '/api/pp';
  }

  const projectToken = window.PIXELPULSE_TOKEN || null;
  const session = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const pageId = Math.random().toString(36).slice(2);

  // Fire-and-forget send
  const send = (t, p) => {
    try {
      const payload = JSON.stringify({
        t,
        p,
        ts: Date.now(),
        url: location.href,
        session,
        page: pageId,
        token: projectToken // Include project token if available
      });
      
      // Use sendBeacon for reliability, fallback to fetch
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Silent fail - never break the host site
    }
  };

  // Helper: get semantic element info
  const getElementInfo = (el) => {
    if (!el) return null;
    
    const tag = el.tagName?.toLowerCase();
    const text = el.innerText?.slice(0, 80) || el.textContent?.slice(0, 80) || '';
    const id = el.id || '';
    const cls = Array.from(el.classList || []).slice(0, 5);
    const selector = el.id ? '#' + el.id : 
                    el.className ? '.' + cls[0] : 
                    tag;
    
    // Check if it's a semantic click target
    const isSemantic = tag === 'button' || 
                       tag === 'a' || 
                       tag === 'input' || 
                       el.onclick || 
                       el.getAttribute('onclick') ||
                       el.getAttribute('role') === 'button' ||
                       cls.some(c => /btn|button|link|cta|click/i.test(c));

    return { tag, text, id, cls, selector, isSemantic };
  };

  // 1. Semantic Clicks
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-pp]") || e.target;
    const info = getElementInfo(el);
    
    if (info && info.isSemantic) {
      send("click", {
        tag: info.tag,
        text: info.text,
        id: info.id,
        cls: info.cls,
        selector: info.selector,
        x: e.clientX,
        y: e.clientY
      });
    }
  }, true);

  // 2. Rage Clicks (≥4 clicks within 700ms on same element)
  let lastClick = { ts: 0, count: 0, x: 0, y: 0, selector: '' };
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-pp]") || e.target;
    const info = getElementInfo(el);
    if (!info) return;

    const now = Date.now();
    const sameElement = info.selector === lastClick.selector;
    const samePosition = Math.abs(e.clientX - lastClick.x) < 10 && 
                         Math.abs(e.clientY - lastClick.y) < 10;
    const withinTime = now - lastClick.ts < 700;

    if (withinTime && samePosition && sameElement) {
      lastClick.count++;
      if (lastClick.count >= 4) {
        send("rage", {
          selector: info.selector,
          text: info.text,
          count: lastClick.count,
          x: e.clientX,
          y: e.clientY
        });
        lastClick = { ts: 0, count: 0, x: 0, y: 0, selector: '' };
      }
    } else {
      lastClick = { 
        ts: now, 
        count: 1, 
        x: e.clientX, 
        y: e.clientY,
        selector: info.selector
      };
    }
  }, true);

  // 3. Scroll Depth (50%, 75%, 100% - once per page)
  let scrollFired = {};
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.ceil((scrollTop / docHeight) * 100) : 0;

      [50, 75, 100].forEach(pct => {
        if (scrollPercent >= pct && !scrollFired[pct]) {
          send("depth", { pct });
          scrollFired[pct] = true;
        }
      });
    }, 100);
  }, { passive: true });

  // 4. Form Drop-offs
  const touchedFields = new Set();
  const fieldInfo = new Map();
  const fieldTimers = new Map();
  const submittedFields = new Set();

  const trackDropoff = (fieldId) => {
    if (submittedFields.has(fieldId)) return; // Already submitted, don't track as drop-off
    
    const info = fieldInfo.get(fieldId);
    if (!info) return;
    
    // Get the actual value from the element
    let value = '';
    const el = fieldElements.get(fieldId);
    if (el) {
      try {
        value = el.value || '';
      } catch (e) {
        // Element might be removed from DOM
        value = '';
      }
    }
    
    // Capture full value, but mask passwords for security
    let displayValue = '';
    if (value && value.length > 0) {
      if (info.type === 'password') {
        displayValue = '***'; // Never capture passwords
      } else {
        // Capture full value for all other fields including emails
        displayValue = value;
      }
    }
    
    send("drop", {
      field: fieldId,
      type: info.type,
      label: info.label,
      value: displayValue,
      hasValue: value.length > 0
    });
    touchedFields.delete(fieldId);
    fieldInfo.delete(fieldId);
    fieldElements.delete(fieldId);
    if (fieldTimers.has(fieldId)) {
      clearTimeout(fieldTimers.get(fieldId));
      fieldTimers.delete(fieldId);
    }
  };

  // Store element references by field ID for value retrieval
  const fieldElements = new Map();

  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
      const fieldId = el.name || el.id || el.placeholder || 'unknown';
      touchedFields.add(fieldId);
      fieldElements.set(fieldId, el); // Store element reference
      fieldInfo.set(fieldId, {
        type: el.type || 'text',
        label: el.labels?.[0]?.textContent || el.placeholder || fieldId
      });
      
      // Clear any existing timer for this field
      if (fieldTimers.has(fieldId)) {
        clearTimeout(fieldTimers.get(fieldId));
      }
    }
  }, true);

  // Track when user leaves a field without submitting
  document.addEventListener("focusout", (e) => {
    const el = e.target;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
      const fieldId = el.name || el.id || el.placeholder || 'unknown';
      
      if (touchedFields.has(fieldId) && !submittedFields.has(fieldId)) {
        // Update element reference to ensure we have the latest value
        fieldElements.set(fieldId, el);
        
        // Set a timer - if form isn't submitted within 2 seconds, track as drop-off
        const timer = setTimeout(() => {
          trackDropoff(fieldId);
        }, 2000);
        fieldTimers.set(fieldId, timer);
      }
    }
  }, true);

  // Track form submissions
  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.tagName === "FORM") {
      // Mark all touched fields as submitted
      touchedFields.forEach(fieldId => {
        submittedFields.add(fieldId);
        send("form_submit", {
          field: fieldId,
          success: true
        });
        // Clear timers
        if (fieldTimers.has(fieldId)) {
          clearTimeout(fieldTimers.get(fieldId));
          fieldTimers.delete(fieldId);
        }
      });
      touchedFields.clear();
      fieldInfo.clear();
      fieldElements.clear();
      submittedFields.clear();
    }
  }, true);

  // Track form resets
  document.addEventListener("reset", (e) => {
    const form = e.target;
    if (form.tagName === "FORM") {
      // Form was reset, track all touched fields as drop-offs
      touchedFields.forEach(fieldId => {
        if (!submittedFields.has(fieldId)) {
          trackDropoff(fieldId);
        }
      });
      touchedFields.clear();
      fieldInfo.clear();
      fieldElements.clear();
      submittedFields.clear();
    }
  }, true);

  // Send drop-offs on page unload (fallback)
  window.addEventListener("beforeunload", () => {
    touchedFields.forEach(fieldId => {
      if (!submittedFields.has(fieldId)) {
        const info = fieldInfo.get(fieldId);
        if (!info) return;
        
        // Get value from element
        let value = '';
        const el = fieldElements.get(fieldId);
        if (el) {
          try {
            value = el.value || '';
          } catch (e) {
            value = '';
          }
        }
        
        let displayValue = '';
        if (value && value.length > 0) {
          if (info.type === 'password') {
            displayValue = '***'; // Never capture passwords
          } else {
            // Capture full value for all other fields including emails
            displayValue = value;
          }
        }
        
        send("drop", {
          field: fieldId,
          type: info.type,
          label: info.label,
          value: displayValue,
          hasValue: value.length > 0
        });
      }
    });
  });

  // Track navigation in SPAs (for Next.js, React Router, etc.)
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      // Page changed, track any remaining drop-offs
      touchedFields.forEach(fieldId => {
        if (!submittedFields.has(fieldId)) {
          trackDropoff(fieldId);
        }
      });
      lastUrl = location.href;
    }
  }, 1000);

  // 5. Broken UI Flows
  let clickTimeouts = new Map();
  let lastNavigationTime = Date.now();

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-pp]") || e.target;
    const info = getElementInfo(el);
    if (!info || !info.isSemantic) return;

    const clickId = info.selector + Date.now();
    const startTime = Date.now();

    // Check if nothing happened after 2 seconds
    clickTimeouts.set(clickId, setTimeout(() => {
      const timeSinceNav = Date.now() - lastNavigationTime;
      if (timeSinceNav > 2000) {
        send("broken_flow", {
          type: "no_response",
          selector: info.selector,
          text: info.text,
          duration: 2000
        });
      }
      clickTimeouts.delete(clickId);
    }, 2000));
  }, true);

  // Track navigation
  let navigationStart = performance.now();
  window.addEventListener("popstate", () => {
    lastNavigationTime = Date.now();
    clickTimeouts.forEach(clearTimeout);
    clickTimeouts.clear();
  });

  // Track fetch errors
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(err => {
      send("broken_flow", {
        type: "fetch_error",
        url: args[0],
        error: err.message
      });
      throw err;
    });
  };

  // 6. JS Errors
  window.addEventListener("error", (e) => {
    send("jserr", {
      msg: e.message,
      src: e.filename || e.target?.src,
      line: e.lineno,
      col: e.colno,
      stack: e.error?.stack?.slice(0, 500)
    });
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    send("jserr", {
      promise: true,
      reason: String(e.reason),
      stack: e.reason?.stack?.slice(0, 500)
    });
  });

  // 7. Component Slowdowns (Long Tasks)
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const po = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 200) {
            send("slow", {
              dur: Math.round(entry.duration),
              name: entry.name,
              type: entry.entryType
            });
          }
        });
      });
      po.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  // Track slow network requests
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const po = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource' && entry.duration > 3000) {
            send("slow", {
              dur: Math.round(entry.duration),
              name: entry.name,
              type: "slow_resource",
              size: entry.transferSize
            });
          }
        });
      });
      po.observe({ entryTypes: ["resource"] });
    } catch (e) {
      // Not supported
    }
  }

  // Page visibility tracking
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      send("page_hide", { duration: Date.now() });
    }
  });

})();


