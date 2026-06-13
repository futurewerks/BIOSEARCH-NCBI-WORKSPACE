import type {
  SearchChip,
  EsearchResult,
  EsummaryResult,
  EsummaryDoc,
  EspellResult,
  EinfoResult,
  ElinkResult,
  SortOption,
} from '../types/search';
import { FIELD_TAGS } from '../constants';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

async function ncbiFetch<T>(endpoint: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${BASE}/${endpoint}?${qs}`, { signal });
  if (!res.ok) throw new Error(`${endpoint} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function ncbiFetchText(endpoint: string, params: Record<string, string>): Promise<string> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${BASE}/${endpoint}?${qs}`);
  if (!res.ok) return '';
  return res.text();
}

export function buildQueryString(
  chips: SearchChip[],
  dateFrom: number,
  dateTo: number,
): string {
  if (chips.length === 0) return '';

  const parts = chips.map((chip, i) => {
    const tag = FIELD_TAGS[chip.field];
    const term = tag ? `"${chip.term}"${tag}` : chip.term;
    return i === 0 ? term : `${chip.operator} ${term}`;
  });

  let query = parts.join(' ');

  if (dateFrom !== 1900 || dateTo !== 2025) {
    query += ` AND ${dateFrom}:${dateTo}[pdat]`;
  }

  return query;
}

export async function runEsearch(db: string, query: string): Promise<EsearchResult> {
  return ncbiFetch<EsearchResult>('esearch.fcgi', {
    db, term: query, retmax: '20', usehistory: 'y', retmode: 'json',
  });
}

export async function fetchEsearchCount(
  db: string,
  query: string,
  mindate: string,
  maxdate: string,
): Promise<number> {
  const data = await ncbiFetch<EsearchResult>('esearch.fcgi', {
    db, term: query, datetype: 'pdat', mindate, maxdate,
    retmax: '0', usehistory: 'n', retmode: 'json',
  });
  return parseInt(data.esearchresult.count, 10) || 0;
}

export async function runEsearchSorted(
  db: string,
  query: string,
  sort: SortOption,
  retstart = 0,
  retmax = 20,
): Promise<EsearchResult> {
  return ncbiFetch<EsearchResult>('esearch.fcgi', {
    db, term: query,
    retmax: String(retmax),
    retstart: String(retstart),
    usehistory: 'y',
    sort,
    retmode: 'json',
  });
}

export async function fetchEsummary(
  db: string,
  webenv: string,
  queryKey: string,
  retstart = 0,
  retmax = 20,
): Promise<EsummaryResult> {
  return ncbiFetch<EsummaryResult>('esummary.fcgi', {
    db,
    WebEnv: webenv,
    query_key: queryKey,
    retstart: String(retstart),
    retmax: String(retmax),
    retmode: 'json',
  });
}

export async function fetchEspell(db: string, query: string): Promise<EspellResult> {
  try {
    return await ncbiFetch<EspellResult>('espell.fcgi', { db, term: query, retmode: 'json' });
  } catch {
    return { eSpellResult: { Database: db, Query: query, CorrectedQuery: '', SpelledQuery: '', ERROR: '' } };
  }
}

export async function fetchEinfo(db: string): Promise<EinfoResult> {
  return ncbiFetch<EinfoResult>('einfo.fcgi', { db, retmode: 'json' });
}

export async function fetchElink(dbFrom: string, uid: string): Promise<ElinkResult> {
  return ncbiFetch<ElinkResult>('elink.fcgi', {
    dbfrom: dbFrom, id: uid, cmd: 'llinks', retmode: 'json',
  });
}

export async function fetchAbstract(uid: string, db: string): Promise<string> {
  if (db !== 'pubmed') return '';
  const xmlText = await ncbiFetchText('efetch.fcgi', {
    db, id: uid, rettype: 'abstract', retmode: 'xml',
  });
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const nodes = Array.from(xmlDoc.querySelectorAll('AbstractText'));
  if (nodes.length === 0) return '';
  return nodes
    .map((node) => {
      const label = node.getAttribute('Label');
      const text = node.textContent ?? '';
      return label ? `${label}\n${text}` : text;
    })
    .filter((s) => s.trim())
    .join('\n\n');
}

export async function fetchEsummaryByIds(db: string, uids: string[]): Promise<EsummaryResult> {
  return ncbiFetch<EsummaryResult>('esummary.fcgi', {
    db, id: uids.join(','), retmode: 'json',
  });
}

export async function fetchPmidList(webenv: string, querykey: string, retmax = 10000): Promise<string> {
  return ncbiFetchText('esearch.fcgi', {
    db: 'pubmed', WebEnv: webenv, query_key: querykey,
    retmax: String(retmax), rettype: 'uilist', retmode: 'text',
  });
}

export async function fetchMedlineText(webenv: string, querykey: string, retmax = 10000): Promise<string> {
  return ncbiFetchText('efetch.fcgi', {
    db: 'pubmed', WebEnv: webenv, query_key: querykey,
    retmax: String(retmax), rettype: 'medline', retmode: 'text',
  });
}

export async function fetchRelatedArticles(uid: string): Promise<EsummaryDoc[]> {
  let data: Record<string, unknown>;
  try {
    data = await ncbiFetch<Record<string, unknown>>('elink.fcgi', {
      dbfrom: 'pubmed', db: 'pubmed', id: uid, cmd: 'neighbor_score', retmode: 'json',
    });
  } catch {
    return [];
  }
  const links: string[] =
    (data as { linksets?: { linksetdbs?: { links?: string[] }[] }[] })
      ?.linksets?.[0]?.linksetdbs?.[0]?.links ?? [];
  const topUids = links.filter((id: string) => id !== uid).slice(0, 8);
  if (topUids.length === 0) return [];
  try {
    const summary = await fetchEsummaryByIds('pubmed', topUids);
    return topUids.map((id) => summary.result[id] as EsummaryDoc).filter(Boolean);
  } catch {
    return [];
  }
}
