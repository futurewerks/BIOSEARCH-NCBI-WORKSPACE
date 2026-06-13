# BioSearch — NCBI Workspace

A biomedical literature and data search interface built on top of NCBI E-Utilities. Authenticated users build precise queries across eight NCBI databases, explore results with full abstract and gene detail views, bookmark articles, organise them into collections, combine past searches, and export results.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-jrndwb9q)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend / Auth / Database | Supabase (PostgreSQL + Edge Functions + Auth) |
| External API | NCBI E-Utilities (`eutils.ncbi.nlm.nih.gov`) |
| Gene Details | NCBI Datasets API (`api.ncbi.nlm.nih.gov/datasets/v2`) |

---

## Authentication

The entire application is gated behind Supabase email/password authentication. Until a session is established, only the `AuthModal` is rendered.

### `useAuth` (`src/hooks/useAuth.ts`)

| Export | Description |
|---|---|
| `user` | Current `User` or `null` |
| `loading` | `true` while the initial session check is in flight |
| `signIn(email, password)` | Signs in with email/password |
| `signUp(email, password)` | Creates a new account (no email confirmation required) |
| `signOut()` | Clears the session |

A full-screen loading splash renders while `loading` is `true` to prevent a flash of the auth form on refresh.

### `AuthModal` (`src/components/AuthModal.tsx`)

Two-tab form (Sign In / Sign Up) with inline error display and loading states.

---

## Application Shell & Navigation

Navigation is managed as in-memory state in `App.tsx` — there is no URL router. Four views:

| View | Component | Description |
|---|---|---|
| `search` | `SearchPage` | Default; build and execute queries |
| `results` | `ResultsPage` | Paginated result list with explorer panel |
| `collections` | `CollectionsPage` | Saved articles, collections, history, exports |
| `api-status` | `ApiStatusPage` | Live NCBI endpoint health dashboard |

### `AppShell` (`src/components/AppShell.tsx`)

Fixed sidebar + scrollable main content. Header shows user email, sign-out, and theme toggle.

### `Sidebar` (`src/components/Sidebar.tsx`)

Navigation links (Search, Collections, API Status) and the `FilterPanel` when the results view is active.

### `useTheme` (`src/hooks/useTheme.ts`)

Persists a `biosearch-dark` key in `localStorage`. Toggles the `dark` class on `document.documentElement`.

---

## Search

### `SearchPage` (`src/pages/SearchPage.tsx`)

Local state: `chips` (search terms), `selectedDb` (active database), `dateFrom`/`dateTo` (year bounds), `history` (last 10 searches from Supabase).

On execute, calls `runEsearch`. On success, persists the entry to history and navigates to Results.

### Query Builder (`src/components/QueryBuilder/`)

| Component | Role |
|---|---|
| `QueryBuilder.tsx` | Manages the list of term rows; add/clear controls |
| `TermRow.tsx` | One condition: operator toggle + field selector + text input (organism autocomplete when field is `Organism`) |
| `OperatorToggle.tsx` | Cycles `AND` → `OR` → `NOT` → `AND` |
| `SearchChip.tsx` | Committed chip rendered as a colour-coded tag with field badge and remove button |
| `ChipInput.tsx` | Standalone input for adding chips |

### Search Fields (`src/constants/index.ts`)

| Field | NCBI Tag |
|---|---|
| All Fields | _(none)_ |
| Title | `[Title]` |
| Abstract | `[Abstract]` |
| MeSH Terms | `[MeSH Terms]` |
| Author | `[Author]` |
| Journal | `[Journal]` |
| Organism | `[Organism]` |
| Gene Name | `[Gene Name]` |

### `buildQueryString` (`src/utils/ncbi.ts`)

Compiles chips and date range into an NCBI query string.

- First chip: `"term"[Field]`
- Subsequent chips: `OPERATOR "term"[Field]`
- Date range (only when narrowed from defaults): appended as `AND YYYY:YYYY[pdat]`

Example: `"BRCA1"[Gene Name] AND "breast cancer"[Title] AND 2015:2024[pdat]`

### `QueryPreview` (`src/components/QueryPreview.tsx`)

Live colour-coded monospace preview of the compiled query. `AND`/`OR`/`NOT` operators are highlighted distinctly.

