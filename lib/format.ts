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
      return '#000000';
    case 'InTransit':
      return '#102A43';
    case 'Distributed':
      return '#1E3A8A';
    case 'Verified':
      return '#0f5132';
    case 'Spoiled':
      return '#B91C1C';
    default:
      return '#000000';
  }
}

export function statusBg(status: BatchStatus): string {
  switch (status) {
    case 'Manufactured':
      return '#FFFFFF';
    case 'InTransit':
      return '#102A43';
    case 'Distributed':
      return '#1E3A8A';
    case 'Verified':
      return '#0f5132';
    case 'Spoiled':
      return '#B91C1C';
    default:
      return '#FFFFFF';
  }
}

export function fmtScore(n: number): string {
  return (n * 100).toFixed(1) + '%';
}
