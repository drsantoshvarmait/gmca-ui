-- =========================================
-- PROFILES TABLE
-- =========================================

create table if not exists core.profiles (

    id uuid primary key references auth.users(id) on delete cascade,

    email text,

    role text default 'USER',

    tenant_id uuid references core.tenants(tenant_id),

    created_at timestamp default now()

);

alter table core.profiles enable row level security;



-- =========================================
-- NOTIFICATIONS TABLE
-- =========================================

create table if not exists core.notifications (

    id uuid primary key default gen_random_uuid(),

    user_id uuid references core.profiles(id) on delete cascade,

    message text,

    type text,

    read boolean default false,

    created_at timestamp default now()

);

alter table core.notifications enable row level security;