import { X, Wand2 } from 'lucide-react';

interface Props {
  corrected: string;
  onAccept: (query: string) => void;
  onDismiss: () => void;
}

export default function SpellingSuggestion({ corrected, onAccept, onDismiss }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-caution/10 border border-caution/30">
      <div className="flex items-center gap-2.5 min-w-0">
        <Wand2 size={14} className="text-caution shrink-0" />
        <span className="text-sm text-on-surface">
          Did you mean:{' '}
          <button
            onClick={() => onAccept(corrected)}
            className="font-semibold text-primary hover:brightness-125 underline underline-offset-2 transition-all"
          >
            {corrected}
          </button>
          ?
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="text-on-surface-3 hover:text-on-surface transition-colors shrink-0"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
