import { Clock, X } from 'lucide-react';
import type { SearchHistoryEntry } from '../types/search';

interface Props {
  history: SearchHistoryEntry[];
  onSelect: (entry: SearchHistoryEntry) => void;
  onClear: () => void;
}

export default function SearchHistory({ history, onSelect, onClear }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
          <Clock size={11} />
          <span>Recent Searches</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[11px] text-on-surface-3 hover:text-danger transition-colors"
        >
          <X size={11} /> Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            title={entry.queryString}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline bg-surface text-xs text-on-surface-2 hover:border-primary/50 hover:text-primary hover:bg-surface-raised transition-all max-w-[280px]"
          >
            <span className="truncate font-medium font-mono text-[11px]">{entry.queryString}</span>
            <span className="shrink-0 text-on-surface-3 text-[10px]">
              {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
