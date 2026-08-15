import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base p-6 text-ink selection:bg-[var(--ink)] selection:text-[var(--bg)]">
      {/* Blueprint Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--ink)10_1px,transparent_1px),linear-gradient(to_bottom,var(--ink)10_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="relative z-10 w-full max-w-2xl border-4 border-black bg-[var(--bg-surface)] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] md:p-16">
        <div className="mb-6 inline-flex items-center justify-center border-4 border-black bg-base p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <AlertTriangle className="h-12 w-12 text-ink md:h-16 md:w-16" strokeWidth={1.5} />
        </div>
        
        <h1 className="mb-2 text-7xl font-black uppercase tracking-tighter md:text-9xl">
          404
        </h1>
        
        <div className="mb-10 border-l-8 border-black pl-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight md:text-4xl">
            Asset Not Found
          </h2>
          <p className="mt-3 font-mono text-xs uppercase leading-relaxed text-ink/70 md:text-sm">
            Terminal Error: The requested page, block, or supply chain asset does not exist on this ledger.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link 
            href="/" 
            className="group flex items-center justify-center gap-3 border-4 border-black bg-[var(--ink)] px-8 py-5 text-sm font-bold uppercase tracking-widest text-[var(--bg)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:translate-x-[6px] hover:translate-y-[6px] hover:bg-base hover:text-ink hover:shadow-none focus:outline-none"
          >
            <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
            Return Home
          </Link>
        </div>
        
        <div className="mt-12 border-t-4 border-black pt-6">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase text-ink/50 md:text-xs">
            <span>SYS.ERR.404</span>
            <span>MEDITRACE_NODE_OFFLINE</span>
          </div>
        </div>
      </div>
    </main>
  );
}
