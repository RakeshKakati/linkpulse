'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Event, Insight } from '@/lib/insights';
import { createSupabaseClient } from '@/lib/supabase-client';

export default function DashboardV2() {
  const [events, setEvents] = useState<Event[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'sources' | 'pages'>('pages');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const supabase = createSupabaseClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events?days=${timeRange}`);
      const data = await response.json();
      setEvents(data.events || []);
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const uniqueSessions = new Set(events.map(e => e.session)).size;
    const uniqueUrls = new Set(events.map(e => e.url)).size;
    const clicks = events.filter(e => e.type === 'click').length;
    const rageClicks = events.filter(e => e.type === 'rage').length;
    const jsErrors = events.filter(e => e.type === 'jserr').length;
    const formDropoffs = events.filter(e => e.type === 'drop').length;
    
    // Calculate average session time (simplified)
    const sessions = Array.from(new Set(events.map(e => e.session)));
    const sessionTimes = sessions.map(session => {
      const sessionEvents = events.filter(e => e.session === session);
      if (sessionEvents.length === 0) return 0;
      const times = sessionEvents.map(e => new Date(e.created_at).getTime());
      return (Math.max(...times) - Math.min(...times)) / 1000; // seconds
    });
    const avgSessionTime = sessionTimes.length > 0 
      ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length 
      : 0;

    return {
      visitors: uniqueSessions,
      pages: uniqueUrls,
      clicks,
      rageClicks,
      jsErrors,
      formDropoffs,
      avgSessionTime: Math.round(avgSessionTime),
    };
  }, [events]);

  // Time series data for chart
  const timeSeriesData = useMemo(() => {
    const buckets: { label: string; count: number; date: Date }[] = [];
    const now = new Date();
    
    if (timeRange === 1) {
      // Hourly for last 24 hours
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        buckets.push({ 
          label: format(hourStart, 'HH:mm'), 
          count: 0,
          date: new Date(hourStart)
        });
      }
      
      events.forEach(event => {
        const eventTime = new Date(event.created_at);
        const eventHour = new Date(eventTime);
        eventHour.setMinutes(0, 0, 0);
        
        const bucket = buckets.find(b => {
          return b.date.getTime() === eventHour.getTime();
        });
        if (bucket) {
          bucket.count++;
        }
      });
    } else {
      // Daily for last 7 or 30 days
      const days = timeRange === 7 ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        buckets.push({ 
          label: format(dayStart, 'MMM d'), 
          count: 0,
          date: new Date(dayStart)
        });
      }
      
      events.forEach(event => {
        const eventTime = new Date(event.created_at);
        const eventDay = new Date(eventTime);
        eventDay.setHours(0, 0, 0, 0);
        
        const bucket = buckets.find(b => {
          return b.date.getTime() === eventDay.getTime();
        });
        if (bucket) {
          bucket.count++;
        }
      });
    }
    
    return buckets;
  }, [events, timeRange]);

  const timeGranularity = timeRange === 1 ? 'Hourly' : 'Daily';

  const maxCount = Math.max(...timeSeriesData.map(d => d.count), 1);

  // Top pages
  const topPages = useMemo(() => {
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

    return Object.values(pagesByUrl)
      .map(page => ({
        ...page,
        uniqueSessions: page.sessions.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '1.5rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              P
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                PixelPulse
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                User Analytics
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                ←
              </button>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#ffffff',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                →
              </button>
            </div>
            <button
              onClick={fetchEvents}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              ↻
            </button>
            <a
              href="/projects"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: '#ffffff',
                textDecoration: 'none',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Projects
            </a>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: '#ffffff',
                fontSize: '0.875rem',
                cursor: 'pointer',
                color: '#374151',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        {/* Key Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <MetricCard
            label="Visitors"
            value={metrics.visitors}
            loading={loading}
            onClick={() => setSelectedMetric('visitors')}
          />
          <MetricCard
            label="Pages"
            value={metrics.pages}
            loading={loading}
            onClick={() => setSelectedMetric('pages')}
          />
          <MetricCard
            label="Clicks"
            value={metrics.clicks}
            loading={loading}
            onClick={() => setSelectedMetric('clicks')}
          />
          <MetricCard
            label="Rage Clicks"
            value={metrics.rageClicks}
            loading={loading}
            color={metrics.rageClicks > 10 ? '#ef4444' : '#f59e0b'}
            onClick={() => setSelectedMetric('rage')}
          />
          <MetricCard
            label="JS Errors"
            value={metrics.jsErrors}
            loading={loading}
            color={metrics.jsErrors > 5 ? '#ef4444' : '#f59e0b'}
            onClick={() => setSelectedMetric('errors')}
          />
          <MetricCard
            label="Form Drop-offs"
            value={metrics.formDropoffs}
            loading={loading}
            color={metrics.formDropoffs > 10 ? '#f59e0b' : '#3b82f6'}
            onClick={() => setSelectedMetric('dropoffs')}
          />
        </div>

        {/* Metric Detail Modal */}
        {selectedMetric && (
          <MetricDetailModal
            metric={selectedMetric}
            events={events}
            metrics={metrics}
            onClose={() => setSelectedMetric(null)}
          />
        )}

        {/* Time Series Chart */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              Events Over Time
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                style={{
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f3f4f6',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {timeGranularity}
              </button>
            </div>
          </div>
          <div
            style={{
              height: '200px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
            }}
          >
            {timeSeriesData.map((data, idx) => {
              const height = (data.count / maxCount) * 100;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${Math.max(height, 2)}%`,
                    background: data.count > 0
                      ? 'linear-gradient(to top, #3b82f6, #60a5fa)'
                      : '#f3f4f6',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px',
                  }}
                  title={`${data.label} - ${data.count} events`}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Section - Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
          }}
        >
          {/* Pages Section */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveTab('pages')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: activeTab === 'pages' ? '#f3f4f6' : 'transparent',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: activeTab === 'pages' ? 600 : 400,
                    cursor: 'pointer',
                    color: activeTab === 'pages' ? '#111827' : '#6b7280',
                  }}
                >
                  Page
                </button>
              </div>
              <select
                style={{
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#ffffff',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <option>All ({topPages.length})</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topPages.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                  No page data available
                </p>
              ) : (
                topPages.map((page, idx) => (
                  <div
                    key={page.url}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: idx < 3 ? '#f9fafb' : 'transparent',
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
                          color: '#6b7280',
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
                        color: '#3b82f6',
                        marginLeft: '1rem',
                      }}
                    >
                      {page.count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event Types Section */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                Event Types
              </h3>
            </div>
            <EventTypeDistribution events={events} />
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  loading, 
  color = '#3b82f6',
  onClick
}: { 
  label: string; 
  value: number; 
  loading: boolean;
  color?: string;
  onClick?: () => void;
}) {
  if (loading) {
    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.5rem',
          height: '100px',
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 4px 12px ${color}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          marginBottom: '0.5rem',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: color,
          lineHeight: 1.2,
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function MetricDetailModal({
  metric,
  events,
  metrics,
  onClose,
}: {
  metric: string;
  events: Event[];
  metrics: any;
  onClose: () => void;
}) {
  const getMetricDetails = () => {
    switch (metric) {
      case 'visitors':
        const sessions = Array.from(new Set(events.map(e => e.session)));
        const sessionDetails = sessions.map(session => {
          const sessionEvents = events.filter(e => e.session === session);
          const firstEvent = sessionEvents[0];
          const lastEvent = sessionEvents[sessionEvents.length - 1];
          const duration = new Date(lastEvent.created_at).getTime() - new Date(firstEvent.created_at).getTime();
          return {
            session,
            eventCount: sessionEvents.length,
            duration: Math.round(duration / 1000),
            url: firstEvent.url,
            firstSeen: firstEvent.created_at,
          };
        });
        return {
          title: 'Visitors',
          description: `${sessions.length} unique sessions`,
          data: sessionDetails.slice(0, 20),
          columns: ['Session', 'Events', 'Duration', 'First Seen', 'Page'],
        };
      
      case 'pages':
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
        
        const pageDetails = Object.values(pagesByUrl)
          .map(page => ({
            url: page.url === '/' ? 'Home' : page.url,
            events: page.count,
            sessions: page.sessions.size,
          }))
          .sort((a, b) => b.events - a.events);
        
        return {
          title: 'Pages',
          description: `${pageDetails.length} unique pages tracked`,
          data: pageDetails,
          columns: ['Page', 'Events', 'Sessions'],
        };
      
      case 'clicks':
        const clicks = events.filter(e => e.type === 'click');
        const clickDetails = clicks
          .map(click => ({
            selector: click.props?.selector || 'unknown',
            text: click.props?.text?.slice(0, 50) || '',
            url: click.url,
            time: click.created_at,
          }))
          .slice(0, 50);
        
        return {
          title: 'Clicks',
          description: `${clicks.length} total clicks tracked`,
          data: clickDetails,
          columns: ['Element', 'Text', 'Page', 'Time'],
        };
      
      case 'rage':
        const rageClicks = events.filter(e => e.type === 'rage');
        const rageDetails = rageClicks.map(rage => ({
          selector: rage.props?.selector || 'unknown',
          text: rage.props?.text?.slice(0, 50) || '',
          count: rage.props?.count || 0,
          url: rage.url,
          time: rage.created_at,
        }));
        
        return {
          title: 'Rage Clicks',
          description: `${rageClicks.length} rage click incidents detected`,
          data: rageDetails,
          columns: ['Element', 'Text', 'Clicks', 'Page', 'Time'],
        };
      
      case 'errors':
        const errors = events.filter(e => e.type === 'jserr');
        const errorDetails = errors.map(error => ({
          message: error.props?.msg || error.props?.reason || 'Unknown error',
          source: error.props?.src || '',
          line: error.props?.line || '',
          url: error.url,
          time: error.created_at,
        }));
        
        return {
          title: 'JavaScript Errors',
          description: `${errors.length} errors affecting users`,
          data: errorDetails,
          columns: ['Error', 'Source', 'Line', 'Page', 'Time'],
        };
      
      case 'dropoffs':
        const dropoffs = events.filter(e => e.type === 'drop');
        const dropoffDetails = dropoffs.map(drop => ({
          field: drop.props?.field || 'unknown',
          label: drop.props?.label || drop.props?.field || 'Unknown field',
          type: drop.props?.type || 'text',
          value: drop.props?.value || (drop.props?.hasValue ? '(entered)' : '(empty)'),
          url: drop.url,
          time: drop.created_at,
        }));
        
        return {
          title: 'Form Drop-offs',
          description: `${dropoffs.length} form abandonment events`,
          data: dropoffDetails,
          columns: ['Field', 'Label', 'Type', 'Value', 'Page', 'Time'],
        };
      
      default:
        return { title: 'Details', description: '', data: [], columns: [] };
    }
  };

  const details = getMetricDetails();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, marginBottom: '0.25rem' }}>
              {details.title}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              {details.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: '#f3f4f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ overflow: 'auto', flex: 1, padding: '1.5rem' }}>
          {details.data.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              No data available
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {details.columns.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.data.map((row: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {details.columns.map((col) => {
                      let value: any = '-';
                      
                      // Map column names to data properties
                      if (col === 'Session') value = row.session || '-';
                      else if (col === 'Events') value = row.eventCount || row.events || '-';
                      else if (col === 'Duration') value = row.duration || '-';
                      else if (col === 'First Seen') value = row.firstSeen || '-';
                      else if (col === 'Page') value = row.url || row.page || '-';
                      else if (col === 'Element') value = row.selector || '-';
                      else if (col === 'Text') value = row.text || '-';
                      else if (col === 'Clicks') value = row.count || '-';
                      else if (col === 'Error') value = row.message || '-';
                      else if (col === 'Source') value = row.source || '-';
                      else if (col === 'Line') value = row.line || '-';
                      else if (col === 'Field') value = row.field || '-';
                      else if (col === 'Label') value = row.label || '-';
                      else if (col === 'Type') value = row.type || '-';
                      else if (col === 'Time') value = row.time || '-';
                      else if (col === 'Sessions') value = row.sessions || '-';
                      else value = row[col.toLowerCase()] || row[col] || '-';
                      
                      let displayValue = value;
                      
                      if (col === 'Time' || col === 'First Seen') {
                        try {
                          displayValue = format(new Date(value), 'MMM d, HH:mm');
                        } catch {
                          displayValue = value;
                        }
                      } else if (col === 'Duration' && typeof value === 'number') {
                        displayValue = `${Math.floor(value / 60)}m ${value % 60}s`;
                      } else if (typeof value === 'string' && value.length > 50) {
                        displayValue = value.slice(0, 50) + '...';
                      } else if (col === 'Page' && typeof value === 'string') {
                        try {
                          const url = new URL(value);
                          displayValue = url.pathname === '/' ? 'Home' : url.pathname;
                        } catch {
                          displayValue = value;
                        }
                      }
                      
                      return (
                        <td
                          key={col}
                          style={{
                            padding: '0.75rem',
                            fontSize: '0.875rem',
                            color: '#111827',
                          }}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function EventTypeDistribution({ events }: { events: Event[] }) {
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = events.length;
  const sortedTypes = Object.entries(eventsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const typeLabels: Record<string, string> = {
    click: 'Clicks',
    rage: 'Rage Clicks',
    depth: 'Scroll Depth',
    drop: 'Form Drop-offs',
    jserr: 'JS Errors',
    broken_flow: 'Broken Flows',
    slow: 'Slow Tasks',
    form_submit: 'Form Submissions',
  };

  if (sortedTypes.length === 0) {
    return (
      <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
        No events to display
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {sortedTypes.map(([type, count]) => {
        const percentage = (count / total) * 100;
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
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {typeLabels[type] || type}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {count.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
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
                height: '6px',
                background: '#f3f4f6',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: '#3b82f6',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

