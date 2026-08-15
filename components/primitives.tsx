'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BatchStatus } from '@/lib/types';
import { motion } from 'framer-motion';
import { statusBg, statusColor } from '@/lib/format';

export function StatusPill({
  status,
  className,
}: {
  status: BatchStatus;
  className?: string;
}) {
  const color = statusColor(status);
  const bg = statusBg(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] mono-data rounded',
        className
      )}
      style={{
        background: bg,
        color: color,
        border: '1px solid var(--border)',
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
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
        'inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-[0.1em] mono-data rounded',
        className
      )}
      style={{
        background: 'var(--border-faint)',
        color: 'var(--ink-muted)',
        border: '1px solid var(--border)',
      }}
    >
      {children}
    </span>
  );
}
