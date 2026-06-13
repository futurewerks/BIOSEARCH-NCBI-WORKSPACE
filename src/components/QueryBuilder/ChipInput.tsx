import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import type { SearchField } from '../../types/search';
import { SEARCH_FIELDS } from '../../constants';

interface Props {
  onAdd: (term: string, field: SearchField) => void;
}

export default function ChipInput({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const [field, setField] = useState<SearchField>('All Fields');
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed, field);
    setValue('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    }
  }

  return (
    <div className="flex items-stretch border border-outline rounded-lg overflow-hidden bg-surface-raised focus-within:border-primary-cta focus-within:ring-1 focus-within:ring-primary-cta/30 transition-all">
      <select
        value={field}
        onChange={(e) => setField(e.target.value as SearchField)}
        className="font-mono text-[11px] font-semibold text-on-surface-2 bg-surface-high border-r border-outline px-3 py-2.5 focus:outline-none cursor-pointer hover:bg-surface-highest transition-colors shrink-0 tracking-wide uppercase"
      >
        {SEARCH_FIELDS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a term and press Enter to add..."
        className="flex-1 px-4 py-2.5 text-sm text-on-surface bg-transparent placeholder:text-on-surface-3 focus:outline-none"
      />
      <button
        onClick={commit}
        disabled={!value.trim()}
        className="px-3.5 text-on-surface-3 hover:text-primary hover:bg-surface-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-outline"
        title="Add term"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
