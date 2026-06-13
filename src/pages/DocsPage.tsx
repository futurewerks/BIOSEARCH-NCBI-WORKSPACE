import { useState } from 'react';
import {
  BookOpen, Search, Database, Filter, Bookmark, FolderOpen,
  Download, Activity, ChevronRight, Code2, Table2,
} from 'lucide-react';

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: Section[] = [
  { id: 'overview',     label: 'Overview',          icon: BookOpen   },
  { id: 'auth',         label: 'Authentication',    icon: BookOpen   },
  { id: 'search',       label: 'Search',            icon: Search     },
  { id: 'results',      label: 'Results',           icon: Filter     },
  { id: 'collections',  label: 'Collections',       icon: FolderOpen },
  { id: 'exports',      label: 'Exports',           icon: Download   },
  { id: 'api-status',   label: 'API Status',        icon: Activity   },
  { id: 'ncbi-api',     label: 'NCBI API Layer',    icon: Code2      },
  { id: 'database',     label: 'Database Schema',   icon: Database   },
  { id: 'edge-fns',     label: 'Edge Functions',    icon: Code2      },
  { id: 'architecture', label: 'Architecture',      icon: Table2     },
];

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-on-surface mt-6 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-on-surface-2 leading-relaxed mb-3">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[11px] bg-surface-raised border border-outline px-1.5 py-0.5 rounded text-primary">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="font-mono text-[11px] bg-surface-raised border border-outline rounded-lg p-4 overflow-x-auto text-on-surface-2 leading-relaxed mb-4 whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-surface-raised">
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 text-[11px] font-bold text-on-surface-3 uppercase tracking-wider border border-outline">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised/30'}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[12px] text-on-surface-2 border border-outline font-mono leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3 bg-accent/5 border border-accent/20 rounded-lg mb-4">
      <ChevronRight size={14} className="text-accent shrink-0 mt-0.5" />
      <p className="text-sm text-on-surface-2 leading-relaxed">{children}</p>
    </div>
  );
}

// ── Section content components ─────────────────────────────────────

function SectionOverview() {
  return (
    <>
      <H2>Overview</H2>
      <P>
        BioSearch is a biomedical literature and data search interface built on top of NCBI
        E-Utilities. Authenticated users build precise boolean queries across eight NCBI databases,
        explore results with full abstract and gene detail views, bookmark articles, organise them
        into named collections, combine past searches with boolean operators, and export result sets
        in PMID or BibTeX format.
      </P>
      <H3>Technology Stack</H3>
      <Table
        headers={['Layer', 'Technology']}
        rows={[
          ['Frontend', 'React 18, TypeScript, Vite'],
          ['Styling', 'Tailwind CSS'],
          ['Icons', 'Lucide React'],
          ['Backend / Auth / Database', 'Supabase (PostgreSQL + Edge Functions + Auth)'],
          ['External API', 'NCBI E-Utilities (eutils.ncbi.nlm.nih.gov)'],
          ['Gene Details', 'NCBI Datasets API (api.ncbi.nlm.nih.gov/datasets/v2)'],
        ]}
      />
      <H3>Navigation</H3>
      <P>
        Navigation is managed as in-memory state in <Code>App.tsx</Code> — there is no URL router.
        The sidebar contains four links that switch between views: Search, Collections, API Status,
        and Documentation.
      </P>
      <Table
        headers={['View', 'Component', 'Description']}
        rows={[
          ['search', 'SearchPage', 'Default; build and execute queries'],
          ['results', 'ResultsPage', 'Paginated result list with explorer panel'],
          ['collections', 'CollectionsPage', 'Saved articles, collections, history, exports'],
          ['api-status', 'ApiStatusPage', 'Live NCBI endpoint health dashboard'],
          ['docs', 'DocsPage', 'This documentation'],
        ]}
      />
    </>
  );
}

