import { useState, type FormEvent } from 'react';
import { Dna, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AuthActions } from '../hooks/useAuth';

type Mode = 'signin' | 'signup';

interface Props {
  onSignIn:  AuthActions['signIn'];
  onSignUp:  AuthActions['signUp'];
}

export default function AuthModal({ onSignIn, onSignUp }: Props) {
  const [mode,     setMode]     = useState<Mode>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      if (mode === 'signup') {
        const err = await onSignUp(email, password);
        if (err) {
          setError(err);
        } else {
          setSuccess(true);
          setMode('signin');
        }
      } else {
        const err = await onSignIn(email, password);
        if (err) setError(err);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
      {/* Background grid decoration */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-on-surface) 1px, transparent 1px), linear-gradient(90deg, var(--color-on-surface) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm mx-4">
        {/* Card */}
        <div className="bg-surface border border-outline rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-outline-dim">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
                <Dna size={20} className="text-accent" />
              </div>
              <div>
                <h1 className="text-on-surface font-bold text-[16px] leading-none">BioSearch</h1>
                <p className="font-mono text-[9px] text-on-surface-3 tracking-widest uppercase mt-1">
                  NCBI Workspace
                </p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-on-surface-3 text-sm mt-1">
              {mode === 'signin'
                ? 'Sign in to access your searches and collections.'
                : 'Start saving searches and organising your research.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Success banner (sign-up confirmed) */}
            {success && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">
                <CheckCircle2 size={14} className="shrink-0" />
                Account created! You can now sign in.
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-3 pointer-events-none"
                />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@institution.edu"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-raised border border-outline text-on-surface text-sm placeholder:text-on-surface-3 focus:outline-none focus:border-primary-cta focus:ring-2 focus:ring-primary-cta/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold text-on-surface-3 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-3 pointer-events-none"
                />
                <input
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface-raised border border-outline text-on-surface text-sm placeholder:text-on-surface-3 focus:outline-none focus:border-primary-cta focus:ring-2 focus:ring-primary-cta/20 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy || !email.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-cta hover:brightness-110 active:brightness-95 text-on-primary font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary-cta/40 focus:ring-offset-2 focus:ring-offset-surface mt-2"
            >
              {busy ? (
                <><Loader2 size={14} className="animate-spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Mode toggle */}
          <div className="px-8 pb-7 text-center">
            <p className="text-sm text-on-surface-3">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary font-semibold hover:underline focus:outline-none"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-on-surface-3 mt-4">
          Powered by NCBI E-utilities · Data is yours
        </p>
      </div>
    </div>
  );
}
