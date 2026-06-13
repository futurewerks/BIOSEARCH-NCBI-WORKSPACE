import { useEffect, useRef, useState } from 'react';
import {
  Network, Loader2, ChevronDown, ExternalLink, Sparkles,
  BookOpen, GitBranch, Dna, AlertCircle, MousePointerClick, Globe,
} from 'lucide-react';
import type { ElinkResult, EsummaryDoc } from '../../types/search';
import { useGeneReport } from '../../hooks/useGeneReport';
import { useGenomeReport } from '../../hooks/useGenomeReport';
import YearChart from './YearChart';

type PanelTab = 'abstract' | 'links' | 'related' | 'gene' | 'genome';

interface Props {
  selectedUid:     string | null;
  linkData:        ElinkResult | null;
  linkLoading:     boolean;
  abstractText:    string | null;
  abstractLoading: boolean;
  relatedDocs:     EsummaryDoc[];
  relatedLoading:  boolean;
  db:              string;
  yearData:        { year: string; count: number }[];
  yearLoading:     boolean;
}

interface UrlEntry { url: string; name: string; }

function parseLinks(data: ElinkResult): Record<string, UrlEntry[]> {
  const groups: Record<string, UrlEntry[]> = {};
  for (const ls of data.linksets ?? []) {
    for (const item of ls.idurllist ?? []) {
      for (const obj of item.objurl ?? []) {
        const category = obj.Category ?? obj.Provider?.Name ?? 'External';
        if (!groups[category]) groups[category] = [];
        groups[category].push({ url: obj.Url, name: obj.LinkName || obj.Provider?.Name || category });
      }
    }
  }
  for (const key of Object.keys(groups)) {
    const seen = new Set<string>();
    groups[key] = groups[key].filter((e) => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });
  }
  return groups;
}

