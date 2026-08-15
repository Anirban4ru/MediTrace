'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BatchStatus } from '@/lib/types';
import { motion } from 'framer-motion';
import { statusBg } from '@/lib/format';

export function StatusPill({
  status,
  className,
}: {
  status: BatchStatus;
  className?: string;
}) {
  const bg = statusBg(status);
  const isLight = status === 'Manufactured';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] mono-data',
        className
      )}
      style={{
        background: bg,
        color: isLight ? 'var(--ink)' : '#fff',
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: isLight ? 'var(--ink)' : '#fff' }}
      />
      {status}
    </span>
  );
}

export function BrutalTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block border border-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] mono-data',
        className
      )}
    >
      {children}
    </span>
  );
}
