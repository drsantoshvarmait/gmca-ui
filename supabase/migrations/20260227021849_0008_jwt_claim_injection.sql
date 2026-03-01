-- ============================================
-- 0008_jwt_claim_injection
-- Inject tenant_id and role_id into JWT
-- ============================================

-- =====================================================
-- FUNCTION: ADD CUSTOM CLAIMS (in core schema)
-- =====================================================

create or replace function core.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_tenant_id uuid;
    v_role_id uuid;
begin
    -- Extract user id from event
    v_user_id := (event->>'user_id')::uuid;

    -- Fetch tenant + role
    select tenant_id, role_id
    into v_tenant_id, v_role_id
    from core.app_users
    where user_id = v_user_id;

    -- Inject claims
    event := jsonb_set(event, '{claims,tenant_id}', to_jsonb(v_tenant_id));
    event := jsonb_set(event, '{claims,role_id}', to_jsonb(v_role_id));

    return event;
end;
$$;