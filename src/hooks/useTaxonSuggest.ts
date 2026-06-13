import { useState, useEffect } from 'react';
import type { SearchField } from '../types/search';

export interface TaxonSuggestion {
  sci_name: string;
  common_name: string;
  tax_id: string;
}

export function useTaxonSuggest(term: string, field: SearchField) {
  const [suggestions, setSuggestions] = useState<TaxonSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (field !== 'Organism' || term.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/taxon_suggest/${encodeURIComponent(term)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('non-ok');
        const data = await res.json();
        if (!cancelled) {
          const items: TaxonSuggestion[] = (data.sci_name_and_ids ?? [])
            .slice(0, 8)
            .map((r: { sci_name: string; common_name?: string; tax_id: string }) => ({
              sci_name: r.sci_name,
              common_name: r.common_name ?? '',
              tax_id: r.tax_id,
            }));
          setSuggestions(items);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, field]);

  return { suggestions, loading };
}
