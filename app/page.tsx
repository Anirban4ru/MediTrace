'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  ShieldCheck, ScanLine, LogOut, Lock, AlertTriangle,
  Fingerprint, Activity, ExternalLink, Menu, X, ChevronRight,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { LedgerProvider } from '@/components/ledger-context';
import { ManufacturerDashboard } from '@/components/views/manufacturer-dashboard';
import { TelemetryConsole } from '@/components/views/telemetry-console';
import { PharmacyTerminal } from '@/components/views/pharmacy-terminal';
import { RoleAllocationDashboard } from '@/components/views/role-allocation-dashboard';
import { AuthScreen } from '@/components/auth-screen';
import { SearchFilter } from '@/components/search-filter';
import { AlertsInbox } from '@/components/alerts-inbox';
import { AuditLog } from '@/components/audit-log';
import { useLedger } from '@/components/ledger-context';
import { cn } from '@/lib/utils';
import { RealtimeGraph } from '@/components/landing/realtime-graph';
import { NewsTicker } from '@/components/landing/news-ticker';
import nextDynamic from 'next/dynamic';
import * as Dialog from '@radix-ui/react-dialog';
import { CommandPalette } from '@/components/command-palette';
import { JudgeModeTour } from '@/components/judge-mode-tour';

const GlobeComponent = nextDynamic(
  () => import('@/components/landing/globe').then((m) => m.GlobeComponent),
  { ssr: false }
);

type DashboardRole = 'admin' | 'manufacturer' | 'carrier' | 'inspector' | 'role-allocation';
type ViewState = 'landing' | DashboardRole;

const REQUIRED_ROLES: Record<DashboardRole, string[]> = {
  admin: ['ADMIN_ROLE', 'admin', 'SUPERIOR_HEAD_ROLE'],
  manufacturer: ['MANUFACTURER_ROLE', 'SUPERIOR_HEAD_ROLE'],
  carrier: ['CARRIER_ROLE', 'MANUFACTURER_ROLE', 'SUPERIOR_HEAD_ROLE'],
  inspector: ['INSPECTOR_ROLE', 'ADMIN_ROLE', 'admin', 'SUPERIOR_HEAD_ROLE'],
  'role-allocation': ['SUPERIOR_HEAD_ROLE'],
};

const ROLE_LABELS: Record<DashboardRole, string> = {
  admin: 'Admin',
  manufacturer: 'Manufacturer',
  carrier: 'Carrier',
  inspector: 'Inspector',
  'role-allocation': 'Role Allocation',
};

// ─── Theme toggle hook (persisted, respects prefers-color-scheme) ───
function useThemeToggle() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('meditrace-theme') as 'light' | 'dark' | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolved = stored ?? preferred;
    setThemeState(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('meditrace-theme', next);
  };

  return { theme, toggle };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

