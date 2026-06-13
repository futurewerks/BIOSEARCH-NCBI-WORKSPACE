import { useState } from 'react';
import { Dna, Loader2 } from 'lucide-react';
import type { EsearchResult, SearchChip, DatabaseInfo } from './types/search';
import type { FilterState } from './components/Results/FilterPanel';
import { runEsearch } from './utils/ncbi';
import { DATABASES, MIN_YEAR, MAX_YEAR } from './constants';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import AppShell, { type AppView } from './components/AppShell';
import AuthModal from './components/AuthModal';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import ApiStatusPage from './pages/ApiStatusPage';
import CollectionsPage from './pages/CollectionsPage';
import DocsPage from './pages/DocsPage';

interface ResultState {
  result:   EsearchResult;
  db:       string;
  query:    string;
  chips:    SearchChip[];
  dateFrom: number;
  dateTo:   number;
  dbInfo:   DatabaseInfo;
}

const DEFAULT_FILTERS: FilterState = { pubTypes: [], species: [], sort: 'relevance' };

export default function App() {
  const { dark, toggle } = useTheme();
  const auth = useAuth();

  const [view,        setView]        = useState<AppView>('search');
  const [resultState, setResultState] = useState<ResultState | null>(null);
  const [filters,     setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [searchKey,   setSearchKey]   = useState(0);

  // ── Auth loading splash ───────────────────────────────────────────
  if (auth.loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg">
        <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
          <Dna size={24} className="text-accent" />
        </div>
        <Loader2 size={20} className="text-on-surface-3 animate-spin" />
      </div>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────────
  if (!auth.user) {
    return <AuthModal onSignIn={auth.signIn} onSignUp={auth.signUp} />;
  }

  // ── Authenticated app ─────────────────────────────────────────────
  function handleResults(
    result: EsearchResult,
    db: string,
    query: string,
    chips: SearchChip[],
    dateFrom: number,
    dateTo: number,
    dbInfo: DatabaseInfo,
  ) {
    setResultState({ result, db, query, chips, dateFrom, dateTo, dbInfo });
    setFilters(DEFAULT_FILTERS);
    setSearchKey((k) => k + 1);
    setView('results');
  }

  async function handleReSearch(
    newQuery: string,
    chips: SearchChip[],
    dateFrom: number,
    dateTo: number,
    dbInfo: DatabaseInfo,
  ) {
    if (!resultState) return;
    try {
      const result = await runEsearch(dbInfo.ncbiDb, newQuery);
      setResultState({ result, db: dbInfo.ncbiDb, query: newQuery, chips, dateFrom, dateTo, dbInfo });
      setFilters(DEFAULT_FILTERS);
      setSearchKey((k) => k + 1);
    } catch {
      // stay on current view
    }
  }

  function handleNewQuery() {
    setView('search');
  }

  const showFilters = view === 'results' && resultState !== null;

  function renderContent() {
    if (view === 'api-status') return <ApiStatusPage />;
    if (view === 'docs') return <DocsPage />;
    if (view === 'collections') return (
      <CollectionsPage
        onReRunSearch={async (query, db) => {
          try {
            const result = await runEsearch(db, query);
            const dbInfo = DATABASES.find((d) => d.ncbiDb === db) ?? DATABASES[0];
            setResultState({ result, db, query, chips: [], dateFrom: MIN_YEAR, dateTo: MAX_YEAR, dbInfo });
            setFilters(DEFAULT_FILTERS);
            setSearchKey((k) => k + 1);
            setView('results');
          } catch { /* stay on collections */ }
        }}
      />
    );
    if (view === 'results' && resultState) {
      return (
        <ResultsPage
          key={searchKey}
          result={resultState.result}
          db={resultState.db}
          query={resultState.query}
          chips={resultState.chips}
          dateFrom={resultState.dateFrom}
          dateTo={resultState.dateTo}
          dbInfo={resultState.dbInfo}
          filters={filters}
          onReSearch={handleReSearch}
          onNewQuery={handleNewQuery}
        />
      );
    }
    return <SearchPage onResults={handleResults} />;
  }

  return (
    <AppShell
      view={view}
      dark={dark}
      onToggleTheme={toggle}
      onNavigate={setView}
      onNewQuery={handleNewQuery}
      sidebarDb={resultState?.db}
      filters={filters}
      onFiltersChange={setFilters}
      showFilters={showFilters}
      userEmail={auth.user.email ?? ''}
      onSignOut={auth.signOut}
    >
      {renderContent()}
    </AppShell>
  );
}