function SectionAuth() {
  return (
    <>
      <H2>Authentication</H2>
      <P>
        The entire application is gated behind Supabase email/password authentication. Until a
        session is established, only the sign-in/sign-up modal is rendered — no other UI is
        accessible.
      </P>
      <Callout>
        Email confirmation is disabled. Accounts are immediately active after sign-up.
      </Callout>
      <H3>useAuth hook — <Code>src/hooks/useAuth.ts</Code></H3>
      <Table
        headers={['Export', 'Description']}
        rows={[
          ['user', 'Current User object, or null when signed out'],
          ['loading', 'true while the initial session check is in flight'],
          ['signIn(email, password)', 'Signs in with email/password'],
          ['signUp(email, password)', 'Creates a new account'],
          ['signOut()', 'Signs out and clears the session'],
        ]}
      />
      <P>
        A full-screen loading splash renders while <Code>loading</Code> is <Code>true</Code> to
        prevent a flash of the auth form on page refresh when a session already exists.
      </P>
      <H3>AuthModal — <Code>src/components/AuthModal.tsx</Code></H3>
      <P>
        Two-tab form (Sign In / Sign Up) with inline error display and loading states on submit
        buttons.
      </P>
    </>
  );
}

function SectionSearch() {
  return (
    <>
      <H2>Search</H2>
      <H3>SearchPage — <Code>src/pages/SearchPage.tsx</Code></H3>
      <P>
        The primary search interface. State managed locally: <Code>chips</Code> (search terms),{' '}
        <Code>selectedDb</Code> (active database), <Code>dateFrom</Code>/<Code>dateTo</Code> (year
        bounds), and <Code>history</Code> (last 10 searches loaded from Supabase on mount).
        On execute, <Code>runEsearch</Code> is called. On success the entry is saved to history
        and the app navigates to the Results view.
      </P>
      <H3>Query Builder — <Code>src/components/QueryBuilder/</Code></H3>
      <Table
        headers={['Component', 'Role']}
        rows={[
          ['QueryBuilder.tsx', 'Manages the list of term rows; add/clear controls'],
          ['TermRow.tsx', 'One condition: operator toggle + field selector + text input'],
          ['OperatorToggle.tsx', 'Cycles AND → OR → NOT → AND'],
          ['SearchChip.tsx', 'Chip rendered as a colour-coded tag with remove button'],
          ['ChipInput.tsx', 'Standalone input for adding chips'],
        ]}
      />
      <P>
        When the selected field is <Code>Organism</Code>, the text input uses{' '}
        <Code>useTaxonSuggest</Code> to show an autocomplete dropdown. Input is debounced 400 ms
        before querying the NCBI Taxonomy <Code>esuggest</Code> endpoint.
      </P>
      <H3>Search Fields</H3>
      <Table
        headers={['Field', 'NCBI Tag']}
        rows={[
          ['All Fields', '(no tag)'],
          ['Title', '[Title]'],
          ['Abstract', '[Abstract]'],
          ['MeSH Terms', '[MeSH Terms]'],
          ['Author', '[Author]'],
          ['Journal', '[Journal]'],
          ['Organism', '[Organism]'],
          ['Gene Name', '[Gene Name]'],
        ]}
      />
      <H3>Query String Compilation</H3>
      <P>
        <Code>buildQueryString</Code> in <Code>src/utils/ncbi.ts</Code> compiles the chip array
        and date range into a valid NCBI query string. The first chip produces{' '}
        <Code>"term"[Field]</Code>; subsequent chips are prefixed with their operator. A date range
        is only appended when narrowed from defaults.
      </P>
      <CodeBlock>{`"BRCA1"[Gene Name] AND "breast cancer"[Title] AND 2015:2024[pdat]`}</CodeBlock>
      <H3>Database Selector — <Code>src/components/DatabasePills.tsx</Code></H3>
      <Table
        headers={['Database', 'NCBI ID', 'Colour']}
        rows={[
          ['PubMed', 'pubmed', 'Blue'],
          ['PMC', 'pmc', 'Teal'],
          ['Gene', 'gene', 'Emerald'],
          ['SNP', 'snp', 'Amber'],
          ['ClinVar', 'clinvar', 'Rose'],
          ['Protein', 'protein', 'Sky'],
          ['Structure', 'structure', 'Orange'],
          ['Taxonomy', 'taxonomy', 'Cyan'],
        ]}
      />
      <H3>Date Range Slider — <Code>src/components/DateRangeSlider.tsx</Code></H3>
      <P>
        Dual-thumb range slider spanning 1900–2025. When both thumbs are at default positions the
        date filter is omitted from the query entirely.
      </P>
      <H3>Query Preview — <Code>src/components/QueryPreview.tsx</Code></H3>
      <P>
        Live colour-coded monospace display of the compiled query. Operators{' '}
        <Code>AND</Code>, <Code>OR</Code>, and <Code>NOT</Code> are highlighted in distinct colours.
      </P>
      <H3>Search History — <Code>src/components/SearchHistory.tsx</Code></H3>
      <P>
        After each successful search the entry is saved to the <Code>search_history</Code> Supabase
        table (max 10 per user; duplicates deduplicated by query string). Clicking a history pill
        restores the full chip array, database, and date range as originally submitted.
      </P>
    </>
  );
}

