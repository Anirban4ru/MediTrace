'use client';

import { useMemo, useState } from 'react';
import { useLedger } from '@/components/ledger-context';
import { Batch } from '@/lib/types';
import { StatusPill, BrutalTag } from '@/components/primitives';
import { fmtDate, fmtTime } from '@/lib/format';
import { shortAddr, shortHash } from '@/lib/rng';
import { exportBatchesCSV } from '@/lib/csv-export';
import { generateBatchReport, calculateExcursionDuration } from '@/lib/pdf-report';
import { txExplorerUrl } from '@/lib/explorer';
import {
  Plus,
  Package,
  Hash,
  Thermometer,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Download,
  FileText,
  ExternalLink,
  Clock,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { QrLabelGenerator } from '@/components/qr-generator';

const ResponsiveGridLayout = dynamic(
  () => import('react-grid-layout/legacy').then((mod) => mod.WidthProvider(mod.Responsive)),
  { ssr: false }
);

export function ManufacturerDashboard() {
  const { batches, addBatch } = useLedger();
  const [productName, setProductName] = useState('Insulin Glargine 100IU');
  const [units, setUnits] = useState(500);
  const [seedKey, setSeedKey] = useState('');
  const [lastProvisioned, setLastProvisioned] = useState<Batch | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Batch | null>(null);

  const stats = useMemo(() => {
    const total = batches.length;
    const spoiled = batches.filter((b) => b.currentStatus === 'Spoiled').length;
    const inTransit = batches.filter((b) => b.currentStatus === 'InTransit').length;
    const verified = batches.filter((b) => b.currentStatus === 'Verified').length;
    const totalUnits = batches.reduce((s, b) => s + b.units, 0);
    const totalExcursion = batches.reduce((s, b) => s + calculateExcursionDuration(b), 0);
    return {
      total,
      spoiled,
      inTransit,
      verified,
      totalUnits,
      excursionHours: (totalExcursion / 3600000).toFixed(0),
    };
  }, [batches]);

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || units <= 0) return;
    const key = seedKey || `${productName}-${units}-${Date.now()}`;
    const batch = await addBatch(productName.trim(), units, key);
    setLastProvisioned(batch || null);
    setSeedKey('');
  }

  const layout = [
    { i: 'stats', x: 0, y: 0, w: 12, h: 1, static: false },
    { i: 'provision', x: 0, y: 1, w: 4, h: 3, static: false },
    { i: 'ledger', x: 4, y: 1, w: 8, h: 4, static: false }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-heavy text-2xl uppercase" style={{ color: 'var(--ink)' }}>
            Manufacturer Control Center
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
            Provision batches, mint cryptographic provenance, and inspect production audit logs.
          </p>
        </div>
        <span className="mono-data text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded" style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          Drag widgets to customize layout
        </span>
      </div>

      <ResponsiveGridLayout
        className="layout -mx-4"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={150}
        draggableHandle=".drag-handle"
      >
        {/* STATS TOP ROW */}
        <div key="stats" className="grid grid-cols-2 md:grid-cols-6 gap-3 w-full h-full">
          <StatCell label="Total Batches" value={stats.total} icon={Package} />
          <StatCell label="In Transit" value={stats.inTransit} icon={Activity} accent />
          <StatCell label="Verified" value={stats.verified} icon={CheckCircle2} />
          <StatCell label="Spoiled" value={stats.spoiled} icon={AlertTriangle} danger />
          <StatCell label="Total Units" value={stats.totalUnits} icon={Hash} />
          <StatCell label="Excursion Hrs" value={Number(stats.excursionHours)} icon={Clock} />
        </div>

        {/* PROVISION CARD */}
        <div 
          key="provision" 
          className="flex flex-col h-full rounded-xl overflow-hidden shadow-sm"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div 
            className="drag-handle cursor-move flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--ink)' }}>
              Provision Batch
            </h2>
            <BrutalTag>MANUFACTURER_ROLE</BrutalTag>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <form onSubmit={handleProvision} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
                  Product Name
                </label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] mono-data rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                  placeholder="e.g. Insulin Glargine 100IU"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
                  Units
                </label>
                <input
                  type="number"
                  min={1}
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  className="w-full px-3 py-2 text-[13px] mono-data rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
                  Provisioning Seed (optional)
                </label>
                <input
                  value={seedKey}
                  onChange={(e) => setSeedKey(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] mono-data rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                  placeholder="auto-generated if blank"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded"
              >
                <Plus className="h-4 w-4" />
                Register On Ledger
              </button>
            </form>

            {lastProvisioned && (
              <div 
                className="mt-4 p-3 rounded-lg animate-editorial-fade space-y-2"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase" style={{ color: 'var(--success)' }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>On-Chain Confirmed</span>
                </div>
                <Row k="Batch ID" v={lastProvisioned.batchId} />
                <Row k="Serial" v={lastProvisioned.serial} />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--ink-muted)' }}>Tx Hash</span>
                  <a
                    href={txExplorerUrl(lastProvisioned.provisionTx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono-data flex items-center gap-1 text-[11px] hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    {shortHash(lastProvisioned.provisionTx)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Row k="Block" v={`#${lastProvisioned.provisionBlock.toLocaleString()}`} />
                <Row k="Manufacturer" v={shortAddr(lastProvisioned.manufacturer)} />
                <div className="mt-3">
                  <QrLabelGenerator batchId={lastProvisioned.batchId} productName={lastProvisioned.productName} serial={lastProvisioned.serial} />
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <button
                onClick={() => exportBatchesCSV(batches)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all hover:bg-[var(--accent-faint)]"
                style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* LEDGER CARD */}
        <div 
          key="ledger" 
          className="flex flex-col h-full rounded-xl overflow-hidden shadow-sm"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div 
            className="drag-handle cursor-move flex items-center justify-between px-6 py-3.5"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--ink)' }}>
              Batch Ledger
            </h2>
            <span className="mono-data text-xs" style={{ color: 'var(--ink-muted)' }}>
              {batches.length} records · newest first
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--ink-muted)' }}>
                <tr className="text-[10px] uppercase font-bold tracking-[0.14em]">
                  <Th>Batch ID</Th>
                  <Th>Product</Th>
                  <Th>Status</Th>
                  <Th>Units</Th>
                  <Th>Telemetry</Th>
                  <Th>Provisioned</Th>
                  <Th>Tx</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <BatchRow
                    key={b.batchId}
                    batch={b}
                    onSelect={() => setSelectedDetail(b)}
                    onReport={() => generateBatchReport(b)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ResponsiveGridLayout>

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="rounded-xl max-h-[85vh] w-full max-w-lg overflow-y-auto shadow-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--ink)' }}>
                Batch Detail
              </h3>
              <button 
                onClick={() => setSelectedDetail(null)} 
                className="text-xs p-1 rounded hover:bg-[var(--accent-faint)]"
                style={{ color: 'var(--ink-muted)' }}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-2">
              <Row k="Batch ID" v={selectedDetail.batchId} />
              <Row k="Product" v={selectedDetail.productName} />
              <Row k="Manufacturer" v={selectedDetail.manufacturerLabel} />
              <Row k="Serial" v={selectedDetail.serial} />
              <Row k="Status" v={selectedDetail.currentStatus} />
              <Row k="Units" v={selectedDetail.units.toLocaleString()} />
              <Row k="Origin" v={selectedDetail.origin.label} />
              <Row k="Destination" v={selectedDetail.destination.label} />
              <Row k="Provisioned" v={fmtDate(selectedDetail.createdAt)} />
              <Row k="Telemetry Points" v={String(selectedDetail.telemetry.length)} />
              <Row
                k="Excursion Duration"
                v={`${(calculateExcursionDuration(selectedDetail) / 3600000).toFixed(1)} hrs`}
              />
              <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => generateBatchReport(selectedDetail)}
                  className="btn-primary flex-1 py-2 text-xs font-bold"
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF Report
                </button>
                <a
                  href={txExplorerUrl(selectedDetail.provisionTx)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost flex-1 py-2 text-xs font-bold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View on Arbiscan
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BatchRow({
  batch,
  onSelect,
  onReport,
}: {
  batch: Batch;
  onSelect: () => void;
  onReport: () => void;
}) {
  const breach = batch.telemetry.some((t) => t.breached);
  return (
    <tr 
      className="text-xs transition-colors hover:bg-[var(--accent-faint)]"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <Td>
        <button onClick={onSelect} className="text-left">
          <div className="mono-data font-semibold hover:underline" style={{ color: 'var(--ink)' }}>{batch.batchId}</div>
          <div className="mono-data text-[10px]" style={{ color: 'var(--ink-muted)' }}>{batch.serial}</div>
        </button>
      </Td>
      <Td>
        <div className="font-semibold" style={{ color: 'var(--ink)' }}>{batch.productName}</div>
        <div className="mono-data text-[10px]" style={{ color: 'var(--ink-muted)' }}>{batch.manufacturerLabel}</div>
      </Td>
      <Td>
        <StatusPill status={batch.currentStatus} />
      </Td>
      <Td>
        <span className="mono-data font-medium" style={{ color: 'var(--ink)' }}>{batch.units.toLocaleString()}</span>
      </Td>
      <Td>
        {batch.telemetry.length === 0 ? (
          <span className="mono-data text-[10px]" style={{ color: 'var(--ink-muted)' }}>—</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <Thermometer
              className="h-3.5 w-3.5"
              style={{ color: breach ? 'var(--danger)' : 'var(--success)' }}
            />
            <span className="mono-data text-[11px]" style={{ color: 'var(--ink)' }}>{batch.telemetry.length}</span>
            {breach && (
              <span className="px-1 text-[9px] font-bold uppercase rounded" style={{ background: 'var(--danger-faint)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                BREACH
              </span>
            )}
          </div>
        )}
      </Td>
      <Td>
        <span className="mono-data text-[11px]" style={{ color: 'var(--ink)' }}>{fmtDate(batch.createdAt)}</span>
      </Td>
      <Td>
        <a
          href={txExplorerUrl(batch.provisionTx)}
          target="_blank"
          rel="noopener noreferrer"
          className="mono-data flex items-center gap-1 text-[11px] hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          {shortHash(batch.provisionTx, 6, 4)}
          <ExternalLink className="h-3 w-3" />
        </a>
      </Td>
      <Td>
        <button
          onClick={onReport}
          title="Generate PDF report"
          className="p-1.5 rounded transition-colors hover:bg-[var(--accent-faint)]"
          style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
      </Td>
    </tr>
  );
}

function StatCell({
  label,
  value,
  icon: Icon,
  accent,
  danger,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: boolean;
  danger?: boolean;
}) {
  const bg = danger ? 'var(--danger-faint)' : accent ? 'var(--accent-faint)' : 'var(--bg-surface)';
  const fg = danger ? 'var(--danger)' : accent ? 'var(--accent)' : 'var(--ink)';
  const border = danger ? 'var(--danger)' : accent ? 'var(--accent)' : 'var(--border)';

  return (
    <div
      className="p-4 flex flex-col justify-between rounded-xl"
      style={{ background: bg, color: fg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
          {label}
        </span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 mono-data text-[28px] font-bold leading-none" style={{ color: fg }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs" style={{ borderBottom: '1px solid var(--border-faint)' }}>
      <span className="uppercase text-[10px] font-bold tracking-wider" style={{ color: 'var(--ink-muted)' }}>{k}</span>
      <span className="mono-data font-semibold" style={{ color: 'var(--ink)' }}>{v}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ''}`}>{children}</td>;
}
