'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { Hexagon, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export function AuthScreen() {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, displayName || undefined);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div 
      className=" flex min-h-screen items-center justify-center p-4 relative"
      style={{ backgroundImage: 'url(/Background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-[var(--ink)]/40" />
      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="border shadow-sm flex h-12 w-12 items-center justify-center bg-base">
            <img src="/BrandLogo.png" alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="leading-none text-[var(--bg)] drop-shadow-lg">
            <div className="display-heavy text-[24px] sm:text-[28px] uppercase tracking-[0.02em]">MediTrace</div>
            <div className="mono-data text-[10px] sm:text-[12px] uppercase tracking-[0.18em] text-[var(--bg)]/90 mt-1">
              Pharmaceutical Integrity Ledger
            </div>
          </div>
        </div>

        <div className="border shadow-ambient bg-card rounded-xl p-6">
          <div className="mb-5 flex gap-0 border-2 border-black">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${
                mode === 'signin' ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-base text-ink/60 hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${
                mode === 'signup' ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-base text-ink/60 hover:text-ink'
              }`}
            >
              Create Account
            </button>
          </div>

          {!configured && (
            <div className="mb-4 flex items-start gap-2 border-2 border-[var(--danger)] bg-[var(--danger)]/5 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--danger)]" strokeWidth={2.5} />
              <span className="text-[11px] text-[var(--danger)]">
                Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 border-2 border-[var(--danger)] bg-[var(--danger)]/5 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--danger)]" strokeWidth={2.5} />
              <span className="text-[11px] text-[var(--danger)]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
                  Display Name
                </span>
                <div className="flex items-center border-2 border-black bg-base">
                  <User className="ml-3 h-4 w-4 text-ink/40" strokeWidth={2.5} />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 text-[13px] mono-data focus:outline-none"
                    placeholder="Authorized Personnel"
                  />
                </div>
              </div>
            )}
            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
                Email
              </span>
              <div className="flex items-center border-2 border-black bg-base">
                <Mail className="ml-3 h-4 w-4 text-ink/40" strokeWidth={2.5} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-[13px] mono-data focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
                Password
              </span>
              <div className="flex items-center border-2 border-black bg-base">
                <Lock className="ml-3 h-4 w-4 text-ink/40" strokeWidth={2.5} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-[13px] mono-data focus:outline-none"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="border shadow-ambient active:scale-[0.98] transition-transform flex w-full items-center justify-center gap-2 bg-[var(--ink)] py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--bg)] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
              ) : null}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-[var(--bg)]/70 drop-shadow-md">
            Secure Terminal. All ledger operations are cryptographically signed.
          </p>
        </div>
      </div>
    </div>
  );
}
