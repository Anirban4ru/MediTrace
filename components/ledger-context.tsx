'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Batch, TelemetryCheckpoint, BatchStatus, SAFE_BAND } from '@/lib/types';
import { makeBatches, provisionBatch, ingestTelemetry, verifyBatch } from '@/lib/engine';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { useAuth } from '@/components/auth-context';

export interface Alert {
  id: string;
  batch_id: string;
  alert_type: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  batch_id: string | null;
  event_type: string;
  actor: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface VerificationRecord {
  id: string;
  batch_id: string;
  authenticity_score: number;
  anomalies_detected: boolean;
  processing_time_ms: number;
  bounding_boxes: number;
  ssim_distance: number;
  proof_tx_hash: string;
  proof_block: number;
  contract_address: string;
  chain: string;
  inspector: string;
  verified_at: number;
  method: string;
  image_preview: string | null;
}

interface LedgerContextValue {
  batches: Batch[];
  alerts: Alert[];
  auditLog: AuditEntry[];
  verifications: VerificationRecord[];
  loading: boolean;
  addBatch: (productName: string, units: number, seedKey: string) => Promise<Batch>;
  pushTelemetry: (batchId: string, temperature: number, seedKey: string) => Promise<void>;
  getBatch: (batchId: string) => Batch | undefined;
  refresh: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  saveVerification: (record: Omit<VerificationRecord, 'id'>) => Promise<void>;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function rowToBatch(row: Record<string, unknown>, telemetry: TelemetryCheckpoint[]): Batch {
  return {
    batchId: row.batch_id as string,
    productName: row.product_name as string,
    manufacturer: row.manufacturer as string,
    manufacturerLabel: row.manufacturer_label as string,
    currentStatus: row.current_status as BatchStatus,
    createdAt: new Date(row.created_at as string).getTime(),
    units: row.units as number,
    serial: row.serial as string,
    origin: {
      lat: row.origin_lat as number,
      lng: row.origin_lng as number,
      label: row.origin_label as string,
    },
    destination: {
      lat: row.dest_lat as number,
      lng: row.dest_lng as number,
      label: row.dest_label as string,
    },
    telemetry,
    provisionTx: row.provision_tx as string,
    provisionBlock: row.provision_block as number,
  };
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>(() => makeBatches(24));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFromSupabase = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    setLoading(true);
    try {
      const { data: batchRows } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!batchRows) return;

      const { data: teleRows } = await supabase
        .from('telemetry_checkpoints')
        .select('*')
        .order('timestamp', { ascending: true });

      const teleByBatch = new Map<string, TelemetryCheckpoint[]>();
      for (const t of teleRows ?? []) {
        const arr = teleByBatch.get(t.batch_id) ?? [];
        arr.push({
          timestamp: t.timestamp,
          lat: t.lat,
          lng: t.lng,
          temperature: t.temperature,
          signer: t.signer,
          txHash: t.tx_hash,
          breached: t.breached,
        });
        teleByBatch.set(t.batch_id, arr);
      }

      const mapped = batchRows.map((r) => rowToBatch(r, teleByBatch.get(r.batch_id) ?? []));
      setBatches(mapped);

      const { data: alertRows } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setAlerts((alertRows ?? []) as unknown as Alert[]);

      const { data: auditRows } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setAuditLog((auditRows ?? []) as unknown as AuditEntry[]);

      const { data: verRows } = await supabase
        .from('verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setVerifications((verRows ?? []) as unknown as VerificationRecord[]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFromSupabase();
    } else {
      setBatches(makeBatches(24));
      setAlerts([]);
      setAuditLog([]);
      setVerifications([]);
    }
  }, [user, loadFromSupabase]);

