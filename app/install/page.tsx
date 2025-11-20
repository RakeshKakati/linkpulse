'use client';

import { useMemo } from 'react';

export default function InstallPage() {
  const endpoint = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/pp`
    : 'https://yourapp.com/api/pp';

  const snippet = useMemo(() => `<script>
  window.PIXELPULSE_ENDPOINT = "${endpoint}";
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/pixelpulse.js"></script>`, [endpoint]);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>
          Install PixelPulse
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Add this snippet to your website before the closing <code>&lt;/body&gt;</code> tag.
        </p>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
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
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Snippet</h2>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Copy
            </button>
          </div>
          <pre
            style={{
              background: 'var(--bg)',
              padding: '1rem',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}
          >
            <code>{snippet}</code>
          </pre>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Optional: Mark Semantic Elements
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Add the <code>data-pp</code> attribute to elements you want to explicitly track:
          </p>
          <pre
            style={{
              background: 'var(--bg)',
              padding: '1rem',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}
          >
            <code>{`<button data-pp>Click Me</button>
<div data-pp class="cta">Call to Action</div>`}</code>
          </pre>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <a
            href="/"
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