### `DatabasePills` (`src/components/DatabasePills.tsx`)

Eight pill buttons for selecting the target NCBI database:

| Label | `ncbiDb` | Colour |
|---|---|---|
| PubMed | `pubmed` | Blue |
| PMC | `pmc` | Teal |
| Gene | `gene` | Emerald |
| SNP | `snp` | Amber |
| ClinVar | `clinvar` | Rose |
| Protein | `protein` | Sky |
| Structure | `structure` | Orange |
| Taxonomy | `taxonomy` | Cyan |

### `DateRangeSlider` (`src/components/DateRangeSlider.tsx`)

Dual-thumb slider spanning 1900–2025. When both thumbs are at defaults the date filter is omitted entirely.

### Organism Autocomplete (`src/hooks/useTaxonSuggest.ts`)

Active only when the field is `Organism`. Debounces input 400 ms, then queries the NCBI Taxonomy `esuggest` endpoint. Returns organism name suggestions shown in a dropdown.

### Search History (`src/components/SearchHistory.tsx`)

After each successful search, the entry is saved to Supabase (max 10; duplicates deduplicated by query string). Clicking a history pill restores the full chip array, database, and date range.

---

## Results

### `ResultsPage` (`src/pages/ResultsPage.tsx`)

Receives the initial `EsearchResult` (server-side `WebEnv`/`query_key`), the database, and the query. On mount loads first-page summaries, checks spelling, and fetches saved article state in a single `Promise.all`.

Layout: result feed (left) + sticky `RightPanel` (right, `xl`+ breakpoints only).

#### Pagination

"Load more" calls `fetchEsummary` with an incrementing `retstart` offset using the server-side history keys.

#### Filter reactions

On `FilterState` change, calls `runEsearchSorted` with publication type and species filters appended as NCBI query clauses. The result set resets to page 1 with new session keys.

#### NCBI query translation