function formatGeneType(raw: string): string {
  return raw.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Shared skeleton ───────────────────────────────────────────────
function SkeletonLines({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse px-4 py-5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`h-3 bg-surface-high rounded ${i === count - 1 ? 'w-2/3' : i % 3 === 1 ? 'w-5/6' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

// ── Shared key-value row ──────────────────────────────────────────
function DataRow({ label, value, link }: { label: string; value: React.ReactNode; link?: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-outline-dim last:border-0">
      <span className="font-mono text-[9px] font-bold text-on-surface-3 uppercase tracking-widest shrink-0 mt-0.5 w-20">
        {label}
      </span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary-cta hover:brightness-125 transition-all leading-snug break-all"
        >
          {value}
          <ExternalLink size={9} className="shrink-0" />
        </a>
      ) : (
        <span className="text-xs text-on-surface-2 leading-snug flex-1 break-words">{value}</span>
      )}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] font-bold text-on-surface-3 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────
function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface-raised border border-outline-dim rounded-lg px-3 py-2">
      <span className="font-mono text-[8px] font-bold text-on-surface-3 uppercase tracking-widest leading-none">
        {label}
      </span>
      <span className="text-xs font-semibold text-on-surface leading-snug mt-0.5">{value}</span>
    </div>
  );
}

// ── Accordion group for links ─────────────────────────────────────
function GroupSection({ label, entries }: { label: string; entries: UrlEntry[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-outline-dim rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-raised/40 hover:bg-surface-raised/80 transition-colors"
      >
        <span className="text-[11px] font-medium text-on-surface-2 truncate pr-2">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
            {entries.length}
          </span>
          <ChevronDown size={10} className={`text-on-surface-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <ul className="divide-y divide-outline-dim">
          {entries.map((e, i) => (
            <li key={i}>
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-raised transition-colors group"
              >
                <span className="text-[11px] text-on-surface-3 flex-1 truncate group-hover:text-on-surface-2">{e.name}</span>
                <ExternalLink size={9} className="text-on-surface-3 group-hover:text-primary shrink-0 transition-colors" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Abstract tab ──────────────────────────────────────────────────
function AbstractTab({ text, loading, uid, db }: { text: string | null; loading: boolean; uid: string; db: string }) {
  if (loading) return <SkeletonLines />;

  if (!text) {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-on-surface-3 italic">No abstract on record.</p>
        <a
          href={`https://www.ncbi.nlm.nih.gov/${db}/${uid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-cta hover:brightness-125 transition-all"
        >
          View on NCBI <ExternalLink size={10} />
        </a>
      </div>
    );
  }

  const sections = text.split('\n\n');
  return (
    <div className="px-4 py-4 space-y-4">
      {sections.map((section, i) => {
        const nl = section.indexOf('\n');
        if (nl > 0 && nl <= 30) {
          const label = section.slice(0, nl);
          const body  = section.slice(nl + 1);
          return (
            <div key={i}>
              <span className="font-mono text-[9px] font-bold text-on-surface-3 uppercase tracking-widest block mb-1">{label}</span>
              <p className="text-xs text-on-surface-2 leading-relaxed">{body}</p>
            </div>
          );
        }
        return <p key={i} className="text-xs text-on-surface-2 leading-relaxed">{section}</p>;
      })}
      <div className="pt-1 border-t border-outline-dim">
        <a
          href={`https://www.ncbi.nlm.nih.gov/${db}/${uid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-cta hover:brightness-125 transition-all"
        >
          View on NCBI <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

// ── Links tab ─────────────────────────────────────────────────────
function LinksTab({ uid, linkData, linkLoading }: { uid: string; linkData: ElinkResult | null; linkLoading: boolean }) {
  if (linkLoading) {
    return (
      <div className="flex items-center gap-2 py-10 justify-center">
        <Loader2 size={15} className="animate-spin text-primary" />
        <span className="text-xs text-on-surface-3">Fetching links…</span>
      </div>
    );
  }
  if (!linkData) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
        <Network size={22} className="text-outline mb-1" strokeWidth={1.5} />
        <p className="text-xs text-on-surface-3 leading-relaxed">
          Click <span className="text-on-surface-2 font-medium">Explore Links</span> on a card.
        </p>
      </div>
    );
  }
  const groups  = parseLinks(linkData);
  const entries = Object.entries(groups);
  if (entries.length === 0) {
    return <p className="text-xs text-on-surface-3 text-center py-8 px-4">No external links found for UID {uid}.</p>;
  }
  return (
    <div className="px-3 py-3 space-y-1.5">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] text-on-surface-3">UID</span>
        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-high border border-outline-dim text-on-surface-2">
          {uid}
        </span>
      </div>
      {entries.map(([label, items]) => (
        <GroupSection key={label} label={label} entries={items} />
      ))}
    </div>
  );
}

// ── Related tab ───────────────────────────────────────────────────
function RelatedTab({ docs, loading, db }: { docs: EsummaryDoc[]; loading: boolean; db: string }) {
  if (db !== 'pubmed') {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-on-surface-3">Related articles are only available for PubMed.</p>
      </div>
    );
  }
  if (loading) return <SkeletonLines count={6} />;
  if (docs.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-on-surface-3">No related articles found.</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-outline-dim">
      {docs.map((doc) => {
        const title   = (doc.title || doc.fulltitle || 'Untitled') as string;
        const journal = (doc.fulljournalname || doc.source || '') as string;
        const year    = (doc.pubdate as string | undefined)?.match(/\d{4}/)?.[0] ?? '';
        return (
          <a
            key={doc.uid}
            href={`https://www.ncbi.nlm.nih.gov/pubmed/${doc.uid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 hover:bg-surface-raised/50 transition-colors group"
          >
            <p className="text-xs font-medium text-on-surface group-hover:text-primary leading-snug line-clamp-2 mb-1 transition-colors">
              {title}
            </p>
            <p className="font-mono text-[10px] text-on-surface-3 truncate">
              {[journal, year].filter(Boolean).join(' · ')}
            </p>
          </a>
        );
      })}
    </div>
  );
}

// ── Gene details tab ──────────────────────────────────────────────
function GeneDetailsTab({ geneId, db, onTaxName }: { geneId: string; db: string; onTaxName: (t: string) => void }) {
  const { data, loading, error } = useGeneReport(geneId, db);

  useEffect(() => {
    if (data?.taxName) onTaxName(data.taxName);
  }, [data?.taxName]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="animate-pulse px-4 py-5 space-y-3">
        <div className="h-5 bg-surface-high rounded w-20 mb-1" />
        <div className="h-3 bg-surface-high rounded w-full" />
        <div className="h-3 bg-surface-high rounded w-3/4" />
        <div className="h-px bg-surface-high my-3" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-3 bg-surface-high rounded w-16 shrink-0" />
            <div className={`h-3 bg-surface-high rounded flex-1 ${i % 2 === 0 ? 'w-24' : 'w-32'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-2.5 text-center">
        <AlertCircle size={20} className="text-caution/70" strokeWidth={1.5} />
        <p className="text-xs font-medium text-on-surface-2">Gene details unavailable</p>
        <p className="text-[11px] text-on-surface-3">The Datasets API may not have a record for this gene ID.</p>
      </div>
    );
  }

  const loc            = data.annotations[0]?.genomicLocations?.[0];
  const assembly       = data.annotations[0];
  const orthologCount  = data.geneGroups.length;
  const orthologMethod = data.geneGroups[0]?.method ?? '';

  const locationStr = loc
    ? `Chr ${loc.sequenceName}: ${parseInt(loc.genomicRange.begin).toLocaleString()}–${parseInt(loc.genomicRange.end).toLocaleString()}${loc.genomicRange.orientation ? ` (${loc.genomicRange.orientation})` : ''}`
    : null;

  const assemblyStr = assembly
    ? `${assembly.assemblyName} (${assembly.assemblyAccession})`
    : null;

  return (
    <div>
      {/* Hero */}
      <div className="px-4 pt-4 pb-3 border-b border-outline-dim">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xl font-bold text-on-surface tracking-tight leading-none">
            {data.symbol}
          </span>
          {data.type && (
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase tracking-wide self-center">
              {formatGeneType(data.type)}
            </span>
          )}
        </div>
        <p className="text-xs text-on-surface-3 leading-snug mt-1">{data.description}</p>
      </div>

      {/* Data rows */}
      <div className="px-4 py-1">
        {data.taxName && (
          <DataRow
            label="Organism"
            value={
              <>
                {data.taxName}
                {data.commonName && <span className="text-on-surface-3"> ({data.commonName})</span>}
              </>
            }
          />
        )}
        {locationStr && <DataRow label="Location"  value={locationStr} />}
        {assemblyStr && <DataRow label="Assembly"  value={assemblyStr} />}
        {data.ensemblGeneIds.length > 0 && (
          <DataRow
            label="Ensembl ID"
            value={data.ensemblGeneIds[0]}
            link={`https://www.ensembl.org/id/${data.ensemblGeneIds[0]}`}
          />
        )}
        {orthologCount > 0 && (
          <DataRow
            label="Orthologs"
            value={`${orthologCount} ${orthologMethod} group${orthologCount !== 1 ? 's' : ''}`}
          />
        )}
      </div>

      {/* NCBI link */}
      <div className="px-4 py-3 border-t border-outline-dim mt-1">
        <a
          href={`https://www.ncbi.nlm.nih.gov/gene/${data.geneId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-primary/8 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/12 transition-all"
        >
          View on NCBI Gene <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

// ── Genome tab ────────────────────────────────────────────────────
function GenomeTab({ taxName, db }: { taxName: string | null; db: string }) {
  const { data, loading, error } = useGenomeReport(taxName, db);

  if (!taxName) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-on-surface-3">Select a gene to load its reference genome.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse px-4 py-5 space-y-3">
        <div className="h-4 bg-surface-high rounded w-3/4" />
        <div className="h-3 bg-surface-high rounded w-1/2" />
        <div className="h-px bg-surface-high my-3" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-11 bg-surface-high rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-2.5 text-center">
        <AlertCircle size={20} className="text-caution/70" strokeWidth={1.5} />
        <p className="text-xs font-medium text-on-surface-2">Genome data unavailable</p>
        <p className="text-[11px] text-on-surface-3">No chromosome-level RefSeq assembly found.</p>
      </div>
    );
  }

  const totalGb = (parseInt(data.totalSequenceLength, 10) / 1e9).toFixed(2);

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-outline-dim">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface leading-tight">{data.assemblyName}</p>
            <a
              href={`https://www.ncbi.nlm.nih.gov/datasets/genome/${data.accession}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-primary-cta hover:brightness-125 transition-all mt-0.5"
            >
              {data.accession} <ExternalLink size={8} />
            </a>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent uppercase tracking-wide">
              {data.assemblyLevel}
            </span>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase tracking-wide">
              {data.assemblyStatus}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-3 mt-1.5">
          {data.organismName}
          {data.commonName && <> ({data.commonName})</>}
        </p>
        {data.synonym && (
          <span className="inline-block mt-1.5 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-raised border border-outline text-on-surface-3 uppercase tracking-wide">
            {data.synonym}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="px-4 py-1">
        {data.submitter      && <DataRow label="Submitter" value={data.submitter} />}
        {data.releaseDate    && <DataRow label="Released"  value={data.releaseDate} />}
        {data.refseqCategory && <DataRow label="Category"  value={data.refseqCategory} />}
      </div>

      {/* Assembly stats */}
      <div className="px-4 py-3 border-t border-outline-dim">
        <SectionLabel>Assembly Stats</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          <StatTile label="Chromosomes"  value={data.totalChromosomes} />
          <StatTile label="Total Length" value={`${totalGb} Gb`} />
          <StatTile label="Contig N50"   value={data.contigN50.toLocaleString()} />
          <StatTile label="Scaffold N50" value={data.scaffoldN50.toLocaleString()} />
          <StatTile label="GC %"         value={`${data.gcPercent}%`} />
        </div>
      </div>

      {/* Gene counts */}
      {data.geneCountTotal > 0 && (
        <div className="px-4 pb-4 border-t border-outline-dim pt-3">
          <SectionLabel>
            Gene Counts
            {data.annotationReleaseDate && (
              <span className="normal-case tracking-normal font-normal ml-1">
                · {data.annotationReleaseDate}
              </span>
            )}
          </SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            <StatTile label="Total"          value={data.geneCountTotal.toLocaleString()} />
            <StatTile label="Protein-coding" value={data.geneCountProteinCoding.toLocaleString()} />
            <StatTile label="Non-coding"     value={data.geneCountNonCoding.toLocaleString()} />
            <StatTile label="Pseudogene"     value={data.geneCountPseudogene.toLocaleString()} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab definitions ────────────────────────────────────────────────
const ALL_TABS: { id: PanelTab; label: string; Icon: typeof BookOpen; dbs?: string[] }[] = [
  { id: 'abstract', label: 'Abstract', Icon: BookOpen },
  { id: 'gene',     label: 'Gene',     Icon: Dna,    dbs: ['gene'] },
  { id: 'genome',   label: 'Genome',   Icon: Globe,  dbs: ['gene'] },
  { id: 'links',    label: 'Links',    Icon: Network },
  { id: 'related',  label: 'Related',  Icon: GitBranch },
];

// ── Main panel ─────────────────────────────────────────────────────
export default function RightPanel({
  selectedUid, linkData, linkLoading,
  abstractText, abstractLoading,
  relatedDocs, relatedLoading,
  db, yearData, yearLoading,
}: Props) {
  const [tab, setTab]         = useState<PanelTab>('abstract');
  const prevUid               = useRef<string | null>(null);
  const [taxName, setTaxName] = useState<string | null>(null);

  const visibleTabs = ALL_TABS.filter((t) => !t.dbs || t.dbs.includes(db));

  useEffect(() => {
    if (selectedUid !== prevUid.current) {
      setTab(db === 'gene' ? 'gene' : 'abstract');
      setTaxName(null);
      prevUid.current = selectedUid;
    }
  }, [selectedUid, db]);

  useEffect(() => {
    if (linkData) setTab('links');
  }, [linkData]);

  return (
    <div className="flex flex-col">
      {/* ── Panel header ── */}
      <div className="flex items-center justify-between px-4 pt-1 pb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">Data Explorer</span>
        </div>
        {db === 'gene' && (
          <span className="flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase tracking-wide">
            <Dna size={8} />
            Gene
          </span>
        )}
      </div>

      {!selectedUid ? (
        /* ── Empty state ── */
        <div>
          <div className="flex flex-col items-center justify-center py-8 px-5 text-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-raised border border-outline-dim mb-1">
              <MousePointerClick size={16} className="text-on-surface-3" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-semibold text-on-surface">Nothing selected yet</p>
            <p className="text-[11px] text-on-surface-3 leading-relaxed max-w-[170px]">
              Click any result to explore its metadata and linked records.
            </p>
          </div>

          {(yearLoading || yearData.length > 0) && (
            <div className="border-t border-outline-dim px-4 pt-4 pb-2">
              <YearChart data={yearData} loading={yearLoading} />
            </div>
          )}
        </div>
      ) : (
        /* ── Selected state ── */
        <div>
          {/* Underline tab bar — sticky within the outer scroll container */}
          <div className="sticky top-0 z-10 bg-surface border-b border-outline-dim">
            <div className="flex">
              {visibleTabs.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`
                      flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 px-1 relative
                      text-[10px] font-semibold transition-colors focus:outline-none
                      ${active ? 'text-primary-cta' : 'text-on-surface-3 hover:text-on-surface'}
                    `}
                  >
                    <Icon size={12} strokeWidth={active ? 2.5 : 1.8} />
                    <span>{label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary-cta" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content — natural height, no inner scroll */}
          <div>
            {tab === 'abstract' && (
              <AbstractTab text={abstractText} loading={abstractLoading} uid={selectedUid} db={db} />
            )}
            {tab === 'gene' && (
              <GeneDetailsTab geneId={selectedUid} db={db} onTaxName={setTaxName} />
            )}
            {tab === 'genome' && (
              <GenomeTab taxName={taxName} db={db} />
            )}
            {tab === 'links' && (
              <LinksTab uid={selectedUid} linkData={linkData} linkLoading={linkLoading} />
            )}
            {tab === 'related' && (
              <RelatedTab docs={relatedDocs} loading={relatedLoading} db={db} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
