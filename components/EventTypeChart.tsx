'use client';

import { Event } from '@/lib/insights';

interface EventTypeChartProps {
  events: Event[];
}

export default function EventTypeChart({ events }: EventTypeChartProps) {
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = events.length;
  const maxCount = Math.max(...Object.values(eventsByType), 1);

  const typeColors: Record<string, string> = {
    click: '#3b82f6',
    rage: '#ef4444',
    depth: '#8b5cf6',
    drop: '#f59e0b',
    jserr: '#dc2626',
    broken_flow: '#ef4444',
    slow: '#f59e0b',
    form_submit: '#10b981',
    page_hide: '#6b7280',
  };

  const typeLabels: Record<string, string> = {
    click: 'Clicks',
    rage: 'Rage Clicks',
    depth: 'Scroll Depth',
    drop: 'Form Drop-offs',
    jserr: 'JS Errors',
    broken_flow: 'Broken Flows',
    slow: 'Slow Tasks',
    form_submit: 'Form Submissions',
    page_hide: 'Page Hides',
  };

  const sortedTypes = Object.entries(eventsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  if (sortedTypes.length === 0) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>No events to display</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.5rem',
      }}
    >
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}
      >
        Event Distribution
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sortedTypes.map(([type, count]) => {
          const percentage = (count / total) * 100;
          const barWidth = (count / maxCount) * 100;
          const color = typeColors[type] || '#6b7280';

          return (
            <div key={type}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: color,
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {typeLabels[type] || type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {count.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      minWidth: '45px',
                      textAlign: 'right',
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--bg)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