function App() {
  const { user, loading, configured, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span className="mono-data text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--ink-muted)' }}>
          Loading MediTrace…
        </span>
      </div>
    );
  }
  if (!configured || !user) return <AuthScreen />;

  return (
    <LedgerProvider>
      <Shell user={user} onSignOut={signOut} />
    </LedgerProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Shell({ user, onSignOut }: {
  user: { email: string; role: string; displayName: string };
  onSignOut: () => void;
}) {
  const [view, setView] = useState<ViewState>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useThemeToggle();
  const isLanding = view === 'landing';

  const navigate = (v: ViewState) => { setView(v); setSidebarOpen(false); };

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CommandPalette onNavigate={navigate} />

      {/* ── Navigation ── */}
      {isLanding ? (
        <MarketingNav user={user} onSignOut={onSignOut} navigate={navigate} theme={theme} toggle={toggle} />
      ) : (
        <DashboardTopBar user={user} navigate={navigate} setSidebarOpen={setSidebarOpen} theme={theme} toggle={toggle} />
      )}

      <div className={cn('flex flex-1', !isLanding && 'pt-14')}>
        {!isLanding && (
          <DashboardSidebar
            user={user} view={view} navigate={navigate}
            isOpen={sidebarOpen} setIsOpen={setSidebarOpen}
            onSignOut={onSignOut}
          />
        )}

        <div className={cn('flex-1 min-w-0', !isLanding && 'xl:pl-60')}>
          {isLanding ? (
            <>
              <LandingHero user={user} navigate={navigate} />
              <LandingProblemSolution />
              <LandingData />
              <SiteFooter onSignOut={onSignOut} />
            </>
          ) : (
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pb-20 pt-6 animate-editorial-fade">
              {!REQUIRED_ROLES[view as DashboardRole]?.includes(user.role) ? (
                <AccessDenied role={user.role} view={view as DashboardRole} />
              ) : (
                <>
                  {view === 'admin' && <AdminDashboard />}
                  {view === 'manufacturer' && <ManufacturerDashboard />}
                  {view === 'carrier' && <TelemetryConsole />}
                  {view === 'inspector' && <PharmacyTerminal />}
                  {view === 'role-allocation' && <RoleAllocationDashboard />}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING — asymmetric, left-anchored, deliberate spacing hierarchy
// ─────────────────────────────────────────────────────────────────────────────
function LandingHero({ user, navigate }: any) {
  return (
    <section style={{ paddingTop: '6rem', paddingBottom: '4rem', borderBottom: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
        {/* Deliberately asymmetric — NOT centered */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-20 items-end">

          {/* Left column — headline */}
          <div>
            {/* Eyebrow — very small, mono, left-anchored */}
            <div className="flex items-center gap-3 mb-8">
              <span className="live-dot" />
              <span className="mono-data label-caps" style={{ color: 'var(--ink-muted)' }}>
                Pharmaceutical Integrity Ledger · Arbitrum L2
              </span>
            </div>

            {/* Primary headline — NOT centered, NOT generic */}
            <h1 className="display-hero mb-6" style={{ color: 'var(--ink)', maxWidth: '18ch' }}>
              The drug supply chain has no memory.
            </h1>

            {/* Supporting — offset from headline with deliberate gap, narrower column */}
            <p style={{
              fontSize: '1.0625rem', lineHeight: '1.65',
              color: 'var(--ink-muted)', maxWidth: '52ch',
              marginBottom: '2.5rem',
            }}>
              MediTrace writes every custody event — from synthesis to dispensary —
              immutably onto blockchain. Spoilage is automatic. Counterfeits are impossible.
              The chain of custody is public and permanent.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('manufacturer')}
                className="btn-primary"
              >
                Open Dashboard
              </button>
              <a
                href="https://meditrace-org.gitbook.io/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Technical Docs <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right column — telemetry stat strip, NOT decorative */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '1px',
            borderTop: '1px solid var(--border)',
          }}>
            {[
              { label: 'Batches on chain', value: '4,821', unit: '' },
              { label: 'Temp violations caught', value: '38', unit: 'this quarter' },
              { label: 'Chain confirmations', value: '< 2 s', unit: 'avg' },
              { label: 'Arbitrum L2 fees', value: '~$0.003', unit: 'per event' },
            ].map(({ label, value, unit }) => (
              <div
                key={label}
                style={{
                  padding: '1rem 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  alignItems: 'baseline',
                }}
              >
                <span className="label-caps">{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <span className="mono-data" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {value}
                  </span>
                  {unit && (
                    <span className="mono-data" style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)', marginLeft: '0.375rem' }}>
                      {unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* News ticker — full width below the split */}
        <div className="mt-10">
          <NewsTicker />
        </div>
      </div>
    </section>
  );
}

function LandingProblemSolution() {
  // Numbered-list format — not icon-blob cards
  const problems = [
    {
      index: '01',
      heading: 'Counterfeit drugs kill.',
      body: 'Up to 20% of pharmaceuticals in developing markets are fake or substandard. Paper-based provenance cannot be verified at the point of dispensing.',
    },
    {
      index: '02',
      heading: 'Cold-chain failures go undetected.',
      body: 'A single temperature excursion during transit renders a vaccine batch ineffective. Without immutable telemetry logs, there is no audit trail and no accountability.',
    },
    {
      index: '03',
      heading: 'Supply chains are opaque by design.',
      body: 'Siloed databases between manufacturer, carrier, and pharmacy make end-to-end traceability structurally impossible under current systems.',
    },
  ];

  const solutions = [
    {
      index: '01',
      heading: 'Every event written to Arbitrum L2.',
      body: 'Minting, transfer, temperature breach, and dispensing are each emitted as on-chain events via audited Solidity contracts. No party can retroactively alter the record.',
    },
    {
      index: '02',
      heading: 'Automatic spoilage via IoT telemetry.',
      body: 'Continuous temperature data is polled from IoT endpoints. Batches exceeding the safe envelope are automatically marked SPOILED by the smart contract — no human intervention required.',
    },
    {
      index: '03',
      heading: 'OpenCV hologram verification at dispensary.',
      body: 'Client-side computer vision compares physical security features against the on-chain hash. Counterfeits fail before they reach the patient.',
    },
  ];

  return (
    <section style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Problems */}
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 py-16 lg:py-20">
        <div className="mb-10" style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <span className="label-caps" style={{ color: 'var(--danger)' }}>The problem</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--border)' }}>
          {problems.map(({ index, heading, body }) => (
            <div
              key={index}
              style={{
                padding: '2rem 1.75rem',
                borderRight: '1px solid var(--border)',
              }}
            >
              <div className="mono-data mb-5" style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
                {index}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.35, marginBottom: '0.75rem', color: 'var(--ink)' }}>
                {heading}
              </h3>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--ink-muted)' }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Solutions */}
      <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 py-16 lg:py-20">
          <div className="mb-10" style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <span className="label-caps" style={{ color: 'var(--success)' }}>The fix</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--border)' }}>
            {solutions.map(({ index, heading, body }) => (
              <div
                key={index}
                style={{
                  padding: '2rem 1.75rem',
                  borderRight: '1px solid var(--border)',
                }}
              >
                <div className="mono-data mb-5" style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
                  {index}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.35, marginBottom: '0.75rem', color: 'var(--ink)' }}>
                  {heading}
                </h3>
                <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--ink-muted)' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingData() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 sm:px-10 py-16 lg:py-20">
      {/* Two-column — globe left, graph right. Not equal weight. */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-12">
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="label-caps mb-6">Global distribution network</div>
          <GlobeComponent />
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="label-caps mb-6">Live telemetry stream</div>
          <RealtimeGraph />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING NAV
// ─────────────────────────────────────────────────────────────────────────────
function MarketingNav({ user, onSignOut, navigate, theme, toggle }: any) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        height: '3.25rem',
        display: 'flex', alignItems: 'center',
      }}>
        <div className="mx-auto max-w-[1440px] w-full px-6 flex items-center justify-between">
          {/* Wordmark */}
          <button
            onClick={() => navigate('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              MediTrace
            </span>
            <span className="live-dot" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {(Object.keys(ROLE_LABELS) as DashboardRole[]).map((role) => {
              if (role === 'role-allocation' && user.role !== 'SUPERIOR_HEAD_ROLE') return null;
              return (
                <button
                  key={role}
                  onClick={() => navigate(role)}
                  style={{
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: 'var(--ink-muted)',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'color 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                >
                  {ROLE_LABELS[role]}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <JudgeModeTour />
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title="Toggle theme"
              style={{
                width: '1.875rem', height: '1.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', cursor: 'pointer',
                color: 'var(--ink-muted)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              {theme === 'dark' ? '○' : '●'}
            </button>
            <button
              onClick={onSignOut}
              className="hidden xl:block"
              style={{
                padding: '0.375rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
                color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Sign out
            </button>
            {/* Mobile hamburger */}
            <button
              className="xl:hidden"
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: '0.25rem' }}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile overlay — marketing site only */}
      {mobileOpen && (
        <div
          className="animate-editorial-fade"
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'var(--bg)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Top bar of overlay */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1.5rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>MediTrace</span>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: '0.25rem' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Large nav links — stacked, left-aligned */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 2.5rem', gap: '0.25rem' }}>
            {(Object.keys(ROLE_LABELS) as DashboardRole[]).map((role) => {
              if (role === 'role-allocation' && user.role !== 'SUPERIOR_HEAD_ROLE') return null;
              return (
                <button
                  key={role}
                  onClick={() => { navigate(role); setMobileOpen(false); }}
                  style={{
                    textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
                    fontWeight: 600, letterSpacing: '-0.025em',
                    color: 'var(--ink-muted)',
                    padding: '0.625rem 0',
                    borderBottom: '1px solid var(--border)',
                    transition: 'color 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                >
                  {ROLE_LABELS[role]}
                </button>
              );
            })}
          </div>

          {/* Footer of overlay */}
          <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <a
              href="https://meditrace-org.gitbook.io/docs"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              Documentation <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={() => { onSignOut(); setMobileOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 500 }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
      {/* Push content below fixed nav */}
      <div style={{ height: '3.25rem' }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD TOPBAR
// ─────────────────────────────────────────────────────────────────────────────
function DashboardTopBar({ user, navigate, setSidebarOpen, theme, toggle }: any) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, height: '3.5rem',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="xl:hidden"
          onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: '0.25rem' }}
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate('landing')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.015em', color: 'var(--ink)' }}
        >
          MediTrace
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* RPC status */}
        <div className="hidden sm:flex items-center gap-2 mono-data"
          style={{ fontSize: '0.625rem', color: 'var(--ink-muted)', padding: '0.25rem 0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <span className="live-dot" style={{ width: 5, height: 5 }} />
          RPC Synced
        </div>

        <JudgeModeTour />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title="Toggle theme"
          style={{
            width: '1.75rem', height: '1.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', cursor: 'pointer',
            color: 'var(--ink-muted)', fontSize: '0.75rem',
            fontFamily: 'var(--font-jetbrains), monospace',
          }}
        >
          {theme === 'dark' ? '○' : '●'}
        </button>

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="hidden sm:block" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>{user.displayName}</div>
            <div className="mono-data" style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
              {user.role.replace('_ROLE', '').replace(/_/g, ' ')}
            </div>
          </div>
          <div style={{
            width: '1.875rem', height: '1.875rem', borderRadius: '50%',
            background: 'var(--accent)', color: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.75rem',
          }}>
            {user.displayName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SIDEBAR — slide-out drawer, dashboard only
// ─────────────────────────────────────────────────────────────────────────────
function DashboardSidebar({ user, view, navigate, isOpen, setIsOpen, onSignOut }: any) {
  const roles = Object.keys(ROLE_LABELS) as DashboardRole[];

  return (
    <>
      {isOpen && (
        <div
          className="xl:hidden animate-editorial-fade"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(42,42,42,0.4)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: '15rem',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        paddingTop: '3.5rem', // below topbar
      }}
        className="xl:translate-x-0"
      >
        {/* Mobile close */}
        <div className="xl:hidden" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)' }}>MediTrace</span>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="label-caps" style={{ marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>Dashboards</div>
          {roles.map((role) => {
            if (role === 'role-allocation' && user.role !== 'SUPERIOR_HEAD_ROLE') return null;
            const active = view === role;
            return (
              <button
                key={role}
                onClick={() => navigate(role)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8375rem', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--bg)' : 'var(--ink-muted)',
                  background: active ? 'var(--accent)' : 'none',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 120ms, color 120ms',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--accent-faint)'; e.currentTarget.style.color = 'var(--ink)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
              >
                {ROLE_LABELS[role]}
                {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <a
            href="https://meditrace-org.gitbook.io/docs"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)',
              fontSize: '0.8rem', color: 'var(--ink-muted)', textDecoration: 'none',
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Docs
          </a>
          <button
            onClick={onSignOut}
            style={{
              textAlign: 'left', width: '100%',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)',
              fontSize: '0.8rem', color: 'var(--danger)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { alerts, batches } = useLedger();
  const unackCount = alerts.filter((a) => !a.acknowledged).length;
  const [subTab, setSubTab] = useState<'alerts' | 'audit' | 'search'>('alerts');
  const isDemo = !process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS === '0xF279C66A37afe2f5d5C029D53655235f14e16204';

  const tabs: { key: 'alerts'|'audit'|'search'; label: string; badge?: number }[] = [
    { key: 'alerts', label: 'Alerts', badge: unackCount },
    { key: 'audit', label: 'Audit Trail' },
    { key: 'search', label: 'Search' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {isDemo && (
        <div style={{
          padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          background: 'var(--danger-faint)', color: 'var(--danger)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        }} className="mono-data">
          Demo mode — hardcoded contract address
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {tabs.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            style={{
              padding: '0.4rem 0.875rem',
              fontSize: '0.775rem', fontWeight: 500,
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              background: subTab === key ? 'var(--accent)' : 'none',
              color: subTab === key ? 'var(--bg)' : 'var(--ink-muted)',
              border: subTab === key ? '1px solid var(--accent)' : '1px solid var(--border)',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 120ms',
            }}
          >
            {label}
            {badge && badge > 0 && (
              <span style={{
                background: 'var(--danger)', color: 'var(--bg)',
                padding: '0 0.375rem', borderRadius: '999px',
                fontSize: '0.6rem', fontWeight: 700, lineHeight: '1.4rem',
              }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {subTab === 'alerts' && <AlertsInbox />}
      {subTab === 'audit' && <AuditLog />}
      {subTab === 'search' && <SearchFilter batches={batches} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS DENIED
// ─────────────────────────────────────────────────────────────────────────────
function AccessDenied({ role, view }: { role: string; view: DashboardRole }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '1rem' }}>
      <div className="chip chip-danger">Access restricted</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
        Insufficient permissions.
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', maxWidth: '42ch', lineHeight: 1.6 }}>
        Your current role <span className="mono-data">{role}</span> does not grant access to the{' '}
        <strong>{ROLE_LABELS[view]}</strong> dashboard.
      </p>
      <a
        href="https://meditrace-org.gitbook.io/docs"
        target="_blank" rel="noopener noreferrer"
        className="btn-ghost"
        style={{ marginTop: '0.5rem', textDecoration: 'none' }}
      >
        View permission model <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER — multi-column, left-anchored, no centered text
// ─────────────────────────────────────────────────────────────────────────────
function SiteFooter({ onSignOut }: { onSignOut: () => void }) {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              MediTrace
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.65, color: 'var(--ink-muted)', maxWidth: '26ch' }}>
              Pharmaceutical integrity ledger. Arbitrum L2. Built for India.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem' }}>
              <span className="live-dot" />
              <span className="mono-data" style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Systems operational
              </span>
            </div>
          </div>

          {/* Legal column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.25rem' }}>Legal</div>
            <LegalDialog title="Terms & Conditions" trigger="Terms">
              <section>
                <h5 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>1. PROPRIETARY SOFTWARE & COPYRIGHT</h5>
                <p>MediTrace is proprietary software. All source code, architecture, smart contracts, and associated intellectual property are strictly protected under the Copyright Act, 1957. Unauthorized reproduction, modification, or distribution is strictly prohibited.</p>
              </section>
              <section>
                <h5 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>2. COMPLIANCE</h5>
                <p>The platform operates in strict adherence to the Drugs and Cosmetics Act, 1940, and the Pharmacy Practice Regulations, 2015. All entities must hold valid CDSCO licenses.</p>
              </section>
              <section>
                <h5 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>3. TELEMETRY & IOT INTEGRITY</h5>
                <p>Data ingested from IoT temperature sensors is written immutably to the Arbitrum Sepolia blockchain. Under the Information Technology Act, 2000, these records serve as legally valid electronic evidence.</p>
              </section>
              <section>
                <h5 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>4. LIABILITY DISCLAIMER</h5>
                <p>MediTrace serves as a cryptographic verification layer. The automated smart contract triggers regarding spoilage are final and mathematically enforced.</p>
              </section>
            </LegalDialog>
            <LegalDialog title="Privacy Policy" trigger="Privacy">
              <section>
                <h5 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>1. DIGITAL PERSONAL DATA PROTECTION ACT (DPDP), 2023</h5>
                <p>MediTrace fully complies with India's DPDP Act, 2023. We collect only the minimum necessary enterprise data required for platform functionality and RBAC enforcement.</p>
              </section>
              <section>
                <h5 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>2. PUBLIC BLOCKCHAIN DISCLOSURE</h5>
                <p>Users acknowledge that supply chain events written to the public Web3 ledger cannot be erased, edited, or modified by any party, including MediTrace.</p>
              </section>
              <section>
                <h5 style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>3. DATA RETENTION</h5>
                <p>To comply with MoHFW auditing standards, off-chain account data is retained for a minimum of 7 years. Blockchain transactions are retained perpetually on the decentralized network.</p>
              </section>
            </LegalDialog>
          </div>

          {/* Contact column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.25rem' }}>Contact</div>
            <a href="mailto:anirban4ru@gmail.com"
              style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}>
              Support
            </a>
            <a href="https://meditrace-org.gitbook.io/docs" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}>
              Documentation
            </a>
          </div>

          {/* Session column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.25rem' }}>Session</div>
            <button
              onClick={onSignOut}
              style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500 }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{
          marginTop: '2.5rem', paddingTop: '1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <span className="mono-data" style={{ fontSize: '0.6875rem', color: 'var(--ink-faint)' }}>
            © 2026 MediTrace. All Rights Reserved. Proprietary Software.
          </span>
          <span className="mono-data" style={{ fontSize: '0.6875rem', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Arbitrum Sepolia Testnet
          </span>
        </div>
      </div>
    </footer>
  );
}

function LegalDialog({ title, trigger, children }: { title: string; trigger: string; children: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--ink-muted)', fontWeight: 400 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}>
          {trigger}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(42,42,42,0.5)',
          backdropFilter: 'blur(4px)',
        }} />
        <Dialog.Content style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 51, width: '90vw', maxWidth: '40rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '2rem',
          maxHeight: '85vh', overflowY: 'auto',
        }}>
          <Dialog.Title style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            {title}
          </Dialog.Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.8125rem', lineHeight: 1.7, color: 'var(--ink-muted)' }}>
            {children}
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Dialog.Close asChild>
              <button className="btn-primary">Acknowledge</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
