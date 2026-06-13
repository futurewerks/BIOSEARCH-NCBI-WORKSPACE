import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, ChevronDown, ExternalLink, X } from 'lucide-react';
import type { EsearchResult, EsummaryDoc, ElinkResult, EsummaryResult, SearchChip, DatabaseInfo } from '../types/search';
import type { FilterState } from '../components/Results/FilterPanel';
import {
  fetchEsummary, fetchEspell, fetchElink, runEsearchSorted,
  fetchAbstract, fetchRelatedArticles, fetchEsearchCount,
} from '../utils/ncbi';
import { dbLoadSavedArticles, dbSaveArticle, dbRemoveSavedArticle } from '../utils/db';
import ResultCard from '../components/Results/ResultCard';
import SpellingSuggestion from '../components/Results/SpellingSuggestion';
import RightPanel from '../components/Results/RightPanel';
import SearchBar from '../components/Results/SearchBar';

interface Props {
  result:    EsearchResult;
  db:        string;
  query:     string;
  chips:     SearchChip[];
  dateFrom:  number;
  dateTo:    number;
  dbInfo:    DatabaseInfo;
  filters:   FilterState;
  onReSearch: (query: string, chips: SearchChip[], dateFrom: number, dateTo: number, dbInfo: DatabaseInfo) => Promise<void>;
  onNewQuery: () => void;
}

const DB_LABELS: Record<string, string> = {
  pubmed: 'PubMed', pmc: 'PMC', gene: 'Gene', snp: 'SNP',
  clinvar: 'ClinVar', protein: 'Protein', structure: 'Structure', taxonomy: 'Taxonomy',
};

function parseDocs(summaryData: EsummaryResult, uids: string[] | undefined): EsummaryDoc[] {
  if (!uids?.length) return [];
  return uids.map((uid) => summaryData.result[uid] as EsummaryDoc).filter(Boolean);
}

