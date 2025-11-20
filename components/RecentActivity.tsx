'use client';

import { Event } from '@/lib/insights';
import { format, formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  events: Event[];
}

export default function RecentActivity({ events }: RecentActivityProps) {
  const recentEvents = events
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const typeColors: Record<string, string> = {
    click: '#3b82f6',
    rage: '#ef4444',
    depth: '#8b5cf6',
    drop: '#f59e0b',
    jserr: '#dc2626',
    broken_flow: '#ef4444',
    slow: '#f59e0b',
    form_submit: '#10b981',
  };

  const typeIcons: Record<string, string> = {
    click: '👆',
    rage: '😤',
    depth: '📜',
    drop: '📝',
    jserr: '❌',
    broken_flow: '🔧',
    slow: '🐌',
    form_submit: '✅',
  };

  if (recentEvents.length === 0) {
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
        <p style={{ color: 'var(--text-muted)' }}>No recent activity</p>
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
        Recent Activity
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {recentEvents.map((event) => {
          const eventTime = new Date(event.created_at);
          const timeAgo = formatDistanceToNow(eventTime, { addSuffix: true });
          const color = typeColors[event.type] || '#6b7280';
          const icon = typeIcons[event.type] || '•';

          return (
            <div
              key={event.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '6px',
                background: 'var(--bg)',
              }}
            >
              <div
                style={{
                  fontSize: '1.25rem',
                  lineHeight: 1,
                }}
              >
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      color: color,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {event.type.replace('_', ' ')}
                  </span>
                  {event.props?.text && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      {event.props.text.slice(0, 40)}
                      {event.props.text.length > 40 ? '...' : ''}
                    </span>
                  )}
                  {event.props?.field && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      on {event.props.field}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {timeAgo} • {event.url ? new URL(event.url).pathname : 'Unknown page'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

