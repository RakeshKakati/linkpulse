'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase-client';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  token: string;
  domain: string | null;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDomain, setProjectDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [verifyingUrls, setVerifyingUrls] = useState<Record<string, string>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const supabase = createSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          domain: projectDomain || null,
        }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProjectName('');
        setProjectDomain('');
        setShowCreate(false);
        fetchProjects();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const copySnippet = (token: string) => {
    const endpoint = `${window.location.origin}/api/pp`;
    const snippet = `<script>
  window.PIXELPULSE_TOKEN = "${token}";
  window.PIXELPULSE_ENDPOINT = "${endpoint}";
</script>
<script src="${window.location.origin}/pixelpulse.js"></script>`;
    navigator.clipboard.writeText(snippet);
    alert('Snippet copied to clipboard!');
  };

  const verifySnippet = async (projectId: string, domain: string, token: string, clientSide: boolean = false) => {
    if (!domain) {
      alert('Please enter a domain to verify');
      return;
    }

    // Client-side verification: open in new tab with instructions
    if (clientSide) {
      let targetUrl = domain;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      
      // Open the website in a new tab
      window.open(targetUrl, '_blank');
      
      // Show instructions for manual verification
      setVerificationResults({
        ...verificationResults,
        [projectId]: {
          verified: null, // null means "check manually"
          url: targetUrl,
          method: 'manual',
          instructions: `Website opened in new tab. To verify:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: window.PIXELPULSE_TOKEN
4. It should show: "${token}"
5. Or check Sources/Network tab for pixelpulse.js`,
          expectedToken: token,
        },
      });
      return;
    }

    // Server-side verification
    setVerifying({ ...verifying, [projectId]: true });
    setVerificationResults({ ...verificationResults, [projectId]: null });

    try {
      const response = await fetch(`/api/verify?url=${encodeURIComponent(domain)}`);
      const data = await response.json();

      setVerificationResults({
        ...verificationResults,
        [projectId]: {
          ...data,
          expectedToken: token,
          tokenMatches: data.token === token,
          method: 'server-side',
        },
      });
    } catch (error: any) {
      setVerificationResults({
        ...verificationResults,
        [projectId]: {
          verified: false,
          error: error.message || 'Failed to verify',
          method: 'server-side',
        },
      });
    } finally {
      setVerifying({ ...verifying, [projectId]: false });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '1.5rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                textDecoration: 'none',
                color: '#111827',
              }}
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Projects</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showCreate ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {showCreate && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject}>
              {error && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                  }}
                >
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  placeholder="My Website"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                  }}
                >
                  Domain (optional)
                </label>
                <input
                  type="text"
                  value={projectDomain}
                  onChange={(e) => setProjectDomain(e.target.value)}
                  placeholder="example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              No projects yet. Create your first project to start tracking events.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {project.name}
                    </h3>
                    {project.domain && (
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {project.domain}
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <code
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {project.token}
                      </code>
                      <button
                        onClick={() => copySnippet(project.token)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Copy Snippet
                      </button>
                    </div>
                    
                    {/* Verify Section - Always Visible */}
                    <div
                      style={{
                        marginTop: '1.5rem',
                        padding: '1.25rem',
                        background: '#f0f9ff',
                        borderRadius: '8px',
                        border: '2px solid #3b82f6',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🔍</span>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1e40af',
                          }}
                        >
                          Verify Snippet Installation
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={verifyingUrls[project.id] || ''}
                          onChange={(e) => setVerifyingUrls({ ...verifyingUrls, [project.id]: e.target.value })}
                          placeholder={project.domain || "example.com or https://example.com"}
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem',
                            border: '1px solid #93c5fd',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            background: 'white',
                          }}
                        />
                        <button
                          onClick={() => verifySnippet(project.id, verifyingUrls[project.id] || project.domain || '', project.token, false)}
                          disabled={verifying[project.id]}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: verifying[project.id] ? 'not-allowed' : 'pointer',
                            opacity: verifying[project.id] ? 0.6 : 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {verifying[project.id] ? 'Checking...' : 'Verify (Server)'}
                        </button>
                        <button
                          onClick={() => verifySnippet(project.id, verifyingUrls[project.id] || project.domain || '', project.token, true)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Verify (Browser)
                        </button>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        <strong>Server:</strong> Fast but may be blocked by CORS. <strong>Browser:</strong> Opens page in popup to check directly.
                      </div>
                      {verificationResults[project.id] && (
                        <div
                          style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: verificationResults[project.id].verified === true ? '#d1fae5' : 
                                       verificationResults[project.id].verified === null ? '#fef3c7' : '#fee2e2',
                            border: `1px solid ${
                              verificationResults[project.id].verified === true ? '#a7f3d0' : 
                              verificationResults[project.id].verified === null ? '#fbbf24' : '#fecaca'
                            }`,
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                          }}
                        >
                          {verificationResults[project.id].verified === true ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '0.25rem' }}>
                                ✓ Snippet Found
                              </div>
                              {verificationResults[project.id].token && (
                                <div style={{ color: '#047857', marginTop: '0.25rem' }}>
                                  Token: {verificationResults[project.id].token}
                                  {verificationResults[project.id].tokenMatches ? (
                                    <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>✓ Matches</span>
                                  ) : (
                                    <span style={{ marginLeft: '0.5rem', color: '#dc2626' }}>✗ Doesn't match</span>
                                  )}
                                </div>
                              )}
                              {verificationResults[project.id].method && (
                                <div style={{ color: '#047857', marginTop: '0.25rem', fontSize: '0.7rem' }}>
                                  Verified via: {verificationResults[project.id].method}
                                </div>
                              )}
                            </div>
                          ) : verificationResults[project.id].verified === null ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
                                🔍 Manual Verification Required
                              </div>
                              {verificationResults[project.id].instructions && (
                                <div style={{ color: '#78350f', marginTop: '0.25rem', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                                  {verificationResults[project.id].instructions}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>
                                ✗ Snippet Not Found
                              </div>
                              {verificationResults[project.id].error && (
                                <div style={{ color: '#991b1b', marginTop: '0.25rem' }}>
                                  {verificationResults[project.id].error}
                                </div>
                              )}
                              {verificationResults[project.id].suggestion && (
                                <div style={{ color: '#1e40af', marginTop: '0.5rem', padding: '0.5rem', background: '#dbeafe', borderRadius: '4px' }}>
                                  💡 {verificationResults[project.id].suggestion}
                                </div>
                              )}
                              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '4px', fontSize: '0.8rem', lineHeight: '1.6' }}>
                                <strong>Manual Check:</strong><br/>
                                1. Open the website<br/>
                                2. Press F12 (DevTools)<br/>
                                3. Go to Console tab<br/>
                                4. Type: <code style={{ background: '#fff', padding: '0.2rem 0.4rem', borderRadius: '3px', fontFamily: 'monospace' }}>window.PIXELPULSE_TOKEN</code><br/>
                                5. It should show: <code style={{ background: '#fff', padding: '0.2rem 0.4rem', borderRadius: '3px', fontFamily: 'monospace' }}>"{project.token}"</code>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

