'use client';

interface StatsGridProps {
  stats: {
    totalEvents: number;
    uniqueSessions: number;
    uniqueUrls: number;
    rageClicks: number;
    jsErrors: number;
    formDropoffs: number;
    brokenFlows: number;
    slowTasks: number;
  };
  loading: boolean;
}

export default function StatsGrid({ stats, loading }: StatsGridProps) {
  const statCards = [
    {
      label: 'Total Events',
      value: stats.totalEvents.toLocaleString(),
      color: 'var(--accent)',
    },
    {
      label: 'Unique Sessions',
      value: stats.uniqueSessions.toLocaleString(),
      color: 'var(--accent)',
    },
    {
      label: 'Rage Clicks',
      value: stats.rageClicks.toLocaleString(),
      color: stats.rageClicks > 10 ? 'var(--error)' : 'var(--warning)',
    },
    {
      label: 'JS Errors',
      value: stats.jsErrors.toLocaleString(),
      color: stats.jsErrors > 5 ? 'var(--error)' : 'var(--warning)',
    },
    {
      label: 'Form Drop-offs',
      value: stats.formDropoffs.toLocaleString(),
      color: stats.formDropoffs > 10 ? 'var(--warning)' : 'var(--accent)',
    },
    {
      label: 'Broken Flows',
      value: stats.brokenFlows.toLocaleString(),
      color: stats.brokenFlows > 5 ? 'var(--error)' : 'var(--accent)',
    },
    {
      label: 'Slow Tasks',
      value: stats.slowTasks.toLocaleString(),
      color: stats.slowTasks > 10 ? 'var(--warning)' : 'var(--accent)',
    },
    {
      label: 'Pages Tracked',
      value: stats.uniqueUrls.toLocaleString(),
      color: 'var(--accent)',
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1.5rem',
              height: '100px',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}
    >
      {statCards.map((stat, idx) => (
        <div
          key={idx}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '1.5rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              fontWeight: 500,
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: stat.color,
              lineHeight: 1.2,
            }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