function SectionResults() {
  return (
    <>
      <H2>Results</H2>
      <H3>ResultsPage — <Code>src/pages/ResultsPage.tsx</Code></H3>
      <P>
        Receives the initial <Code>EsearchResult</Code> (server-side <Code>WebEnv</Code>/
        <Code>query_key</Code>), the database, and the query. On mount loads the first 20
        summaries, checks spelling, and fetches saved article state — all in a single{' '}
        <Code>Promise.all</Code>. Layout: result feed on the left, sticky RightPanel on the right
        (visible at <Code>xl</Code>+ breakpoints).
      </P>
      <H3>Pagination</H3>
      <P>
        Uses NCBI's server-side history. "Load more" calls <Code>fetchEsummary</Code> with an
        incrementing <Code>retstart</Code> offset using the active <Code>WebEnv</Code> and{' '}
        <Code>query_key</Code>.
      </P>
      <H3>Filter Panel — <Code>src/components/Results/FilterPanel.tsx</Code></H3>
      <P>
        Rendered in the sidebar when viewing results. On change, <Code>runEsearchSorted</Code> is
        called with the modified query (pub-type and species filters appended as NCBI query
        clauses). The result set resets to page 1 with new session keys.
      </P>
      <Table
        headers={['Control', 'Options']}
        rows={[
          ['Sort', 'Relevance, Date, Publication Date, Author, Journal'],
          ['Publication type', 'Journal Article, Review, Clinical Trial, Meta-Analysis, Case Reports, Systematic Review'],
          ['Species', 'Human, Mouse, Rat, Zebrafish, Drosophila, C. elegans'],
        ]}
      />
      <H3>Spelling Suggestion — <Code>src/components/Results/SpellingSuggestion.tsx</Code></H3>
      <P>
        On initial load <Code>fetchEspell</Code> runs. If the corrected query differs from the
        original (case-insensitive), a banner offers to re-run with the correction. Dismissing
        hides it for the session.
      </P>
      <H3>ResultCard — <Code>src/components/Results/ResultCard.tsx</Code></H3>
      <P>
        Displays title (linked to NCBI), authors (first 3 + "et al."), journal + year, and
        pub-type badges. Actions:
      </P>
      <Table
        headers={['Action', 'Behaviour']}
        rows={[
          ['Click card', 'Fetches and caches the PubMed abstract (XML parsing via efetch.fcgi)'],
          ['Bookmark', 'Saves or removes the article in Supabase saved_articles'],
          ['Explore', 'Fetches ELink data and opens the right panel'],
        ]}
      />
      <H3>Right Panel — <Code>src/components/Results/RightPanel.tsx</Code></H3>
      <P>Sticky panel with four tabs, shown when a card is selected:</P>
      <Table
        headers={['Tab', 'Availability', 'Description']}
        rows={[
          ['Abstract', 'All databases', 'Full abstract via efetch.fcgi XML; structured abstracts show section labels; per-UID session cache'],
          ['Gene Details', 'Gene database only', 'Calls NCBI Datasets API; shows symbol, description, organism, chromosomes, Ensembl IDs, genomic locations, gene groups'],
          ['Links', 'All databases', 'External URLs from fetchElink cmd=llinks, grouped by provider'],
          ['Related Articles', 'PubMed only', 'Up to 8 articles via elink cmd=neighbor_score; per-UID session cache'],
        ]}
      />
      <H3>Year Chart — <Code>src/components/Results/YearChart.tsx</Code></H3>
      <P>
        Visible in the right panel when no article is selected (PubMed only). Fires 13 parallel{' '}
        <Code>fetchEsearchCount</Code> calls — one per year for the last 12 years plus a{' '}
        <Code>{"<YYYY"}</Code> bucket — and renders a horizontal bar chart with relative widths.
      </P>
    </>
  );
}

