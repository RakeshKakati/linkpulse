'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import InsightsPanel from './InsightsPanel';
import StatsGrid from './StatsGrid';
import EventTable from './EventTable';
import EventTypeChart from './EventTypeChart';
import TimeSeriesChart from './TimeSeriesChart';
import TopPages from './TopPages';
import RecentActivity from './RecentActivity';
import { Event, Insight } from '@/lib/insights';

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // days

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
    const interval = setInterval(fetchEvents, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleRefresh = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTimeRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(Number(e.target.value));
  }, []);

  const stats = {
    totalEvents: events.length,
    uniqueSessions: new Set(events.map(e => e.session)).size,
    uniqueUrls: new Set(events.map(e => e.url)).size,
    rageClicks: events.filter(e => e.type === 'rage').length,
    jsErrors: events.filter(e => e.type === 'jserr').length,
    formDropoffs: events.filter(e => e.type === 'drop').length,
    brokenFlows: events.filter(e => e.type === 'broken_flow').length,
    slowTasks: events.filter(e => e.type === 'slow').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '1.5rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '0.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              PixelPulse
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Lightweight, insights-first user analytics
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a
              href="/install"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--surface)',
                fontSize: '0.875rem',
                textDecoration: 'none',
                color: 'var(--text)',
              }}
            >
              Install Snippet
            </a>
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--surface)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--surface)',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Loading...' : 'Refresh'}
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
        {/* Insights First */}
        <InsightsPanel insights={insights} loading={loading} />

        {/* Stats Grid */}
        <StatsGrid stats={stats} loading={loading} />

        {/* Charts Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <EventTypeChart events={events} />
          <TimeSeriesChart 
            events={events} 
            hours={timeRange === 1 ? 24 : timeRange === 7 ? 168 : timeRange === 30 ? 720 : 24} 
          />
        </div>

        {/* Bottom Row - Top Pages and Recent Activity */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <TopPages events={events} />
          <RecentActivity events={events} />
        </div>

        {/* Event Breakdown */}
        <div style={{ marginTop: '2rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            All Events
          </h2>
          <EventTable events={events} loading={loading} />
        </div>
      </main>
    </div>
  );
}

