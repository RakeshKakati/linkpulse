import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY?.trim();

    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'your_supabase_project_url' || 
        supabaseKey === 'your_supabase_service_role_key' ||
        supabaseUrl.length < 10 ||
        supabaseKey.length < 10) {
      console.error('Supabase not configured. URL:', supabaseUrl ? 'SET' : 'MISSING', 'KEY:', supabaseKey ? 'SET' : 'MISSING');
      // Return success to not break client, but log error
      return NextResponse.json({ ok: true, warning: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle both JSON and Blob (from sendBeacon)
    let payload;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      // Handle Blob from sendBeacon
      const blob = await req.blob();
      const text = await blob.text();
      payload = JSON.parse(text);
    }

    // Get project from token in payload (for external site events)
    // Or get user from cookie (for test page events)
    let projectId: string | null = null;
    let userId: string | null = null;
    
    // Check if payload has a project token
    if (payload.token) {
      const { data: project, error: projectError } = await supabase
        .from('pixel_projects')
        .select('id, user_id')
        .eq('token', payload.token)
        .single();
      
      if (projectError) {
        console.error('Project lookup error:', projectError);
      }
      
      if (project) {
        projectId = project.id;
        userId = project.user_id;
        console.log(`Event received for project ${projectId} (token: ${payload.token})`);
      } else {
        console.warn(`No project found for token: ${payload.token}`);
      }
    } else {
      // Try to get user from cookie (for test page)
      try {
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
          supabaseUrl,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return cookieStore.get(name)?.value;
              },
              set() {},
              remove() {},
            },
          }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();
        userId = user?.id || null;
      } catch (e) {
        // No user - events will be anonymous
        console.log('No authenticated user for event');
      }
    }

    // Validate payload structure
    if (!payload.t || !payload.ts) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Insert event into database
    // If no project_id or user_id, event will be orphaned (shouldn't happen in production)
    const eventData = {
      type: payload.t,
      props: payload.p || {},
      url: payload.url || '',
      session: payload.session || '',
      page: payload.page || '',
      ts: payload.ts,
      project_id: projectId,
      user_id: userId,
      created_at: new Date(payload.ts).toISOString()
    };

    console.log('Inserting event:', { type: payload.t, project_id: projectId, user_id: userId, url: payload.url });

    const { error, data } = await supabase
      .from('pixel_events')
      .insert(eventData)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      // If table doesn't exist, return success to not break client
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.error('Table pixel_events does not exist. Please run schema.sql in Supabase.');
        return NextResponse.json({ ok: true, warning: 'Table not found' });
      }
      return NextResponse.json(
        { error: 'Failed to store event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API error:', error);
    // Return success to not break client tracking
    return NextResponse.json({ ok: true, warning: 'Error processing event' });
  }
}

// Handle CORS for cross-origin requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

