import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Wifi } from 'lucide-react';

const HEALTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ncbi-health`;
const ANON_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

interface EndpointDef {
  id: string;
  name: string;
  path: string;
  description: string;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: 'esearch',
    name: 'ESearch',
    path: '/esearch.fcgi',
    description: 'Text search across NCBI databases; returns IDs and history keys.',
  },
  {
    id: 'esummary',
    name: 'ESummary',
    path: '/esummary.fcgi',
    description: 'Returns document summaries for a list of UIDs.',
  },
  {
    id: 'egquery',
    name: 'EGQuery',
    path: '/egquery.fcgi',
    description: 'Global cross-database query; returns hit counts per database.',
  },
  {
    id: 'espell',
    name: 'ESpell',
    path: '/espell.fcgi',
    description: 'Spelling suggestions for search terms.',
  },
  {
    id: 'einfo',
    name: 'EInfo',
    path: '/einfo.fcgi',
    description: 'Database statistics, field names, and link info.',
  },
  {
    id: 'elink',
    name: 'ELink',
    path: '/elink.fcgi',
    description: 'Cross-database links and external provider URLs.',
  },
];

type StatusState = 'idle' | 'checking' | 'ok' | 'error';

interface EndpointStatus {
  state: StatusState;
  ms: number | null;
  checkedAt: Date | null;
  error: string | null;
}

type StatusMap = Record<string, EndpointStatus>;

const INIT_STATUS: EndpointStatus = { state: 'idle', ms: null, checkedAt: null, error: null };

function relativeTime(d: Date): string {
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  return `${Math.round(secs / 60)}m ago`;
}

export default function ApiStatusPage() {
  const [statuses, setStatuses] = useState<StatusMap>(() =>
    Object.fromEntries(ENDPOINTS.map((e) => [e.id, { ...INIT_STATUS }]))
  );
  const [tick, setTick] = useState(0);
  const [checking, setChecking] = useState(false);

  const checkAll = useCallback(async () => {
    if (checking) return;
    setChecking(true);

    setStatuses(
      Object.fromEntries(
        ENDPOINTS.map((e) => [e.id, { state: 'checking', ms: null, checkedAt: null, error: null }]),
      ),
    );

    try {
      const res = await fetch(HEALTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'Apikey': ANON_KEY,
        },
      });

      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);

      const results: { id: string; ok: boolean; ms: number; error: string | null }[] =
        await res.json();

      const now = new Date();
      setStatuses(
        Object.fromEntries(
          results.map((r) => [
            r.id,
            {
              state: (r.ok ? 'ok' : 'error') as StatusState,
              ms: r.ms,
              checkedAt: now,
              error: r.error,
            },
          ]),
        ),
      );
    } catch (err) {
      const now = new Date();
      const errMsg = err instanceof Error ? err.message : 'Request failed';
      setStatuses(
        Object.fromEntries(
          ENDPOINTS.map((e) => [
            e.id,
            { state: 'error' as StatusState, ms: null, checkedAt: now, error: errMsg },
          ]),
        ),
      );
    } finally {
      setChecking(false);
    }
  }, [checking]);

  useEffect(() => {
    checkAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);
  void tick;

  const okCount      = Object.values(statuses).filter((s) => s.state === 'ok').length;
  const totalChecked = Object.values(statuses).filter((s) => s.state !== 'idle' && s.state !== 'checking').length;

  const overallColor =
    totalChecked === 0 ? 'text-on-surface-3' :
    okCount === totalChecked ? 'text-emerald-500' :
    okCount === 0 ? 'text-danger' :
    'text-caution';

  const overallBg =
    totalChecked === 0 ? 'bg-surface-raised border-outline' :
    okCount === totalChecked ? 'bg-emerald-500/10 border-emerald-500/30' :
    okCount === 0 ? 'bg-danger/10 border-danger/30' :
    'bg-caution/10 border-caution/30';

  const overallLabel =
    totalChecked === 0 ? 'Checking…' :
    okCount === totalChecked ? 'All Systems Operational' :
    okCount === 0 ? 'All Endpoints Down' :
    'Partial Outage';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-on-surface font-bold text-xl">API Status</h2>
          <p className="text-on-surface-3 text-sm mt-0.5">
            Live health of NCBI E-Utilities connected to BioSearch
          </p>
        </div>
        <button
          onClick={checkAll}
          disabled={checking}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-outline bg-surface text-sm font-medium text-on-surface-2 hover:text-on-surface hover:bg-surface-raised transition-all disabled:opacity-40"
        >
          <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${overallBg}`}>
        <Wifi size={18} className={overallColor} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${overallColor}`}>{overallLabel}</p>
          <p className="text-on-surface-3 text-xs mt-0.5">
            {okCount} of {ENDPOINTS.length} endpoints reachable
          </p>
        </div>
        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${overallBg} ${overallColor}`}>
          {okCount}/{ENDPOINTS.length}
        </span>
      </div>

      <div className="space-y-3">
        {ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.id} ep={ep} status={statuses[ep.id]} />
        ))}
      </div>

      <p className="text-on-surface-3 text-xs text-center pb-2">
        NCBI E-Utilities —{' '}
        <span className="font-mono">https://eutils.ncbi.nlm.nih.gov/entrez/eutils</span>
      </p>
    </div>
  );
}

function StatusDot({ state }: { state: StatusState }) {
  if (state === 'checking') return <RefreshCw size={14} className="text-primary animate-spin" />;
  if (state === 'ok')       return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (state === 'error')    return <XCircle size={14} className="text-danger" />;
  return <AlertCircle size={14} className="text-on-surface-3" />;
}

function EndpointCard({ ep, status }: { ep: EndpointDef; status: EndpointStatus }) {
  const { state, ms, checkedAt, error } = status;

  const borderColor =
    state === 'ok'    ? 'border-emerald-500/25' :
    state === 'error' ? 'border-danger/25' :
    'border-outline';

  const msColor =
    ms === null ? '' :
    ms < 500    ? 'text-emerald-500' :
    ms < 1500   ? 'text-caution' :
    'text-danger';

  return (
    <div className={`flex items-start gap-4 px-5 py-4 rounded-xl border bg-surface shadow-card transition-colors ${borderColor}`}>
      <div className="mt-0.5">
        <StatusDot state={state} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-on-surface">{ep.name}</span>
          <span className="font-mono text-[10px] text-on-surface-3 bg-surface-raised border border-outline px-1.5 py-0.5 rounded">
            {ep.path}
          </span>
          {state === 'error' && error && (
            <span className="text-[10px] font-medium text-danger bg-danger/10 border border-danger/20 px-1.5 py-0.5 rounded">
              {error}
            </span>
          )}
        </div>
        <p className="text-on-surface-3 text-xs mt-1 leading-relaxed">{ep.description}</p>
      </div>
      <div className="shrink-0 text-right space-y-1">
        {ms !== null && (
          <p className={`font-mono text-xs font-semibold ${msColor}`}>{ms} ms</p>
        )}
        {checkedAt && (
          <p className="text-on-surface-3 text-[10px] flex items-center gap-1 justify-end">
            <Clock size={9} />
            {relativeTime(checkedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
