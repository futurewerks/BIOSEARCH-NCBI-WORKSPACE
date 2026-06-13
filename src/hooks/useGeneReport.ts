import { useState, useEffect } from 'react';

interface GenomicRange {
  begin: string;
  end: string;
  orientation: string;
}

interface GenomicLocation {
  sequenceName: string;
  genomicRange: GenomicRange;
}

interface Annotation {
  assemblyName: string;
  assemblyAccession: string;
  genomicLocations: GenomicLocation[];
}

interface GeneGroup {
  id: string;
  method: string;
}

export interface GeneReport {
  geneId: string;
  symbol: string;
  description: string;
  taxName: string;
  commonName: string;
  chromosomes: string[];
  type: string;
  ensemblGeneIds: string[];
  geneGroups: GeneGroup[];
  annotations: Annotation[];
}

export function useGeneReport(geneId: string | null, db: string) {
  const [data, setData] = useState<GeneReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (db !== 'gene' || !geneId) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setData(null);

    fetch(
      `https://api.ncbi.nlm.nih.gov/datasets/v2/gene/id/${encodeURIComponent(geneId)}/dataset_report`,
      { signal: controller.signal },
    )
      .then((res) => {
        if (!res.ok) throw new Error('non-ok');
        return res.json();
      })
      .then((json) => {
        const gene = json?.reports?.[0]?.gene;
        if (!gene) throw new Error('no gene');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapAnnotation = (a: any) => ({
          assemblyName: a.assembly_name ?? '',
          assemblyAccession: a.assembly_accession ?? '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          genomicLocations: (a.genomic_locations ?? []).map((loc: any) => ({
            sequenceName: loc.sequence_name ?? '',
            genomicRange: {
              begin: loc.genomic_range?.begin ?? '',
              end: loc.genomic_range?.end ?? '',
              orientation: loc.genomic_range?.orientation ?? '',
            },
          })),
        });
        setData({
          geneId: gene.gene_id ?? '',
          symbol: gene.symbol ?? '',
          description: gene.description ?? '',
          taxName: gene.taxname ?? '',
          commonName: gene.common_name ?? '',
          chromosomes: gene.chromosomes ?? [],
          type: gene.type ?? '',
          ensemblGeneIds: gene.ensembl_gene_ids ?? [],
          geneGroups: gene.gene_groups ?? [],
          annotations: (gene.annotations ?? []).map(mapAnnotation),
        });
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [geneId, db]);

  return { data, loading, error };
}
