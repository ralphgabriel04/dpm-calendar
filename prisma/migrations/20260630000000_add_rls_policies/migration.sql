-- Defense-in-depth Row Level Security (RLS) for all user-owned tables.
--
-- IMPORTANT — this migration is SAFE to apply with no behavior change:
-- on Supabase the `postgres` and `service_role` roles have BYPASSRLS, and the
-- app connects as `postgres`. Applying RLS therefore immediately protects the
-- `anon`/`authenticated` API roles and any direct/non-bypass access, while the
-- Prisma path keeps working unchanged.
--
-- Full Prisma-path enforcement ("Phase B") is opt-in: point the runtime
-- DATABASE_URL at the `app_user` role below and set the request-scoped GUC
-- `app.current_user_id` per transaction (see src/infrastructure/db/rls.ts and the
-- "RLS rollout" section of README.md). Policies are written against that GUC and
-- fail closed (NULL when unset => zero rows).

-- ---------------------------------------------------------------------------
-- 1. Dedicated, RLS-subject runtime role (login/password granted out-of-band).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- ---------------------------------------------------------------------------
-- 2. Tables with a direct "userId" column: row is visible only to its owner.
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Account','AuditLog','Calendar','CalendarAccount','CalendarSection','DailyStats',
    'EnergyLog','Event','EventComment','Experiment','FocusSession','Goal','Habit',
    'JournalEntry','MeetingPoll','Notification','NotificationPreference','PushSubscription',
    'Recap','Rule','Session','ShareLink','Suggestion','Task','UserPreferences'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS rls_isolation ON %I', t);
    EXECUTE format($f$CREATE POLICY rls_isolation ON %I
      USING ("userId" = current_setting('app.current_user_id', true))
      WITH CHECK ("userId" = current_setting('app.current_user_id', true))$f$, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Child tables (no "userId"): ownership derived from the parent row.
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('Attendee',            'eventId',           'Event'),
    ('ChecklistItem',       'taskId',            'Task'),
    ('TimeBlock',           'taskId',            'Task'),
    ('GoalProgress',        'goalId',            'Goal'),
    ('HabitLog',            'habitId',           'Habit'),
    ('HabitBlock',          'habitId',           'Habit'),
    ('RuleExecution',       'ruleId',            'Rule'),
    ('SyncConflict',        'calendarAccountId', 'CalendarAccount'),
    ('SyncLog',             'calendarAccountId', 'CalendarAccount'),
    ('WebhookSubscription', 'calendarAccountId', 'CalendarAccount'),
    ('MeetingPollResponse', 'pollId',            'MeetingPoll')
  ) AS v(child, fk, parent)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.child);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.child);
    EXECUTE format('DROP POLICY IF EXISTS rls_isolation ON %I', r.child);
    EXECUTE format($f$CREATE POLICY rls_isolation ON %I
      USING (EXISTS (SELECT 1 FROM %I p WHERE p.id = %I.%I AND p."userId" = current_setting('app.current_user_id', true)))
      WITH CHECK (EXISTS (SELECT 1 FROM %I p WHERE p.id = %I.%I AND p."userId" = current_setting('app.current_user_id', true)))$f$,
      r.child, r.parent, r.child, r.fk, r.parent, r.child, r.fk);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Special tables.
-- ---------------------------------------------------------------------------
-- User: a person may see/modify only their own row (keyed by id).
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "User";
CREATE POLICY rls_isolation ON "User"
  USING (id = current_setting('app.current_user_id', true))
  WITH CHECK (id = current_setting('app.current_user_id', true));

-- PublicHoliday: shared reference data — readable by everyone, writable only by
-- BYPASSRLS roles (admin/migrations).
ALTER TABLE "PublicHoliday" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_read_all ON "PublicHoliday";
CREATE POLICY rls_read_all ON "PublicHoliday" FOR SELECT USING (true);

-- VerificationToken: NextAuth sign-in table. No policy => only BYPASSRLS roles
-- (the owner/dbAdmin connection used by the auth adapter) may touch it.
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
