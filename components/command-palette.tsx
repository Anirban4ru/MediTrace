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
      className="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-[640px] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-base border shadow-ambient bg-card rounded-xl border-4 border-black shadow-ambient outline-none"
    >
      <div className="flex items-center border-b-2 border-black px-4" cmdk-input-wrapper="">
        <Search className="h-5 w-5 text-ink/50" />
        <Command.Input
          placeholder="Search batches by ID, product, or serial..."
          className="flex h-14 w-full bg-transparent px-3 py-3 text-[14px] mono-data placeholder:text-ink/50 focus:outline-none"
        />
      </div>
      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
        <Command.Empty className="py-6 text-center text-[12px] mono-data text-ink/50">
          No results found.
        </Command.Empty>
        
        <Command.Group heading="Batches" className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink/50 p-2">
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
              className="flex cursor-pointer items-center justify-between border-2 border-transparent px-3 py-2 data-[selected='true']:border-black data-[selected='true']:bg-[var(--bg-surface)] outline-none transition-colors"
            >
              <div>
                <div className="mono-data text-[12px] font-bold text-ink">{batch.batchId}</div>
                <div className="text-[11px] text-ink/70">{batch.productName}</div>
              </div>
              <StatusPill status={batch.currentStatus} />
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