function SectionCollections() {
  return (
    <>
      <H2>Collections</H2>
      <H3>CollectionsPage — <Code>src/pages/CollectionsPage.tsx</Code></H3>
      <P>
        Workspace management. Loads collections, all saved articles, and search history in parallel
        on mount.
      </P>
      <H3>Search History Section</H3>
      <P>Cards show query string, database badge, and relative timestamp. Per-card actions:</P>
      <Table
        headers={['Action', 'Behaviour']}
        rows={[
          ['Re-run', 'Re-executes the search and navigates to Results'],
          ['Pin', 'Marks the entry for combining (max 2 at a time)'],
          ['Delete', 'Removes the entry from history'],
        ]}
      />
      <H3>Combine Searches</H3>
      <P>
        Appears when exactly 2 history entries are pinned. A cycling operator button (
        <Code>AND</Code> / <Code>OR</Code> / <Code>NOT</Code>) sits between the two query strings.
        "Combine & Search" runs the combined query:{' '}
        <Code>(queryA) OPERATOR (queryB)</Code>.
      </P>
      <H3>Collections Grid</H3>
      <P>
        Named folders displayed in a grid. Each card shows name, description, article count, and
        creation date. Clicking opens the collection's article list. Deletion requires two clicks
        (first click arms the button; second confirms). Unsorted saved articles appear as a virtual
        "All Saved Articles" card when any exist.
      </P>
    </>
  );
}

function SectionExports() {
  return (
    <>
      <H2>Exports</H2>
      <P>
        Both export formats are based on the most recent search history entry. Each export first
        calls <Code>runEsearch</Code> to obtain fresh server-side history keys, then fetches the
        result set.
      </P>
      <Table
        headers={['Format', 'Mechanism', 'Output']}
        rows={[
          ['PMID list', 'ESearch rettype=uilist via fetchPmidList', '.txt — one PMID per line'],
          ['BibTeX', 'EFetch rettype=medline via fetchMedlineText + client-side MEDLINE→BibTeX parser', '.bib — up to 10,000 records'],
        ]}
      />
      <H3>MEDLINE-to-BibTeX Parser</H3>
      <P>
        The parser (<Code>parseMedlineToBibtex</Code> in CollectionsPage) splits the MEDLINE text
        on record boundaries, then extracts: <Code>PMID-</Code> (id), <Code>TI-</Code> (title),{' '}
        <Code>JT-</Code> (journal), year from <Code>DP-</Code>, and all <Code>AU-</Code> lines as
        authors.
      </P>
      <CodeBlock>{`@article{PMID12345678,
  pmid    = {12345678},
  title   = {Structural basis of BRCA1 function},
  author  = {Smith AB and Jones CD and Lee EF},
  journal = {Nature},
  year    = {2022},
}`}</CodeBlock>
    </>
  );
}

function SectionApiStatus() {
  return (
    <>
      <H2>API Status</H2>
      <H3>ApiStatusPage — <Code>src/pages/ApiStatusPage.tsx</Code></H3>
      <P>
        Calls the deployed <Code>ncbi-health</Code> Edge Function on mount. Displays a status card
        per endpoint showing name, URL, reachable/unreachable badge, latency in ms, and any error
        message.
      </P>
      <H3>Probed Endpoints</H3>
      <Table
        headers={['ID', 'Description']}
        rows={[
          ['esearch', 'Keyword search and history server'],
          ['esummary', 'Document summary retrieval'],
          ['egquery', 'Global cross-database query counts'],
          ['espell', 'Spelling correction service'],
          ['einfo', 'Database field and link metadata'],
          ['elink', 'Cross-database and external link lookup'],
        ]}
      />
      <Callout>
        The egquery endpoint redirects to an internal NCBI service-mesh host. The probe uses
        redirect: "manual" and treats any 3xx response as reachable.
      </Callout>
    </>
  );
}

