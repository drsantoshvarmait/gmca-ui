-- ============================================
-- 0012_documentation_system
-- System Architecture and User Documentation
-- ============================================

create table if not exists public.meta_docs (
    doc_id uuid primary key default gen_random_uuid(),
    doc_title text not null,
    doc_category text not null, -- 'ARCHITECTURE', 'ONBOARDING', 'API', 'USER_GUIDE'
    doc_content text not null,
    related_table text, -- Optional link to a database table
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.meta_docs enable row level security;

-- Policies
drop policy if exists "Allow public read access to system docs" on public.meta_docs;
create policy "Allow public read access to system docs"
on public.meta_docs for select
to authenticated
using (true);

drop policy if exists "Allow admins to manage system docs" on public.meta_docs;
create policy "Allow admins to manage system docs"
on public.meta_docs for all
to authenticated
using (
    exists (
        select 1 from core.profiles
        where id = auth.uid()
        and role = 'SUPER_ADMIN'
    )
);

-- Initial Seed for Architecture
insert into public.meta_docs (doc_title, doc_category, doc_content, related_table)
values (
    'System Architecture Overview',
    'ARCHITECTURE',
    'GMCA UI is a multi-tenant administrative platform built with React 19 and Supabase. It uses PostgreSQL schemas for module isolation and RLS for tenant security.',
    'core.tenants'
)
on conflict do nothing;
