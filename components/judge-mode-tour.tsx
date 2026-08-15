'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronRight, ChevronLeft, Map, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export function JudgeModeTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "1. Manufacturer",
      description: "Registers the product batch on the blockchain, attaching metadata and GS1 serials. This sets the initial root of trust.",
      role: "MANUFACTURER_ROLE",
      color: "bg-[var(--accent-faint)]",
    },
    {
      title: "2. Carrier (IoT)",
      description: "Transports the batch while IoT sensors stream live temperature data to Supabase. Smart contracts automatically spoil the batch if temperatures breach the safe band.",
      role: "CARRIER_ROLE",
      color: "bg-[var(--danger-faint)]",
    },
    {
      title: "3. Inspector (Pharmacy)",
      description: "Upon arrival, the pharmacy uses computer vision (OpenCV) to verify the physical hologram against the blockchain record. They submit a final verification hash on-chain.",
      role: "INSPECTOR_ROLE",
      color: "bg-[var(--success-faint)]",
    },
    {
      title: "4. Administrator",
      description: "Has a birds-eye view of all alerts, audits, and real-time operations across the entire supply chain.",
      role: "ADMIN_ROLE",
      color: "bg-[var(--danger)]",
    }
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 border-2 border-black dark:border-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] hover:bg-[var(--ink)] hover:text-[var(--bg)] dark:hover:bg-base dark:hover:text-ink transition-colors">
          <Map className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tour
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--ink)]/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 bg-base border shadow-ambient bg-card rounded-xl p-0 outline-none">
          <div className="flex items-center justify-between border-b-2 border-black bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4" strokeWidth={2.5} />
              <span className="text-[14px] font-bold uppercase tracking-[0.1em]">Judge Mode Tour</span>
            </div>
            <Dialog.Close asChild>
              <button className="text-ink/50 hover:text-ink">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="p-6">
            <div className="mb-6 flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className={cn("h-2 flex-1 border-2 border-black", i <= step ? "bg-[var(--ink)]" : "bg-base")} />
              ))}
            </div>

            <div className="min-h-[160px]">
              <div className="mb-2 flex items-center gap-2">
                <div className={cn("h-3 w-3 border border-black", steps[step].color)} />
                <h3 className="display-heavy text-[20px] uppercase">{steps[step].title}</h3>
              </div>
              <div className="mono-data mb-4 inline-block bg-[var(--ink)] px-2 py-0.5 text-[10px] uppercase text-[var(--bg)]">
                {steps[step].role}
              </div>
              <p className="mono-data text-[13px] leading-relaxed text-ink/80">
                {steps[step].description}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t-2 border-black pt-4">
              <button 
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="disabled:opacity-50 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] hover:underline"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              
              {step < steps.length - 1 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1 border-2 border-black bg-[var(--ink)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--bg)] hover:bg-base hover:text-ink"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <Dialog.Close asChild>
                  <button onClick={() => setStep(0)} className="flex items-center gap-1 border-2 border-black bg-[var(--ink)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--bg)] hover:bg-base hover:text-ink">
                    Finish
                  </button>
                </Dialog.Close>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
