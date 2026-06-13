import { useRef } from 'react'; // custom dual-range
import { MIN_YEAR, MAX_YEAR } from '../constants';

interface Props {
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}

const RANGE = MAX_YEAR - MIN_YEAR;

export default function DateRangeSlider({ from, to, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeThumb = useRef<'from' | 'to' | null>(null);

  const fromPct = ((from - MIN_YEAR) / RANGE) * 100;
  const toPct   = ((to   - MIN_YEAR) / RANGE) * 100;

  function yearAt(e: React.PointerEvent): number {
    const rect = trackRef.current!.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return Math.round(MIN_YEAR + pct * RANGE);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const year = yearAt(e);
    // Route to whichever thumb is closer; break ties toward "from"
    activeThumb.current = Math.abs(year - from) <= Math.abs(year - to) ? 'from' : 'to';
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    move(year);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeThumb.current) return;
    move(yearAt(e));
  }

  function handlePointerUp() {
    activeThumb.current = null;
  }

  function move(year: number) {
    if (activeThumb.current === 'from') {
      onChange(Math.max(MIN_YEAR, Math.min(year, to)), to);
    } else {
      onChange(from, Math.max(from, Math.min(year, MAX_YEAR)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface-2">Publication Year</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-surface-raised border border-outline text-on-surface">
            {from}
          </span>
          <span className="text-on-surface-3 text-xs">—</span>
          <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-surface-raised border border-outline text-on-surface">
            {to}
          </span>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative h-8 flex items-center select-none cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Track */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-surface-high" />
        {/* Active fill */}
        <div
          className="absolute h-1 rounded-full bg-primary-cta"
          style={{ left: `${fromPct}%`, right: `${100 - toPct}%` }}
        />
        {/* From thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-surface border-2 border-primary-cta shadow-md"
          style={{ left: `${fromPct}%`, transform: 'translateX(-50%)' }}
        />
        {/* To thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-surface border-2 border-primary-cta shadow-md"
          style={{ left: `${toPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="flex justify-between font-mono text-[10px] text-on-surface-3">
        <span>{MIN_YEAR}</span>
        <span>{MAX_YEAR}</span>
      </div>
    </div>
  );
}
