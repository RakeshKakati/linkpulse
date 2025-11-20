'use client';

import { Insight } from '@/lib/insights';

interface InsightsPanelProps {
  insights: Insight[];
  loading: boolean;
}

export default function InsightsPanel({ insights, loading }: InsightsPanelProps) {
  if (loading) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>Loading insights...</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>
          No insights yet. Events will generate insights automatically.
        </p>
      </div>
    );
  }

  const severityColors = {
    critical: 'var(--critical)',
    high: 'var(--error)',
    medium: 'var(--warning)',
    low: 'var(--accent)',
  };

  const severityLabels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        Insights
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {insights.map((insight, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1.5rem',
              borderLeft: `4px solid ${severityColors[insight.severity]}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '0.75rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  flex: 1,
                }}
              >
                {insight.title}
              </h3>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: severityColors[insight.severity] + '15',
                  color: severityColors[insight.severity],
                }}
              >
                {severityLabels[insight.severity]}
              </span>
            </div>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                marginBottom: '0.75rem',
                lineHeight: 1.6,
              }}
            >
              {insight.summary}
            </p>
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--bg)',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            >
              <strong style={{ color: 'var(--text)' }}>Action:</strong>{' '}
              <span style={{ color: 'var(--text-muted)' }}>{insight.action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

