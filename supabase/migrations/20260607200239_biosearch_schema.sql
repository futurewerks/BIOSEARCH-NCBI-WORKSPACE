-- ── search_history ──────────────────────────────────────────────
-- Persists the user's recent queries. Scoped by session_id (a UUID
-- generated client-side and stored in localStorage) so each browser
-- gets its own private history without requiring an account.

CREATE TABLE IF NOT EXISTS search_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid        NOT NULL,
  query_string text        NOT NULL,
  chips        jsonb       NOT NULL DEFAULT '[]',
  selected_db  text        NOT NULL,
  date_from    integer     NOT NULL DEFAULT 1900,
  date_to      integer     NOT NULL DEFAULT 2025,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_history_session ON search_history (session_id, created_at DESC);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_history_select" ON search_history
  FOR SELECT TO anon USING (true);

CREATE POLICY "search_history_insert" ON search_history
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "search_history_update" ON search_history
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "search_history_delete" ON search_history
  FOR DELETE TO anon USING (true);


-- ── collections ──────────────────────────────────────────────────
-- Named groups that users can create to organise saved articles.

CREATE TABLE IF NOT EXISTS collections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_collections_session ON collections (session_id, created_at DESC);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_select" ON collections
  FOR SELECT TO anon USING (true);

CREATE POLICY "collections_insert" ON collections
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "collections_update" ON collections
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "collections_delete" ON collections
  FOR DELETE TO anon USING (true);


-- ── saved_articles ────────────────────────────────────────────────
-- Individual NCBI records bookmarked by the user; optionally linked
-- to a collection. The summary_json column caches the ESummary
-- payload so bookmarked articles can be displayed offline.

CREATE TABLE IF NOT EXISTS saved_articles (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid        NOT NULL,
  collection_id  uuid        REFERENCES collections (id) ON DELETE SET NULL,
  ncbi_uid       text        NOT NULL,
  db             text        NOT NULL,
  title          text,
  summary_json   jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (session_id, ncbi_uid, db)
);

CREATE INDEX idx_saved_articles_session     ON saved_articles (session_id, created_at DESC);
CREATE INDEX idx_saved_articles_collection  ON saved_articles (collection_id);

ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_articles_select" ON saved_articles
  FOR SELECT TO anon USING (true);

CREATE POLICY "saved_articles_insert" ON saved_articles
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "saved_articles_update" ON saved_articles
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "saved_articles_delete" ON saved_articles
  FOR DELETE TO anon USING (true);
