/**
 * PixelPulse Insight Engine
 * Turns raw events into actionable insights
 */

export type Event = {
  id: number;
  type: string;
  props: Record<string, any>;
  url: string;
  session: string;
  ts: number;
  created_at: string;
};

export type Insight = {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  action: string;
  metadata?: Record<string, any>;
};

export function computeInsights(events: Event[]): Insight[] {
  const insights: Insight[] = [];

  if (events.length === 0) {
    return insights;
  }

  // Time windows
  const now = Date.now();
  const last24h = events.filter(e => now - e.ts < 24 * 60 * 60 * 1000);
  const last7d = events.filter(e => now - e.ts < 7 * 24 * 60 * 60 * 1000);
  const prev7d = events.filter(e => {
    const age = now - e.ts;
    return age >= 7 * 24 * 60 * 60 * 1000 && age < 14 * 24 * 60 * 60 * 1000;
  });

  // 1. Rage Click Analysis
  const rageClicks = events.filter(e => e.type === 'rage');
  const rage24h = last24h.filter(e => e.type === 'rage');
  
  if (rageClicks.length >= 5) {
    const uniqueSessions = new Set(rageClicks.map(e => e.session)).size;
    const topRageElement = getTopElement(rageClicks);
    
    insights.push({
      title: 'High rage-click activity detected',
      severity: rageClicks.length > 20 ? 'high' : 'medium',
      summary: `${rageClicks.length} rage-click incidents detected across ${uniqueSessions} sessions. Most common: ${topRageElement?.selector || 'unknown'}`,
      action: 'Investigate broken buttons, unresponsive CTAs, or UX dead-ends.',
      metadata: {
        count: rageClicks.length,
        sessions: uniqueSessions,
        topElement: topRageElement
      }
    });
  }

  // 2. JavaScript Error Analysis
  const jsErrors = events.filter(e => e.type === 'jserr');
  const error24h = last24h.filter(e => e.type === 'jserr');
  const totalSessions = new Set(events.map(e => e.session)).size;
  const errorSessions = new Set(jsErrors.map(e => e.session)).size;
  const errorRate = totalSessions > 0 ? (errorSessions / totalSessions) * 100 : 0;

  if (jsErrors.length >= 5) {
    const topError = getTopError(jsErrors);
    
    insights.push({
      title: `JavaScript errors affecting ${errorRate.toFixed(1)}% of sessions`,
      severity: errorRate > 20 ? 'critical' : errorRate > 10 ? 'high' : 'medium',
      summary: `${jsErrors.length} JS errors across ${errorSessions} sessions. Most common: ${topError?.msg || 'unknown'}`,
      action: 'Check browser console and fix broken scripts. Monitor error stack traces.',
      metadata: {
        errorCount: jsErrors.length,
        affectedSessions: errorSessions,
        errorRate: errorRate.toFixed(1),
        topError
      }
    });
  }

  // 3. Form Drop-off Analysis
  const dropOffs = events.filter(e => e.type === 'drop');
  const dropOffs24h = last24h.filter(e => e.type === 'drop');
  const dropOffsPrev7d = prev7d.filter(e => e.type === 'drop');
  
  if (dropOffs.length > 0) {
    const dropOffByField = groupBy(dropOffs, e => e.props?.field || 'unknown');
    const topDropField = Object.entries(dropOffByField)
      .sort(([, a], [, b]) => b.length - a.length)[0];
    
    if (topDropField) {
      const [field, fieldDrops] = topDropField;
      const prevCount = dropOffsPrev7d.filter(e => e.props?.field === field).length;
      const currentCount = fieldDrops.length;
      const increase = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;

      if (increase > 200 || currentCount >= 10) {
        insights.push({
          title: `Form drop-off spike on ${field}`,
          severity: increase > 300 ? 'high' : 'medium',
          summary: `${currentCount} drop-offs on "${field}" field${increase > 0 ? ` (${increase > 0 ? '+' : ''}${increase.toFixed(0)}% vs last week)` : ''}`,
          action: 'Review field validation, UX, or required field indicators.',
          metadata: {
            field,
            count: currentCount,
            increase: increase.toFixed(0),
            label: fieldDrops[0]?.props?.label
          }
        });
      }
    }
  }

  // 4. Broken UI Flow Detection
  const brokenFlows = events.filter(e => e.type === 'broken_flow');
  if (brokenFlows.length >= 5) {
    const brokenByType = groupBy(brokenFlows, e => e.props?.type || 'unknown');
    const topBrokenType = Object.entries(brokenByType)
      .sort(([, a], [, b]) => b.length - a.length)[0];
    
    insights.push({
      title: 'Broken UI flows detected',
      severity: brokenFlows.length > 15 ? 'high' : 'medium',
      summary: `${brokenFlows.length} broken flow incidents. Most common: ${topBrokenType?.[0] || 'unknown'}`,
      action: 'Check for unresponsive buttons, failed navigation, or network issues.',
      metadata: {
        count: brokenFlows.length,
        topType: topBrokenType?.[0],
        breakdown: brokenByType
      }
    });
  }

  // 5. Performance Issues
  const slowTasks = events.filter(e => e.type === 'slow');
  if (slowTasks.length >= 5) {
    const avgDuration = slowTasks.reduce((sum, e) => sum + (e.props?.dur || 0), 0) / slowTasks.length;
    const slowByUrl = groupBy(slowTasks, e => e.url);
    const topSlowUrl = Object.entries(slowByUrl)
      .sort(([, a], [, b]) => b.length - a.length)[0];
    
    insights.push({
      title: 'Performance degradation detected',
      severity: avgDuration > 1000 ? 'high' : 'medium',
      summary: `${slowTasks.length} slow tasks detected. Average duration: ${Math.round(avgDuration)}ms. Most affected: ${topSlowUrl?.[0] || 'unknown'}`,
      action: 'Optimize long tasks, reduce bundle size, or investigate slow network requests.',
      metadata: {
        count: slowTasks.length,
        avgDuration: Math.round(avgDuration),
        topUrl: topSlowUrl?.[0]
      }
    });
  }

  // 6. Scroll Depth Analysis
  const scrollDepth = events.filter(e => e.type === 'depth');
  const depth100 = scrollDepth.filter(e => e.props?.pct === 100);
  const depth75 = scrollDepth.filter(e => e.props?.pct === 75);
  const depth50 = scrollDepth.filter(e => e.props?.pct === 50);
  
  if (scrollDepth.length > 0) {
    const totalSessions = new Set(events.map(e => e.session)).size;
    const completionRate = totalSessions > 0 ? (depth100.length / totalSessions) * 100 : 0;
    
    if (completionRate < 30 && scrollDepth.length >= 20) {
      insights.push({
        title: 'Low scroll completion rate',
        severity: 'low',
        summary: `Only ${completionRate.toFixed(1)}% of sessions reach 100% scroll depth.`,
        action: 'Consider improving content engagement or reducing page length.',
        metadata: {
          completionRate: completionRate.toFixed(1),
          depth50: depth50.length,
          depth75: depth75.length,
          depth100: depth100.length
        }
      });
    }
  }

  // 7. Top Click Analysis
  const clicks = events.filter(e => e.type === 'click');
  if (clicks.length > 0) {
    const clickBySelector = groupBy(clicks, e => e.props?.selector || 'unknown');
    const topClicks = Object.entries(clickBySelector)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 5);
    
    // This is informational, not an insight
    // Could be used for dashboard display
  }

  return insights.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

// Helper functions
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function getTopElement(events: Event[]) {
  const bySelector = groupBy(events, e => e.props?.selector || 'unknown');
  const top = Object.entries(bySelector)
    .sort(([, a], [, b]) => b.length - a.length)[0];
  
  if (!top) return null;
  
  return {
    selector: top[0],
    count: top[1].length,
    text: top[1][0]?.props?.text || ''
  };
}

function getTopError(events: Event[]) {
  const byMsg = groupBy(events, e => e.props?.msg || e.props?.reason || 'unknown');
  const top = Object.entries(byMsg)
    .sort(([, a], [, b]) => b.length - a.length)[0];
  
  if (!top) return null;
  
  return {
    msg: top[0],
    count: top[1].length,
    src: top[1][0]?.props?.src || ''
  };
}

