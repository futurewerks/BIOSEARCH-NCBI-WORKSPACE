import { Sun, Moon } from 'lucide-react';

interface Props {
  dark: boolean;
  toggle: () => void;
}

export default function ThemeToggle({ dark, toggle }: Props) {
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-outline text-on-surface-2 hover:text-on-surface hover:bg-surface-raised transition-all"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
