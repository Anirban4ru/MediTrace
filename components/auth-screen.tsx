'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

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
      className="flex min-h-screen items-center justify-center p-4 relative"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="w-full max-w-md relative z-10 animate-editorial-fade">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <img src="/BrandLogo.png" alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <div className="display-heavy text-[24px] sm:text-[26px] tracking-tight" style={{ color: 'var(--ink)' }}>
              MediTrace
            </div>
            <div className="mono-data text-[10px] sm:text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--ink-muted)' }}>
              Pharmaceutical Integrity Ledger
            </div>
          </div>
        </div>

        {/* Card */}
        <div 
          className="rounded-xl p-6 sm:p-8"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(74,74,74,0.06)',
          }}
        >
          {/* Mode Switcher */}
          <div className="mb-6 flex gap-1 p-1 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className="flex-1 py-2 text-[12px] font-bold uppercase tracking-[0.1em] rounded transition-all"
              style={{
                background: mode === 'signin' ? 'var(--accent)' : 'transparent',
                color: mode === 'signin' ? 'var(--bg)' : 'var(--ink-muted)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className="flex-1 py-2 text-[12px] font-bold uppercase tracking-[0.1em] rounded transition-all"
              style={{
                background: mode === 'signup' ? 'var(--accent)' : 'transparent',
                color: mode === 'signup' ? 'var(--bg)' : 'var(--ink-muted)',
              }}
            >
              Create Account
            </button>
          </div>

          {!configured && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded" style={{ background: 'var(--danger-faint)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium">
                Supabase not configured. Please set credentials in .env
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded" style={{ background: 'var(--danger-faint)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
                  Display Name
                </label>
                <div 
                  className="flex items-center rounded px-3 py-2" 
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <User className="h-4 w-4 mr-2.5 shrink-0" style={{ color: 'var(--ink-muted)' }} />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-transparent text-[13px] mono-data focus:outline-none"
                    style={{ color: 'var(--ink)' }}
                    placeholder="Authorized Personnel"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
                Email
              </label>
              <div 
                className="flex items-center rounded px-3 py-2" 
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <Mail className="h-4 w-4 mr-2.5 shrink-0" style={{ color: 'var(--ink-muted)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-[13px] mono-data focus:outline-none"
                  style={{ color: 'var(--ink)' }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
                Password
              </label>
              <div 
                className="flex items-center rounded px-3 py-2" 
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <Lock className="h-4 w-4 mr-2.5 shrink-0" style={{ color: 'var(--ink-muted)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-[13px] mono-data focus:outline-none"
                  style={{ color: 'var(--ink)' }}
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-2.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In to Ledger' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--ink-muted)' }}>
            Secure Terminal · Zero-Trust Cryptographic Ledger
          </p>
        </div>
      </div>
    </div>
  );
}
