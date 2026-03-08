


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "core";


ALTER SCHEMA "core" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."current_user_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
    return (auth.jwt() ->> 'sub')::uuid;
end;
$$;


ALTER FUNCTION "core"."current_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "core"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'core'
    AS $$
begin

  insert into core.profiles (
    id,
    email,
    role,
    preferred_language_code,
    created_at
  )
  values (
    new.id,
    new.email,
    'USER',
    'en',
    now()
  )
  on conflict (id) do nothing;

  return new;

end;
$$;


ALTER FUNCTION "core"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."has_permission"("p_user_id" "uuid", "p_permission_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
    v_count int;
begin
    select count(*) into v_count
    from core.app_users u
    join core.role_permissions rp on rp.role_id = u.role_id
    join core.permissions p on p.permission_id = rp.permission_id
    where u.user_id = p_user_id
      and p.permission_code = p_permission_code
      and u.is_active = true;

    return v_count > 0;
end;
$$;


ALTER FUNCTION "core"."has_permission"("p_user_id" "uuid", "p_permission_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."notify_task_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin

insert into core.notifications
(
id,
user_id,
title,
message,
created_at
)
values
(
gen_random_uuid(),
new.assigned_to,
'Task Assigned',
'You have been assigned a new task',
now()
);

return new;

end;
$$;


ALTER FUNCTION "core"."notify_task_assignment"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "core"."app_users" (
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "core"."app_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "message" "text",
    "type" "text",
    "read" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "order" integer DEFAULT 0
);


ALTER TABLE "core"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."permissions" (
    "permission_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "permission_code" "text" NOT NULL,
    "module" "text" NOT NULL,
    "action" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "core"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'USER'::"text",
    "tenant_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "preferred_language_code" "text" DEFAULT 'en'::"text"
);


ALTER TABLE "core"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL
);


ALTER TABLE "core"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."roles" (
    "role_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_name" "text" NOT NULL,
    "role_scope" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "roles_role_scope_check" CHECK (("role_scope" = ANY (ARRAY['GLOBAL'::"text", 'TENANT'::"text"])))
);


ALTER TABLE "core"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."tenants" (
    "tenant_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_name" "text" NOT NULL,
    "tenant_code" "text" NOT NULL,
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone,
    "updated_by" "uuid",
    CONSTRAINT "tenants_status_check" CHECK (("status" = ANY (ARRAY['ACTIVE'::"text", 'INACTIVE'::"text", 'SUSPENDED'::"text"])))
);


ALTER TABLE "core"."tenants" OWNER TO "postgres";


CREATE OR REPLACE VIEW "core"."v_current_user" AS
 SELECT "u"."id",
    "p"."email",
    "p"."role",
    "p"."tenant_id",
    "p"."preferred_language_code"
   FROM ("auth"."users" "u"
     LEFT JOIN "core"."profiles" "p" ON (("p"."id" = "u"."id")));


ALTER VIEW "core"."v_current_user" OWNER TO "postgres";


CREATE OR REPLACE VIEW "core"."v_dashboard_stats" AS
 SELECT "id" AS "user_id",
    "tenant_id",
    ( SELECT "count"(*) AS "count"
           FROM ("task"."task_assignments" "ta"
             JOIN "task"."tasks" "t" ON (("t"."id" = "ta"."task_id")))
          WHERE (("ta"."assigned_to" = "u"."id") AND ("ta"."tenant_id" = "u"."tenant_id") AND ("t"."status" <> ALL (ARRAY['Completed'::"text", 'Closed'::"text"])))) AS "my_active_tasks",
    ( SELECT "count"(*) AS "count"
           FROM ("task"."task_assignments" "ta"
             JOIN "task"."tasks" "t" ON (("t"."id" = "ta"."task_id")))
          WHERE (("ta"."assigned_to" = "u"."id") AND ("ta"."tenant_id" = "u"."tenant_id") AND ("t"."status" = 'Completed'::"text"))) AS "my_completed_tasks",
    ( SELECT "count"(*) AS "count"
           FROM "task"."tasks" "t"
          WHERE (("t"."created_by" = "u"."id") AND ("t"."tenant_id" = "u"."tenant_id") AND ("t"."status" <> ALL (ARRAY['Completed'::"text", 'Closed'::"text"])))) AS "my_pending_tasks",
    ( SELECT "count"(*) AS "count"
           FROM ("task"."task_assignments" "ta"
             JOIN "task"."tasks" "t" ON (("t"."id" = "ta"."task_id")))
          WHERE (("ta"."assigned_to" = "u"."id") AND ("ta"."tenant_id" = "u"."tenant_id") AND ("t"."status" <> ALL (ARRAY['Completed'::"text", 'Closed'::"text"])) AND ("t"."due_date" < "now"()))) AS "overdue_tasks",
    ( SELECT "count"(*) AS "count"
           FROM ("task"."task_assignments" "ta"
             JOIN "task"."tasks" "t" ON (("t"."id" = "ta"."task_id")))
          WHERE (("ta"."assigned_to" = "u"."id") AND ("ta"."tenant_id" = "u"."tenant_id") AND ("t"."status" <> ALL (ARRAY['Completed'::"text", 'Closed'::"text"])) AND ("t"."due_date" < ("now"() - '24:00:00'::interval)))) AS "sla_breached_tasks",
    ( SELECT "count"(*) AS "count"
           FROM "core"."notifications" "n"
          WHERE (("n"."user_id" = "u"."id") AND ("n"."read" = false))) AS "unread_notifications"
   FROM "core"."v_current_user" "u";


ALTER VIEW "core"."v_dashboard_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "core"."v_dashboard_user" AS
 SELECT "u"."id" AS "user_id",
    "p"."email",
    "p"."role",
    "p"."tenant_id",
    "p"."preferred_language_code",
    ( SELECT "count"(*) AS "count"
           FROM "core"."notifications" "n"
          WHERE (("n"."user_id" = "u"."id") AND ("n"."read" = false))) AS "unread_notifications"
   FROM ("auth"."users" "u"
     LEFT JOIN "core"."profiles" "p" ON (("p"."id" = "u"."id")));


ALTER VIEW "core"."v_dashboard_user" OWNER TO "postgres";


CREATE OR REPLACE VIEW "core"."v_notifications" AS
 SELECT "id",
    "user_id",
    "message",
    "type",
    "read",
    "created_at",
    "order"
   FROM "core"."notifications";


ALTER VIEW "core"."v_notifications" OWNER TO "postgres";


ALTER TABLE ONLY "core"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "core"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."permissions"
    ADD CONSTRAINT "permissions_permission_code_key" UNIQUE ("permission_code");



ALTER TABLE ONLY "core"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id");



ALTER TABLE ONLY "core"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "core"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id");



ALTER TABLE ONLY "core"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "core"."tenants"
    ADD CONSTRAINT "tenants_tenant_code_key" UNIQUE ("tenant_code");



CREATE INDEX "idx_app_users_tenant" ON "core"."app_users" USING "btree" ("tenant_id");



CREATE INDEX "idx_permissions_module" ON "core"."permissions" USING "btree" ("module");



ALTER TABLE ONLY "core"."app_users"
    ADD CONSTRAINT "app_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("role_id");



ALTER TABLE ONLY "core"."app_users"
    ADD CONSTRAINT "app_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("tenant_id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."app_users"
    ADD CONSTRAINT "app_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."profiles"
    ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("tenant_id");



ALTER TABLE ONLY "core"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "core"."permissions"("permission_id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("role_id") ON DELETE CASCADE;



CREATE POLICY "Users can see their notifications" ON "core"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "allow_read_notifications" ON "core"."notifications" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "core"."app_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_read_authenticated" ON "core"."notifications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "notifications_select_authenticated" ON "core"."notifications" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "core"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "core"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_authenticated" ON "core"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_select_own" ON "core"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_own" ON "core"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "core"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_read_all" ON "core"."roles" FOR SELECT USING (true);



CREATE POLICY "tenant_isolation_tenants" ON "core"."tenants" USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_users" ON "core"."app_users" USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_permission_isolation" ON "core"."role_permissions" USING (true);



CREATE POLICY "tenant_permission_read" ON "core"."permissions" FOR SELECT USING (true);



ALTER TABLE "core"."tenants" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "core" TO "anon";
GRANT USAGE ON SCHEMA "core" TO "authenticated";



GRANT SELECT ON TABLE "core"."app_users" TO "anon";
GRANT SELECT ON TABLE "core"."app_users" TO "authenticated";



GRANT SELECT ON TABLE "core"."notifications" TO "anon";
GRANT SELECT ON TABLE "core"."notifications" TO "authenticated";



GRANT SELECT ON TABLE "core"."permissions" TO "anon";
GRANT SELECT ON TABLE "core"."permissions" TO "authenticated";



GRANT SELECT ON TABLE "core"."profiles" TO "anon";
GRANT SELECT ON TABLE "core"."profiles" TO "authenticated";



GRANT SELECT ON TABLE "core"."role_permissions" TO "anon";
GRANT SELECT ON TABLE "core"."role_permissions" TO "authenticated";



GRANT SELECT ON TABLE "core"."roles" TO "anon";
GRANT SELECT ON TABLE "core"."roles" TO "authenticated";



GRANT SELECT ON TABLE "core"."tenants" TO "anon";
GRANT SELECT ON TABLE "core"."tenants" TO "authenticated";



GRANT SELECT ON TABLE "core"."v_notifications" TO "anon";
GRANT SELECT ON TABLE "core"."v_notifications" TO "authenticated";




