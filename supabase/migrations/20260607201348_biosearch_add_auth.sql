/*
# Add user authentication to BioSearch tables

## Summary
Migrates search_history, collections, and saved_articles from anonymous
session-based access to proper Supabase auth user ownership.

## Changes

### search_history
- Added: `user_id uuid DEFAULT auth.uid()` — links each history entry to the
  authenticated user. DEFAULT fills it automatically on INSERT so the frontend
  never needs to pass it explicitly.
- Dropped: all anon USING(true) policies.
- Added: 4 authenticated-only owner-scoped policies (SELECT/INSERT/UPDATE/DELETE).

### collections
- Same user_id column + policy swap as search_history.

### saved_articles
- Same user_id column + policy swap as search_history.

## Security
All three tables now reject unauthenticated requests entirely.
Authenticated users can only access rows where user_id = auth.uid().

## Notes
1. The session_id column is retained (data safety) but is no longer used
   by the application.
2. The user_id column is nullable to allow the migration to run even if
   rows with no owner exist; application inserts always populate it via
   DEFAULT auth.uid().
*/

-- ── search_history ────────────────────────────────────────────────

ALTER TABLE search_history
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "search_history_select" ON search_history;
DROP POLICY IF EXISTS "search_history_insert" ON search_history;
DROP POLICY IF EXISTS "search_history_update" ON search_history;
DROP POLICY IF EXISTS "search_history_delete" ON search_history;

CREATE POLICY "search_history_select" ON search_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "search_history_insert" ON search_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "search_history_update" ON search_history
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "search_history_delete" ON search_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user
  ON search_history (user_id, created_at DESC);


-- ── collections ───────────────────────────────────────────────────

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "collections_select" ON collections;
DROP POLICY IF EXISTS "collections_insert" ON collections;
DROP POLICY IF EXISTS "collections_update" ON collections;
DROP POLICY IF EXISTS "collections_delete" ON collections;

CREATE POLICY "collections_select" ON collections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "collections_insert" ON collections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collections_update" ON collections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collections_delete" ON collections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_collections_user
  ON collections (user_id, created_at DESC);


-- ── saved_articles ────────────────────────────────────────────────

ALTER TABLE saved_articles
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "saved_articles_select" ON saved_articles;
DROP POLICY IF EXISTS "saved_articles_insert" ON saved_articles;
DROP POLICY IF EXISTS "saved_articles_update" ON saved_articles;
DROP POLICY IF EXISTS "saved_articles_delete" ON saved_articles;

CREATE POLICY "saved_articles_select" ON saved_articles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "saved_articles_insert" ON saved_articles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_articles_update" ON saved_articles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_articles_delete" ON saved_articles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_articles_user
  ON saved_articles (user_id, created_at DESC);