The `querytranslation` field from ESearch (NCBI's normalised query interpretation) is shown in monospace below the result count.

#### "View on NCBI"

Direct link to `ncbi.nlm.nih.gov` using the active `WebEnv` and `query_key`.

### `FilterPanel` (`src/components/Results/FilterPanel.tsx`)

| Control | Options |
|---|---|
| Sort | Relevance, Date, Publication Date, Author, Journal |
| Publication type | Journal Article, Review, Clinical Trial, Meta-Analysis, Case Reports, Systematic Review |
| Species | Human, Mouse, Rat, Zebrafish, Drosophila, C. elegans |

### `SpellingSuggestion` (`src/components/Results/SpellingSuggestion.tsx`)

On initial load, `fetchEspell` runs. If the corrected query differs from the original (case-insensitive), a banner appears. Accepting triggers `onReSearch` in `App.tsx`; dismissing hides it for the session.

### `ResultCard` (`src/components/Results/ResultCard.tsx`)

Each card displays: title (linked to NCBI), authors (first 3 + "et al."), journal + year, pub-type badges. Actions:

- **Click card** — fetches and caches the PubMed abstract (XML parsing)
- **Bookmark** — saves/removes the article in Supabase
- **Explore** — fetches ELink data and opens the right panel

### `RightPanel` (`src/components/Results/RightPanel.tsx`)

Four tabs shown when a card is selected:

**Abstract** — Full abstract via `efetch.fcgi` XML. Structured abstracts render with section labels. Per-UID session cache.

**Gene Details** _(Gene database only)_ — Powered by `useGeneReport` (`src/hooks/useGeneReport.ts`), which calls the NCBI Datasets API (`/datasets/v2/gene/id/{id}/dataset_report`). Renders: symbol, description, organism, chromosomes, gene type, Ensembl IDs, genomic location table, gene groups.

**Links** — External URLs from `fetchElink` (`cmd=llinks`), grouped by provider.

**Related Articles** _(PubMed only)_ — Up to 8 articles from `fetchRelatedArticles` (`elink cmd=neighbor_score`). Per-UID session cache.

### `YearChart` (`src/components/Results/YearChart.tsx`)

Visible in the right panel when no article is selected (PubMed only). Fires 13 parallel `fetchEsearchCount` calls — one per year for the last 12 years plus a `<YYYY` bucket — and renders a horizontal bar chart.

---

## Collections & Workspace

### `CollectionsPage` (`src/pages/CollectionsPage.tsx`)

Loads collections, all saved articles, and search history in parallel on mount.

#### Search History

Cards show query string, database badge, and relative timestamp. Actions:

- **Re-run** — re-executes and navigates to results
- **Pin** — marks for combining (max 2 at a time)
- **Delete** — removes the entry

#### Combine Searches

Appears when exactly 2 entries are pinned. A cycling operator button (`AND`/`OR`/`NOT`) sits between the two query strings. "Combine & Search" fires `onReRunSearch` with `(queryA) OPERATOR (queryB)`.

#### Export

Both exports re-run `runEsearch` for the most recent history entry to obtain fresh session keys:

| Format | Mechanism | File |
|---|---|---|
| PMID list | `fetchPmidList` — ESearch `rettype=uilist` | `.txt`, one PMID per line |
| BibTeX | `fetchMedlineText` — EFetch `rettype=medline`, then client-side MEDLINE→BibTeX parser | `.bib`, up to 10,000 records |

The MEDLINE→BibTeX parser (`parseMedlineToBibtex`) extracts: `PMID-`, `TI-`, `JT-`, `DP-` (year), `AU-` (all authors).

#### Collections

Named folders displayed in a grid. Each card shows name, description, article count, creation date. Two-click delete confirmation. Unsorted saved articles appear as a virtual "All Saved Articles" card.

---

## API Status (`src/pages/ApiStatusPage.tsx`)

Calls the `ncbi-health` Edge Function on mount. Displays per-endpoint: name, URL, reachable/unreachable badge, latency in ms, error message if applicable.

---

## NCBI Utility Layer (`src/utils/ncbi.ts`)

All calls go directly from the browser to `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`.

| Function | Endpoint | Purpose |
|---|---|---|
| `buildQueryString(chips, from, to)` | — | Compile chip array + date range into NCBI query |
| `runEsearch(db, query)` | `esearch.fcgi` | Search with `usehistory=y`; returns count + session keys |
| `runEsearchSorted(db, query, sort, retstart, retmax)` | `esearch.fcgi` | Same with sort and pagination offset |
| `fetchEsearchCount(db, query, mindate, maxdate)` | `esearch.fcgi` | Count-only query for year chart |
| `fetchEsummary(db, webenv, queryKey, retstart, retmax)` | `esummary.fcgi` | Fetch summaries from server-side history |
| `fetchEsummaryByIds(db, uids)` | `esummary.fcgi` | Fetch summaries for explicit UID list |
| `fetchEspell(db, query)` | `espell.fcgi` | Spelling correction; never throws |
| `fetchEinfo(db)` | `einfo.fcgi` | Database field and link metadata |
| `fetchElink(dbFrom, uid)` | `elink.fcgi` | External links (`cmd=llinks`) |
| `fetchAbstract(uid, db)` | `efetch.fcgi` | PubMed abstract XML → parsed text |
| `fetchPmidList(webenv, querykey, retmax)` | `esearch.fcgi` | PMID export list (`rettype=uilist`) |
| `fetchMedlineText(webenv, querykey, retmax)` | `efetch.fcgi` | MEDLINE export for BibTeX conversion |
| `fetchRelatedArticles(uid)` | `elink.fcgi` | Up to 8 related PubMed articles (`cmd=neighbor_score`) |

---

## Database Layer (`src/utils/db.ts`)

### Search History

| Function | Description |
|---|---|
| `dbLoadHistory()` | Up to 10 entries, newest first |
| `dbSaveHistory(entry)` | Deduplicates by query string, enforces 10-entry cap |
| `dbClearHistory()` | Deletes all history for the current user |
| `dbDeleteHistoryEntry(id)` | Deletes one entry |

### Collections

| Function | Description |
|---|---|
| `dbLoadCollections()` | All collections, newest first |
| `dbCreateCollection(name, description?)` | Creates and returns a new collection |
| `dbDeleteCollection(id)` | Deletes collection; articles set to `collection_id = null` |

### Saved Articles

| Function | Description |
|---|---|
| `dbLoadSavedArticles(collectionId?)` | All saved articles, optionally filtered by collection |
| `dbSaveArticle(ncbiUid, db, title, summaryJson, collectionId?)` | Upserts (conflict: `user_id, ncbi_uid, db`) |
| `dbRemoveSavedArticle(ncbiUid, db)` | Removes an article |
| `dbIsArticleSaved(ncbiUid, db)` | Returns `true` if already saved |

---

## Database Schema

### `search_history`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `DEFAULT auth.uid()` |
| `query_string` | `text` | Compiled NCBI query |
| `chips` | `jsonb` | Serialised `SearchChip[]` |
| `selected_db` | `text` | e.g. `pubmed` |
| `date_from` | `integer` | Year lower bound |
| `date_to` | `integer` | Year upper bound |
| `created_at` | `timestamptz` | Auto |

### `collections`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `DEFAULT auth.uid()` |
| `name` | `text` | Required |
| `description` | `text` | Optional |
| `created_at` | `timestamptz` | Auto |

### `saved_articles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `DEFAULT auth.uid()` |
| `collection_id` | `uuid` | FK → `collections`, `ON DELETE SET NULL` |
| `ncbi_uid` | `text` | NCBI record UID |
| `db` | `text` | NCBI database name |
| `title` | `text` | Cached from ESummary |
| `summary_json` | `jsonb` | Full ESummary payload |
| `created_at` | `timestamptz` | Auto |
| — | unique | `(user_id, ncbi_uid, db)` |

### Row-Level Security

All three tables have RLS enabled with four separate policies (SELECT / INSERT / UPDATE / DELETE), all scoped to `authenticated` with `auth.uid() = user_id`.

---

## Edge Functions

### `ncbi-proxy` (`supabase/functions/ncbi-proxy/index.ts`)

Pass-through proxy for NCBI E-Utilities. Accepts `POST { endpoint, params }`, appends `NCBI_API_KEY` from environment if set, forwards with a 15-second timeout. Not currently called by the frontend — present for optional API key injection to raise the rate limit from 3 to 10 req/s.

### `ncbi-health` (`supabase/functions/ncbi-health/index.ts`)

Probes six NCBI endpoints (`esearch`, `esummary`, `egquery`, `espell`, `einfo`, `elink`) staggered 200 ms apart (stays under 3 req/s limit). Each probe has an 8-second timeout. `egquery` uses `redirect: 'manual'` and treats 3xx responses as reachable.

Response per endpoint:
```json
{ "id": "esearch", "ok": true, "ms": 142, "error": null }
```

---

## Type Reference (`src/types/search.ts`)

| Type | Shape |
|---|---|
| `SearchField` | Union of 8 field name strings |
| `LogicalOperator` | `'AND' \| 'OR' \| 'NOT'` |
| `SearchChip` | `{ id, term, field, operator }` |
| `DatabaseInfo` | `{ id, label, ncbiDb, color }` |
| `SearchHistoryEntry` | `{ id, chips, selectedDb, dateFrom, dateTo, queryString, timestamp }` |
| `SortOption` | `'relevance' \| 'date' \| 'pubdate' \| 'Author' \| 'JournalName'` |
| `EsearchResult` | ESearch JSON envelope |
| `EsummaryDoc` | Flexible ESummary document (PubMed + other DBs) |
| `EsummaryResult` | `{ result: { uids, ...docs } }` |
| `EspellResult` | ESpell JSON envelope |
| `EinfoResult` | EInfo JSON envelope including `fieldlist` |
| `ElinkResult` | ELink JSON envelope |

---

## Project Structure

```
src/
  App.tsx                        Root; view state + search result state
  pages/
    SearchPage.tsx               Query builder, database selector, search execution
    ResultsPage.tsx              Result list, filters, pagination, right panel
    CollectionsPage.tsx          Workspace: history, collections, exports
    ApiStatusPage.tsx            NCBI endpoint health dashboard
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
    20260607200239_biosearch_schema.sql                 Initial schema
    20260607201348_biosearch_add_auth.sql               Auth migration (session_id -> user_id + RLS)
    20260607204159_biosearch_fix_saved_articles_unique.sql  Unique constraint fix
  functions/
    ncbi-proxy/index.ts          NCBI API key proxy (deployed, unused by frontend)
    ncbi-health/index.ts         Health check prober (used by ApiStatusPage)
```
