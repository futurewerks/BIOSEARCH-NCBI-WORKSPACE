import { Network, Bookmark, BookmarkCheck } from 'lucide-react';
import type { EsummaryDoc } from '../../types/search';

const UID_LABELS: Record<string, string> = {
  pubmed: 'PMID', pmc: 'PMC', gene: 'Gene ID',
  snp: 'rs', clinvar: 'VarID', protein: 'UID', structure: 'UID', taxonomy: 'TaxID',
};

interface Props {
  doc: EsummaryDoc;
  db: string;
  onExploreLinks: (uid: string) => void;
  onSelect: (uid: string) => void;
  isSelected: boolean;
  abstractText: string | null;
  abstractLoading: boolean;
  isSaved: boolean;
  onSave: (uid: string) => void;
  onUnsave: (uid: string) => void;
}

function truncateAuthors(authors: Array<{ name: string }>): string {
  if (!authors || authors.length === 0) return '';
  if (authors.length <= 3) return authors.map((a) => a.name).join(', ');
  return authors.slice(0, 3).map((a) => a.name).join(', ') + ' et al.';
}

function extractYear(pubdate: string | undefined): string {
  if (!pubdate) return '';
  const m = pubdate.match(/\d{4}/);
  return m ? m[0] : '';
}

function getAttributes(doc: EsummaryDoc): string[] {
  const attrs = doc.attributes as string[] | undefined;
  if (!Array.isArray(attrs)) return [];
  return attrs.filter((a) => typeof a === 'string').slice(0, 3);
}

function StatusDot({ attrs }: { attrs: string[] }) {
  const hasAbstract = attrs.some((a) => a.toLowerCase().includes('abstract'));
  if (hasAbstract) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
        <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-caution">
      <span className="w-1.5 h-1.5 rounded-full bg-caution inline-block" />
      Processing
    </span>
  );
}

function AbstractSection({ text, loading }: { text: string | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-outline-dim space-y-2 animate-pulse">
        <div className="h-3 bg-surface-high rounded w-full" />
        <div className="h-3 bg-surface-high rounded w-5/6" />
        <div className="h-3 bg-surface-high rounded w-4/5" />
        <div className="h-3 bg-surface-high rounded w-3/4" />
      </div>
    );
  }
  if (!text) {
    return (
      <div className="mt-3 pt-3 border-t border-outline-dim">
        <p className="text-[11px] text-on-surface-3 italic">No abstract available.</p>
      </div>
    );
  }
  const sections = text.split('\n\n');
  return (
    <div className="mt-3 pt-3 border-t border-outline-dim space-y-2.5 max-h-64 overflow-y-auto pr-1">
      {sections.map((section, i) => {
        const nl = section.indexOf('\n');
        if (nl > 0 && nl <= 30) {
          const label = section.slice(0, nl);
          const body = section.slice(nl + 1);
          return (
            <div key={i}>
              <span className="font-mono text-[9px] font-bold text-on-surface-3 uppercase tracking-widest block mb-0.5">
                {label}
              </span>
              <p className="text-xs text-on-surface-2 leading-relaxed">{body}</p>
            </div>
          );
        }
        return <p key={i} className="text-xs text-on-surface-2 leading-relaxed">{section}</p>;
      })}
    </div>
  );
}

export default function ResultCard({
  doc, db, onExploreLinks, onSelect, isSelected,
  abstractText, abstractLoading, isSaved, onSave, onUnsave,
}: Props) {
  const title    = (doc.title || doc.fulltitle || (doc.summary as string) || 'Untitled') as string;
  const authors  = truncateAuthors((doc.authors as Array<{ name: string }>) || []);
  const journal  = (doc.fulljournalname || doc.source || '') as string;
  const year     = extractYear(doc.pubdate as string | undefined);
  const pubTypes = (doc.pubtype as string[]) || [];
  const attrs    = getAttributes(doc);
  const ncbiUrl  = `https://www.ncbi.nlm.nih.gov/${db}/${doc.uid}/`;

  return (
    <article
      onClick={() => onSelect(doc.uid)}
      className={`
        relative bg-surface rounded-xl border transition-all duration-150 cursor-pointer shadow-card
        ${isSelected
          ? 'border-primary-cta shadow-[0_0_0_1px_var(--color-primary-cta)]'
          : 'border-outline hover:border-outline/60 hover:bg-surface-raised/20 hover:shadow-sm'
        }
      `}
    >
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full transition-all ${isSelected ? 'bg-primary-cta' : 'bg-transparent'}`} />

      <div className="px-5 py-4">
        {db === 'pubmed' && attrs.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <StatusDot attrs={attrs} />
          </div>
        )}

        <a
          href={ncbiUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block text-sm font-semibold text-primary hover:brightness-125 leading-snug mb-2 transition-all line-clamp-3"
        >
          {title}
        </a>

        {authors && (
          <p className="text-xs text-on-surface-2 mb-1.5 truncate">{authors}</p>
        )}

        <p className="font-mono text-[11px] text-on-surface-3 mb-3 truncate">
          {[journal, year, doc.uid ? `${UID_LABELS[db] ?? 'UID'}: ${doc.uid}` : ''].filter(Boolean).join(' • ')}
        </p>

        {pubTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pubTypes.slice(0, 3).map((pt) => (
              <span
                key={pt}
                className="font-mono text-[10px] font-medium px-2 py-0.5 rounded border border-outline text-on-surface-2 bg-surface-raised"
              >
                {pt}
              </span>
            ))}
            {pubTypes.length > 3 && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-outline text-on-surface-3 bg-surface-raised">
                +{pubTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {isSelected && db !== 'gene' && (
          <AbstractSection text={abstractText} loading={abstractLoading} />
        )}

        <div className="flex items-center justify-between pt-2 mt-2 border-t border-outline-dim">
          <button
            onClick={(e) => { e.stopPropagation(); isSaved ? onUnsave(doc.uid) : onSave(doc.uid); }}
            title={isSaved ? 'Remove from saved' : 'Save article'}
            className={`
              flex items-center gap-1.5 text-xs font-medium transition-all
              ${isSaved ? 'text-accent hover:text-accent/70' : 'text-on-surface-3 hover:text-primary'}
            `}
          >
            {isSaved ? <><BookmarkCheck size={13} /> Saved</> : <><Bookmark size={13} /> Save</>}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onExploreLinks(doc.uid); }}
            className={`
              flex items-center gap-1.5 text-xs font-medium transition-all
              ${isSelected ? 'text-primary-cta' : 'text-on-surface-3 hover:text-primary'}
            `}
          >
            <Network size={12} />
            Explore Links →
          </button>
        </div>
      </div>
    </article>
  );
}
