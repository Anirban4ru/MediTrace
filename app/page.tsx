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

// ─── Theme Toggle Hook ───
function useThemeToggle() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('meditrace-theme') as 'light' | 'dark' | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolved = stored || preferred;
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

// ─── Main Shell with Unified TOP NAVIGATION BAR ───
function Shell({ user, onSignOut }: {
  user: { email: string; role: string; displayName: string };
  onSignOut: () => void;
}) {
  const [view, setView] = useState<ViewState>('landing');
  const { theme, toggle } = useThemeToggle();
  const isLanding = view === 'landing';

  const navigate = (v: ViewState) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CommandPalette onNavigate={navigate} />

      {/* TOP NAVIGATION BAR — ALWAYS VISIBLE ON TOP FOR ALL VIEWS */}
      <TopNavigation 
        user={user} 
        currentView={view} 
        onNavigate={navigate} 
        onSignOut={onSignOut} 
        theme={theme} 
        toggleTheme={toggle} 
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16">
        {isLanding ? (
          <>
            <LandingHero navigate={navigate} />
            <LandingProblemSolution />
            <LandingData />
            <SiteFooter onSignOut={onSignOut} />
          </>
        ) : (
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-8 animate-editorial-fade w-full">
            {/* View Breadcrumb / Active Header */}
            <div className="mb-6 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('landing')} 
                  className="text-xs font-semibold uppercase tracking-wider hover:underline"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  ← Home
                </button>
                <span style={{ color: 'var(--border)' }}>/</span>
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
                  {ROLE_LABELS[view as DashboardRole]} Dashboard
                </span>
              </div>
              <div className="mono-data text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                Role: <span className="font-bold" style={{ color: 'var(--ink)' }}>{user.role}</span>
              </div>
            </div>

            {!REQUIRED_ROLES[view as DashboardRole]?.includes(user.role) ? (
              <AccessDenied role={user.role} view={view as DashboardRole} onReturnHome={() => navigate('landing')} />
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
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// UNIFIED TOP NAVIGATION BAR (Top navbar across all views)
// ─────────────────────────────────────────────────────────────
function TopNavigation({
  user,
  currentView,
  onNavigate,
  onSignOut,
  theme,
  toggleTheme,
}: {
  user: { email: string; role: string; displayName: string };
  currentView: ViewState;
  onNavigate: (v: ViewState) => void;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const roles = Object.keys(ROLE_LABELS) as DashboardRole[];

  return (
    <header 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: '3.75rem',
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="mx-auto max-w-[1440px] w-full px-4 sm:px-8 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 group shrink-0"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <img src="/BrandLogo.png" alt="Logo" className="h-5 w-5 object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
            MediTrace
          </span>
          <span className="live-dot" />
        </button>

        {/* Center: TOP NAVIGATION LINKS (Visible for all pages on desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5">
          <button
            onClick={() => onNavigate('landing')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded transition-all",
              currentView === 'landing' 
                ? "bg-[var(--accent)] text-[var(--bg)] shadow-sm" 
                : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--accent-faint)]"
            )}
            style={{ border: currentView === 'landing' ? '1px solid var(--accent)' : '1px solid transparent' }}
          >
            Overview
          </button>

          {roles.map((role) => {
            if (role === 'role-allocation' && user.role !== 'SUPERIOR_HEAD_ROLE') return null;
            const isActive = currentView === role;
            return (
              <button
                key={role}
                onClick={() => onNavigate(role)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                  isActive 
                    ? "bg-[var(--accent)] text-[var(--bg)] shadow-sm" 
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--accent-faint)]"
                )}
                style={{ border: isActive ? '1px solid var(--accent)' : '1px solid transparent' }}
              >
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions, Theme Toggle, Tour, Profile & Sign Out */}
        <div className="flex items-center gap-3">
          {/* RPC Status */}
          <div className="hidden xl:flex items-center gap-1.5 mono-data text-[10px] uppercase tracking-wider px-2 py-1 rounded" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            RPC Synced
          </div>

          <JudgeModeTour />

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
            title="Toggle Light / Dark Mode"
          >
            <span>{theme === 'dark' ? '☀' : '☽'}</span>
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2 pl-1">
            <div className="text-right">
              <div className="text-xs font-bold leading-tight" style={{ color: 'var(--ink)' }}>{user.displayName}</div>
              <div className="mono-data text-[9px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                {user.role.replace('_ROLE', '').replace(/_/g, ' ')}
              </div>
            </div>
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {user.displayName.charAt(0)}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-all"
            style={{
              background: 'var(--danger-faint)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
            }}
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="lg:hidden p-1.5 rounded"
            onClick={() => setMobileOpen(true)}
            style={{ color: 'var(--ink)', border: '1px solid var(--border)' }}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col animate-editorial-fade"
          style={{ background: 'var(--bg)', color: 'var(--ink)' }}
        >
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <img src="/BrandLogo.png" alt="Logo" className="h-6 w-6 object-contain" />
              <span className="font-bold text-base">MediTrace Menu</span>
            </div>
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded"
              style={{ color: 'var(--ink)' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            <div className="label-caps mb-2">Navigation</div>
            <button
              onClick={() => { onNavigate('landing'); setMobileOpen(false); }}
              className="w-full text-left py-3 px-4 text-base font-semibold rounded"
              style={{
                background: currentView === 'landing' ? 'var(--accent)' : 'var(--bg-surface)',
                color: currentView === 'landing' ? 'var(--bg)' : 'var(--ink)',
                border: '1px solid var(--border)',
              }}
            >
              Overview / Home
            </button>

            {roles.map((role) => {
              if (role === 'role-allocation' && user.role !== 'SUPERIOR_HEAD_ROLE') return null;
              const isActive = currentView === role;
              return (
                <button
                  key={role}
                  onClick={() => { onNavigate(role); setMobileOpen(false); }}
                  className="w-full text-left py-3 px-4 text-base font-semibold rounded"
                  style={{
                    background: isActive ? 'var(--accent)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--bg)' : 'var(--ink)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {ROLE_LABELS[role]} Dashboard
                </button>
              );
            })}

            <div className="label-caps mt-6 mb-2">Preferences</div>
            <button
              onClick={() => { toggleTheme(); }}
              className="w-full text-left py-3 px-4 text-sm font-semibold rounded flex items-center justify-between"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            >
              <span>Color Theme</span>
              <span className="font-bold">{theme === 'dark' ? '☀ Dark Mode' : '☽ Light Mode'}</span>
            </button>
          </div>

          <div className="p-6 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Logged in as <strong style={{ color: 'var(--ink)' }}>{user.displayName}</strong> ({user.role})
            </div>
            <button
              onClick={() => { onSignOut(); setMobileOpen(false); }}
              className="w-full py-3 text-sm font-bold uppercase rounded flex items-center justify-center gap-2"
              style={{ background: 'var(--danger)', color: '#fff' }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING PAGE SECTIONS
// ─────────────────────────────────────────────────────────────
function LandingHero({ navigate }: { navigate: (v: ViewState) => void }) {
  return (
    <section className="py-12 sm:py-16" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-16 items-end">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="live-dot" />
              <span className="mono-data label-caps">
                Pharmaceutical Integrity Ledger · Arbitrum L2
              </span>
            </div>

            <h1 className="display-hero mb-6" style={{ color: 'var(--ink)', maxWidth: '18ch' }}>
              The drug supply chain has no memory.
            </h1>

            <p style={{
              fontSize: '1.0625rem', lineHeight: '1.65',
              color: 'var(--ink-muted)', maxWidth: '52ch',
              marginBottom: '2rem',
            }}>
              MediTrace writes every custody event — from synthesis to dispensary —
              immutably onto blockchain. Spoilage is automatic. Counterfeits are impossible.
              The chain of custody is public and permanent.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => navigate('manufacturer')} className="btn-primary">
                Open Manufacturer Terminal
              </button>
              <button onClick={() => navigate('admin')} className="btn-ghost">
                Admin Console
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Batches on chain', value: '4,821', unit: '' },
              { label: 'Temp violations caught', value: '38', unit: 'this quarter' },
              { label: 'Chain confirmations', value: '< 2 s', unit: 'avg' },
              { label: 'Arbitrum L2 fees', value: '~$0.003', unit: 'per event' },
            ].map(({ label, value, unit }) => (
              <div
                key={label}
                style={{
                  padding: '0.875rem 0',
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

        <div className="mt-8">
          <NewsTicker />
        </div>
      </div>
    </section>
  );
}

function LandingProblemSolution() {
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
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-16">
        <div className="mb-8" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span className="label-caps" style={{ color: 'var(--danger)' }}>The Problem</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map(({ index, heading, body }) => (
            <div
              key={index}
              className="p-6 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="mono-data mb-3" style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
                {index}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.35, marginBottom: '0.5rem', color: 'var(--ink)' }}>
                {heading}
              </h3>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Solutions */}
      <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-16">
          <div className="mb-8" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <span className="label-caps" style={{ color: 'var(--success)' }}>The Technological Solution</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solutions.map(({ index, heading, body }) => (
              <div
                key={index}
                className="p-6 rounded-xl"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="mono-data mb-3" style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
                  {index}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.35, marginBottom: '0.5rem', color: 'var(--ink)' }}>
                  {heading}
                </h3>
                <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
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
    <section className="mx-auto max-w-[1440px] px-4 sm:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8">
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="label-caps mb-4">Global Distribution Network</div>
          <GlobeComponent />
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="label-caps mb-4">Live Telemetry Stream</div>
          <RealtimeGraph />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { alerts, batches } = useLedger();
  const unackCount = alerts.filter((a) => !a.acknowledged).length;
  const [subTab, setSubTab] = useState<'alerts' | 'audit' | 'search'>('alerts');
  const isDemo = !process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS === '0xF279C66A37afe2f5d5C029D53655235f14e16204';

  const tabs: { key: 'alerts' | 'audit' | 'search'; label: string; badge?: number }[] = [
    { key: 'alerts', label: 'Alerts', badge: unackCount },
    { key: 'audit', label: 'Audit Trail' },
    { key: 'search', label: 'Search & Ledger' },
  ];

  return (
    <div className="space-y-6">
      {isDemo && (
        <div 
          className="mono-data px-4 py-2 text-xs font-bold uppercase tracking-wider rounded"
          style={{ background: 'var(--danger-faint)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
        >
          Demo Mode · Using Hardcoded Sepolia Contract Address
        </div>
      )}
      
      <div className="flex gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2"
            style={{
              background: subTab === key ? 'var(--accent)' : 'var(--bg-surface)',
              color: subTab === key ? 'var(--bg)' : 'var(--ink-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {label}
            {badge && badge > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--danger)', color: '#fff' }}>
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {subTab === 'alerts' && <AlertsInbox />}
      {subTab === 'audit' && <AuditLog />}
      {subTab === 'search' && <SearchFilter batches={batches} />}
    </div>
  );
}

function AccessDenied({ role, view, onReturnHome }: { role: string; view: DashboardRole; onReturnHome: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
      <div className="p-3 rounded-full" style={{ background: 'var(--danger-faint)', color: 'var(--danger)' }}>
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>Access Restricted</h2>
      <p className="text-sm max-w-md" style={{ color: 'var(--ink-muted)' }}>
        Your account role (<strong style={{ color: 'var(--ink)' }}>{role}</strong>) does not have permission to access the{' '}
        <strong>{ROLE_LABELS[view]}</strong> dashboard.
      </p>
      <button onClick={onReturnHome} className="btn-primary mt-2">
        Return to Overview
      </button>
    </div>
  );
}

function SiteFooter({ onSignOut }: { onSignOut: () => void }) {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-2">
            <div className="font-bold text-base" style={{ color: 'var(--ink)' }}>MediTrace</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Cryptographic supply chain ledger built for pharmaceutical integrity.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="live-dot" />
              <span className="mono-data text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                Systems Operational
              </span>
            </div>
          </div>

          <div>
            <div className="label-caps mb-3">Documentation</div>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
              <li>
                <a href="https://meditrace-org.gitbook.io/docs" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  GitBook Documentation
                </a>
              </li>
              <li>
                <a href="https://sepolia.arbiscan.io" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Arbitrum Explorer
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="label-caps mb-3">Contact</div>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
              <li>
                <a href="mailto:anirban4ru@gmail.com" className="hover:underline">
                  Support & Auditing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="label-caps mb-3">Session</div>
            <button
              onClick={onSignOut}
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{ color: 'var(--danger)' }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 flex items-center justify-between text-[10px] mono-data" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          <div>© 2026 MediTrace · All Rights Reserved.</div>
          <div>Arbitrum Sepolia Testnet</div>
        </div>
      </div>
    </footer>
  );
}
