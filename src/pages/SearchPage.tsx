import { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import type { SearchChip, DatabaseInfo, SearchHistoryEntry, EsearchResult } from '../types/search';
import { DATABASES, MIN_YEAR, MAX_YEAR } from '../constants';
import { buildQueryString, runEsearch } from '../utils/ncbi';
import { dbLoadHistory, dbSaveHistory, dbClearHistory } from '../utils/db';
import QueryBuilder from '../components/QueryBuilder/QueryBuilder';
import QueryPreview from '../components/QueryPreview';
import DatabasePills from '../components/DatabasePills';
import DateRangeSlider from '../components/DateRangeSlider';
import SearchHistory from '../components/SearchHistory';

interface Props {
  onResults: (result: EsearchResult, db: string, query: string, chips: SearchChip[], dateFrom: number, dateTo: number, dbInfo: DatabaseInfo) => void;
}

export default function SearchPage({ onResults }: Props) {
  const [chips, setChips] = useState<SearchChip[]>([]);
  const [selectedDb, setSelectedDb] = useState<DatabaseInfo>(DATABASES[0]);
  const [dateFrom, setDateFrom] = useState(MIN_YEAR);
  const [dateTo, setDateTo] = useState(MAX_YEAR);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  const query = buildQueryString(chips, dateFrom, dateTo);

  useEffect(() => {
    dbLoadHistory()
      .then(setHistory)
      .catch(() => {/* non-critical */});
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;
    setError(null);
    setSearching(true);
    try {
      const result = await runEsearch(selectedDb.ncbiDb, query);
      const entry: SearchHistoryEntry = {
        id:          crypto.randomUUID(),
        chips,
        selectedDb:  selectedDb.id,
        dateFrom,
        dateTo,
        queryString: query,
        timestamp:   Date.now(),
      };
      await dbSaveHistory(entry).catch(() => {/* non-critical */});
      dbLoadHistory().then(setHistory).catch(() => {});
      onResults(result, selectedDb.ncbiDb, query, chips, dateFrom, dateTo, selectedDb);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function restoreHistory(entry: SearchHistoryEntry) {
    setChips(entry.chips);
    setDateFrom(entry.dateFrom);
    setDateTo(entry.dateTo);
    setSelectedDb(DATABASES.find((d) => d.id === entry.selectedDb) ?? DATABASES[0]);
  }

  async function handleClearHistory() {
    await dbClearHistory().catch(() => {});
    setHistory([]);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-bold text-on-surface tracking-tight">Advanced Search</h2>
        <p className="text-xs text-on-surface-3 mt-0.5">Build precise queries across NCBI databases.</p>
      </div>

      {/* Unified search panel */}
      <div className="bg-surface rounded-xl border border-outline shadow-card overflow-hidden">

        {/* ── Query builder ── */}
        <div className="p-4">
          <QueryBuilder chips={chips} onChange={setChips} />
        </div>

        {/* ── Compiled query preview ── */}
        {query && (
          <div className="border-t border-outline-dim">
            <QueryPreview query={query} />
          </div>
        )}

        {/* ── Target database ── */}
        <div className="border-t border-outline-dim">
          <div className="flex items-center justify-between px-4 pt-3 pb-0">
            <span className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
              Target Database
            </span>
          </div>
          <div className="p-4">
            <DatabasePills
              selectedDb={selectedDb.id}
              onSelect={setSelectedDb}
            />
          </div>
        </div>

        {/* ── Publication date + Execute ── */}
        <div className="border-t border-outline-dim px-4 py-4">
          <div className="flex items-end gap-5">
            <div className="flex-1">
              <DateRangeSlider
                from={dateFrom}
                to={dateTo}
                onChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || searching}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-cta hover:brightness-110 active:brightness-95 text-on-primary font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary-cta/40 focus:ring-offset-2 focus:ring-offset-surface whitespace-nowrap"
            >
              {searching ? (
                <><Loader2 size={14} className="animate-spin" /> Searching…</>
              ) : (
                <><Search size={14} /> Execute Query</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recent searches */}
      <SearchHistory
        history={history}
        onSelect={restoreHistory}
        onClear={handleClearHistory}
      />
    </div>
  );
}
