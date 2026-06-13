export type SearchField =
  | 'All Fields'
  | 'Title'
  | 'Abstract'
  | 'MeSH Terms'
  | 'Author'
  | 'Journal'
  | 'Organism'
  | 'Gene Name';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface SearchChip {
  id: string;
  term: string;
  field: SearchField;
  operator: LogicalOperator;
}

export interface DatabaseInfo {
  id: string;
  label: string;
  ncbiDb: string;
  color: string;
}

export interface SearchHistoryEntry {
  id: string;
  chips: SearchChip[];
  selectedDb: string;
  dateFrom: number;
  dateTo: number;
  queryString: string;
  timestamp: number;
}

export interface EsearchResult {
  esearchresult: {
    count: string;
    retmax: string;
    retstart: string;
    querykey: string;
    webenv: string;
    idlist: string[];
    translationset: Array<{ from: string; to: string }>;
    querytranslation: string;
  };
}

// ESummary — flexible enough to cover PubMed and other dbs
export interface EsummaryDoc {
  uid: string;
  title?: string;
  fulltitle?: string;
  authors?: Array<{ name: string; authtype?: string }>;
  source?: string;
  fulljournalname?: string;
  pubdate?: string;
  epubdate?: string;
  pubtype?: string[];
  // Mesh terms (PubMed-specific)
  attributes?: string[];
  // Gene/SNP/other dbs use different keys — we cast loosely
  [key: string]: unknown;
}

export interface EsummaryResult {
  result: {
    uids: string[];
    [uid: string]: EsummaryDoc | string[];
  };
}

// ESpell
export interface EspellResult {
  eSpellResult: {
    Database: string;
    Query: string;
    CorrectedQuery: string;
    SpelledQuery: string;
    ERROR: string;
  };
}

// EInfo — field and link lists for a database
export interface EinfoField {
  Name: string;
  FullName: string;
  Description: string;
  TermCount: string;
  IsDate: string;
  IsNumerical: string;
  SingleToken: string;
  Hierarchy: string;
  IsHidden: string;
  IsRangable: string;
  IsTruncatable: string;
}

export interface EinfoResult {
  einforesult: {
    dbinfo: {
      dbname: string;
      menuname: string;
      description: string;
      fieldlist: EinfoField[];
    };
  };
}

// ELink
export interface ElinkObjUrl {
  Url: string;
  IconUrl?: string;
  LinkName: string;
  SubjectType: string[];
  Category: string;
  Attribute: string[];
  Provider: {
    Name: string;
    NameAbbr: string;
    Id: string;
    Url: string;
    IconUrl: string;
  };
}

export interface ElinkLinkSet {
  dbfrom: string;
  ids: string[];
  idurllist?: Array<{
    objurl: ElinkObjUrl[];
    id: string;
  }>;
  idchecklist?: unknown;
}

export interface ElinkResult {
  linksets: ElinkLinkSet[];
}

// Parsed ELink link group for display
export interface LinkGroup {
  db: string;
  urls: Array<{ id: string; url: string; name: string; provider: string }>;
}

// Sort options
export type SortOption = 'relevance' | 'date' | 'pubdate' | 'Author' | 'JournalName';