  // Background telemetry simulator for live graph
  useEffect(() => {
    const interval = setInterval(() => {
      setBatches(prevBatches => {
        let changed = false;
        const nextBatches = prevBatches.map(b => {
          if (b.currentStatus === 'InTransit') {
            changed = true;
            const baseTemp = 4.5 + (Math.random() - 0.5) * 2;
            const temp = Math.round(baseTemp * 10) / 10;
            const t = {
              timestamp: Date.now(),
              lat: b.origin.lat + (b.destination.lat - b.origin.lat) * 0.5,
              lng: b.origin.lng + (b.destination.lng - b.origin.lng) * 0.5,
              temperature: temp,
              signer: '0xBACKGROUND_SIM',
              txHash: '0x' + Math.random().toString(16).slice(2),
              breached: temp > 8.0 || temp < 2.0
            };
            // Keep array size manageable for simulation
            const newTelemetry = [...b.telemetry, t];
            if (newTelemetry.length > 50) newTelemetry.shift();
            return { ...b, telemetry: newTelemetry };
          }
          return b;
        });
        return changed ? nextBatches : prevBatches;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addBatch = useCallback(
    async (productName: string, units: number, seedKey: string): Promise<Batch> => {
      const batch = provisionBatch(productName, units, seedKey);
      const supabase = getSupabase();

      if (supabase && user) {
        const { error } = await supabase.from('batches').insert({
          batch_id: batch.batchId,
          product_name: batch.productName,
          manufacturer: batch.manufacturer,
          manufacturer_label: batch.manufacturerLabel,
          current_status: batch.currentStatus,
          units: batch.units,
          serial: batch.serial,
          origin_lat: batch.origin.lat,
          origin_lng: batch.origin.lng,
          origin_label: batch.origin.label,
          dest_lat: batch.destination.lat,
          dest_lng: batch.destination.lng,
          dest_label: batch.destination.label,
          provision_tx: batch.provisionTx,
          provision_block: batch.provisionBlock,
        });

        if (!error) {
          await supabase.from('audit_logs').insert({
            batch_id: batch.batchId,
            event_type: 'provisioned',
            actor: user.email,
            details: { product: batch.productName, units: batch.units, serial: batch.serial },
          });
        }
      }

      setBatches((prev) => [batch, ...prev]);
      return batch;
    },
    [user]
  );

  const pushTelemetry = useCallback(
    async (batchId: string, temperature: number, seedKey: string) => {
      const batch = batches.find((b) => b.batchId === batchId);
      if (!batch) return;
      const { batch: updated, checkpoint, spoiled } = ingestTelemetry(batch, temperature, seedKey);
      const supabase = getSupabase();

      if (supabase && user) {
        await supabase.from('telemetry_checkpoints').insert({
          batch_id: batchId,
          timestamp: checkpoint.timestamp,
          lat: checkpoint.lat,
          lng: checkpoint.lng,
          temperature: checkpoint.temperature,
          signer: checkpoint.signer,
          tx_hash: checkpoint.txHash,
          breached: checkpoint.breached,
        });

        if (spoiled && batch.currentStatus !== 'Spoiled') {
          await supabase
            .from('batches')
            .update({ current_status: 'Spoiled' })
            .eq('batch_id', batchId);

          await supabase.from('alerts').insert({
            batch_id: batchId,
            alert_type: 'breach',
            message: `Batch ${batchId} exceeded safe band [${SAFE_BAND.min}-${SAFE_BAND.max}°C] at ${checkpoint.temperature}°C`,
            severity: 'critical',
          });

          await supabase.from('audit_logs').insert({
            batch_id: batchId,
            event_type: 'spoiled',
            actor: user.email,
            details: { temperature: checkpoint.temperature, lat: checkpoint.lat, lng: checkpoint.lng },
          });
        } else if (batch.currentStatus === 'Manufactured') {
          await supabase
            .from('batches')
            .update({ current_status: 'InTransit' })
            .eq('batch_id', batchId);
        }

        await supabase.from('audit_logs').insert({
          batch_id: batchId,
          event_type: 'telemetry_logged',
          actor: user.email,
          details: { temperature: checkpoint.temperature, breached: checkpoint.breached },
        });
      }

      setBatches((prev) => prev.map((b) => (b.batchId === batchId ? updated : b)));
    },
    [batches, user]
  );

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('alerts').update({ acknowledged: true }).eq('id', alertId);
    }
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
  }, []);

  const saveVerification = useCallback(
    async (record: Omit<VerificationRecord, 'id'>) => {
      const supabase = getSupabase();
      if (supabase && user) {
        await supabase.from('verifications').insert({
          batch_id: record.batch_id,
          authenticity_score: record.authenticity_score,
          anomalies_detected: record.anomalies_detected,
          processing_time_ms: record.processing_time_ms,
          bounding_boxes: record.bounding_boxes,
          ssim_distance: record.ssim_distance,
          proof_tx_hash: record.proof_tx_hash,
          proof_block: record.proof_block,
          contract_address: record.contract_address,
          chain: record.chain,
          inspector: record.inspector,
          verified_at: record.verified_at,
          method: record.method,
          image_preview: record.image_preview,
        });

        await supabase.from('audit_logs').insert({
          batch_id: record.batch_id,
          event_type: 'scanned',
          actor: user.email,
          details: { score: record.authenticity_score, anomalies: record.anomalies_detected },
        });

        if (record.anomalies_detected) {
          await supabase.from('alerts').insert({
            batch_id: record.batch_id,
            alert_type: 'anomaly',
            message: `Verification anomaly detected for ${record.batch_id} — score ${(record.authenticity_score * 100).toFixed(1)}%`,
            severity: 'warning',
          });
        }
      }
      setVerifications((prev) => [{ ...record, id: crypto.randomUUID() }, ...prev]);
    },
    [user]
  );

  const getBatch = useCallback(
    (batchId: string) => batches.find((b) => b.batchId === batchId),
    [batches]
  );

  const value = useMemo<LedgerContextValue>(
    () => ({
      batches,
      alerts,
      auditLog,
      verifications,
      loading,
      addBatch,
      pushTelemetry,
      getBatch,
      refresh: loadFromSupabase,
      acknowledgeAlert,
      saveVerification,
    }),
    [batches, alerts, auditLog, verifications, loading, addBatch, pushTelemetry, getBatch, loadFromSupabase, acknowledgeAlert, saveVerification]
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger must be used within LedgerProvider');
  return ctx;
}
