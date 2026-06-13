import type { DatabaseInfo } from '../types/search';
import { DATABASES } from '../constants';

interface Props {
  selectedDb: string;
  onSelect: (db: DatabaseInfo) => void;
}

const DB_ACCENT: Record<string, { idle: string; active: string }> = {
  pubmed:    {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10',
    active: 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500',
  },
  pmc:       {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10',
    active: 'border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500',
  },
  gene:      {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    active: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500',
  },
  snp:       {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10',
    active: 'border-amber-500 bg-amber-500 text-white dark:border-amber-400 dark:bg-amber-400',
  },
  clinvar:   {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10',
    active: 'border-rose-600 bg-rose-600 text-white dark:border-rose-500 dark:bg-rose-500',
  },
  protein:   {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10',
    active: 'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500',
  },
  structure: {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10',
    active: 'border-orange-500 bg-orange-500 text-white dark:border-orange-400 dark:bg-orange-400',
  },
  taxonomy:  {
    idle:   'bg-surface border-outline text-on-surface-2 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
    active: 'border-cyan-600 bg-cyan-600 text-white dark:border-cyan-500 dark:bg-cyan-500',
  },
};

export default function DatabasePills({ selectedDb, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {DATABASES.map((db) => {
        const active = selectedDb === db.id;
        const { idle, active: activeStyle } = DB_ACCENT[db.id] ?? DB_ACCENT.pubmed;

        return (
          <button
            key={db.id}
            onClick={() => onSelect(db)}
            className={`flex items-center justify-center px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 ${active ? activeStyle : idle}`}
          >
            <span className="truncate">{db.label}</span>
          </button>
        );
      })}
    </div>
  );
}
