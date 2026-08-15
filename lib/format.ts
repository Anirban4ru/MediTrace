import { BatchStatus } from './types';

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtTemp(t: number): string {
  return `${t.toFixed(1)}°C`;
}

export function statusColor(status: BatchStatus): string {
  switch (status) {
    case 'Manufactured':
      return 'var(--ink-muted)';
    case 'InTransit':
      return 'var(--accent)';
    case 'Distributed':
      return 'var(--accent)';
    case 'Verified':
      return 'var(--success)';
    case 'Spoiled':
      return 'var(--danger)';
    default:
      return 'var(--ink)';
  }
}

export function statusBg(status: BatchStatus): string {
  switch (status) {
    case 'Manufactured':
      return 'var(--border-faint)';
    case 'InTransit':
      return 'var(--accent-faint)';
    case 'Distributed':
      return 'var(--accent-faint)';
    case 'Verified':
      return 'var(--success-faint)';
    case 'Spoiled':
      return 'var(--danger-faint)';
    default:
      return 'var(--border-faint)';
  }
}

export function fmtScore(n: number): string {
  return (n * 100).toFixed(1) + '%';
}
