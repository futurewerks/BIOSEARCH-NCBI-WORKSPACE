import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

const ENDPOINTS = [
  {
    id: "esearch",
    url: `${BASE}/esearch.fcgi?db=pubmed&term=cancer&retmax=1&retmode=json`,
  },
  {
    id: "esummary",
    url: `${BASE}/esummary.fcgi?db=pubmed&id=11748933&retmode=json`,
  },
  {
    id: "egquery",
    url: `${BASE}/egquery.fcgi?term=cancer&retmode=json`,
  },
  {
    id: "espell",
    url: `${BASE}/espell.fcgi?db=pubmed&term=cancre&retmode=json`,
  },
  {
    id: "einfo",
    url: `${BASE}/einfo.fcgi?db=pubmed&retmode=json`,
  },
  {
    id: "elink",
    url: `${BASE}/elink.fcgi?dbfrom=pubmed&id=11748933&cmd=llinks&retmode=json`,
  },
];

// egquery redirects to an internal NCBI service-mesh hostname — follow: 'manual'
// so we treat any NCBI response (including redirects) as reachable.
async function probeEndpoint(id: string, url: string, delayMs: number) {
  if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - t0;

    // opaqueredirect (type) when redirect: 'manual' intercepts a 3xx — NCBI responded, treat as ok
    const reachable = res.ok || res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400);

    return {
      id,
      ok: reachable,
      ms,
      error: reachable ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    const ms = Date.now() - t0;
    return {
      id,
      ok: false,
      ms,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Stagger probes 200ms apart to stay well under NCBI's 3 req/s rate limit
    const results = await Promise.allSettled(
      ENDPOINTS.map((ep, i) => probeEndpoint(ep.id, ep.url, i * 200))
    );

    const data = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { id: ENDPOINTS[i].id, ok: false, ms: 0, error: "Probe failed" };
    });

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
