import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import type { FilterState } from './Results/FilterPanel';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

export type AppView = 'search' | 'results' | 'api-status' | 'collections' | 'docs';

interface Props {
  view:            AppView;
  dark:            boolean;
  onToggleTheme:   () => void;
  onNavigate:      (v: AppView) => void;
  onNewQuery:      () => void;
  sidebarDb?:      string;
  filters:         FilterState;
  onFiltersChange: (f: FilterState) => void;
  showFilters:     boolean;
  userEmail:       string;
  onSignOut:       () => void;
  children:        ReactNode;
}

const VIEW_LABEL: Record<AppView, string> = {
  search:       'Advanced Search',
  results:      'Results',
  'api-status': 'API Status',
  collections:  'Collections',
  docs:         'Documentation',
};

export default function AppShell({
  view, dark, onToggleTheme, onNavigate, onNewQuery,
  sidebarDb, filters, onFiltersChange, showFilters,
  userEmail, onSignOut,
  children,
}: Props) {
  const initials = userEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        view={view}
        onNavigate={onNavigate}
        onNewQuery={onNewQuery}
        sidebarDb={sidebarDb}
        filters={filters}
        onFiltersChange={onFiltersChange}
        showFilters={showFilters}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <header className="h-11 shrink-0 flex items-center gap-3 px-5 border-b border-outline-dim bg-surface">
          <span className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
            {VIEW_LABEL[view]}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* User chip */}
            <div className="flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-surface-raised border border-outline">
              <div className="w-5 h-5 rounded-full bg-primary-cta/20 border border-primary-cta/30 flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary leading-none">{initials}</span>
              </div>
              <span className="text-[11px] text-on-surface-2 font-medium max-w-[130px] truncate">
                {userEmail}
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={onSignOut}
              title="Sign out"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-on-surface-3 hover:text-on-surface hover:bg-surface-raised transition-all focus:outline-none focus:ring-2 focus:ring-primary-cta/30"
            >
              <LogOut size={13} />
            </button>

            <ThemeToggle dark={dark} toggle={onToggleTheme} />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