function SectionNcbiApi() {
  return (
    <>
      <H2>NCBI API Layer</H2>
      <P>
        All calls go directly from the browser to{' '}
        <Code>https://eutils.ncbi.nlm.nih.gov/entrez/eutils/</Code>. The{' '}
        <Code>ncbi-proxy</Code> Edge Function is deployed for optional API key injection but is not
        currently called by the frontend.
      </P>
      <H3>Functions — <Code>src/utils/ncbi.ts</Code></H3>
      <Table
        headers={['Function', 'Endpoint', 'Purpose']}
        rows={[
          ['buildQueryString(chips, from, to)', '—', 'Compile chip array + date range into NCBI query'],
          ['runEsearch(db, query)', 'esearch.fcgi', 'Search with usehistory=y; returns count + session keys'],
          ['runEsearchSorted(db, query, sort, retstart, retmax)', 'esearch.fcgi', 'Same with sort and pagination offset'],
          ['fetchEsearchCount(db, query, mindate, maxdate)', 'esearch.fcgi', 'Count-only query (used for year chart)'],
          ['fetchEsummary(db, webenv, queryKey, retstart, retmax)', 'esummary.fcgi', 'Fetch summaries from server-side history'],
          ['fetchEsummaryByIds(db, uids)', 'esummary.fcgi', 'Fetch summaries for an explicit UID list'],
          ['fetchEspell(db, query)', 'espell.fcgi', 'Spelling correction; never throws'],
          ['fetchEinfo(db)', 'einfo.fcgi', 'Database field and link metadata'],
          ['fetchElink(dbFrom, uid)', 'elink.fcgi', 'External links (cmd=llinks)'],
          ['fetchAbstract(uid, db)', 'efetch.fcgi', 'PubMed abstract XML → parsed text'],
          ['fetchPmidList(webenv, querykey, retmax)', 'esearch.fcgi', 'PMID export list (rettype=uilist)'],
          ['fetchMedlineText(webenv, querykey, retmax)', 'efetch.fcgi', 'MEDLINE export for BibTeX conversion'],
          ['fetchRelatedArticles(uid)', 'elink.fcgi', 'Up to 8 related PubMed articles (cmd=neighbor_score)'],
        ]}
      />
      <H3>Gene Details Hook — <Code>src/hooks/useGeneReport.ts</Code></H3>
      <P>
        Calls the NCBI Datasets API at{' '}
        <Code>/datasets/v2/gene/id/{'{geneId}'}/dataset_report</Code>. Returns symbol, description,
        organism, chromosomes, Ensembl gene IDs, gene groups, and genomic location tables. Active
        only when the selected database is <Code>gene</Code>.
      </P>
    </>
  );
}

