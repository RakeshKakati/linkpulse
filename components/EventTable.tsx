'use client';

import { useState, useMemo } from 'react';
import { Event } from '@/lib/insights';
import { format } from 'date-fns';

interface EventTableProps {
  events: Event[];
  loading: boolean;
}

export default function EventTable({ events, loading }: EventTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'type'>('time');

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((e) => e.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.type.toLowerCase().includes(query) ||
          e.url?.toLowerCase().includes(query) ||
          e.props?.text?.toLowerCase().includes(query) ||
          e.props?.msg?.toLowerCase().includes(query) ||
          e.props?.field?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'time') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      filtered.sort((a, b) => a.type.localeCompare(b.type));
    }

    return filtered;
  }, [events, searchQuery, filterType, sortBy]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(events.map((e) => e.type))).sort();
  }, [events]);
  if (loading) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2rem',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Loading events...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2rem',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
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
        <p style={{ color: 'var(--text-muted)' }}>
          No events yet. Add the PixelPulse snippet to your site to start tracking.
        </p>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    click: 'var(--accent)',
    rage: 'var(--error)',
    depth: 'var(--accent)',
    drop: 'var(--warning)',
    jserr: 'var(--error)',
    broken_flow: 'var(--error)',
    slow: 'var(--warning)',
    form_submit: 'var(--success)',
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Filters */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            background: 'var(--bg)',
          }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            background: 'var(--bg)',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'time' | 'type')}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            background: 'var(--bg)',
            cursor: 'pointer',
          }}
        >
          <option value="time">Sort by Time</option>
          <option value="type">Sort by Type</option>
        </select>
        <div
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            padding: '0.5rem',
          }}
        >
          {filteredAndSortedEvents.length} of {events.length} events
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Type
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Details
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                URL
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEvents.slice(0, 100).map((event) => (
              <tr
                key={event.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: (typeColors[event.type] || 'var(--accent)') + '15',
                      color: typeColors[event.type] || 'var(--accent)',
                    }}
                  >
                    {event.type}
                  </span>
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {event.props?.text || event.props?.msg || event.props?.field || JSON.stringify(event.props).slice(0, 50)}
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {event.url || '-'}
                </td>
                <td
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {format(new Date(event.created_at), 'MMM d, HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAndSortedEvents.length > 100 && (
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          Showing 100 of {filteredAndSortedEvents.length} events
        </div>
      )}
    </div>
  );
}

