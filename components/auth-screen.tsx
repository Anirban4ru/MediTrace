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
      className="grid-canvas flex min-h-screen items-center justify-center p-4 relative"
      style={{ backgroundImage: 'url(/PharmaTrace.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="brutal-border brutal-shadow-sm flex h-12 w-12 items-center justify-center bg-white">
            <img src="/PharmaTrace.svg" alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="leading-none">
            <div className="display-heavy text-[22px] uppercase tracking-[0.02em]">PharmaTrace</div>
            <div className="mono-data text-[11px] uppercase tracking-[0.18em] text-black/55">
              Pharmaceutical Integrity Ledger
            </div>
          </div>
        </div>

        <div className="brutal-card p-6">
          <div className="mb-5 flex gap-0 border-2 border-black">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${
                mode === 'signin' ? 'bg-black text-white' : 'bg-white text-black/60 hover:text-black'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${
                mode === 'signup' ? 'bg-black text-white' : 'bg-white text-black/60 hover:text-black'
              }`}
            >
              Create Account
            </button>
          </div>

          {!configured && (
            <div className="mb-4 flex items-start gap-2 border-2 border-[#B91C1C] bg-[#B91C1C]/5 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#B91C1C]" strokeWidth={2.5} />
              <span className="text-[11px] text-[#B91C1C]">
                Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 border-2 border-[#B91C1C] bg-[#B91C1C]/5 p-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#B91C1C]" strokeWidth={2.5} />
              <span className="text-[11px] text-[#B91C1C]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/70">
                  Display Name
                </span>
                <div className="flex items-center border-2 border-black bg-white">
                  <User className="ml-3 h-4 w-4 text-black/40" strokeWidth={2.5} />
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
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/70">
                Email
              </span>
              <div className="flex items-center border-2 border-black bg-white">
                <Mail className="ml-3 h-4 w-4 text-black/40" strokeWidth={2.5} />
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
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/70">
                Password
              </span>
              <div className="flex items-center border-2 border-black bg-white">
                <Lock className="ml-3 h-4 w-4 text-black/40" strokeWidth={2.5} />
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
              className="brutal-border brutal-shadow brutal-press flex w-full items-center justify-center gap-2 bg-black py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
              ) : null}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.12em] text-black/45">
            Secure Terminal. All ledger operations are cryptographically signed.
          </p>
        </div>
      </div>
    </div>
  );
}