function SectionDatabase() {
  return (
    <>
      <H2>Database Schema</H2>
      <P>
        Three tables in Supabase PostgreSQL. All have RLS enabled with four separate policies
        (SELECT / INSERT / UPDATE / DELETE) scoped to the <Code>authenticated</Code> role using{' '}
        <Code>auth.uid() = user_id</Code>.
      </P>
      <H3>search_history</H3>
      <Table
        headers={['Column', 'Type', 'Notes']}
        rows={[
          ['id', 'uuid', 'Primary key'],
          ['user_id', 'uuid', 'DEFAULT auth.uid()'],
          ['query_string', 'text', 'Compiled NCBI query'],
          ['chips', 'jsonb', 'Serialised SearchChip[]'],
          ['selected_db', 'text', 'e.g. pubmed'],
          ['date_from', 'integer', 'Year lower bound'],
          ['date_to', 'integer', 'Year upper bound'],
          ['created_at', 'timestamptz', 'Auto-set on insert'],
        ]}
      />
      <H3>collections</H3>
      <Table
        headers={['Column', 'Type', 'Notes']}
        rows={[
          ['id', 'uuid', 'Primary key'],
          ['user_id', 'uuid', 'DEFAULT auth.uid()'],
          ['name', 'text', 'Required'],
          ['description', 'text', 'Optional'],
          ['created_at', 'timestamptz', 'Auto-set on insert'],
        ]}
      />
      <H3>saved_articles</H3>
      <Table
        headers={['Column', 'Type', 'Notes']}
        rows={[
          ['id', 'uuid', 'Primary key'],
          ['user_id', 'uuid', 'DEFAULT auth.uid()'],
          ['collection_id', 'uuid', 'FK → collections, ON DELETE SET NULL'],
          ['ncbi_uid', 'text', 'NCBI record UID'],
          ['db', 'text', 'NCBI database name'],
          ['title', 'text', 'Cached from ESummary'],
          ['summary_json', 'jsonb', 'Full ESummary payload'],
          ['created_at', 'timestamptz', 'Auto-set on insert'],
          ['(unique)', '—', '(user_id, ncbi_uid, db)'],
        ]}
      />
      <H3>Database Layer — <Code>src/utils/db.ts</Code></H3>
      <Table
        headers={['Function', 'Description']}
        rows={[
          ['dbLoadHistory()', 'Up to 10 entries, newest first'],
          ['dbSaveHistory(entry)', 'Deduplicates by query string, enforces 10-entry cap'],
          ['dbClearHistory()', 'Deletes all history for the current user'],
          ['dbDeleteHistoryEntry(id)', 'Deletes one entry'],
          ['dbLoadCollections()', 'All collections, newest first'],
          ['dbCreateCollection(name, desc?)', 'Creates and returns a new collection'],
          ['dbDeleteCollection(id)', 'Deletes a collection'],
          ['dbLoadSavedArticles(collectionId?)', 'Saved articles, optionally filtered by collection'],
          ['dbSaveArticle(uid, db, title, json, colId?)', 'Upserts an article'],
          ['dbRemoveSavedArticle(uid, db)', 'Removes an article'],
          ['dbIsArticleSaved(uid, db)', 'Returns true if already saved'],
        ]}
      />
    </>
  );
}

function SectionEdgeFunctions() {
  return (
    <>
      <H2>Edge Functions</H2>
      <H3>ncbi-proxy — <Code>supabase/functions/ncbi-proxy/index.ts</Code></H3>
      <P>
        Pass-through proxy for NCBI E-Utilities. Accepts{' '}
        <Code>POST {"{ endpoint, params }"}</Code>, appends <Code>NCBI_API_KEY</Code> from the
        environment if configured, and forwards with a 15-second timeout. Not currently called by
        the frontend — present for optional API key injection to raise the rate limit from 3 to
        10 req/s.
      </P>
      <H3>ncbi-health — <Code>supabase/functions/ncbi-health/index.ts</Code></H3>
      <P>
        Probes six NCBI endpoints staggered 200 ms apart to stay within the 3 req/s rate limit.
        Each probe has an 8-second timeout. Returns reachability and latency per endpoint.
      </P>
      <CodeBlock>{`// Response shape per endpoint
{ "id": "esearch", "ok": true, "ms": 142, "error": null }`}</CodeBlock>
      <H3>CORS Headers (both functions)</H3>
      <CodeBlock>{`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey`}</CodeBlock>
    </>
  );
}

