'use client';

import { useState } from 'react';

import { useLedger } from '@/components/ledger-context';
import { AlertTriangle, Bell, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AlertsInbox() {
  const { alerts, acknowledgeAlert, fileAudit } = useLedger();
  const unack = alerts.filter((a) => !a.acknowledged);
  const acked = alerts.filter((a) => a.acknowledged);

  return (
    <div className="border shadow-ambient bg-card rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" strokeWidth={2.5} />
          <h3 className="display-heavy text-[13px] uppercase">Spoilage Alerts</h3>
          {unack.length > 0 && (
            <span className="border-2 border-[var(--danger)] bg-[var(--danger)] px-1.5 text-[10px] font-bold uppercase text-[var(--bg)]">
              {unack.length} new
            </span>
          )}
        </div>
        <span className="mono-data text-[10px] uppercase tracking-[0.14em] text-ink/55">
          {alerts.length} total
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <Check className="h-8 w-8 text-[var(--success)]" strokeWidth={2} />
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink/50">
              No alerts — all batches within safe parameters
            </span>
          </div>
        ) : (
          <ul>
            {unack.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAck={() => acknowledgeAlert(alert.id)}
                onFileAudit={
                  alert.severity === 'critical'
                    ? async (commentary?: string) => {
                        const finalMessage = commentary ? `${alert.message} | Commentary: ${commentary}` : alert.message;
                        await fileAudit(alert.id, alert.batch_id, finalMessage);
                      }
                    : undefined
                }
              />
            ))}
            {unack.length > 0 && acked.length > 0 && (
              <li className="border-y-2 border-[var(--border)] bg-[var(--bg-surface)] px-4 py-1.5">
                <span className="mono-data text-[9px] uppercase tracking-[0.16em] text-ink/45">
                  Acknowledged
                </span>
              </li>
            )}
            {acked.slice(0, 10).map((alert) => (
              <AlertItem key={alert.id} alert={alert} acknowledged />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AlertItem({
  alert,
  onAck,
  onFileAudit,
  acknowledged,
}: {
  alert: {
    id: string;
    batch_id: string;
    alert_type: string;
    message: string;
    severity: string;
    acknowledged: boolean;
    created_at: string;
  };
  onAck?: () => void;
  onFileAudit?: (comment?: string) => Promise<void>;
  acknowledged?: boolean;
}) {
  const isCritical = alert.severity === 'critical';
  const isWarning = alert.severity === 'warning';
  const [isFiling, setIsFiling] = useState(false);
  const [commentary, setCommentary] = useState("");
  const [showCommentary, setShowCommentary] = useState(false);

  const handleFileAudit = async () => {
    if (!onFileAudit) return;
    if (!showCommentary) {
      setShowCommentary(true);
      return;
    }
    
    try {
      setIsFiling(true);
      await onFileAudit(commentary);
    } catch (err) {
      console.error(err);
      toast.error("Failed to file audit: " + (err as any).message);
    } finally {
      setIsFiling(false);
    }
  };

  return (
    <li
      className={cn(
        'border-b border-[var(--border)] px-4 py-3 transition-colors',
        acknowledged ? 'opacity-50' : '',
        isCritical ? 'bg-[var(--danger)]/5' : isWarning ? 'bg-[#f59e0b]/5' : ''
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {isCritical ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" strokeWidth={2.5} />
          ) : isWarning ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" strokeWidth={2.5} />
          ) : (
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-ink/50" strokeWidth={2.5} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-[0.12em]',
                  isCritical ? 'text-[var(--danger)]' : isWarning ? 'text-[#d97706]' : 'text-ink/60'
                )}
              >
                {alert.alert_type}
              </span>
              <span className="mono-data text-[10px] text-ink/40">{alert.batch_id}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-ink/70">{alert.message}</p>
            <span className="mono-data text-[9px] text-ink/40">
              {new Date(alert.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onFileAudit && !acknowledged && (
            <div className="flex flex-col items-end gap-2">
              {showCommentary && (
                <input
                  type="text"
                  value={commentary}
                  onChange={(e) => setCommentary(e.target.value)}
                  placeholder="Add inspector commentary..."
                  className="border border-[var(--border)] px-2 py-1 text-[10px] mono-data w-48 focus:outline-none"
                  autoFocus
                />
              )}
              <div className="flex gap-2">
                {showCommentary && (
                  <button
                    onClick={() => setShowCommentary(false)}
                    className="flex h-6 items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] text-ink px-2 text-[10px] font-bold uppercase hover:bg-[var(--ink)] hover:text-[var(--bg)]"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleFileAudit}
                  disabled={isFiling}
                  className="flex h-6 items-center justify-center border border-[var(--border)] bg-[var(--danger)] px-2 text-[10px] font-bold uppercase text-[var(--bg)] transition-colors hover:bg-[var(--ink)] disabled:opacity-50"
                  title="File Audit & Revoke Batch On-Chain"
                >
                  {isFiling ? 'Mining...' : (showCommentary ? 'Confirm Revoke' : 'File Audit & Revoke')}
                </button>
              </div>
            </div>
          )}
          {onAck && (
            <button
              onClick={onAck}
              disabled={isFiling}
              className="flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--bg)] disabled:opacity-50"
              title="Acknowledge"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
