import { Dna, Plus, Search, FolderOpen, Activity, BookOpen, type LucideIcon } from 'lucide-react';
import type { AppView } from './AppShell';
import type { FilterState } from './Results/FilterPanel';
import FilterPanel from './Results/FilterPanel';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  view: AppView;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'search',       label: 'Search',        icon: Search,     view: 'search'        },
  { id: 'collections',  label: 'Collections',   icon: FolderOpen, view: 'collections'   },
  { id: 'api',          label: 'API Status',    icon: Activity,   view: 'api-status'    },
  { id: 'docs',         label: 'Documentation', icon: BookOpen,   view: 'docs'          },
];

interface Props {
  view: AppView;
  onNavigate: (v: AppView) => void;
  onNewQuery: () => void;
  sidebarDb?: string;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  showFilters: boolean;
}

export default function Sidebar({
  view, onNavigate, onNewQuery,
  sidebarDb, filters, onFiltersChange, showFilters,
}: Props) {
  return (
    <aside className="w-[240px] shrink-0 h-full flex flex-col bg-surface border-r border-outline-dim overflow-y-auto">
      {/* ── Brand ── */}
      <div className="px-4 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Dna size={16} className="text-accent" />
          </div>
          <div>
            <h1 className="text-on-surface font-bold text-[14px] leading-none">BioSearch</h1>
            <p className="font-mono text-[9px] text-on-surface-3 tracking-widest uppercase mt-0.5">
              NCBI Workspace
            </p>
          </div>
        </div>
      </div>

      {/* ── New Query CTA ── */}
      <div className="px-3 pb-3 shrink-0">
        <button
          onClick={onNewQuery}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-cta text-on-primary text-sm font-semibold hover:brightness-110 active:brightness-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary-cta/40 focus:ring-offset-2 focus:ring-offset-surface"
        >
          <Plus size={13} />
          New Query
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav className="px-2 space-y-0.5 shrink-0">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.view;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.view)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                ${active
                  ? 'bg-primary/10 text-primary border-l-[3px] border-primary-cta pl-[9px]'
                  : 'text-on-surface-2 hover:text-on-surface hover:bg-surface-raised border-l-[3px] border-transparent pl-[9px]'
                }
              `}
            >
              <Icon size={14} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Contextual filter zone (results view only) ── */}
      {showFilters && sidebarDb && (
        <div className="mt-4 pt-4 border-t border-outline-dim px-3 pb-6 flex-1">
          <FilterPanel
            db={sidebarDb}
            filters={filters}
            onChange={onFiltersChange}
          />
        </div>
      )}
    </aside>
  );
}
