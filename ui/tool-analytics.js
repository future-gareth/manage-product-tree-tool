// Universal Analytics Tracking for GarethAPI Tools
// This script can be included in any of your web tools for consistent tracking

(function() {
  'use strict';

  // Configuration - Update these values for each tool
  const TOOL_CONFIG = {
    toolName: 'unknown', // Will be auto-detected or set manually
    toolVersion: '1.0.0',
    ga4MeasurementId: 'G-5ZDR6FJYHX', // Your actual GA4 ID
    debugMode: false,
    trackUserJourney: true,
    trackPerformance: true,
    trackErrors: true
  };

  // Auto-detect tool name from URL or set manually
  function detectToolName() {
    const pathname = window.location.pathname;
    const toolMap = {
      '/api-designer/': 'api-designer',
      '/mcp-designer/': 'mcp-designer',
      '/product-tree-manager/': 'product-tree-manager',
      '/product-tree-jira/': 'product-tree-jira',
      '/central-ai/': 'centralised-ai-service'
    };
    
    for (const [path, name] of Object.entries(toolMap)) {
      if (pathname.includes(path)) {
        return name;
      }
    }
    
    return 'unknown-tool';
  }

  // Initialize tool configuration
  TOOL_CONFIG.toolName = detectToolName();

  // Tracking state
  let sessionData = {
    startTime: Date.now(),
    interactions: 0,
    errors: 0,
    featuresUsed: new Set(),
    userActions: []
  };

  // Utility functions
  function log(message, data = null) {
    if (TOOL_CONFIG.debugMode) {
      console.log(`[${TOOL_CONFIG.toolName} Analytics] ${message}`, data);
    }
  }

  function trackEvent(eventName, parameters = {}) {
    const eventData = {
      tool_name: TOOL_CONFIG.toolName,
      tool_version: TOOL_CONFIG.toolVersion,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
      session_duration: Date.now() - sessionData.startTime,
      interaction_count: sessionData.interactions,
      ...parameters
    };

    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    }

    // Store in session data
    sessionData.userActions.push({
      event: eventName,
      timestamp: Date.now(),
      data: eventData
    });

    sessionData.interactions++;

    log(`Event tracked: ${eventName}`, eventData);
  }

  function trackToolUsage(feature, action, additionalData = {}) {
    sessionData.featuresUsed.add(feature);
    
    trackEvent('tool_feature_usage', {
      feature_name: feature,
      action: action,
      features_used_count: sessionData.featuresUsed.size,
      ...additionalData
    });
  }

  function trackUserFlow(step, context = {}) {
    trackEvent('user_flow', {
      flow_step: step,
      flow_context: context,
      session_progress: sessionData.interactions
    });
  }

  function trackPerformance(metric, value, context = {}) {
    if (!TOOL_CONFIG.trackPerformance) return;
    
    trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: context.unit || 'ms',
      ...context
    });
  }

  function trackError(error, context = {}) {
    if (!TOOL_CONFIG.trackErrors) return;
    
    sessionData.errors++;
    
    trackEvent('tool_error', {
      error_message: error.message || error,
      error_stack: error.stack || '',
      error_type: error.name || 'UnknownError',
      error_count: sessionData.errors,
      error_context: context,
      tool_name: TOOL_CONFIG.toolName
    });
  }

  function trackConversion(conversionType, value = null, context = {}) {
    trackEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      conversion_context: context,
      tool_name: TOOL_CONFIG.toolName
    });
  }

  // Tool-specific tracking functions
  function trackAPIDesignerUsage(action, context = {}) {
    trackToolUsage('api-designer', action, context);
  }

  function trackMCPDesignerUsage(action, context = {}) {
    trackToolUsage('mcp-designer', action, context);
  }

  function trackProductTreeUsage(action, context = {}) {
    trackToolUsage('product-tree-manager', action, context);
  }

  function trackJiraToolUsage(action, context = {}) {
    trackToolUsage('product-tree-jira', action, context);
  }

  function trackAIServiceUsage(action, context = {}) {
    trackToolUsage('centralised-ai-service', action, context);
  }

  // Initialize tracking
  function initializeToolTracking() {
    log(`Initializing tracking for ${TOOL_CONFIG.toolName}`);

    // Track tool entry
    trackEvent('tool_entry', {
      entry_method: 'direct',
      referrer: document.referrer,
      utm_source: getUrlParameter('utm_source'),
      utm_medium: getUrlParameter('utm_medium'),
      utm_campaign: getUrlParameter('utm_campaign')
    });

    // Track initial page view
    trackEvent('tool_page_view', {
      page_name: TOOL_CONFIG.toolName,
      page_path: window.location.pathname
    });

    // Set up performance tracking
    if (TOOL_CONFIG.trackPerformance) {
      setupPerformanceTracking();
    }

    // Set up error tracking
    if (TOOL_CONFIG.trackErrors) {
      setupErrorTracking();
    }

    // Set up user interaction tracking
    setupInteractionTracking();

    // Track session end
    window.addEventListener('beforeunload', function() {
      trackEvent('tool_exit', {
        session_duration: Date.now() - sessionData.startTime,
        total_interactions: sessionData.interactions,
        features_used: Array.from(sessionData.featuresUsed),
        error_count: sessionData.errors,
        engagement_score: calculateEngagementScore()
      });
    });
  }

  function setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', function() {
      setTimeout(function() {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          trackPerformance('page_load_time', perfData.loadEventEnd - perfData.loadEventStart);
          trackPerformance('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
          trackPerformance('first_paint', perfData.responseEnd - perfData.requestStart);
        }
      }, 1000);
    });

    // Track API response times
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const startTime = Date.now();
      return originalFetch.apply(this, args).then(response => {
        const duration = Date.now() - startTime;
        trackPerformance('api_response_time', duration, {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: response.status
        });
        return response;
      }).catch(error => {
        const duration = Date.now() - startTime;
        trackPerformance('api_error_time', duration, {
          url: args[0],
          method: args[1]?.method || 'GET',
          error: error.message
        });
        throw error;
      });
    };
  }

  function setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', function(e) {
      trackError(e.error, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error_type: 'javascript_error'
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
      trackError(new Error(e.reason), {
        error_type: 'unhandled_promise_rejection',
        promise_reason: e.reason
      });
    });
  }

  function setupInteractionTracking() {
    // Track button clicks
    document.addEventListener('click', function(e) {
      const button = e.target.closest('button, .btn, .gapi-btn');
      if (button) {
        const buttonText = button.textContent.trim();
        const buttonClass = button.className;
        
        trackEvent('button_click', {
          button_text: buttonText,
          button_class: buttonClass,
          button_id: button.id || null
        });
      }
    });

    // Track form interactions
    document.addEventListener('submit', function(e) {
      const form = e.target;
      trackEvent('form_submit', {
        form_id: form.id || null,
        form_class: form.className,
        form_action: form.action || null
      });
    });

    // Track input focus (for engagement)
    document.addEventListener('focus', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        trackEvent('form_interaction', {
          interaction_type: 'focus',
          input_type: e.target.type || 'text',
          input_name: e.target.name || null
        });
      }
    }, true);
  }

  function calculateEngagementScore() {
    let score = 0;
    
    // Interaction count (0-40 points)
    score += Math.min(sessionData.interactions * 2, 40);
    
    // Features used (0-30 points)
    score += Math.min(sessionData.featuresUsed.size * 5, 30);
    
    // Time on tool (0-20 points)
    const timeOnTool = Math.round((Date.now() - sessionData.startTime) / 1000);
    score += Math.min(timeOnTool * 0.1, 20);
    
    // Error penalty (0-10 points deducted)
    score -= Math.min(sessionData.errors * 2, 10);
    
    return Math.max(0, Math.round(score));
  }

  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Public API
  window.GarethAPIToolAnalytics = {
    trackEvent: trackEvent,
    trackToolUsage: trackToolUsage,
    trackUserFlow: trackUserFlow,
    trackPerformance: trackPerformance,
    trackError: trackError,
    trackConversion: trackConversion,
    
    // Tool-specific methods
    trackAPIDesignerUsage: trackAPIDesignerUsage,
    trackMCPDesignerUsage: trackMCPDesignerUsage,
    trackProductTreeUsage: trackProductTreeUsage,
    trackJiraToolUsage: trackJiraToolUsage,
    trackAIServiceUsage: trackAIServiceUsage,
    
    // Utility methods
    getSessionData: () => sessionData,
    getEngagementScore: calculateEngagementScore,
    setToolName: (name) => { TOOL_CONFIG.toolName = name; },
    setDebugMode: (enabled) => { TOOL_CONFIG.debugMode = enabled; }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeToolTracking);
  } else {
    initializeToolTracking();
  }

})();
