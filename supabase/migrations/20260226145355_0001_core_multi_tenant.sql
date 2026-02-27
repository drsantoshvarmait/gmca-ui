-- =========================================
-- 0001_core_multi_tenant.sql
-- Multi-Tenant Core Foundation
-- =========================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =========================================
-- SCHEMAS
-- =========================================

create schema if not exists core;
create schema if not exists audit;

-- =========================================
-- TENANTS
-- =========================================

create table core.tenants (
    tenant_id uuid primary key default gen_random_uuid(),
    tenant_name text not null,
    tenant_code text not null unique,
    status text not null default 'ACTIVE'
        check (status in ('ACTIVE','INACTIVE','SUSPENDED')),
    created_at timestamptz not null default now(),
    created_by uuid,
    updated_at timestamptz,
    updated_by uuid
);

-- =========================================
-- ROLES
-- =========================================

create table core.roles (
    role_id uuid primary key default gen_random_uuid(),
    role_name text not null,
    role_scope text not null
        check (role_scope in ('GLOBAL','TENANT')),
    created_at timestamptz not null default now()
);

-- =========================================
-- APP USERS (linked to auth.users)
-- =========================================

create table core.app_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    tenant_id uuid not null references core.tenants(tenant_id) on delete cascade,
    role_id uuid not null references core.roles(role_id),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

create index idx_app_users_tenant on core.app_users(tenant_id);

-- =========================================
-- AUDIT LOGS
-- =========================================

create table audit.audit_logs (
    audit_id uuid primary key default gen_random_uuid(),
    tenant_id uuid,
    table_name text not null,
    record_id uuid,
    action_type text not null
        check (action_type in ('INSERT','UPDATE','DELETE')),
    old_data jsonb,
    new_data jsonb,
    changed_by uuid,
    changed_at timestamptz not null default now()
);

create index idx_audit_tenant on audit.audit_logs(tenant_id);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table core.tenants enable row level security;
alter table core.roles enable row level security;
alter table core.app_users enable row level security;
alter table audit.audit_logs enable row level security;

-- Basic tenant isolation policy (JWT must contain tenant_id claim)

create policy tenant_isolation_tenants
on core.tenants
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_isolation_users
on core.app_users
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_isolation_audit
on audit.audit_logs
for all
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Roles table can be global read-only for now
create policy roles_read_all
on core.roles
for select
using (true);
