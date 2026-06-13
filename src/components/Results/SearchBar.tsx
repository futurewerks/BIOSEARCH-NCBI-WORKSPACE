import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, Loader2, X } from 'lucide-react';
import type { SearchChip, DatabaseInfo } from '../../types/search';
import { DATABASES, MIN_YEAR, MAX_YEAR } from '../../constants';
import { buildQueryString } from '../../utils/ncbi';
import QueryBuilder from '../QueryBuilder/QueryBuilder';
import DatabasePills from '../DatabasePills';
import DateRangeSlider from '../DateRangeSlider';

interface Props {
  chips:    SearchChip[];
  dateFrom: number;
  dateTo:   number;
  dbInfo:   DatabaseInfo;
  onSearch: (query: string, chips: SearchChip[], dateFrom: number, dateTo: number, dbInfo: DatabaseInfo) => Promise<void>;
}

const DB_PILL: Record<string, string> = {
  pubmed:    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  pmc:       'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  gene:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  snp:       'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  clinvar:   'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  protein:   'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  structure: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  taxonomy:  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
};

export default function SearchBar({ chips: initChips, dateFrom: initFrom, dateTo: initTo, dbInfo: initDb, onSearch }: Props) {
  const [open,      setOpen]      = useState(false);
  const [chips,     setChips]     = useState<SearchChip[]>(initChips);
  const [dateFrom,  setDateFrom]  = useState(initFrom);
  const [dateTo,    setDateTo]    = useState(initTo);
  const [dbInfo,    setDbInfo]    = useState<DatabaseInfo>(initDb);
  const [searching, setSearching] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync if parent re-mounts (new query key)
  useEffect(() => {
    setChips(initChips);
    setDateFrom(initFrom);
    setDateTo(initTo);
    setDbInfo(initDb);
    setOpen(false);
    setError(null);
  }, [initChips, initFrom, initTo, initDb]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('pointerdown', onPointer, true);
    return () => window.removeEventListener('pointerdown', onPointer, true);
  }, [open]);

  const query = buildQueryString(chips, dateFrom, dateTo);

  async function handleExecute() {
    if (!query.trim()) return;
    setError(null);
    setSearching(true);
    try {
      await onSearch(query, chips, dateFrom, dateTo, dbInfo);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setSearching(false);
    }
  }

  const pillClass = DB_PILL[dbInfo.id] ?? DB_PILL.pubmed;
  const hasDateFilter = dateFrom > MIN_YEAR || dateTo < MAX_YEAR;

  // Summary of current chips for the collapsed bar
  const chipSummary = chips.length === 0
    ? 'No terms'
    : chips.map((c) => c.term || '…').filter(Boolean).join(' · ');

  return (
    <div ref={panelRef} className="relative">
      {/* ── Collapsed bar ── */}
      <button
        onClick={() => { setOpen((v) => !v); setError(null); }}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left
          ${open
            ? 'border-primary-cta/60 bg-surface shadow-glow-primary'
            : 'border-outline bg-surface hover:border-outline/60 hover:bg-surface-raised'
          }
        `}
      >
        <Search size={13} className="text-on-surface-3 shrink-0" />

        {/* DB badge */}
        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pillClass}`}>
          {dbInfo.label}
        </span>

        {/* Query summary */}
        <span className="flex-1 text-xs text-on-surface-2 truncate min-w-0">
          {chipSummary}
        </span>

        {/* Date range hint */}
        {hasDateFilter && (
          <span className="font-mono text-[10px] text-on-surface-3 shrink-0">
            {dateFrom}–{dateTo}
          </span>
        )}

        <ChevronDown
          size={13}
          className={`text-on-surface-3 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Expanded panel ── */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-surface border border-outline rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Query builder */}
          <div className="p-4 border-b border-outline-dim">
            <QueryBuilder chips={chips} onChange={setChips} />
          </div>

          {/* Database */}
          <div className="px-4 py-3 border-b border-outline-dim">
            <p className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest mb-2">
              Database
            </p>
            <DatabasePills
              selectedDb={dbInfo.id}
              onSelect={(db) => setDbInfo(db)}
            />
          </div>

          {/* Date + actions */}
          <div className="px-4 py-3">
            <DateRangeSlider
              from={dateFrom}
              to={dateTo}
              onChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
            />

            {error && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-danger/10 border border-danger/25 text-danger text-xs">
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="shrink-0 hover:opacity-70 transition-opacity">
                  <X size={11} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 rounded-lg border border-outline text-xs font-medium text-on-surface-2 hover:bg-surface-raised transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={!query.trim() || searching}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-cta hover:brightness-110 active:brightness-95 text-on-primary text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {searching ? (
                  <><Loader2 size={12} className="animate-spin" /> Searching…</>
                ) : (
                  <><Search size={12} /> Run Search</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
