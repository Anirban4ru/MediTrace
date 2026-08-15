'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useLedger } from '@/components/ledger-context';
import { StatusPill } from '@/components/primitives';
import { Search } from 'lucide-react';

export function CommandPalette({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [open, setOpen] = useState(false);
  const { batches } = useLedger();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-[580px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl outline-none animate-editorial-fade"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        color: 'var(--ink)',
      }}
    >
      <div 
        className="flex items-center px-4" 
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
        cmdk-input-wrapper=""
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} />
        <Command.Input
          placeholder="Search batches by ID, product, or serial..."
          className="flex h-12 w-full bg-transparent px-3 text-xs mono-data focus:outline-none"
          style={{ color: 'var(--ink)' }}
        />
      </div>
      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
        <Command.Empty className="py-8 text-center text-xs mono-data" style={{ color: 'var(--ink-muted)' }}>
          No batches found matching query.
        </Command.Empty>
        
        <Command.Group heading="Batches" className="text-[10px] font-bold uppercase tracking-wider p-2" style={{ color: 'var(--ink-muted)' }}>
          {batches.map((batch) => (
            <Command.Item
              key={batch.batchId}
              value={`${batch.batchId} ${batch.productName} ${batch.serial}`}
              onSelect={() => {
                setOpen(false);
                onNavigate('admin');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('globalSearch', { detail: batch.batchId }));
                }, 100);
              }}
              className="flex cursor-pointer items-center justify-between px-3 py-2.5 rounded-lg outline-none transition-colors hover:bg-[var(--accent-faint)]"
            >
              <div>
                <div className="mono-data text-xs font-bold" style={{ color: 'var(--ink)' }}>{batch.batchId}</div>
                <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{batch.productName}</div>
              </div>
              <StatusPill status={batch.currentStatus} />
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
