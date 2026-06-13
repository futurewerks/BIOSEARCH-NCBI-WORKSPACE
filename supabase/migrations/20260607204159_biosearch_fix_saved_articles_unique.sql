-- Drop the old session_id-based unique constraint
ALTER TABLE saved_articles
  DROP CONSTRAINT IF EXISTS saved_articles_session_id_ncbi_uid_db_key;

-- Add user_id-based unique constraint so upserts work correctly
ALTER TABLE saved_articles
  ADD CONSTRAINT saved_articles_user_ncbi_db_key
  UNIQUE (user_id, ncbi_uid, db);
