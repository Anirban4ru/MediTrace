'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Factory, Truck, ScanLine, Hexagon, Search, Bell, History, LogOut, Lock, ArrowLeft, Info, FileText, AlertTriangle, Fingerprint, Activity, ExternalLink } from 'lucide-react';
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
const GlobeComponent = nextDynamic(() => import('@/components/landing/globe').then(mod => mod.GlobeComponent), { ssr: false });
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { CommandPalette } from '@/components/command-palette';
import { JudgeModeTour } from '@/components/judge-mode-tour';

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
          Loading MediTrace...
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

  const handleNavigate = (targetRole: ViewState) => {
    setView(targetRole);
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      <CommandPalette onNavigate={handleNavigate} />
      <TopBar user={user} onSignOut={onSignOut} view={view} onNavigate={handleNavigate} />
      
      <div className="flex-1 w-full bg-[#F4F4F6]">
        {view === 'landing' ? (
          <div className="mx-auto max-w-[1440px] px-6 py-12 flex flex-col gap-12">
            
            {/* Hero Section */}
            <header className="text-center space-y-6">
              <h1 className="text-5xl md:text-7xl display-heavy uppercase tracking-tighter text-black">
                MediTrace
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
              <div className="hidden md:block w-full">
                <RealtimeGraph />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[1440px] px-6 pb-24 pt-6">
            {!REQUIRED_ROLES[view as DashboardRole]?.includes(user.role) ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
                <Lock className="h-16 w-16 text-[#B91C1C]" strokeWidth={1.5} />
                <h2 className="display-heavy text-3xl uppercase text-black">Access Restricted</h2>
                <p className="font-mono text-sm text-black/60">
                  Your current role ({user.role}) does not have permission to access the {ROLE_LABELS[view as DashboardRole]} dashboard.
                </p>
                <a href="https://meditrace-org.gitbook.io/docs" target="_blank" rel="noopener noreferrer" className="mt-4 border-2 border-black px-6 py-2 font-bold uppercase hover:bg-[#F4F4F6] transition-colors">
                  Return Home
                </a>
              </div>
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

      <Footer />


    </main>
  );
}

function AdminDashboard() {
  const { alerts, batches } = useLedger();
  const unackCount = alerts.filter((a) => !a.acknowledged).length;
  const [subTab, setSubTab] = useState<'alerts' | 'audit' | 'search'>('alerts');
  const isDemo = !process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS === '0xF279C66A37afe2f5d5C029D53655235f14e16204';

  return (
    <div className="space-y-6 relative">
      {isDemo && (
        <div className="sticky top-[72px] z-30 mb-4 bg-[#B91C1C] text-white px-4 py-2 text-center text-[12px] font-bold uppercase tracking-[0.15em] brutal-shadow-sm border-2 border-black">
          DEMO MODE: USING HARDCODED CONTRACT ADDRESS
        </div>
      )}
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
            <div className="brutal-border flex h-9 w-9 items-center justify-center bg-white group-hover:scale-105 transition-transform">
              <img src="/BrandLogo.png" alt="Logo" className="h-6 w-6 object-contain" />
            </div>
            <div className="leading-none">
              <div className="display-heavy text-[16px] uppercase tracking-[0.02em] dark:text-white">
                MediTrace
              </div>
            </div>
          </button>
          
          <nav className="hidden xl:flex items-center gap-1 xl:gap-2 ml-4">
            {(Object.keys(ROLE_LABELS) as DashboardRole[]).map((role) => {
              if (role === 'role-allocation' && user.role !== 'SUPERIOR_HEAD_ROLE') return null;
              return (
              <button
                key={role}
                onClick={() => onNavigate(role)}
                className={cn(
                  "px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-all duration-200 border-2",
                  view === role 
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]" 
                    : "bg-transparent text-black/70 border-transparent hover:text-black hover:bg-black/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            )})}
          </nav>
        </div>
        
        {/* Sync & User Profile */}
        <div className="flex items-center gap-4 xl:gap-8">
          <div className="hidden items-center gap-2 2xl:flex">
            <span className="h-2 w-2 animate-pulse bg-[#0f5132] dark:bg-green-400" />
            <span className="mono-data text-[10px] uppercase tracking-[0.16em] text-black/50 dark:text-white/50">
              RPC Synced · Blk 8,431,902
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 border-r-2 border-black/10 dark:border-white/10 pr-6">
              <div className="text-right">
                <div className="text-[12px] font-black uppercase tracking-widest dark:text-white">{user.displayName}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50 mt-0.5">{user.role.replace('_ROLE', '').replace('_', ' ')}</div>
              </div>
              <div className="h-9 w-9 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[14px] font-black brutal-border">
                {user.displayName.charAt(0)}
              </div>
            </div>

            <div className="flex gap-2">
              <JudgeModeTour />
              <a
                href="https://meditrace-org.gitbook.io/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 h-9 px-3 text-[11px] font-bold uppercase tracking-wider border-2 border-black dark:border-white bg-white dark:bg-black dark:text-white transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                title="View Documentation"
              >
                Docs <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={onSignOut}
                className="flex h-9 w-9 items-center justify-center border-2 border-black dark:border-white bg-[#F4F4F6] dark:bg-black dark:text-white transition-colors hover:bg-[#B91C1C] hover:text-white dark:hover:bg-[#B91C1C] hover:border-[#B91C1C] dark:hover:border-[#B91C1C]"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.5} />
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
        <div className="mono-data text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-black/55">
          © 2026 MediTrace. All Rights Reserved. Proprietary software.<br />
          Contact: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=anirban4ru@gmail.com" target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline">anirban4ru@gmail.com</a>
        </div>
        <div className="flex gap-4">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="mono-data text-[10px] uppercase tracking-[0.18em] text-black font-bold hover:underline underline-offset-4 flex gap-1 items-center">
                <img src="/BrandLogo.png" alt="Logo" className="h-3 w-3 object-contain" /> Terms & Conditions
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white brutal-card p-6 z-50 w-[90vw] max-w-[600px] max-h-[80vh] overflow-y-auto">
                <Dialog.Title className="display-heavy text-lg uppercase mb-4 border-b-2 border-black pb-2">Terms & Conditions</Dialog.Title>
                <div className="space-y-4 text-[12px] mono-data leading-relaxed">
                  <p><strong>1. PROPRIETARY SOFTWARE & COPYRIGHT</strong><br/>MediTrace is proprietary software. All source code, architecture, smart contracts, and associated intellectual property are strictly protected under the Copyright Act, 1957. Unauthorized reproduction, modification, or distribution is strictly prohibited.</p>
                  <p><strong>2. COMPLIANCE WITH INDIAN PHARMACEUTICAL LAWS</strong><br/>The platform operates in strict adherence to the Drugs and Cosmetics Act, 1940, and the Pharmacy Practice Regulations, 2015. All entities interacting with the ledger must hold valid CDSCO (Central Drugs Standard Control Organisation) licenses.</p>
                  <p><strong>3. TELEMETRY & IOT INTEGRITY</strong><br/>Data ingested from IoT temperature sensors is written immutably to the Arbitrum Sepolia blockchain. Under the Information Technology Act, 2000, these cryptographic records serve as legally valid electronic evidence.</p>
                  <p><strong>4. LIABILITY DISCLAIMER</strong><br/>MediTrace serves as a cryptographic verification layer. We are not liable for physical damages, spoiled batches, or carrier negligence. The automated smart contract triggers regarding spoilage are final and mathematically enforced.</p>
                  <p><strong>5. CROSS-BORDER SHIPMENTS</strong><br/>While optimized for the Indian pharmaceutical ecosystem, cross-border logistics tracked on MediTrace must adhere to the World Health Organization (WHO) Good Distribution Practices (GDP).</p>
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
                <img src="/BrandLogo.png" alt="Logo" className="h-3 w-3 object-contain" /> Privacy Policy
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white brutal-card p-6 z-50 w-[90vw] max-w-[600px] max-h-[80vh] overflow-y-auto">
                <Dialog.Title className="display-heavy text-lg uppercase mb-4 border-b-2 border-black pb-2">Privacy Policy</Dialog.Title>
                <div className="space-y-4 text-[12px] mono-data leading-relaxed">
                  <p><strong>1. DIGITAL PERSONAL DATA PROTECTION ACT (DPDP), 2023</strong><br/>MediTrace fully complies with India&apos;s DPDP Act, 2023. We collect only the minimum necessary enterprise data (emails, role designations, and public wallet addresses) required for platform functionality and RBAC enforcement.</p>
                  <p><strong>2. PUBLIC BLOCKCHAIN DISCLOSURE</strong><br/>Users acknowledge that supply chain events, telemetry thresholds, and timestamps are written to a public Web3 ledger (Arbitrum L2). Once deployed, this data cannot be erased, edited, or modified by any party, including MediTrace.</p>
                  <p><strong>3. INFORMATION TECHNOLOGY ACT, 2000</strong><br/>Under Section 43A of the IT Act, we implement reasonable security practices to protect off-chain enterprise identity data (such as emails) stored in our encrypted databases.</p>
                  <p><strong>4. DATA RETENTION & AUDITING</strong><br/>To comply with Ministry of Health and Family Welfare (MoHFW) auditing standards, off-chain account data is retained for a minimum of 7 years. Blockchain transactions are retained perpetually on the decentralized network.</p>
                  <p><strong>5. CONSENT & REVOCATION</strong><br/>By accessing the dashboard, you explicitly consent to these data practices as a Data Principal. While off-chain account deletion requests are honored within 30 days, on-chain ledger entries remain immutable.</p>
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
