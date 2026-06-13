import { BarChart2 } from 'lucide-react';

interface YearEntry { year: string; count: number; }

interface Props {
  data: YearEntry[];
  loading: boolean;
}

export default function YearChart({ data, loading }: Props) {
  const maxCount = data.length > 0 ? Math.max(...data.map((e) => e.count)) : 1;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart2 size={11} className="text-on-surface-3" strokeWidth={2} />
        <p className="font-mono text-[10px] font-bold text-on-surface-3 uppercase tracking-widest">
          Publications by Year
        </p>
      </div>

      {loading ? (
        <div className="space-y-1.5 animate-pulse">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-9 bg-surface-high rounded shrink-0" />
              <div className="flex-1 bg-surface-high rounded-full h-1.5" style={{ opacity: 1 - i * 0.09 }} />
              <div className="h-3 w-5 bg-surface-high rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? null : (
        <div className="space-y-1.5">
          {data.map(({ year, count }) => {
            const pct = Math.max(6, Math.round((count / maxCount) * 100));
            return (
              <div key={year} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-on-surface-3 w-9 shrink-0 text-right">{year}</span>
                <div className="flex-1 bg-surface-raised rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-on-surface-3 w-8 shrink-0 text-right">
                  {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
