'use client';

import { Event } from '@/lib/insights';

interface TopPagesProps {
  events: Event[];
}

export default function TopPages({ events }: TopPagesProps) {
  const pagesByUrl = events.reduce((acc, event) => {
    if (!event.url) return acc;
    const url = new URL(event.url).pathname;
    if (!acc[url]) {
      acc[url] = { url, count: 0, sessions: new Set() };
    }
    acc[url].count++;
    if (event.session) {
      acc[url].sessions.add(event.session);
    }
    return acc;
  }, {} as Record<string, { url: string; count: number; sessions: Set<string> }>);

  const topPages = Object.values(pagesByUrl)
    .map((page) => ({
      ...page,
      uniqueSessions: page.sessions.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (topPages.length === 0) {
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
        <p style={{ color: 'var(--text-muted)' }}>No page data available</p>
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
        Top Pages
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {topPages.map((page, idx) => (
          <div
            key={page.url}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: idx < 3 ? 'var(--bg)' : 'transparent',
              borderRadius: '6px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: idx < 3 ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {page.url === '/' ? 'Home' : page.url}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.25rem',
                }}
              >
                {page.uniqueSessions} session{page.uniqueSessions !== 1 ? 's' : ''}
              </div>
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--accent)',
                marginLeft: '1rem',
              }}
            >
              {page.count.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

