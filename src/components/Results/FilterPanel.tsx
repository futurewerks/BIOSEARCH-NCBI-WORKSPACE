import { useEffect, useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import type { EinfoField, SortOption } from '../../types/search';
import { fetchEinfo } from '../../utils/ncbi';

export interface FilterState {
  pubTypes: string[];
  species: string[];
  sort: SortOption;
}

interface Props {
  db: string;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance',   label: 'Best Match' },
  { value: 'date',        label: 'Most Recent' },
  { value: 'pubdate',     label: 'Publication Date' },
  { value: 'Author',      label: 'First Author' },
  { value: 'JournalName', label: 'Journal' },
];

const COMMON_PUB_TYPES = [
  'Journal Article', 'Review', 'Clinical Trial',
  'Meta-Analysis', 'Randomized Controlled Trial',
  'Systematic Review', 'Case Reports', 'Editorial',
];

const COMMON_SPECIES = ['Human', 'Mouse', 'Rat', 'Zebrafish', 'Drosophila'];

export default function FilterPanel({ db, filters, onChange }: Props) {
  const [fields, setFields] = useState<EinfoField[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [ptOpen, setPtOpen] = useState(true);
  const [spOpen, setSpOpen] = useState(true);

  useEffect(() => {
    setLoadingInfo(true);
    fetchEinfo(db)
      .then((res) => setFields(res.einforesult.dbinfo.fieldlist ?? []))
      .catch(() => setFields([]))
      .finally(() => setLoadingInfo(false));
  }, [db]);

  const hasSpecies = fields.some(
    (f) => f.Name === 'ORGN' || f.FullName?.toLowerCase().includes('organism'),
  );

  function togglePubType(pt: string) {
    const next = filters.pubTypes.includes(pt)
      ? filters.pubTypes.filter((x) => x !== pt)
      : [...filters.pubTypes, pt];
    onChange({ ...filters, pubTypes: next });
  }

  function toggleSpecies(sp: string) {
    const next = filters.species.includes(sp)
      ? filters.species.filter((x) => x !== sp)
      : [...filters.species, sp];
    onChange({ ...filters, species: next });
  }

  return (
    <div className="space-y-4">
      {/* Sort */}
      <div>
        <p className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest mb-2">
          Sort Results
        </p>
        <div className="relative">
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
            className="w-full text-sm text-on-surface bg-surface-raised border border-outline rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary-cta/40 appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-3 pointer-events-none" />
        </div>
      </div>

      {/* Publication Type */}
      <div>
        <button
          onClick={() => setPtOpen((v) => !v)}
          className="w-full flex items-center justify-between mb-1.5"
        >
          <span className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
            Publication Type
          </span>
          <ChevronDown size={11} className={`text-on-surface-3 transition-transform ${ptOpen ? 'rotate-180' : ''}`} />
        </button>
        {ptOpen && (
          <div className="space-y-0.5">
            {loadingInfo ? (
              <div className="flex items-center gap-2 py-1 text-xs text-on-surface-3">
                <Loader2 size={11} className="animate-spin" /> Loading…
              </div>
            ) : (
              COMMON_PUB_TYPES.map((pt) => (
                <label
                  key={pt}
                  className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-md hover:bg-surface-high cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={filters.pubTypes.includes(pt)}
                    onChange={() => togglePubType(pt)}
                    className="w-3.5 h-3.5 rounded accent-primary-cta cursor-pointer"
                  />
                  <span className="text-xs text-on-surface-2 group-hover:text-on-surface leading-tight">
                    {pt}
                  </span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Species */}
      {hasSpecies && (
        <div>
          <button
            onClick={() => setSpOpen((v) => !v)}
            className="w-full flex items-center justify-between mb-1.5"
          >
            <span className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
              Species
            </span>
            <ChevronDown size={11} className={`text-on-surface-3 transition-transform ${spOpen ? 'rotate-180' : ''}`} />
          </button>
          {spOpen && (
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SPECIES.map((sp) => {
                const active = filters.species.includes(sp);
                return (
                  <button
                    key={sp}
                    onClick={() => toggleSpecies(sp)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all font-medium ${
                      active
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'border-outline text-on-surface-3 hover:border-outline/60 hover:text-on-surface-2'
                    }`}
                  >
                    {sp}
                    {active && <span className="ml-1.5 text-[10px] opacity-70">×</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
