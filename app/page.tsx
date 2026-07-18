'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Factory, Truck, ScanLine, Hexagon, Search, Bell, History, LogOut, Lock, ArrowLeft, Info, FileText, AlertTriangle, Fingerprint, Activity } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { LedgerProvider } from '@/components/ledger-context';
import { ManufacturerDashboard } from '@/components/views/manufacturer-dashboard';
import { TelemetryConsole } from '@/components/views/telemetry-console';
import { PharmacyTerminal } from '@/components/views/pharmacy-terminal';
import { AuthScreen } from '@/components/auth-screen';
import { SearchFilter } from '@/components/search-filter';
import { AlertsInbox } from '@/components/alerts-inbox';
import { AuditLog } from '@/components/audit-log';
import { useLedger } from '@/components/ledger-context';
import { cn } from '@/lib/utils';
import { RealtimeGraph } from '@/components/landing/realtime-graph';
import { NewsTicker } from '@/components/landing/news-ticker';
import { GlobeComponent } from '@/components/landing/globe';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

type DashboardRole = 'admin' | 'manufacturer' | 'carrier' | 'inspector';
type ViewState = 'landing' | DashboardRole;

const PASSWORDS: Record<DashboardRole, string> = {
  admin: 'admin123',
  manufacturer: 'mfg123',
  carrier: 'car123',
  inspector: 'ins123',
};

const ROLE_LABELS: Record<DashboardRole, string> = {
  admin: 'Admin',
  manufacturer: 'Manufacturer',
  carrier: 'Carrier',
  inspector: 'Inspector',
};

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
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F6]">
        <div className="mono-data text-[12px] uppercase tracking-[0.2em] text-black/50">
          Loading PharmaTrace...
        </div>
      </div>
    );
  }

  if (!configured || !user) {
    return <AuthScreen />;
  }

  return (
    <LedgerProvider>
      <Shell user={user} onSignOut={signOut} />
    </LedgerProvider>
  );
}

