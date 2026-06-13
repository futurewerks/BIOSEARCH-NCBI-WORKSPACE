import { useEffect, useState } from 'react';
import {
  FolderOpen, Plus, Trash2, ArrowLeft, Loader2,
  BookmarkX, ExternalLink, AlertCircle, Play, Pin,
  Download, FileText, GitMerge, Clock,
} from 'lucide-react';
import type { SearchHistoryEntry } from '../types/search';
import {
  dbLoadCollections, dbLoadSavedArticles, dbCreateCollection,
  dbDeleteCollection, dbRemoveSavedArticle, dbLoadHistory, dbDeleteHistoryEntry,
  type Collection, type SavedArticle,
} from '../utils/db';
import { runEsearch, fetchPmidList, fetchMedlineText } from '../utils/ncbi';
import { DATABASES } from '../constants';

type ViewMode = 'grid' | 'all' | 'collection';
type CombineOp = 'AND' | 'OR' | 'NOT';

const DB_LABELS: Record<string, string> = {
  pubmed: 'PubMed', pmc: 'PMC', gene: 'Gene', snp: 'SNP',
  clinvar: 'ClinVar', protein: 'Protein', structure: 'Structure', taxonomy: 'Taxonomy',
};

const DB_PILL_COLORS: Record<string, string> = {
  pubmed:    'bg-blue-50 text-blue-700 border-blue-200',
  pmc:       'bg-teal-50 text-teal-700 border-teal-200',
  gene:      'bg-green-50 text-green-700 border-green-200',
  snp:       'bg-amber-50 text-amber-700 border-amber-200',
  clinvar:   'bg-rose-50 text-rose-700 border-rose-200',
  protein:   'bg-sky-50 text-sky-700 border-sky-200',
  structure: 'bg-orange-50 text-orange-700 border-orange-200',
  taxonomy:  'bg-cyan-50 text-cyan-700 border-cyan-200',
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m !== 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d !== 1 ? 's' : ''} ago`;
  const w = Math.floor(d / 7);
  return `${w} week${w !== 1 ? 's' : ''} ago`;
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseMedlineToBibtex(medline: string): string {
  const records = medline.split(/\n\nPMID- /);
  const entries: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const block = i === 0 ? records[i] : 'PMID- ' + records[i];
    const lines = block.split('\n');

    // Extract a single-occurrence field, joining continuation lines (6-space indent).
    const field = (tag: string): string => {
      const prefix = `${tag}- `;
      let result = '';
      let capturing = false;
      for (const line of lines) {
        if (line.startsWith(prefix)) {
          result = line.slice(prefix.length);
          capturing = true;
        } else if (capturing && line.startsWith('      ')) {
          result += ' ' + line.trimStart();
        } else if (capturing) {
          break;
        }
      }
      return result.trim();
    };

    // Extract all occurrences of a repeating field (e.g. AU — one per line, no continuations).
    const fieldAll = (tag: string): string[] => {
      const prefix = `${tag}- `;
      return lines.filter((l) => l.startsWith(prefix)).map((l) => l.slice(prefix.length).trim());
    };

    const pmid = field('PMID');
    if (!pmid) continue;

    const title    = field('TI').replace(/[{}]/g, '');
    const journal  = field('JT').replace(/[{}]/g, '');
    const dp       = field('DP');
    const year     = dp.match(/\d{4}/)?.[0] ?? '';
    const authors  = fieldAll('AU');
    const authorStr = authors.length > 0 ? authors.join(' and ') : '';

    entries.push(
      `@article{PMID${pmid},\n` +
      `  pmid    = {${pmid}},\n` +
      (title     ? `  title   = {${title}},\n`    : '') +
      (authorStr ? `  author  = {${authorStr}},\n` : '') +
      (journal   ? `  journal = {${journal}},\n`   : '') +
      (year      ? `  year    = {${year}},\n`      : '') +
      `}`
    );
  }

  return entries.join('\n\n');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── History card ──────────────────────────────────────────────────

interface HistoryCardProps {
  entry: SearchHistoryEntry;
  pinned: boolean;
  onReRun: () => void;
  onPin: () => void;
  onDelete: () => void;
}

function HistoryCard({ entry, pinned, onReRun, onPin, onDelete }: HistoryCardProps) {
  const [deleting, setDeleting] = useState(false);
  const dbLabel = DB_LABELS[entry.selectedDb] ?? entry.selectedDb.toUpperCase();
  const pillColor = DB_PILL_COLORS[entry.selectedDb] ?? 'bg-slate-50 text-slate-700 border-slate-200';

  async function handleDelete() {
    setDeleting(true);
    try { await dbDeleteHistoryEntry(entry.id); onDelete(); }
    catch { setDeleting(false); }
  }

  return (
    <div className={`
      bg-surface rounded-xl border transition-all p-4 space-y-3
      ${pinned ? 'border-primary-cta/50 shadow-sm' : 'border-outline hover:border-outline/80'}
    `}>
      <div className="flex items-start gap-2">
        <code className="flex-1 min-w-0 font-mono text-[11px] text-on-surface-2 leading-relaxed truncate block">
          {entry.queryString}
        </code>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${pillColor}`}>
            {dbLabel}
          </span>
          <span className="text-[11px] text-on-surface-3 flex items-center gap-1">
            <Clock size={10} />
            {relativeTime(entry.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onReRun}
            title="Re-run search"
            className="p-1.5 rounded-lg text-on-surface-3 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <Play size={12} />
          </button>
          <button
            onClick={onPin}
            title={pinned ? 'Unpin' : 'Pin for combining'}
            className={`p-1.5 rounded-lg transition-all ${
              pinned
                ? 'text-primary-cta bg-primary-cta/10'
                : 'text-on-surface-3 hover:text-primary-cta hover:bg-primary-cta/10'
            }`}
          >
            <Pin size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            className="p-1.5 rounded-lg text-on-surface-3 hover:text-danger hover:bg-danger/10 transition-all"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Article row ───────────────────────────────────────────────────

function ArticleRow({ article, onRemove }: { article: SavedArticle; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false);
  const dbLabel = DB_LABELS[article.db] ?? article.db.toUpperCase();
  const ncbiUrl = `https://www.ncbi.nlm.nih.gov/${article.db}/${article.ncbiUid}/`;

  async function handleRemove() {
    setRemoving(true);
    try {
      await dbRemoveSavedArticle(article.ncbiUid, article.db);
      onRemove(article.id);
    } catch {
      setRemoving(false);
    }
  }

  return (
    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-raised/40 transition-colors group">
      <div className="flex-1 min-w-0">
        <a
          href={ncbiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium text-primary hover:brightness-125 leading-snug line-clamp-2 mb-1 transition-all"
        >
          {article.title || 'Untitled'}
        </a>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            {dbLabel}
          </span>
          <span className="font-mono text-[10px] text-on-surface-3">UID: {article.ncbiUid}</span>
          <span className="font-mono text-[10px] text-on-surface-3">{formatDate(article.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={ncbiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-on-surface-3 hover:text-primary hover:bg-surface-high transition-all"
          title="Open in NCBI"
        >
          <ExternalLink size={13} />
        </a>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="p-1.5 rounded-lg text-on-surface-3 hover:text-danger hover:bg-danger/10 transition-all"
          title="Remove from saved"
        >
          {removing ? <Loader2 size={13} className="animate-spin" /> : <BookmarkX size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Collection card ───────────────────────────────────────────────

interface CollectionCardProps {
  collection: Collection;
  articleCount: number;
  onClick: () => void;
  onDelete: (id: string) => void;
}

function CollectionCard({ collection, articleCount, onClick, onDelete }: CollectionCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await dbDeleteCollection(collection.id);
      onDelete(collection.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl border border-outline hover:border-primary-cta/50 hover:shadow-sm cursor-pointer transition-all group p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <FolderOpen size={16} className="text-accent" />
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          onBlur={() => setConfirmDelete(false)}
          className={`
            shrink-0 p-1.5 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100
            ${confirmDelete
              ? 'text-danger bg-danger/10 border border-danger/30 opacity-100'
              : 'text-on-surface-3 hover:text-danger hover:bg-danger/10'
            }
          `}
          title={confirmDelete ? 'Click again to confirm' : 'Delete collection'}
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-on-surface text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-xs text-on-surface-3 line-clamp-2 leading-relaxed">{collection.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold text-on-surface-3">
          {articleCount} {articleCount === 1 ? 'article' : 'articles'}
        </span>
        <span className="font-mono text-[10px] text-on-surface-3">{formatDate(collection.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

interface Props {
  onReRunSearch: (query: string, db: string) => void;
}

export default function CollectionsPage({ onReRunSearch }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allArticles, setAllArticles] = useState<SavedArticle[]>([]);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [combineOp, setCombineOp] = useState<CombineOp>('AND');

  const [exportingPmids, setExportingPmids] = useState(false);
  const [exportingBibtex, setExportingBibtex] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([dbLoadCollections(), dbLoadSavedArticles(), dbLoadHistory()])
      .then(([cols, articles, hist]) => {
        setCollections(cols);
        setAllArticles(articles);
        setHistory(hist);
      })
      .catch(() => setError('Failed to load workspace data.'))
      .finally(() => setLoading(false));
  }, []);

  const countByCollection = Object.fromEntries(
    collections.map((c) => [c.id, allArticles.filter((a) => a.collectionId === c.id).length]),
  );
  const unsortedCount = allArticles.filter((a) => !a.collectionId).length;

  const visibleArticles =
    viewMode === 'collection' && activeCollection
      ? allArticles.filter((a) => a.collectionId === activeCollection.id)
      : allArticles.filter((a) => !a.collectionId);

  const pinnedEntries = history.filter((e) => pinnedIds.has(e.id));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const col = await dbCreateCollection(newName.trim(), newDesc.trim() || undefined);
      setCollections((prev) => [col, ...prev]);
      setNewName('');
      setNewDesc('');
      setShowNewForm(false);
    } catch {
      setCreateError('Failed to create collection. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  function handleDeleteCollection(id: string) {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setAllArticles((prev) => prev.map((a) => a.collectionId === id ? { ...a, collectionId: null } : a));
    if (activeCollection?.id === id) setViewMode('grid');
  }

  function handleRemoveArticle(articleId: string) {
    setAllArticles((prev) => prev.filter((a) => a.id !== articleId));
  }

  function handleDeleteHistory(id: string) {
    setHistory((prev) => prev.filter((e) => e.id !== id));
    setPinnedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function togglePin(id: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= 2) return prev;
      next.add(id);
      return next;
    });
  }

  function cycleOp() {
    setCombineOp((op) => op === 'AND' ? 'OR' : op === 'OR' ? 'NOT' : 'AND');
  }

  function handleCombineSearch() {
    if (pinnedEntries.length !== 2) return;
    const [a, b] = pinnedEntries;
    const combined = `(${a.queryString}) ${combineOp} (${b.queryString})`;
    const db = DATABASES.find((d) => d.id === a.selectedDb)?.ncbiDb ?? a.selectedDb;
    onReRunSearch(combined, db);
  }

  async function handleExportPmids() {
    const latest = history[0];
    if (!latest) return;
    setExportingPmids(true);
    setExportError(null);
    try {
      const result = await runEsearch(latest.selectedDb, latest.queryString);
      const { webenv, querykey } = result.esearchresult;
      const text = await fetchPmidList(webenv, querykey);
      const clean = text.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
      triggerDownload(clean, `pmids-${Date.now()}.txt`, 'text/plain');
    } catch {
      setExportError('Export failed — please try again.');
    } finally {
      setExportingPmids(false);
    }
  }

  async function handleExportBibtex() {
    const latest = history[0];
    if (!latest) return;
    setExportingBibtex(true);
    setExportError(null);
    try {
      const result = await runEsearch(latest.selectedDb, latest.queryString);
      const { webenv, querykey } = result.esearchresult;
      const medline = await fetchMedlineText(webenv, querykey);
      if (!medline || medline.trimStart().startsWith('<?xml')) {
        setExportError('Export failed — try again in a moment');
        return;
      }
      const bibtex = parseMedlineToBibtex(medline);
      triggerDownload(bibtex, `export-${Date.now()}.bib`, 'text/plain');
    } catch {
      setExportError('Export failed — please try again.');
    } finally {
      setExportingBibtex(false);
    }
  }

  function goBack() {
    setViewMode('grid');
    setActiveCollection(null);
  }

  const detailTitle =
    viewMode === 'all'        ? 'All Saved Articles' :
    viewMode === 'collection' ? (activeCollection?.name ?? '') : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 size={20} className="animate-spin text-on-surface-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-10 max-w-xl">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-4xl space-y-8">

      {/* ── Search History ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-on-surface-3" />
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest font-mono">Search History</h2>
          {history.length > 0 && (
            <span className="ml-auto font-mono text-[10px] text-on-surface-3">
              {pinnedIds.size > 0 ? `${pinnedIds.size}/2 pinned` : 'Pin 2 to combine'}
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center bg-surface rounded-xl border border-outline border-dashed">
            <Clock size={28} className="text-on-surface-3/40 mb-3" />
            <p className="font-semibold text-on-surface mb-1">No searches yet</p>
            <p className="text-sm text-on-surface-3">Run a query to start building your workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {history.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                pinned={pinnedIds.has(entry.id)}
                onReRun={() => {
                  const db = DATABASES.find((d) => d.id === entry.selectedDb)?.ncbiDb ?? entry.selectedDb;
                  onReRunSearch(entry.queryString, db);
                }}
                onPin={() => togglePin(entry.id)}
                onDelete={() => handleDeleteHistory(entry.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Combine Searches ── */}
      {pinnedIds.size === 2 && (
        <section className="bg-surface rounded-xl border border-primary-cta/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <GitMerge size={14} className="text-primary-cta" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest font-mono">Combine Searches</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex-1 min-w-0 bg-surface-raised rounded-lg border border-outline p-3">
              <p className="font-mono text-[11px] text-on-surface-2 truncate">{pinnedEntries[0]?.queryString}</p>
            </div>
            <button
              onClick={cycleOp}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary-cta/10 border border-primary-cta/30 text-primary-cta text-xs font-bold font-mono hover:bg-primary-cta/20 transition-colors min-w-[52px] text-center"
            >
              {combineOp}
            </button>
            <div className="flex-1 min-w-0 bg-surface-raised rounded-lg border border-outline p-3">
              <p className="font-mono text-[11px] text-on-surface-2 truncate">{pinnedEntries[1]?.queryString}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleCombineSearch}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-cta text-on-primary text-sm font-semibold hover:brightness-110 transition-all"
            >
              <Play size={13} />
              Combine &amp; Search
            </button>
          </div>
        </section>
      )}

      {/* ── Export ── */}
      {history.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Download size={14} className="text-on-surface-3" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest font-mono">Export</h2>
            <span className="ml-2 text-[11px] text-on-surface-3 truncate max-w-xs">
              Most recent: <span className="font-mono">{history[0].queryString.length > 40 ? history[0].queryString.slice(0, 40) + '…' : history[0].queryString}</span>
            </span>
          </div>

          {exportError && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm mb-3">
              <AlertCircle size={13} className="shrink-0" />
              {exportError}
            </div>
          )}

          <div className="flex items-start gap-4 flex-wrap">
            <button
              onClick={handleExportPmids}
              disabled={exportingPmids || exportingBibtex}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline text-sm font-medium text-on-surface hover:bg-surface-raised hover:border-outline/80 disabled:opacity-50 transition-all"
            >
              {exportingPmids
                ? <><Loader2 size={13} className="animate-spin" /> Exporting…</>
                : <><FileText size={13} /> Export PMIDs</>
              }
            </button>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleExportBibtex}
                disabled={exportingPmids || exportingBibtex}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline text-sm font-medium text-on-surface hover:bg-surface-raised hover:border-outline/80 disabled:opacity-50 transition-all"
              >
                {exportingBibtex
                  ? <><Loader2 size={13} className="animate-spin" /> Exporting…</>
                  : <><Download size={13} /> Export BibTeX</>
                }
              </button>
              <p className="text-[11px] text-on-surface-3 pl-1">Exports up to 10,000 records.</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Collections ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {viewMode !== 'grid' && (
              <button
                onClick={goBack}
                className="p-1.5 rounded-lg text-on-surface-3 hover:text-on-surface hover:bg-surface-raised transition-all"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-on-surface-3" />
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest font-mono">
                  {viewMode === 'grid' ? 'Collections' : detailTitle}
                </h2>
              </div>
              <p className="text-xs text-on-surface-3 mt-0.5">
                {viewMode === 'grid'
                  ? `${collections.length} collection${collections.length !== 1 ? 's' : ''} · ${allArticles.length} saved article${allArticles.length !== 1 ? 's' : ''}`
                  : `${visibleArticles.length} article${visibleArticles.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          {viewMode === 'grid' && (
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-cta text-on-primary text-sm font-semibold hover:brightness-110 transition-all"
            >
              <Plus size={14} />
              New Collection
            </button>
          )}
        </div>

        {showNewForm && viewMode === 'grid' && (
          <form
            onSubmit={handleCreate}
            className="bg-surface rounded-xl border border-primary-cta/40 p-5 mb-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-on-surface">New Collection</h3>
            <input
              autoFocus
              type="text"
              placeholder="Collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-outline text-sm text-on-surface placeholder:text-on-surface-3 focus:outline-none focus:border-primary-cta/60 transition-colors"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-outline text-sm text-on-surface placeholder:text-on-surface-3 focus:outline-none focus:border-primary-cta/60 transition-colors"
            />
            {createError && <p className="text-xs text-danger">{createError}</p>}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-cta text-on-primary text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowNewForm(false); setNewName(''); setNewDesc(''); setCreateError(null); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-2 hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {viewMode === 'grid' && (
          <>
            {collections.length === 0 && allArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center bg-surface rounded-xl border border-outline border-dashed">
                <FolderOpen size={28} className="text-on-surface-3/40 mb-3" />
                <p className="font-semibold text-on-surface mb-1">No saved articles yet</p>
                <p className="text-sm text-on-surface-3">Save articles from search results using the bookmark icon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unsortedCount > 0 && (
                  <div
                    onClick={() => setViewMode('all')}
                    className="bg-surface rounded-xl border border-outline hover:border-primary-cta/50 hover:shadow-sm cursor-pointer transition-all group p-5 flex flex-col gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <FolderOpen size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-on-surface text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                        All Saved Articles
                      </h3>
                      <p className="text-xs text-on-surface-3 leading-relaxed">Articles not assigned to a collection.</p>
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-on-surface-3">
                      {unsortedCount} {unsortedCount === 1 ? 'article' : 'articles'}
                    </span>
                  </div>
                )}
                {collections.map((col) => (
                  <CollectionCard
                    key={col.id}
                    collection={col}
                    articleCount={countByCollection[col.id] ?? 0}
                    onClick={() => { setActiveCollection(col); setViewMode('collection'); }}
                    onDelete={handleDeleteCollection}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {(viewMode === 'all' || viewMode === 'collection') && (
          <div className="bg-surface rounded-xl border border-outline overflow-hidden">
            {visibleArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen size={28} className="text-on-surface-3/40 mb-3" />
                <p className="text-sm text-on-surface-3">No articles here yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-dim">
                {visibleArticles.map((article) => (
                  <ArticleRow key={article.id} article={article} onRemove={handleRemoveArticle} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
