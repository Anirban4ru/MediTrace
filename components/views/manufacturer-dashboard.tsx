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
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
         <h1 className="display-heavy text-[24px] uppercase dark:text-white">Manufacturer Control Center</h1>
         <span className="mono-data text-[10px] uppercase text-black/50 dark:text-white/50">Drag widgets to customize layout</span>
      </div>

      <ResponsiveGridLayout
        className="layout -mx-4"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={150}
        draggableHandle=".drag-handle"
      >
        <div key="stats" className="border-2 border-black dark:border-white brutal-shadow flex w-full h-full overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-6 w-full h-full">
            <StatCell label="Total Batches" value={stats.total} icon={Package} />
            <StatCell label="In Transit" value={stats.inTransit} icon={Activity} accent />
            <StatCell label="Verified" value={stats.verified} icon={CheckCircle2} />
            <StatCell label="Spoiled" value={stats.spoiled} icon={AlertTriangle} danger />
            <StatCell label="Total Units" value={stats.totalUnits} icon={Hash} />
            <StatCell label="Excursion Hrs" value={Number(stats.excursionHours)} icon={Clock} />
          </div>
        </div>

        <div key="provision" className="flex flex-col h-full glass brutal-border dark:border-white brutal-shadow p-5 dark:bg-black">
          <div className="drag-handle cursor-move mb-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 p-2 -m-2">
            <h2 className="display-heavy text-[15px] uppercase dark:text-white">Provision Batch</h2>
            <BrutalTag>MANUFACTURER_ROLE</BrutalTag>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleProvision} className="space-y-4">
            <Field label="Product Name">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="brutal-border w-full bg-white dark:bg-black dark:text-white px-3 py-2 text-[13px] mono-data focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="e.g. Insulin Glargine 100IU"
              />
            </Field>
            <Field label="Units">
              <input
                type="number"
                min={1}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="brutal-border w-full bg-white dark:bg-black dark:text-white px-3 py-2 text-[13px] mono-data focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </Field>
            <Field label="Provisioning Seed (optional)">
              <input
                value={seedKey}
                onChange={(e) => setSeedKey(e.target.value)}
                className="brutal-border w-full bg-white dark:bg-black dark:text-white px-3 py-2 text-[13px] mono-data focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="auto-generated if blank"
              />
            </Field>
            <button
              type="submit"
              className="brutal-border brutal-shadow brutal-press flex w-full items-center justify-center gap-2 bg-black py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Register On Ledger
            </button>
          </form>

          {lastProvisioned && (
            <div className="mt-5 animate-in border-2 border-black dark:border-white bg-white dark:bg-black p-3">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0f5132] dark:text-green-400" strokeWidth={2.5} />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] dark:text-white">
                  On-Chain Confirmed
                </span>
              </div>
              <Row k="Batch ID" v={lastProvisioned.batchId} />
              <Row k="Serial" v={lastProvisioned.serial} />
              <div className="flex items-center justify-between py-1 text-[11px]">
                <span className="uppercase tracking-[0.1em] text-black/50 dark:text-white/50">Tx Hash</span>
                <a
                  href={txExplorerUrl(lastProvisioned.provisionTx)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono-data flex items-center gap-1 font-semibold text-[#102A43] dark:text-blue-400 hover:underline"
                >
                  {shortHash(lastProvisioned.provisionTx)}
                  <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                </a>
              </div>
              <Row k="Block" v={`#${lastProvisioned.provisionBlock.toLocaleString()}`} />
              <Row k="Manufacturer" v={shortAddr(lastProvisioned.manufacturer)} />
              <div className="mt-4">
                <QrLabelGenerator batchId={lastProvisioned.batchId} productName={lastProvisioned.productName} serial={lastProvisioned.serial} />
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-2 pb-4">
            <button
              onClick={() => exportBatchesCSV(batches)}
              className="brutal-border brutal-shadow-sm brutal-press flex flex-1 items-center justify-center gap-2 bg-white dark:bg-black dark:text-white py-2 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-[#F4F4F6] dark:hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
              Export CSV
            </button>
          </div>
          </div>
        </div>

        <div key="ledger" className="brutal-card flex flex-col h-full bg-white dark:bg-black dark:border-white">
          <div className="drag-handle cursor-move flex items-center justify-between border-b-2 border-black dark:border-white px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5">
            <h2 className="display-heavy text-[15px] uppercase dark:text-white">Batch Ledger</h2>
            <span className="mono-data text-[10px] uppercase tracking-[0.16em] text-black/55 dark:text-white/55">
              {batches.length} records · newest first
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-[#F4F4F6] dark:bg-black/90 backdrop-blur z-10">
                <tr className="border-b-2 border-black dark:border-white text-[10px] uppercase tracking-[0.14em] text-black/60 dark:text-white/60">
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

      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="brutal-card max-h-[80vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-3">
              <h3 className="display-heavy text-[14px] uppercase">Batch Detail</h3>
              <button onClick={() => setSelectedDetail(null)} className="text-black/50 hover:text-black">
                ✕
              </button>
            </div>
            <div className="p-4">
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
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => generateBatchReport(selectedDetail)}
                  className="brutal-border brutal-shadow-sm brutal-press flex flex-1 items-center justify-center gap-1.5 bg-black py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                >
                  <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />
                  PDF Report
                </button>
                <a
                  href={txExplorerUrl(selectedDetail.provisionTx)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-border brutal-shadow-sm brutal-press flex flex-1 items-center justify-center gap-1.5 bg-white py-2 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-[#F4F4F6]"
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
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
    <tr className="border-b border-black/15 text-[12px] transition-colors hover:bg-[#F4F4F6]">
      <Td>
        <button onClick={onSelect} className="text-left">
          <div className="mono-data font-semibold hover:underline">{batch.batchId}</div>
          <div className="mono-data text-[10px] text-black/50">{batch.serial}</div>
        </button>
      </Td>
      <Td>
        <div className="font-medium">{batch.productName}</div>
        <div className="mono-data text-[10px] text-black/50">{batch.manufacturerLabel}</div>
      </Td>
      <Td>
        <StatusPill status={batch.currentStatus} />
      </Td>
      <Td>
        <span className="mono-data">{batch.units.toLocaleString()}</span>
      </Td>
      <Td>
        {batch.telemetry.length === 0 ? (
          <span className="mono-data text-[10px] text-black/40">—</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <Thermometer
              className="h-3.5 w-3.5"
              strokeWidth={2.5}
              style={{ color: breach ? '#B91C1C' : '#0f5132' }}
            />
            <span className="mono-data text-[11px]">{batch.telemetry.length}</span>
            {breach && (
              <span className="border border-[#B91C1C] px-1 text-[9px] font-bold uppercase text-[#B91C1C]">
                BREACH
              </span>
            )}
          </div>
        )}
      </Td>
      <Td>
        <span className="mono-data text-[11px]">{fmtDate(batch.createdAt)}</span>
      </Td>
      <Td>
        <a
          href={txExplorerUrl(batch.provisionTx)}
          target="_blank"
          rel="noopener noreferrer"
          className="mono-data flex items-center gap-1 text-[11px] text-[#102A43] hover:underline"
        >
          {shortHash(batch.provisionTx, 6, 4)}
          <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
        </a>
      </Td>
      <Td>
        <button
          onClick={onReport}
          title="Generate PDF report"
          className="border-2 border-black/20 p-1 transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />
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
  const bg = danger ? '#B91C1C' : accent ? '#102A43' : '#FFFFFF';
  const fg = danger || accent ? '#fff' : '#000';
  return (
    <div
      className="border-b-2 border-black p-4 md:border-b-0 md:border-r-2 last:border-r-0"
      style={{ background: bg, color: fg }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
          {label}
        </span>
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="mt-2 mono-data text-[34px] font-bold leading-none">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px]">
      <span className="uppercase tracking-[0.1em] text-black/50">{k}</span>
      <span className="mono-data font-semibold">{v}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-bold">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className ?? ''}`}>{children}</td>;
}
