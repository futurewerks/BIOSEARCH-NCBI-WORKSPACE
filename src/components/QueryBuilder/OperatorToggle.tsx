import type { LogicalOperator } from '../../types/search';

interface Props {
  value: LogicalOperator;
  onChange: (op: LogicalOperator) => void;
}

const CYCLE: LogicalOperator[] = ['AND', 'OR', 'NOT'];

const STYLES: Record<LogicalOperator, string> = {
  AND: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600',
  OR:  'bg-amber-400 text-white border-amber-400 hover:bg-amber-500',
  NOT: 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600',
};

export default function OperatorToggle({ value, onChange }: Props) {
  function cycle() {
    const idx = CYCLE.indexOf(value);
    onChange(CYCLE[(idx + 1) % CYCLE.length]);
  }

  return (
    <button
      onClick={cycle}
      title={`${value} — click to cycle`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide transition-all ${STYLES[value]}`}
    >
      {value}
    </button>
  );
}
