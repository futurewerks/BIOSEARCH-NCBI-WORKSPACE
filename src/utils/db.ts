import { supabase } from './supabase';
import type { SearchChip, SearchHistoryEntry } from '../types/search';

// ── Search history ────────────────────────────────────────────────

export async function dbLoadHistory(): Promise<SearchHistoryEntry[]> {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id:          row.id,
    chips:       row.chips as SearchChip[],
    selectedDb:  row.selected_db,
    dateFrom:    row.date_from,
    dateTo:      row.date_to,
    queryString: row.query_string,
    timestamp:   new Date(row.created_at).getTime(),
  }));
}

export async function dbSaveHistory(entry: SearchHistoryEntry): Promise<void> {
  // Remove duplicate query string for this user
  await supabase
    .from('search_history')
    .delete()
    .eq('query_string', entry.queryString);

  // Enforce max 10: delete oldest beyond limit
  const { data: existing } = await supabase
    .from('search_history')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  if (existing && existing.length >= 10) {
    const toDelete = existing.slice(9).map((r) => r.id);
    await supabase.from('search_history').delete().in('id', toDelete);
  }

  const { error } = await supabase.from('search_history').insert({
    query_string: entry.queryString,
    chips:        entry.chips,
    selected_db:  entry.selectedDb,
    date_from:    entry.dateFrom,
    date_to:      entry.dateTo,
    // user_id filled by DEFAULT auth.uid()
  });

  if (error) throw error;
}

export async function dbClearHistory(): Promise<void> {
  const { error } = await supabase.from('search_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

export async function dbDeleteHistoryEntry(id: string): Promise<void> {
  const { error } = await supabase.from('search_history').delete().eq('id', id);
  if (error) throw error;
}

// ── Collections ───────────────────────────────────────────────────

export interface Collection {
  id:          string;
  name:        string;
  description: string | null;
  createdAt:   string;
}

export async function dbLoadCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id:          row.id,
    name:        row.name,
    description: row.description,
    createdAt:   row.created_at,
  }));
}

export async function dbCreateCollection(name: string, description?: string): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert({ name, description: description ?? null })
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, name: data.name, description: data.description, createdAt: data.created_at };
}

export async function dbDeleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

// ── Saved articles ────────────────────────────────────────────────

export interface SavedArticle {
  id:           string;
  collectionId: string | null;
  ncbiUid:      string;
  db:           string;
  title:        string | null;
  summaryJson:  Record<string, unknown> | null;
  createdAt:    string;
}

export async function dbLoadSavedArticles(collectionId?: string): Promise<SavedArticle[]> {
  let q = supabase
    .from('saved_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (collectionId) q = q.eq('collection_id', collectionId);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id:           row.id,
    collectionId: row.collection_id,
    ncbiUid:      row.ncbi_uid,
    db:           row.db,
    title:        row.title,
    summaryJson:  row.summary_json,
    createdAt:    row.created_at,
  }));
}

export async function dbSaveArticle(
  ncbiUid: string,
  db: string,
  title: string | null,
  summaryJson: Record<string, unknown> | null,
  collectionId?: string,
): Promise<SavedArticle> {
  const { data, error } = await supabase
    .from('saved_articles')
    .upsert(
      { ncbi_uid: ncbiUid, db, title, summary_json: summaryJson, collection_id: collectionId ?? null },
      { onConflict: 'user_id,ncbi_uid,db' },
    )
    .select()
    .single();

  if (error) throw error;

  return {
    id:           data.id,
    collectionId: data.collection_id,
    ncbiUid:      data.ncbi_uid,
    db:           data.db,
    title:        data.title,
    summaryJson:  data.summary_json,
    createdAt:    data.created_at,
  };
}

export async function dbRemoveSavedArticle(ncbiUid: string, db: string): Promise<void> {
  const { error } = await supabase
    .from('saved_articles')
    .delete()
    .eq('ncbi_uid', ncbiUid)
    .eq('db', db);
  if (error) throw error;
}

export async function dbIsArticleSaved(ncbiUid: string, db: string): Promise<boolean> {
  const { data } = await supabase
    .from('saved_articles')
    .select('id')
    .eq('ncbi_uid', ncbiUid)
    .eq('db', db)
    .maybeSingle();
  return data !== null;
}
