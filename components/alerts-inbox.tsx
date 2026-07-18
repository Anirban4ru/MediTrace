'use client';

import { useLedger } from '@/components/ledger-context';
import { AlertTriangle, Bell, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AlertsInbox() {
  const { alerts, acknowledgeAlert } = useLedger();
  const unack = alerts.filter((a) => !a.acknowledged);
  const acked = alerts.filter((a) => a.acknowledged);

  return (
    <div className="brutal-card">
      <div className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" strokeWidth={2.5} />
          <h3 className="display-heavy text-[13px] uppercase">Spoilage Alerts</h3>
          {unack.length > 0 && (
            <span className="border-2 border-[#B91C1C] bg-[#B91C1C] px-1.5 text-[10px] font-bold uppercase text-white">
              {unack.length} new
            </span>
          )}
        </div>
        <span className="mono-data text-[10px] uppercase tracking-[0.14em] text-black/55">
          {alerts.length} total
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <Check className="h-8 w-8 text-[#0f5132]" strokeWidth={2} />
            <span className="text-[11px] uppercase tracking-[0.14em] text-black/50">
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
              />
            ))}
            {unack.length > 0 && acked.length > 0 && (
              <li className="border-y-2 border-black/10 bg-[#F4F4F6] px-4 py-1.5">
                <span className="mono-data text-[9px] uppercase tracking-[0.16em] text-black/45">
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
  acknowledged?: boolean;
}) {
  const isCritical = alert.severity === 'critical';
  const isWarning = alert.severity === 'warning';

  return (
    <li
      className={cn(
        'border-b border-black/15 px-4 py-3 transition-colors',
        acknowledged ? 'opacity-50' : '',
        isCritical ? 'bg-[#B91C1C]/5' : isWarning ? 'bg-[#f59e0b]/5' : ''
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {isCritical ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]" strokeWidth={2.5} />
          ) : isWarning ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" strokeWidth={2.5} />
          ) : (
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-black/50" strokeWidth={2.5} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-[0.12em]',
                  isCritical ? 'text-[#B91C1C]' : isWarning ? 'text-[#d97706]' : 'text-black/60'
                )}
              >
                {alert.alert_type}
              </span>
              <span className="mono-data text-[10px] text-black/40">{alert.batch_id}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-black/70">{alert.message}</p>
            <span className="mono-data text-[9px] text-black/40">
              {new Date(alert.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
        {onAck && (
          <button
            onClick={onAck}
            className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-white transition-colors hover:bg-black hover:text-white"
            title="Acknowledge"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </li>
  );
}
