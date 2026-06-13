import { X } from 'lucide-react';
import type { SearchChip } from '../../types/search';
import { FIELD_TAGS } from '../../constants';

// Field-specific accent colors that work in both light and dark mode
const FIELD_ACCENT: Record<string, string> = {
  'All Fields':  'bg-surface-highest text-on-surface-2',
  Title:         'bg-primary/15 text-primary',
  Abstract:      'bg-accent/15 text-accent',
  'MeSH Terms':  'bg-emerald-500/15 text-emerald-400',
  Author:        'bg-amber-500/15 text-amber-400',
  Journal:       'bg-orange-500/15 text-orange-400',
  Organism:      'bg-rose-500/15 text-rose-400',
  'Gene Name':   'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

interface Props {
  chip: SearchChip;
  onRemove: (id: string) => void;
}

export default function SearchChipComponent({ chip, onRemove }: Props) {
  const tag = FIELD_TAGS[chip.field];
  const accent = FIELD_ACCENT[chip.field] ?? FIELD_ACCENT['All Fields'];

  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full border border-outline bg-surface text-sm text-on-surface group hover:border-primary/50 transition-all">
      <span className="font-medium leading-none text-sm">{chip.term}</span>
      {tag && (
        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none uppercase tracking-wide ${accent}`}>
          {chip.field}
        </span>
      )}
      <button
        onClick={() => onRemove(chip.id)}
        className="p-0.5 rounded-full text-on-surface-3 hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100 ml-0.5"
        title="Remove"
      >
        <X size={11} />
      </button>
    </span>
  );
}
