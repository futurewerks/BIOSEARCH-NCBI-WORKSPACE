import type { SearchField, DatabaseInfo } from '../types/search';

export const SEARCH_FIELDS: SearchField[] = [
  'All Fields',
  'Title',
  'Abstract',
  'MeSH Terms',
  'Author',
  'Journal',
  'Organism',
  'Gene Name',
];

export const FIELD_TAGS: Record<SearchField, string> = {
  'All Fields': '',
  Title: '[Title]',
  Abstract: '[Abstract]',
  'MeSH Terms': '[MeSH Terms]',
  Author: '[Author]',
  Journal: '[Journal]',
  Organism: '[Organism]',
  'Gene Name': '[Gene Name]',
};

export const DATABASES: DatabaseInfo[] = [
  { id: 'pubmed',    label: 'PubMed',    ncbiDb: 'pubmed',    color: 'blue'   },
  { id: 'pmc',       label: 'PMC',       ncbiDb: 'pmc',       color: 'teal'   },
  { id: 'gene',      label: 'Gene',      ncbiDb: 'gene',      color: 'green'  },
  { id: 'snp',       label: 'SNP',       ncbiDb: 'snp',       color: 'amber'  },
  { id: 'clinvar',   label: 'ClinVar',   ncbiDb: 'clinvar',   color: 'rose'   },
  { id: 'protein',   label: 'Protein',   ncbiDb: 'protein',   color: 'violet' },
  { id: 'structure', label: 'Structure', ncbiDb: 'structure', color: 'orange' },
  { id: 'taxonomy',  label: 'Taxonomy',  ncbiDb: 'taxonomy',  color: 'cyan'   },
];

export const FIELD_BADGE: Record<SearchField, string> = {
  'All Fields':  'bg-slate-100 text-slate-600',
  Title:         'bg-blue-100 text-blue-700',
  Abstract:      'bg-teal-100 text-teal-700',
  'MeSH Terms':  'bg-green-100 text-green-700',
  Author:        'bg-amber-100 text-amber-700',
  Journal:       'bg-orange-100 text-orange-700',
  Organism:      'bg-rose-100 text-rose-700',
  'Gene Name':   'bg-sky-100 text-sky-700',
};

export const HISTORY_KEY = 'biosearch_history';
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2025;
