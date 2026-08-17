'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Batch, TelemetryCheckpoint, BatchStatus, SAFE_BAND } from '@/lib/types';
import { makeBatches, provisionBatch, ingestTelemetry, verifyBatch } from '@/lib/engine';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { ethers } from 'ethers';
import { MedicineTrackerABI } from '@/lib/abi';
import { useAuth } from '@/components/auth-context';
import { toast } from 'sonner';

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
  addBatch: (productName: string, units: number, seedKey: string) => Promise<Batch | undefined>;
  pushTelemetry: (batchId: string, temperature: number, seedKey: string, skipBlockchain?: boolean) => Promise<void>;
  getBatch: (batchId: string) => Batch | undefined;
  refresh: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  fileAudit: (alertId: string, batchId: string, message: string) => Promise<void>;
  saveVerification: (record: Omit<VerificationRecord, 'id'>, commentary?: string) => Promise<void>;
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

  // Supabase Realtime subscription for alerts (e.g., from Dedaub webhooks)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }).catch(console.error);
    }

    const supabase = getSupabase();
    if (!supabase || !user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          setAlerts((prev) => {
            if (prev.some((a) => a.id === newAlert.id)) return prev;
            
            // Trigger web push if backgrounded
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              if (document.hidden) {
                navigator.serviceWorker.ready.then(reg => {
                  reg.showNotification(`New ${newAlert.alert_type} Alert`, {
                    body: newAlert.message,
                    icon: '/favicon.ico'
                  });
                });
              } else {
                toast.error(`New ${newAlert.alert_type} Alert: ${newAlert.message}`);
              }
            }

            return [newAlert, ...prev].slice(0, 50);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addBatch = useCallback(
    async (productName: string, units: number, seedKey: string): Promise<Batch | undefined> => {
      try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error("MetaMask is not installed. Web3 features are disabled.");
      }
      
      const ethereum = (window as any).ethereum;
      try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0xaa36a7', chainName: 'Sepolia', rpcUrls: ['https://rpc.sepolia.org'], nativeCurrency: { name: 'SepoliaETH', symbol: 'SEP', decimals: 18 } }]
          });
        }
      }

      const provider = new ethers.BrowserProvider(ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in environment variables");
      
      const contract = new ethers.Contract(contractAddress, MedicineTrackerABI, signer);

      const batch = provisionBatch(productName, units, seedKey);
      
      const tx = await contract.provisionBatch(
        batch.batchId,
        batch.productName,
        batch.manufacturerLabel,
        batch.units,
        batch.serial,
        batch.origin.label,
        batch.destination.label
      );
      
      await tx.wait();
      batch.provisionTx = tx.hash;

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

        if (error) {
          toast.error(`Database Error: ${error.message}`);
          throw new Error(`Supabase insert failed: ${error.message}`);
        }

        const { error: auditError } = await supabase.from('audit_logs').insert({
          batch_id: batch.batchId,
          event_type: 'provisioned',
          actor: user.email,
          details: { product: batch.productName, units: batch.units, serial: batch.serial },
        });
        if (auditError) {
          console.error('Audit log write failed (addBatch):', auditError);
          toast.error(`Audit log failed: ${auditError.message}`);
        }
      }

      setBatches((prev) => [batch, ...prev]);
      return batch;
      } catch (err: any) {
        console.error("addBatch Error:", err);
        if (err?.reason?.includes('AccessControl') || err?.message?.includes('missing role')) {
          toast.error('Your wallet address does not hold the required on-chain role for this action. Contact the contract admin to be granted the role separately from your app account role.');
        } else {
          toast.error(`Failed to provision batch: ${err.message}`);
        }
      }
    },
    [user]
  );

  const pushTelemetry = useCallback(
    async (batchId: string, temperature: number, seedKey: string, skipBlockchain: boolean = false) => {
      try {
        const batch = batches.find((b) => b.batchId === batchId);
        if (!batch) return;

        const { batch: updated, checkpoint, spoiled } = ingestTelemetry(batch, temperature, seedKey);
        
        const latE6 = Math.round(checkpoint.lat * 1e6);
        const lngE6 = Math.round(checkpoint.lng * 1e6);
        const tempCp = Math.round(checkpoint.temperature * 100);

        if (!skipBlockchain) {
          if (typeof window === 'undefined' || !(window as any).ethereum) {
            throw new Error("MetaMask is not installed. Web3 features are disabled.");
          }
          
          const ethereum = (window as any).ethereum;
          try {
            await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{ chainId: '0xaa36a7', chainName: 'Sepolia', rpcUrls: ['https://rpc.sepolia.org'], nativeCurrency: { name: 'SepoliaETH', symbol: 'SEP', decimals: 18 } }]
              });
            }
          }

          const provider = new ethers.BrowserProvider(ethereum);
          await provider.send("eth_requestAccounts", []);
          const signer = await provider.getSigner();
          
          let contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
          if (!contractAddress) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in environment variables");
          
          // Ensure valid checksum address if possible
          try { contractAddress = ethers.getAddress(contractAddress); } catch (e) {}
          
          const contract = new ethers.Contract(contractAddress, MedicineTrackerABI, signer);
          const tx = await contract.logTelemetry(batchId, latE6, lngE6, tempCp);
          await tx.wait();
          
          checkpoint.txHash = tx.hash;
        } else {
          // Simulated IoT device transaction (no MetaMask popup)
          checkpoint.txHash = '0x' + Math.random().toString(16).slice(2).padStart(64, '0');
        }

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

          const { error: spoiledAuditError } = await supabase.from('audit_logs').insert({
            batch_id: batchId,
            event_type: 'spoiled',
            actor: user.email,
            details: { temperature: checkpoint.temperature, lat: checkpoint.lat, lng: checkpoint.lng },
          });
          if (spoiledAuditError) {
            console.error('Audit log write failed (spoiled):', spoiledAuditError);
            toast.error(`Audit log failed: ${spoiledAuditError.message}`);
          }
        } else if (batch.currentStatus === 'Manufactured') {
          await supabase
            .from('batches')
            .update({ current_status: 'InTransit' })
            .eq('batch_id', batchId);
        }

        const { error: telemetryAuditError } = await supabase.from('audit_logs').insert({
          batch_id: batchId,
          event_type: 'telemetry_logged',
          actor: user.email,
          details: { temperature: checkpoint.temperature, breached: checkpoint.breached, simulated: skipBlockchain },
        });
        if (telemetryAuditError) {
          console.error('Audit log write failed (telemetry):', telemetryAuditError);
          toast.error(`Audit log failed: ${telemetryAuditError.message}`);
        }
      }

      setBatches((prev) => prev.map((b) => (b.batchId === batchId ? updated : b)));
      } catch (err: any) {
        console.error("pushTelemetry Error:", err);
        if (err?.reason?.includes('AccessControl') || err?.message?.includes('missing role')) {
          toast.error('Your wallet address does not hold the required on-chain role for this action. Contact the contract admin to be granted the role separately from your app account role.');
        } else {
          toast.error(`Failed to log telemetry: ${err.message}`);
        }
      }
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

  const fileAudit = useCallback(
    async (alertId: string, batchId: string, message: string) => {
      try {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          throw new Error("MetaMask is not installed.");
        }
        const ethereum = (window as any).ethereum;
        try {
          await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{ chainId: '0xaa36a7', chainName: 'Sepolia', rpcUrls: ['https://rpc.sepolia.org'], nativeCurrency: { name: 'SepoliaETH', symbol: 'SEP', decimals: 18 } }]
            });
          }
        }
        
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
        const contract = new ethers.Contract(contractAddress, MedicineTrackerABI, signer);
        
        // Revoke the batch on-chain
        let chainSuccess = false;
        try {
          const tx = await contract.revokeBatch(batchId, message);
          await tx.wait(1);
          chainSuccess = true;
        } catch (contractErr: any) {
          console.warn("On-chain revocation failed, falling back to off-chain:", contractErr);
          if (contractErr.message && contractErr.message.includes("Batch does not exist")) {
            toast.info(`Note: Batch ${batchId} was never registered on the blockchain. The alert has been resolved and the audit filed off-chain in the database instead.`);
          } else {
            throw contractErr; // Re-throw if it's a MetaMask rejection or something else
          }
        }

        const supabase = getSupabase();
        if (supabase && user) {
          await supabase
            .from('alerts')
            .update({ acknowledged: true })
            .eq('id', alertId);

          const { error: fileAuditError } = await supabase.from('audit_logs').insert({
            batch_id: batchId,
            event_type: 'spoiled', // Trigger red styling
            actor: user.email,
            details: { action: 'admin_revocation', reason: message, on_chain: chainSuccess },
          });
          if (fileAuditError) {
            console.error('Audit log write failed (fileAudit):', fileAuditError);
            toast.error(`Audit log failed: ${fileAuditError.message}`);
          }
        }
        
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
        );
      } catch (err: any) {
        console.error("fileAudit Error:", err);
        throw err;
      }
    },
    [user]
  );

  const saveVerification = useCallback(
    async (record: Omit<VerificationRecord, 'id'>, commentary?: string) => {
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
          const contract = new ethers.Contract(contractAddress, MedicineTrackerABI, signer);
          
          const payloadString = JSON.stringify(record);
          const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(payloadString));
          
          const tx = await contract.recordVerificationHash(record.batch_id, payloadHash);
          await tx.wait();
        }
      } catch (err) {
        console.warn("Failed to anchor verification on-chain:", err);
      }

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

        const { error: scanAuditError } = await supabase.from('audit_logs').insert({
          batch_id: record.batch_id,
          event_type: 'scanned',
          actor: user.email,
          details: { score: record.authenticity_score, anomalies: record.anomalies_detected },
        });
        if (scanAuditError) {
          console.error('Audit log write failed (saveVerification):', scanAuditError);
          toast.error(`Audit log failed: ${scanAuditError.message}`);
        }

        if (record.anomalies_detected) {
          const msg = `Verification anomaly detected for ${record.batch_id} — score ${(record.authenticity_score * 100).toFixed(1)}%`;
          await supabase.from('alerts').insert({
            batch_id: record.batch_id,
            alert_type: 'anomaly',
            message: commentary ? `${msg} | Inspector: ${commentary}` : msg,
            severity: 'critical',
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
      fileAudit,
      saveVerification,
    }),
    [batches, alerts, auditLog, verifications, loading, addBatch, pushTelemetry, getBatch, loadFromSupabase, acknowledgeAlert, fileAudit, saveVerification]
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger must be used within LedgerProvider');
  return ctx;
}
