'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function TestPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).PIXELPULSE_ENDPOINT = window.location.origin + '/api/pp';
    }
  }, []);

  const handleJSError = () => {
    // Trigger error asynchronously so it's caught by global error handler
    // without breaking React's error boundary
    setTimeout(() => {
      throw new Error('Test JavaScript error');
    }, 0);
  };

  const handleAddBrokenButton = () => {
    const btn = document.createElement('button');
    btn.textContent = 'Rage Click Me';
    btn.style.cssText = 'padding: 1rem; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 1rem;';
    btn.onclick = () => {
      // Do nothing - simulate broken button
    };
    document.body.appendChild(btn);
  };

  return (
    <>
      <Script src="/pixelpulse.js" strategy="afterInteractive" />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>PixelPulse Test Page</h1>
        <p>This page is used to test the PixelPulse snippet. Open the dashboard to see events.</p>
        
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button data-pp style={{ padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Click Me (Tracked)
          </button>
          
          <a href="/" data-pp style={{ padding: '1rem', background: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px', display: 'inline-block', textAlign: 'center' }}>
            Link (Tracked)
          </a>
          
          <form style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e5e5', borderRadius: '6px' }}>
            <h3>Test Form Drop-off</h3>
            <input 
              type="text" 
              name="email" 
              placeholder="Email (focus then leave to test drop-off)"
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #e5e5e5', borderRadius: '4px' }}
            />
            <input 
              type="text" 
              name="name" 
              placeholder="Name"
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #e5e5e5', borderRadius: '4px' }}
            />
            <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Submit
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', height: '200vh', background: 'linear-gradient(to bottom, #f0f0f0, #ffffff)', padding: '2rem' }}>
            <h2>Scroll Test</h2>
            <p>Scroll down to test scroll depth tracking (50%, 75%, 100%)</p>
            <div style={{ marginTop: '50vh' }}>
              <p>50% scroll depth</p>
            </div>
            <div style={{ marginTop: '25vh' }}>
              <p>75% scroll depth</p>
            </div>
            <div style={{ marginTop: '25vh' }}>
              <p>100% scroll depth</p>
            </div>
          </div>
          
          <button 
            onClick={handleJSError}
            style={{ padding: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '2rem' }}
          >
            Trigger JS Error (for testing)
          </button>
          
          <button 
            onClick={handleAddBrokenButton}
            style={{ padding: '1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem' }}
          >
            Add Broken Button (for rage click testing)
          </button>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '6px' }}>
          <h3>Instructions:</h3>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Click the buttons above to generate click events</li>
            <li>Scroll down to trigger scroll depth events</li>
            <li>Focus on form fields then leave to test drop-off tracking</li>
            <li>Click the &quot;Trigger JS Error&quot; button to test error tracking</li>
            <li>Check the dashboard to see all events</li>
          </ul>
        </div>
      </div>
    </>
  );
}
