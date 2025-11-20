'use client';

import { Event } from '@/lib/insights';
import { format, startOfHour, subHours, isWithinInterval } from 'date-fns';

interface TimeSeriesChartProps {
  events: Event[];
  hours: number;
}

export default function TimeSeriesChart({ events, hours }: TimeSeriesChartProps) {
  const now = new Date();
  const buckets: { time: Date; count: number }[] = [];

  // Create hourly buckets
  for (let i = hours - 1; i >= 0; i--) {
    const hourStart = startOfHour(subHours(now, i));
    buckets.push({ time: hourStart, count: 0 });
  }

  // Count events in each bucket
  events.forEach((event) => {
    const eventTime = new Date(event.created_at);
    const bucket = buckets.find((b) => {
      const bucketEnd = new Date(b.time);
      bucketEnd.setHours(bucketEnd.getHours() + 1);
      return isWithinInterval(eventTime, {
        start: b.time,
        end: bucketEnd,
      });
    });
    if (bucket) {
      bucket.count++;
    }
  });

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

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
        Events Over Time
      </h3>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height: '120px',
        }}
      >
        {buckets.map((bucket, idx) => {
          const height = (bucket.count / maxCount) * 100;
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <div
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(height, 2)}%`,
                    background:
                      bucket.count > 0
                        ? 'linear-gradient(to top, #3b82f6, #60a5fa)'
                        : 'transparent',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`${format(bucket.time, 'HH:mm')}: ${bucket.count} events`}
                />
              </div>
              {idx % Math.ceil(buckets.length / 6) === 0 && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    color: 'var(--text-muted)',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {format(bucket.time, 'HH:mm')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

