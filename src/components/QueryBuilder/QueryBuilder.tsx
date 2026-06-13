import { Plus, Trash2 } from 'lucide-react';
import type { SearchChip, SearchField } from '../../types/search';
import TermRow from './TermRow';

interface Props {
  chips: SearchChip[];
  onChange: (chips: SearchChip[]) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeChip(field: SearchField = 'All Fields'): SearchChip {
  return { id: uid(), term: '', field, operator: 'AND' };
}

export default function QueryBuilder({ chips, onChange }: Props) {
  function addChip() {
    onChange([...chips, makeChip()]);
  }

  function removeChip(id: string) {
    onChange(chips.filter((c) => c.id !== id));
  }

  function updateChip(id: string, updates: Partial<SearchChip>) {
    onChange(chips.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
          Query Builder
        </span>
        {chips.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="flex items-center gap-1 font-mono text-[10px] text-on-surface-3 hover:text-danger transition-colors"
          >
            <Trash2 size={11} />
            Clear All
          </button>
        )}
      </div>

      {/* Term rows */}
      {chips.map((chip, i) => (
        <TermRow
          key={chip.id}
          chip={chip}
          isFirst={i === 0}
          autoFocus={i === chips.length - 1 && chip.term === ''}
          onUpdate={updateChip}
          onRemove={removeChip}
        />
      ))}

      {/* Empty state */}
      {chips.length === 0 && (
        <p className="py-3 text-center text-xs text-on-surface-3">
          Click <span className="font-semibold">Add Term</span> to start building your query.
        </p>
      )}

      {/* Add Term button */}
      <button
        onClick={addChip}
        className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-lg border border-dashed border-outline text-xs text-on-surface-3 hover:text-on-surface-2 hover:border-outline/70 hover:bg-surface-raised transition-all"
      >
        <Plus size={13} />
        Add Term
      </button>
    </div>
  );
}