function SectionArchitecture() {
  return (
    <>
      <H2>Architecture</H2>
      <H3>Project Structure</H3>
      <CodeBlock>{`src/
  App.tsx                        Root; view state + search result state
  pages/
    SearchPage.tsx               Query builder, database selector, search execution
    ResultsPage.tsx              Result list, filters, pagination, right panel
    CollectionsPage.tsx          Workspace: history, collections, exports
    ApiStatusPage.tsx            NCBI endpoint health dashboard
    DocsPage.tsx                 This documentation
  components/
    AppShell.tsx                 Layout shell (sidebar + header)
    AuthModal.tsx                Sign-in / sign-up forms
    DatabasePills.tsx            8-database selector pills
    DateRangeSlider.tsx          Dual-thumb year range slider
    QueryPreview.tsx             Live compiled query display
    SearchHistory.tsx            Recent searches list
    Sidebar.tsx                  Navigation + filter panel
    ThemeToggle.tsx              Light / dark toggle
    QueryBuilder/
      QueryBuilder.tsx           Row list manager
      TermRow.tsx                Single condition row
      ChipInput.tsx              Chip add input
      SearchChip.tsx             Chip tag display
      OperatorToggle.tsx         AND / OR / NOT toggle
    Results/
      FilterPanel.tsx            Sort, pub type, species filters
      ResultCard.tsx             Individual result card
      RightPanel.tsx             Abstract / Gene Details / Links / Related tabs
      SpellingSuggestion.tsx     Spell-correction banner
      YearChart.tsx              Publication year bar chart
  hooks/
    useAuth.ts                   Supabase auth state
    useGeneReport.ts             NCBI Datasets API gene details
    useTaxonSuggest.ts           Organism name autocomplete
    useTheme.ts                  Dark mode persistence
  utils/
    ncbi.ts                      All NCBI E-Utilities functions
    db.ts                        All Supabase data access functions
    supabase.ts                  Supabase client initialisation
  types/
    search.ts                    All TypeScript types
  constants/
    index.ts                     SEARCH_FIELDS, FIELD_TAGS, DATABASES, year constants
supabase/
  migrations/
    20260607200239_biosearch_schema.sql
    20260607201348_biosearch_add_auth.sql
    20260607204159_biosearch_fix_saved_articles_unique.sql
  functions/
    ncbi-proxy/index.ts
    ncbi-health/index.ts`}</CodeBlock>
      <H3>Type Reference — <Code>src/types/search.ts</Code></H3>
      <Table
        headers={['Type', 'Shape']}
        rows={[
          ['SearchField', 'Union of 8 field name strings'],
          ['LogicalOperator', "'AND' | 'OR' | 'NOT'"],
          ['SearchChip', '{ id, term, field, operator }'],
          ['DatabaseInfo', '{ id, label, ncbiDb, color }'],
          ['SearchHistoryEntry', '{ id, chips, selectedDb, dateFrom, dateTo, queryString, timestamp }'],
          ['SortOption', "'relevance' | 'date' | 'pubdate' | 'Author' | 'JournalName'"],
          ['EsearchResult', 'ESearch JSON envelope'],
          ['EsummaryDoc', 'Flexible ESummary document (PubMed + other DBs)'],
          ['EsummaryResult', '{ result: { uids, ...docs } }'],
          ['EspellResult', 'ESpell JSON envelope'],
          ['EinfoResult', 'EInfo JSON envelope including fieldlist'],
          ['ElinkResult', 'ELink JSON envelope'],
        ]}
      />
    </>
  );
}

const SECTION_CONTENT: Record<string, React.ReactNode> = {
  overview:     <SectionOverview />,
  auth:         <SectionAuth />,
  search:       <SectionSearch />,
  results:      <SectionResults />,
  collections:  <SectionCollections />,
  exports:      <SectionExports />,
  'api-status': <SectionApiStatus />,
  'ncbi-api':   <SectionNcbiApi />,
  database:     <SectionDatabase />,
  'edge-fns':   <SectionEdgeFunctions />,
  architecture: <SectionArchitecture />,
};

// ── Main page ─────────────────────────────────────────────────────

export default function DocsPage() {
  const [active, setActive] = useState('overview');

  return (
    <div className="flex h-full">
      {/* ── Left nav ── */}
      <nav className="hidden lg:flex flex-col w-48 shrink-0 border-r border-outline-dim h-full overflow-y-auto bg-surface py-4">
        <p className="px-4 mb-2 text-[10px] font-bold text-on-surface-3 uppercase tracking-widest font-mono">
          Contents
        </p>
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`
                w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-all
                ${isActive
                  ? 'bg-primary/8 text-primary font-semibold border-r-2 border-primary-cta'
                  : 'text-on-surface-2 hover:text-on-surface hover:bg-surface-raised border-r-2 border-transparent'
                }
              `}
            >
              <Icon size={13} className="shrink-0 opacity-70" />
              <span className="text-[12px] leading-snug">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Mobile section picker ── */}
      <div className="lg:hidden px-4 pt-4 w-full">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-outline text-sm text-on-surface focus:outline-none focus:border-primary-cta/60 mb-4"
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 px-6 lg:px-10 py-6 max-w-3xl">
        {SECTION_CONTENT[active]}
      </div>
    </div>
  );
}