function Shell({
  user,
  onSignOut,
}: {
  user: { email: string; role: string; displayName: string };
  onSignOut: () => void;
}) {
  const [view, setView] = useState<ViewState>('landing');
  const [sessions, setSessions] = useState<Record<DashboardRole, number>>({} as any);
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<DashboardRole | null>(null);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState(false);

  const handleNavigate = (targetRole: ViewState) => {
    if (view !== 'landing') {
      setSessions((prev) => ({ ...prev, [view as DashboardRole]: Date.now() }));
    }

    if (targetRole === 'landing') {
      setView('landing');
      return;
    }

    const lastActive = sessions[targetRole];
    const isExpired = !lastActive || (Date.now() - lastActive > 5 * 60 * 1000);

    if (isExpired) {
      setPendingRole(targetRole);
      setPwdInput('');
      setPwdError(false);
      setShowPasswordModal(true);
    } else {
      setView(targetRole);
    }
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingRole && pwdInput === PASSWORDS[pendingRole]) {
      setSessions((prev) => ({ ...prev, [pendingRole]: Date.now() }));
      setView(pendingRole);
      setShowPasswordModal(false);
    } else {
      setPwdError(true);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      <TopBar user={user} onSignOut={onSignOut} view={view} onNavigate={handleNavigate} />
      
      <div className="flex-1 w-full bg-[#F4F4F6]">
        {view === 'landing' ? (
          <div className="mx-auto max-w-[1440px] px-6 py-12 flex flex-col gap-12">
            
            {/* Hero Section */}
            <header className="text-center space-y-6">
              <h1 className="text-5xl md:text-7xl display-heavy uppercase tracking-tighter text-black">
                PharmaTrace
              </h1>
              <p className="text-2xl md:text-3xl font-bold italic tracking-wide text-black/70">
                &quot;Securing India&apos;s Health.&quot;
              </p>
            </header>
            
            <NewsTicker />

            {/* The Problem & Solution Grid */}
            <div className="flex flex-col gap-12 w-full">
              {/* The Problem */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b-4 border-black pb-4">
                  <AlertTriangle className="h-10 w-10 text-[#B91C1C]" strokeWidth={2.5} />
                  <h2 className="display-heavy text-4xl uppercase tracking-tight">The Problem</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="brutal-card bg-white p-6 flex flex-col gap-4 border-t-8 border-t-[#B91C1C]">
                    <h3 className="display-heavy text-xl uppercase">Counterfeit Epidemic</h3>
                    <p className="font-mono text-[13px] leading-relaxed text-black/80">Up to 20% of drugs in developing markets are fake, costing lives.</p>
                  </div>
                  <div className="brutal-card bg-white p-6 flex flex-col gap-4 border-t-8 border-t-[#B91C1C]">
                    <h3 className="display-heavy text-xl uppercase">Cold-Chain Failures</h3>
                    <p className="font-mono text-[13px] leading-relaxed text-black/80">A single temperature excursion ruins vaccines, risking patients.</p>
                  </div>
                  <div className="brutal-card bg-white p-6 flex flex-col gap-4 border-t-8 border-t-[#B91C1C]">
                    <h3 className="display-heavy text-xl uppercase">Opaque Supply Chains</h3>
                    <p className="font-mono text-[13px] leading-relaxed text-black/80">Paper trails and siloed databases make auditing impossible.</p>
                  </div>
                </div>
              </div>

              {/* Our Solution */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b-4 border-black pb-4">
                  <ShieldCheck className="h-10 w-10 text-[#0f5132]" strokeWidth={2.5} />
                  <h2 className="display-heavy text-4xl uppercase tracking-tight">Our Solution</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="brutal-card bg-black text-white p-6 flex flex-col gap-4 border-t-8 border-t-[#0f5132]">
                    <Fingerprint className="h-8 w-8 text-white" strokeWidth={2.5} />
                    <h3 className="display-heavy text-xl uppercase">Immutable Provenance</h3>
                    <p className="font-mono text-[13px] leading-relaxed text-white/80">Smart contracts mint an unforgeable audit trail on Arbitrum L2.</p>
                  </div>
                  <div className="brutal-card bg-black text-white p-6 flex flex-col gap-4 border-t-8 border-t-[#0f5132]">
                    <Activity className="h-8 w-8 text-white" strokeWidth={2.5} />
                    <h3 className="display-heavy text-xl uppercase">IoT Telemetry</h3>
                    <p className="font-mono text-[13px] leading-relaxed text-white/80">Continuous temperature tracking automatically spoils breached batches.</p>
                  </div>
                  <div className="brutal-card bg-black text-white p-6 flex flex-col gap-4 border-t-8 border-t-[#0f5132]">
                    <ScanLine className="h-8 w-8 text-white" strokeWidth={2.5} />
                    <h3 className="display-heavy text-xl uppercase">Vision Verification</h3>
                    <p className="font-mono text-[13px] leading-relaxed text-white/80">Client-side OpenCV.js verifies physical holograms against the blockchain.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              <GlobeComponent />
              <RealtimeGraph />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[1440px] px-6 pb-24 pt-6">
            {view === 'admin' && <AdminDashboard />}
            {view === 'manufacturer' && <ManufacturerDashboard />}
            {view === 'carrier' && <TelemetryConsole />}
            {view === 'inspector' && <PharmacyTerminal />}
          </div>
        )}
      </div>

      <Footer />

      {/* Password Modal */}
      <Dialog.Root open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 brutal-card bg-white p-6 z-50 w-[90vw] max-w-[400px]">
            <Dialog.Title className="display-heavy text-xl uppercase mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication Required
            </Dialog.Title>
            <Dialog.Description className="text-[12px] uppercase tracking-[0.1em] text-black/60 mb-4">
              Please enter the password to access the {pendingRole && ROLE_LABELS[pendingRole]} dashboard.
            </Dialog.Description>
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pwdInput}
                  onChange={(e) => setPwdInput(e.target.value)}
                  className={cn(
                    "w-full brutal-border px-4 py-2 bg-[#F4F4F6] focus:outline-none focus:ring-2 focus:ring-black mono-data",
                    pwdError && "border-[#B91C1C] text-[#B91C1C]"
                  )}
                  placeholder="Password"
                  autoFocus
                />
                {pwdError && <span className="text-[#B91C1C] text-[10px] uppercase font-bold mt-1 block">Incorrect password</span>}

                {pendingRole && (
                  <div className="mt-4 flex items-start gap-3 border-2 border-black bg-[#F4F4F6] p-3 brutal-shadow-sm">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-black" strokeWidth={2} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black">
                        Demo Mode Active
                      </span>
                      <span className="mt-0.5 font-mono text-[11px] text-black/70">
                        Use test passcode: <strong className="text-black text-[13px] tracking-wider bg-black/10 px-1 py-0.5 rounded-sm">{PASSWORDS[pendingRole]}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border-2 border-black px-4 py-2 font-bold uppercase text-[12px] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white px-4 py-2 font-bold uppercase text-[12px] border-2 border-black hover:bg-black/90 brutal-shadow-sm brutal-press"
                >
                  Unlock
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}

function AdminDashboard() {
  const { alerts, batches } = useLedger();
  const unackCount = alerts.filter((a) => !a.acknowledged).length;
  const [subTab, setSubTab] = useState<'alerts' | 'audit' | 'search'>('alerts');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b-2 border-black pb-2">
        <button onClick={() => setSubTab('alerts')} className={cn("px-4 py-2 font-bold uppercase text-[12px] flex gap-2 items-center", subTab === 'alerts' ? "bg-black text-white" : "border-2 border-black hover:bg-[#F4F4F6]")}>
          Alerts {unackCount > 0 && <span className="bg-[#B91C1C] text-white px-1.5 py-0.5 text-[10px]">{unackCount}</span>}
        </button>
        <button onClick={() => setSubTab('audit')} className={cn("px-4 py-2 font-bold uppercase text-[12px]", subTab === 'audit' ? "bg-black text-white" : "border-2 border-black hover:bg-[#F4F4F6]")}>Audit Trail</button>
        <button onClick={() => setSubTab('search')} className={cn("px-4 py-2 font-bold uppercase text-[12px]", subTab === 'search' ? "bg-black text-white" : "border-2 border-black hover:bg-[#F4F4F6]")}>Search & Filter</button>
      </div>
      {subTab === 'alerts' && <AlertsInbox />}
      {subTab === 'audit' && <AuditLog />}
      {subTab === 'search' && <SearchFilter batches={batches} />}
    </div>
  );
}

function TopBar({
  user,
  onSignOut,
  view,
  onNavigate
}: {
  user: { email: string; role: string; displayName: string };
  onSignOut: () => void;
  view: ViewState;
  onNavigate: (view: ViewState) => void;
}) {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-40 border-b-2 border-black bg-white dark:bg-black dark:border-white/20">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-3 group text-left">
            <div className="brutal-border flex h-9 w-9 items-center justify-center bg-black dark:bg-white dark:text-black text-white group-hover:scale-105 transition-transform">
              <Hexagon className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="display-heavy text-[16px] uppercase tracking-[0.02em] dark:text-white">
                PharmaTrace
              </div>
            </div>
          </button>
          
          <nav className="hidden md:flex items-center gap-2 border-l-2 border-black dark:border-white/20 pl-8">
            {(Object.keys(ROLE_LABELS) as DashboardRole[]).map((role) => (
              <button
                key={role}
                onClick={() => onNavigate(role)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] border-2 transition-colors",
                  view === role 
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                    : "bg-white text-black border-transparent hover:border-black dark:bg-black dark:text-white dark:hover:border-white"
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Sync & User Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-2 lg:flex">
            <span className="h-2 w-2 animate-pulse bg-[#0f5132] dark:bg-green-400" />
            <span className="mono-data text-[10px] uppercase tracking-[0.16em] text-black/60 dark:text-white/60">
              RPC Synced · Blk 8,431,902
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right dark:text-white">
              <div className="text-[11px] font-bold uppercase">{user.displayName}</div>
              <div className="mono-data text-[9px] text-black/50 dark:text-white/50">{user.email}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-8 w-8 items-center justify-center border-2 border-black dark:border-white bg-[#F4F4F6] dark:bg-black dark:text-white transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                title="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Moon className="h-3.5 w-3.5" strokeWidth={2.5} />}
              </button>
              <button
                onClick={onSignOut}
                className="flex h-8 w-8 items-center justify-center border-2 border-black dark:border-white bg-[#F4F4F6] dark:bg-black dark:text-white transition-colors hover:bg-[#B91C1C] hover:text-white dark:hover:bg-[#B91C1C]"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t-2 border-black bg-[#F4F4F6] mt-auto">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="mono-data text-[10px] uppercase tracking-[0.18em] text-black/55">
          PharmaTrace · Solidity ^0.8.20 · Next.js 14 · Supabase · OpenCV.js
        </div>
        <div className="flex gap-4">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="mono-data text-[10px] uppercase tracking-[0.18em] text-black font-bold hover:underline underline-offset-4 flex gap-1 items-center">
                <FileText className="h-3 w-3" /> Terms & Conditions
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white brutal-card p-6 z-50 w-[90vw] max-w-[600px] max-h-[80vh] overflow-y-auto">
                <Dialog.Title className="display-heavy text-lg uppercase mb-4 border-b-2 border-black pb-2">Terms & Conditions</Dialog.Title>
                <div className="space-y-4 text-[12px] mono-data leading-relaxed">
                  <p><strong>1. Introduction</strong><br/>Welcome to PharmaTrace. By accessing this platform, you agree to be bound by these terms. This platform operates primarily within the jurisdiction of India.</p>
                  <p><strong>2. Compliance with Indian Laws</strong><br/>Users must comply with the Drugs and Cosmetics Act, 1940, and the Information Technology Act, 2000 of India. Any data uploaded must meet the compliance standards of the CDSCO.</p>
                  <p><strong>3. Liability</strong><br/>PharmaTrace acts as an immutable ledger. We are not liable for spoiled batches resulting from carrier negligence. Smart contract status changes are final and cannot be appealed.</p>
                  <p><strong>4. International Scope</strong><br/>While India is the first priority jurisdiction, cross-border shipments must comply with WHO GDP (Good Distribution Practices) guidelines.</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <Dialog.Close asChild>
                    <button className="bg-black text-white px-4 py-2 font-bold uppercase text-[12px] border-2 border-black brutal-shadow-sm brutal-press">Close</button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="mono-data text-[10px] uppercase tracking-[0.18em] text-black font-bold hover:underline underline-offset-4 flex gap-1 items-center">
                <Info className="h-3 w-3" /> Privacy Policy
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white brutal-card p-6 z-50 w-[90vw] max-w-[600px] max-h-[80vh] overflow-y-auto">
                <Dialog.Title className="display-heavy text-lg uppercase mb-4 border-b-2 border-black pb-2">Privacy Policy</Dialog.Title>
                <div className="space-y-4 text-[12px] mono-data leading-relaxed">
                  <p><strong>1. Data Collection</strong><br/>We collect telemetry data, carrier identities, and geolocation data. This information is written to the Arbitrum Sepolia L2 blockchain and is inherently public.</p>
                  <p><strong>2. Digital Personal Data Protection Act (DPDP), 2023</strong><br/>PharmaTrace complies with India&apos;s DPDP Act. Enterprise user data (emails, display names) are stored securely and processed solely for supply-chain authentication.</p>
                  <p><strong>3. Data Retention</strong><br/>Blockchain transactions are permanent. Off-chain data in Supabase may be retained for 7 years to comply with Indian pharmaceutical auditing requirements.</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <Dialog.Close asChild>
                    <button className="bg-black text-white px-4 py-2 font-bold uppercase text-[12px] border-2 border-black brutal-shadow-sm brutal-press">Close</button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </footer>
  );
}
