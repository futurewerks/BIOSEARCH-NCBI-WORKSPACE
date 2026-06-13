import { Terminal } from 'lucide-react';

interface Props {
  query: string;
}

type Token = { text: string; cls: string };

function tokenize(query: string): Token[] {
  const re = /(\bAND\b|\bOR\b|\bNOT\b|\[[^\]]+\]|"[^"]*"|\S+)/g;
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(query)) !== null) {
    if (m.index > last) {
      tokens.push({ text: query.slice(last, m.index), cls: 'text-on-surface-3' });
    }
    const w = m[0];
    if (w === 'AND')            tokens.push({ text: w, cls: 'text-emerald-500 dark:text-emerald-400 font-bold' });
    else if (w === 'OR')        tokens.push({ text: w, cls: 'text-amber-500 dark:text-amber-400 font-bold' });
    else if (w === 'NOT')       tokens.push({ text: w, cls: 'text-rose-500 dark:text-rose-400 font-bold' });
    else if (w.startsWith('[')) tokens.push({ text: w, cls: 'text-accent' });
    else if (w.startsWith('"')) tokens.push({ text: w, cls: 'text-primary' });
    else                         tokens.push({ text: w, cls: 'text-on-surface' });
    last = m.index + w.length;
  }

  if (last < query.length) {
    tokens.push({ text: query.slice(last), cls: 'text-on-surface-3' });
  }
  return tokens;
}

export default function QueryPreview({ query }: Props) {
  if (!query) return null;

  return (
    <div className="bg-surface-raised/60">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-dim">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-400/70" />
          <div className="w-2 h-2 rounded-full bg-amber-400/70" />
          <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
        </div>
        <Terminal size={10} className="text-on-surface-3 ml-0.5" />
        <span className="font-mono text-[10px] font-semibold text-on-surface-3 tracking-widest uppercase">
          Compiled Query
        </span>
      </div>
      <div className="px-4 py-3 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
        {tokenize(query).map((tok, i) => (
          <span key={i} className={tok.cls}>{tok.text}</span>
        ))}
      </div>
    </div>
  );
}
