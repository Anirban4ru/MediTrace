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
      description: "Registers the product batch on the blockchain, attaching metadata and GS1 serials. This sets the initial cryptographic root of trust.",
      role: "MANUFACTURER_ROLE",
      color: "var(--accent)",
    },
    {
      title: "2. Carrier (IoT Telemetry)",
      description: "Transports the batch while IoT sensors stream live temperature telemetry. Smart contracts automatically spoil the batch if temperatures breach the safe [2.0°C, 8.0°C] band.",
      role: "CARRIER_ROLE",
      color: "var(--danger)",
    },
    {
      title: "3. Inspector (Pharmacy)",
      description: "Upon arrival, the pharmacy uses computer vision (OpenCV.js) to verify physical hologram security features against the on-chain record before dispensing.",
      role: "INSPECTOR_ROLE",
      color: "var(--success)",
    },
    {
      title: "4. Administrator",
      description: "Birds-eye view of all temperature breach alerts, immutable audit logs, and real-time operations across the entire decentralized supply chain.",
      role: "ADMIN_ROLE",
      color: "var(--accent)",
    }
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button 
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-all hover:bg-[var(--accent-faint)]"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
          }}
          title="Interactive Tour"
        >
          <Map className="h-3.5 w-3.5" />
          <span>Tour</span>
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        {/* Solid dimming backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md animate-editorial-fade" />
        
        {/* Opaque Modal Card */}
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden outline-none animate-editorial-fade"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            color: 'var(--ink)',
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
                Judge Mode Interactive Tour
              </span>
            </div>
            <Dialog.Close asChild>
              <button 
                className="p-1 rounded text-xs transition-colors hover:bg-[var(--accent-faint)]"
                style={{ color: 'var(--ink-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          
          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Step Progress Indicators */}
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: i <= step ? 'var(--accent)' : 'var(--border)',
                  }}
                />
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[140px] space-y-3">
              <div className="flex items-center gap-2">
                <div 
                  className="h-2.5 w-2.5 rounded-full shrink-0" 
                  style={{ background: steps[step].color }}
                />
                <h3 className="display-heavy text-xl uppercase tracking-tight" style={{ color: 'var(--ink)' }}>
                  {steps[step].title}
                </h3>
              </div>

              <div 
                className="mono-data inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
                style={{
                  background: 'var(--border-faint)',
                  color: 'var(--ink-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {steps[step].role}
              </div>

              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                {steps[step].description}
              </p>
            </div>

            {/* Footer Controls */}
            <div 
              className="flex items-center justify-between pt-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button 
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="disabled:opacity-30 flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-opacity"
                style={{ color: 'var(--ink)' }}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              
              {step < steps.length - 1 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="btn-primary py-2 px-5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <Dialog.Close asChild>
                  <button 
                    onClick={() => setStep(0)} 
                    className="btn-primary py-2 px-5 text-xs font-bold uppercase tracking-wider rounded-lg"
                  >
                    Finish Tour
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
