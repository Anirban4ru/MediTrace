'use client';

import { useLedger } from '@/components/ledger-context';
import { History, Package, Truck, ShieldCheck, AlertTriangle, ScanLine, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generatePDFReport } from '@/lib/pdf-report';

const EVENT_ICONS: Record<string, React.ElementType> = {
  provisioned: Package,
  dispatched: Truck,
  telemetry_logged: Truck,
  spoiled: AlertTriangle,
  verified: ShieldCheck,
  scanned: ScanLine,
};

export function AuditLog() {
  const { auditLog, getBatch } = useLedger();

  return (
    <div className="border shadow-ambient bg-card rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" strokeWidth={2.5} />
          <h3 className="display-heavy text-[13px] uppercase">Audit Trail</h3>
        </div>
        <span className="mono-data text-[10px] uppercase tracking-[0.14em] text-ink/55">
          {auditLog.length} events
        </span>
      </div>

      <div className="max-h-[520px] overflow-y-auto">
        {auditLog.length === 0 ? (
          <div className="p-6 text-center text-[11px] uppercase tracking-[0.14em] text-ink/50">
            No audit events recorded yet.
          </div>
        ) : (
          <ul>
            {auditLog.map((entry) => {
              const Icon = EVENT_ICONS[entry.event_type] ?? History;
              const isSpoiled = entry.event_type === 'spoiled';
              return (
                <li
                  key={entry.id}
                  className={cn(
                    'border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--bg-surface)]',
                    isSpoiled && 'bg-[var(--danger)]/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--border)]',
                        isSpoiled ? 'bg-[var(--danger)] text-[var(--bg)]' : 'bg-[var(--bg-surface)]'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-[11px] font-bold uppercase tracking-[0.1em]',
                            isSpoiled && 'text-[var(--danger)]'
                          )}
                        >
                          {entry.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="mono-data text-[9px] text-ink/40">
                          {new Date(entry.created_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {entry.batch_id && (
                        <div className="mono-data text-[10px] text-ink/50">{entry.batch_id}</div>
                      )}
                      <div className="mono-data text-[10px] text-ink/60">
                        by {entry.actor}
                      </div>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {Object.entries(entry.details).map(([k, v]) => (
                            <span key={k} className="mono-data text-[9px] text-ink/45">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {entry.batch_id && (
                      <button
                        onClick={() => {
                          const b = getBatch(entry.batch_id!);
                          if (b) generatePDFReport(b);
                        }}
                        className="flex h-7 shrink-0 items-center gap-1 border border-[var(--border)] bg-[var(--bg-surface)] px-2 transition-colors hover:bg-[var(--ink)] hover:text-[var(--bg)]"
                        title="Download PDF Report"
                      >
                        <FileText className="h-3 w-3" strokeWidth={2.5} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em]">PDF</span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
