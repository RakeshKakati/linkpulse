-- PixelPulse Database Schema

-- Projects/Sites table - each user can have multiple projects
create table if not exists pixel_projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  token text unique not null,
  domain text,
  created_at timestamptz default now()
);

-- Main events table
create table if not exists pixel_events (
  id bigint generated always as identity primary key,
  type text not null,
  props jsonb default '{}',
  url text,
  session text,
  page text,
  ts bigint not null,
  created_at timestamptz default now()
);

-- Add user_id column if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'pixel_events' and column_name = 'user_id') then
    alter table pixel_events add column user_id uuid references auth.users(id) on delete cascade;
  end if;
end $$;

-- Add project_id column if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'pixel_events' and column_name = 'project_id') then
    alter table pixel_events add column project_id uuid references pixel_projects(id) on delete cascade;
  end if;
end $$;

-- Indexes for fast queries
create index if not exists idx_pixel_type on pixel_events(type);
create index if not exists idx_pixel_url on pixel_events(url);
create index if not exists idx_pixel_session on pixel_events(session);
create index if not exists idx_pixel_created_at on pixel_events(created_at);
create index if not exists idx_pixel_type_created on pixel_events(type, created_at);
create index if not exists idx_pixel_user_id on pixel_events(user_id);
create index if not exists idx_pixel_project_id on pixel_events(project_id);
create index if not exists idx_projects_user_id on pixel_projects(user_id);
create index if not exists idx_projects_token on pixel_projects(token);

-- Insights table (computed insights)
create table if not exists pixel_insights (
  id bigint generated always as identity primary key,
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  summary text,
  action text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  resolved_at timestamptz,
  is_resolved boolean default false
);

create index if not exists idx_insights_severity on pixel_insights(severity, is_resolved);
create index if not exists idx_insights_created on pixel_insights(created_at);

-- Aggregated stats view (for dashboard)
create or replace view pixel_stats as
select 
  type,
  count(*) as count,
  count(distinct session) as unique_sessions,
  count(distinct url) as unique_urls,
  min(created_at) as first_seen,
  max(created_at) as last_seen
from pixel_events
group by type;
