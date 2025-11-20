import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { computeInsights, Event } from '@/lib/insights';

export async function GET(req: NextRequest) {
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
      return NextResponse.json(
        { 
          error: 'Supabase not configured',
          message: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local with your actual Supabase credentials',
          events: [],
          insights: []
        },
        { status: 500 }
      );
    }

    // Get authenticated user
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

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Please log in to view your events',
          events: [],
          insights: []
        },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get user's projects
    const { data: projects } = await supabase
      .from('pixel_projects')
      .select('id')
      .eq('user_id', user.id);

    const projectIds = projects?.map(p => p.id) || [];

    // Fetch events for this user's projects only
    let query = supabase
      .from('pixel_events')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000);

    if (projectIds.length > 0) {
      query = query.in('project_id', projectIds);
    } else {
      // No projects yet, return empty
      return NextResponse.json({
        events: [],
        insights: [],
      });
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      // If table doesn't exist, return empty data instead of error
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          events: [],
          insights: [],
          message: 'Database table not found. Please run the schema.sql in your Supabase SQL editor.'
        });
      }
      return NextResponse.json(
        { 
          error: 'Failed to fetch events',
          message: error.message,
          events: [],
          insights: []
        },
        { status: 500 }
      );
    }

    // Compute insights
    const insights = computeInsights((events || []) as Event[]);

    return NextResponse.json({
      events: events || [],
      insights,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        events: [],
        insights: []
      },
      { status: 500 }
    );
  }
}

