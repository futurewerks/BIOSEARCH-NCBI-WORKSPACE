import { useState, useEffect } from 'react';

export interface GenomeReport {
  accession: string;
  organismName: string;
  commonName: string;
  taxId: number;
  assemblyName: string;
  assemblyLevel: string;
  assemblyStatus: string;
  releaseDate: string;
  submitter: string;
  refseqCategory: string;
  synonym: string;
  totalChromosomes: number;
  totalSequenceLength: string;
  contigN50: number;
  scaffoldN50: number;
  gcPercent: number;
  annotationReleaseDate: string;
  geneCountTotal: number;
  geneCountProteinCoding: number;
  geneCountNonCoding: number;
  geneCountPseudogene: number;
}

export function useGenomeReport(taxName: string | null, db: string) {
  const [data, setData] = useState<GenomeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (db !== 'gene' || !taxName) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setData(null);

    const url =
      `https://api.ncbi.nlm.nih.gov/datasets/v2/genome/taxon/${encodeURIComponent(taxName)}/dataset_report` +
      `?filters.refseq_only=true&filters.assembly_level=chromosome&page_size=1`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('non-ok');
        return res.json();
      })
      .then((json) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = (json?.reports as any[])?.[0];
        if (!r) throw new Error('no report');

        const ai = r.assembly_info ?? {};
        const as_ = r.assembly_stats ?? {};
        const ann = r.annotation_info ?? {};
        const gc = ann.stats?.gene_counts ?? {};

        setData({
          accession: r.accession ?? '',
          organismName: r.organism?.organism_name ?? '',
          commonName: r.organism?.common_name ?? '',
          taxId: r.organism?.tax_id ?? 0,
          assemblyName: ai.assembly_name ?? '',
          assemblyLevel: ai.assembly_level ?? '',
          assemblyStatus: ai.assembly_status ?? '',
          releaseDate: ai.release_date ?? '',
          submitter: ai.submitter ?? '',
          refseqCategory: ai.refseq_category ?? '',
          synonym: ai.synonym ?? '',
          totalChromosomes: Number(as_.total_number_of_chromosomes ?? 0),
          totalSequenceLength: as_.total_sequence_length ?? '0',
          contigN50: Number(as_.contig_n50 ?? 0),
          scaffoldN50: Number(as_.scaffold_n50 ?? 0),
          gcPercent: Number(as_.gc_percent ?? 0),
          annotationReleaseDate: ann.release_date ?? '',
          geneCountTotal: Number(gc.total ?? 0),
          geneCountProteinCoding: Number(gc.protein_coding ?? 0),
          geneCountNonCoding: Number(gc.non_coding ?? 0),
          geneCountPseudogene: Number(gc.pseudogene ?? 0),
        });
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [taxName, db]);

  return { data, loading, error };
}
