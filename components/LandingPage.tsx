'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            P
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
            PixelPulse
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/login"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 500,
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            Login
          </Link>
          <Link
            href="/signup"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              borderRadius: '8px',
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            fontWeight: 800,
            color: 'white',
            marginBottom: '1.5rem',
            lineHeight: 1.2,
          }}
        >
          Lightweight User Analytics
          <br />
          <span style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Without the Bloat
          </span>
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: 1.6,
          }}
        >
          Drop one snippet → instant insights. Track clicks, errors, form drop-offs, and more.
          <br />
          <strong>5-10 KB</strong> vs FullStory's 300+ KB.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <Link
            href="/signup"
            style={{
              padding: '1rem 2rem',
              background: 'white',
              borderRadius: '10px',
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1.125rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            Get Started Free
          </Link>
          <Link
            href="/install"
            style={{
              padding: '1rem 2rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1.125rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            View Docs
          </Link>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginTop: '4rem',
          }}
        >
          {[
            {
              title: 'Lightweight',
              description: 'Just 5-10 KB. No bloat, no slowdown.',
              icon: '⚡',
            },
            {
              title: 'Insights First',
              description: 'Actionable insights, not just raw data.',
              icon: '💡',
            },
            {
              title: 'Privacy Focused',
              description: 'No session replays, no creepy tracking.',
              icon: '🔒',
            },
            {
              title: 'Easy Setup',
              description: 'One snippet. Works everywhere.',
              icon: '🚀',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