export default function ResultsPage({
  result, db, query, chips, dateFrom, dateTo, dbInfo,
  filters, onReSearch, onNewQuery: _,
}: Props) {
  const { count, webenv, querykey } = result.esearchresult;
  const label = DB_LABELS[db] ?? db;

  const [docs,         setDocs]         = useState<EsummaryDoc[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [retstart,     setRetstart]     = useState(0);
  const [currentTotal, setCurrentTotal] = useState(parseInt(count, 10));
  const [session,      setSession]      = useState({ webenv, querykey });

  const [spellCorrection, setSpellCorrection] = useState<string | null>(null);
  const [spellDismissed,  setSpellDismissed]  = useState(false);

  const [selectedUid,  setSelectedUid]  = useState<string | null>(null);
  const [linkData,     setLinkData]     = useState<ElinkResult | null>(null);
  const [linkLoading,  setLinkLoading]  = useState(false);

  const [abstractCache,    setAbstractCache]    = useState<Record<string, string>>({});
  const [loadingAbstracts, setLoadingAbstracts] = useState<Set<string>>(new Set());

  const [relatedCache,   setRelatedCache]   = useState<Record<string, EsummaryDoc[]>>({});
  const [loadingRelated, setLoadingRelated] = useState<Set<string>>(new Set());

  const [savedUids, setSavedUids] = useState<Set<string>>(new Set());

  const [yearData,    setYearData]    = useState<{ year: string; count: number }[]>([]);
  const [yearLoading, setYearLoading] = useState(true);

  const initialized = useRef(false);

  function fetchYearCounts(termQuery: string) {
    if (db !== 'pubmed') { setYearLoading(false); return; }
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - i);
    setYearLoading(true);
    Promise.allSettled([
      ...years.map((y) =>
        fetchEsearchCount(db, termQuery, String(y), String(y))
          .then((c) => ({ year: String(y), count: c })),
      ),
      fetchEsearchCount(db, termQuery, '1000', String(currentYear - 12))
        .then((c) => ({ year: `<${currentYear - 11}`, count: c })),
    ]).then((results) => {
      const data = results
        .filter((r): r is PromiseFulfilledResult<{ year: string; count: number }> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((e) => e.count > 0)
        .sort((a, b) => {
          const ya = parseInt(a.year) || 0;
          const yb = parseInt(b.year) || 0;
          return yb - ya;
        });
      setYearData(data);
    }).finally(() => setYearLoading(false));
  }

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setDocs([]);
    setError(null);
    setFetchError(null);

    Promise.all([
      fetchEsummary(db, session.webenv, session.querykey, 0, 20),
      fetchEspell(db, query),
      dbLoadSavedArticles().catch(() => []),
    ])
      .then(([summaryData, spellData, savedArticles]) => {
        setDocs(parseDocs(summaryData, summaryData.result.uids as string[] | undefined));
        setRetstart(20);
        const corrected = spellData.eSpellResult?.CorrectedQuery?.trim();
        if (corrected && corrected.toLowerCase() !== query.toLowerCase()) {
          setSpellCorrection(corrected);
        }
        setSavedUids(new Set(
          savedArticles.filter((a) => a.db === db).map((a) => a.ncbiUid),
        ));
        fetchYearCounts(query);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load results.'))
      .finally(() => {
        setLoading(false);
        initialized.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── React to filter changes after initial load ────────────────────
  useEffect(() => {
    if (!initialized.current) return;

    const ptSuffix  = filters.pubTypes.map((pt) => `"${pt}"[pt]`).join(' OR ');
    const orgSuffix = filters.species.map((sp) => `${sp}[Organism]`).join(' OR ');
    let filterQuery = query;
    if (ptSuffix)  filterQuery += ` AND (${ptSuffix})`;
    if (orgSuffix) filterQuery += ` AND (${orgSuffix})`;

    setLoading(true);
    setFetchError(null);

    runEsearchSorted(db, filterQuery, filters.sort, 0)
      .then(async (newSearch) => {
        const { webenv: wenv, querykey: qkey, count: newCount } = newSearch.esearchresult;
        if (!wenv || !qkey) {
          setFetchError('Search session expired — please re-run your query.');
          return;
        }
        const summaryData = await fetchEsummary(db, wenv, qkey, 0, 20);
        setDocs(parseDocs(summaryData, summaryData.result.uids as string[] | undefined));
        setSession({ webenv: wenv, querykey: qkey });
        setCurrentTotal(parseInt(newCount, 10));
        setRetstart(20);
        setSelectedUid(null);
        setLinkData(null);
        setAbstractCache({});
        setRelatedCache({});
        fetchYearCounts(filterQuery);
      })
      .catch((e) => setFetchError(e instanceof Error ? e.message : 'Filter failed — results may be stale.'))
      .finally(() => setLoading(false));
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load more ─────────────────────────────────────────────────────
  async function loadMore() {
    if (!session.webenv || !session.querykey) {
      setFetchError('Search session expired — please re-run your query.');
      return;
    }
    setLoadingMore(true);
    try {
      const summaryData = await fetchEsummary(db, session.webenv, session.querykey, retstart, 20);
      const uids = summaryData.result.uids as string[] | undefined;
      setDocs((prev) => [...prev, ...parseDocs(summaryData, uids)]);
      setRetstart((n) => n + 20);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load more results.');
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Card selection ────────────────────────────────────────────────
  function selectCard(uid: string) {
    setSelectedUid(uid);

    if (!(uid in abstractCache) && !loadingAbstracts.has(uid)) {
      setLoadingAbstracts((prev) => new Set([...prev, uid]));
      fetchAbstract(uid, db)
        .then((text) => setAbstractCache((prev) => ({ ...prev, [uid]: text })))
        .catch(() => setAbstractCache((prev) => ({ ...prev, [uid]: '' })))
        .finally(() =>
          setLoadingAbstracts((prev) => {
            const next = new Set(prev);
            next.delete(uid);
            return next;
          }),
        );
    }

    if (db === 'pubmed' && !(uid in relatedCache) && !loadingRelated.has(uid)) {
      setLoadingRelated((prev) => new Set([...prev, uid]));
      fetchRelatedArticles(uid)
        .then((articles) => setRelatedCache((prev) => ({ ...prev, [uid]: articles })))
        .catch(() => setRelatedCache((prev) => ({ ...prev, [uid]: [] })))
        .finally(() =>
          setLoadingRelated((prev) => {
            const next = new Set(prev);
            next.delete(uid);
            return next;
          }),
        );
    }
  }

  function handleSelectCard(uid: string) {
    if (selectedUid === uid) { setSelectedUid(null); return; }
    selectCard(uid);
  }

  // ── ELink ─────────────────────────────────────────────────────────
  async function handleExploreLinks(uid: string) {
    if (selectedUid === uid && linkData !== null) {
      setSelectedUid(null);
      setLinkData(null);
      return;
    }
    selectCard(uid);
    setLinkData(null);
    setLinkLoading(true);
    try {
      setLinkData(await fetchElink(db, uid));
    } catch {
      setLinkData(null);
    } finally {
      setLinkLoading(false);
    }
  }

  // ── Spelling suggestion re-search ─────────────────────────────────
  async function handleSpellAccept(newQuery: string) {
    await onReSearch(newQuery, chips, dateFrom, dateTo, dbInfo);
  }

  // ── Save / unsave ─────────────────────────────────────────────────
  async function handleSaveArticle(uid: string) {
    const doc = docs.find((d) => d.uid === uid);
    if (!doc) return;
    try {
      await dbSaveArticle(
        uid, db,
        (doc.title || doc.fulltitle || null) as string | null,
        doc as Record<string, unknown>,
      );
      setSavedUids((prev) => new Set([...prev, uid]));
    } catch { /* non-critical */ }
  }

  async function handleUnsaveArticle(uid: string) {
    try {
      await dbRemoveSavedArticle(uid, db);
      setSavedUids((prev) => { const next = new Set(prev); next.delete(uid); return next; });
    } catch { /* non-critical */ }
  }

  return (
    <div className="flex h-full">
      {/* ── Results feed ── */}
      <div className="flex-1 min-w-0 px-6 py-5 space-y-4">

        {/* ── Search bar ── */}
        <div className="relative z-20">
          <SearchBar
            chips={chips}
            dateFrom={dateFrom}
            dateTo={dateTo}
            dbInfo={dbInfo}
            onSearch={onReSearch}
          />
        </div>

        {/* ── Result count + NCBI link ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-on-surface-3">
            <span className="font-semibold text-on-surface">{docs.length}</span>
            {' / '}
            <span className="font-semibold text-on-surface">{currentTotal.toLocaleString()}</span>
            {' results in '}
            <span className="text-on-surface font-semibold">{label}</span>
          </span>
          <a
            href={`https://www.ncbi.nlm.nih.gov/${db}?WebEnv=${session.webenv}&query_key=${session.querykey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-on-surface-3 hover:text-primary transition-colors"
          >
            View on NCBI <ExternalLink size={11} />
          </a>
        </div>

        {result.esearchresult.querytranslation && (
          <p className="font-mono text-[11px] text-on-surface-3 truncate">
            {result.esearchresult.querytranslation}
          </p>
        )}

        {spellCorrection && !spellDismissed && (
          <SpellingSuggestion
            corrected={spellCorrection}
            onAccept={handleSpellAccept}
            onDismiss={() => setSpellDismissed(true)}
          />
        )}

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {fetchError && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-caution/10 border border-caution/30 text-caution text-sm">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1">{fetchError}</span>
            <button
              onClick={() => setFetchError(null)}
              className="shrink-0 hover:opacity-70 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface rounded-xl border border-outline p-5 animate-pulse space-y-3">
                <div className="h-4 bg-surface-high rounded w-3/4" />
                <div className="h-3 bg-surface-raised rounded w-1/2" />
                <div className="flex gap-1.5">
                  {[1, 2].map((j) => <div key={j} className="h-5 w-20 bg-surface-high rounded-full" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && docs.map((doc) => (
          <ResultCard
            key={doc.uid}
            doc={doc}
            db={db}
            onExploreLinks={handleExploreLinks}
            onSelect={handleSelectCard}
            isSelected={selectedUid === doc.uid}
            abstractText={selectedUid === doc.uid ? (abstractCache[doc.uid] ?? null) : null}
            abstractLoading={selectedUid === doc.uid && loadingAbstracts.has(doc.uid)}
            isSaved={savedUids.has(doc.uid)}
            onSave={handleSaveArticle}
            onUnsave={handleUnsaveArticle}
          />
        ))}

        {!loading && docs.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface rounded-xl border border-outline">
            <p className="font-semibold text-on-surface mb-1">No records found</p>
            <p className="text-on-surface-3 text-sm">Try adjusting your search terms or filters.</p>
          </div>
        )}

        {!loading && docs.length > 0 && docs.length < currentTotal && (
          <div className="flex justify-center pt-2 pb-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface border border-outline text-sm font-medium text-on-surface-2 hover:text-on-surface hover:bg-surface-raised disabled:opacity-50 transition-all"
            >
              {loadingMore
                ? <><Loader2 size={13} className="animate-spin" /> Loading…</>
                : <><ChevronDown size={13} /> Load more</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Data Explorer panel (sticky right column) ── */}
      <div className="hidden xl:block w-[280px] shrink-0 border-l border-outline-dim">
        <div className="sticky top-0 h-screen overflow-y-auto pt-3">
          <RightPanel
            selectedUid={selectedUid}
            linkData={linkData}
            linkLoading={linkLoading}
            abstractText={selectedUid ? (abstractCache[selectedUid] ?? null) : null}
            abstractLoading={selectedUid ? loadingAbstracts.has(selectedUid) : false}
            relatedDocs={selectedUid ? (relatedCache[selectedUid] ?? []) : []}
            relatedLoading={selectedUid ? loadingRelated.has(selectedUid) : false}
            db={db}
            yearData={yearData}
            yearLoading={yearLoading}
          />
        </div>
      </div>
    </div>
  );
}
