import { useRef, useEffect, useState } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import type { SearchChip, SearchField, LogicalOperator } from '../../types/search';
import { SEARCH_FIELDS } from '../../constants';
import OperatorToggle from './OperatorToggle';
import { useTaxonSuggest } from '../../hooks/useTaxonSuggest';

interface Props {
  chip: SearchChip;
  isFirst: boolean;
  autoFocus?: boolean;
  onUpdate: (id: string, updates: Partial<SearchChip>) => void;
  onRemove: (id: string) => void;
}

export default function TermRow({ chip, isFirst, autoFocus, onUpdate, onRemove }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { suggestions, loading } = useTaxonSuggest(chip.term, chip.field);

  // Open dropdown whenever new suggestions arrive
  useEffect(() => {
    if (suggestions.length > 0) setShowDropdown(true);
    else setShowDropdown(false);
  }, [suggestions]);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') setShowDropdown(false);
  }

  function selectSuggestion(sci_name: string) {
    onUpdate(chip.id, { term: sci_name });
    setShowDropdown(false);
  }

  return (
    <div className="flex items-center gap-2 group">
      {/* Operator badge / "SEARCH" label */}
      <div className="w-[68px] shrink-0 flex justify-center">
        {isFirst ? (
          <span className="font-mono text-[9px] font-bold text-on-surface-3 uppercase tracking-widest">
            Search
          </span>
        ) : (
          <OperatorToggle
            value={chip.operator}
            onChange={(op: LogicalOperator) => onUpdate(chip.id, { operator: op })}
          />
        )}
      </div>

      {/* Term text input + dropdown */}
      <div ref={wrapperRef} className="relative flex-1">
        <input
          type="text"
          value={chip.term}
          onChange={(e) => onUpdate(chip.id, { term: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Enter search term…"
          autoFocus={autoFocus}
          className="w-full bg-surface border border-outline rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-3 focus:outline-none focus:border-primary-cta focus:ring-1 focus:ring-primary-cta/30 transition-all pr-8"
        />
        {loading && chip.field === 'Organism' && (
          <Loader2
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-on-surface-3 pointer-events-none"
          />
        )}

        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface border border-outline rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li key={s.tax_id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(s.sci_name);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-surface-raised transition-colors"
                >
                  <div className="text-sm text-on-surface">
                    <span className="italic">{s.sci_name}</span>
                    {s.common_name && (
                      <span className="text-on-surface-2 not-italic"> ({s.common_name})</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-on-surface-3 mt-0.5">
                    taxid: {s.tax_id}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Field dropdown */}
      <div className="relative shrink-0">
        <select
          value={chip.field}
          onChange={(e) => onUpdate(chip.id, { field: e.target.value as SearchField })}
          className="font-mono text-[10px] font-semibold text-on-surface-2 bg-surface-raised border border-outline rounded-lg pl-2.5 pr-6 py-2 focus:outline-none focus:border-primary-cta appearance-none cursor-pointer hover:bg-surface-high transition-colors uppercase tracking-wide"
        >
          {SEARCH_FIELDS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <ChevronDown
          size={11}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-3 pointer-events-none"
        />
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(chip.id)}
        className="sm:opacity-0 sm:group-hover:opacity-100 text-on-surface-3 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-all"
        title="Remove term"
      >
        <X size={13} />
      </button>
    </div>
  );
}
