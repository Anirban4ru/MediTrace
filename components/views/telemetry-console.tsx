'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { useLedger } from '@/components/ledger-context';
import { SAFE_BAND, Batch } from '@/lib/types';
import { StatusPill, BrutalTag } from '@/components/primitives';
import { fmtTime, fmtTemp } from '@/lib/format';
import { shortAddr, shortHash } from '@/lib/rng';
import { calculateExcursionDuration } from '@/lib/pdf-report';
import { exportTelemetryCSV } from '@/lib/csv-export';
import { RouteMap } from '@/components/route-map';
import { txExplorerUrl } from '@/lib/explorer';
import {
  Truck,
  Thermometer,
  MapPin,
  Activity,
  AlertTriangle,
  Send,
  Gauge,
  Clock,
  ArrowRight,
  Radio,
  Square,
  Download,
  ExternalLink,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function TelemetryConsole() {
  const { batches, pushTelemetry } = useLedger();
  const inTransitBatches = useMemo(
    () =>
      batches.filter(
        (b) =>
          b.currentStatus === 'InTransit' ||
          b.currentStatus === 'Spoiled' ||
          b.currentStatus === 'Manufactured'
      ),
    [batches]
  );
  const [selectedId, setSelectedId] = useState<string>(
    inTransitBatches[0]?.batchId ?? batches[0]?.batchId ?? ''
  );
  const selected = batches.find((b) => b.batchId === selectedId) ?? batches[0];

  const [tempInput, setTempInput] = useState(5.0);
  const [seedKey, setSeedKey] = useState('');
  const [liveMode, setLiveMode] = useState(false);
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live streaming telemetry simulation
  useEffect(() => {
    if (liveMode && selected) {
      liveRef.current = setInterval(() => {
        const baseTemp = 4.5 + Math.random() * 2;
        const drift = (Math.random() - 0.5) * 3;
        const temp = Math.round((baseTemp + drift) * 10) / 10;
        pushTelemetry(selected.batchId, temp, `${selected.batchId}-live-${Date.now()}`);
      }, 3000);
    }
    return () => {
      if (liveRef.current) clearInterval(liveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode, selectedId]);

  function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const key = seedKey || `${selected.batchId}-${tempInput}-${Date.now()}`;
    pushTelemetry(selected.batchId, tempInput, key);
    setSeedKey('');
  }

  if (!selected) {
    return (
      <div className="brutal-card p-8 text-center text-[13px] uppercase tracking-[0.14em] text-black/60">
        No batches available for telemetry ingestion.
      </div>
    );
  }

  const chartData = selected.telemetry.map((t) => ({
    ts: t.timestamp,
    label: new Date(t.timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    temp: t.temperature,
    breached: t.breached,
  }));

  const breachCount = selected.telemetry.filter((t) => t.breached).length;
  const minTemp = selected.telemetry.length
    ? Math.min(...selected.telemetry.map((t) => t.temperature))
    : 0;
  const maxTemp = selected.telemetry.length
    ? Math.max(...selected.telemetry.map((t) => t.temperature))
    : 0;
  const avgTemp = selected.telemetry.length
    ? selected.telemetry.reduce((s, t) => s + t.temperature, 0) /
      selected.telemetry.length
    : 0;
  const excursionMs = calculateExcursionDuration(selected);
  const excursionHours = (excursionMs / 3600000).toFixed(1);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 flex items-center gap-3 overflow-x-auto no-scrollbar border-2 border-black brutal-shadow bg-white p-2">
        {inTransitBatches.slice(0, 12).map((b) => {
          const active = b.batchId === selectedId;
          return (
            <button
              key={b.batchId}
              onClick={() => setSelectedId(b.batchId)}
              className={cn(
                'flex shrink-0 items-center gap-2 border-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors',
                active
                  ? 'border-black bg-black text-white'
                  : 'border-black/30 bg-white text-black/70 hover:border-black'
              )}
            >
              <Thermometer className="h-3.5 w-3.5" strokeWidth={2.5} />
              {b.batchId}
              <span
                className={cn(
                  'h-1.5 w-1.5',
                  b.currentStatus === 'Spoiled' ? 'bg-[#B91C1C]' : 'bg-[#0f5132]'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Chart + stats */}
      <section className="col-span-12 lg:col-span-8 space-y-4">
        <div className="glass brutal-border brutal-shadow p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="display-heavy text-[15px] uppercase">Cold-Chain Telemetry</h2>
              <div className="mono-data text-[11px] text-black/55">
                {selected.batchId} · {selected.productName}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={selected.currentStatus} />
              <BrutalTag>CARRIER_ROLE</BrutalTag>
              <button
                onClick={() => setLiveMode(!liveMode)}
                className={cn(
                  'flex items-center gap-1.5 border-2 border-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
                  liveMode ? 'bg-[#B91C1C] text-white' : 'bg-white hover:bg-black/5'
                )}
              >
                {liveMode ? <Square className="h-3 w-3" strokeWidth={2.5} /> : <Radio className="h-3 w-3" strokeWidth={2.5} />}
                {liveMode ? 'Stop Live' : 'Simulate Live'}
              </button>
            </div>
          </div>

          {liveMode && (
            <div className="mb-3 flex items-center gap-2 border-2 border-[#B91C1C] bg-[#B91C1C]/5 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse bg-[#B91C1C]" />
              <span className="mono-data text-[10px] uppercase tracking-[0.14em] text-[#B91C1C]">
                Live carrier stream — new reading every 3s
              </span>
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-black/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-black" /> Sensor reading
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-[#B91C1C]" /> Ceiling 8.0°C
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-[#B91C1C]" /> Floor 2.0°C
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-[#102A43]/15" /> Safe band
            </span>
          </div>

          <div className="h-[340px] w-full border-2 border-black bg-white/60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 20, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#E5E5E9" strokeDasharray="2 2" />
                <XAxis
                  dataKey="label"
                  stroke="#000"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#000' }}
                  axisLine={{ stroke: '#000', strokeWidth: 2 }}
                />
                <YAxis
                  domain={[0, 14]}
                  ticks={[0, 2, 4, 6, 8, 10, 12, 14]}
                  stroke="#000"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#000' }}
                  axisLine={{ stroke: '#000', strokeWidth: 2 }}
                  tickFormatter={(v) => `${v}°`}
                />
                <ReferenceArea y1={SAFE_BAND.min} y2={SAFE_BAND.max} fill="#102A43" fillOpacity={0.08} />
                <ReferenceLine
                  y={SAFE_BAND.max}
                  stroke="#B91C1C"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{ value: 'CEILING 8.0°C', position: 'insideTopRight', fontSize: 9, fontFamily: 'monospace', fill: '#B91C1C' }}
                />
                <ReferenceLine
                  y={SAFE_BAND.min}
                  stroke="#B91C1C"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{ value: 'FLOOR 2.0°C', position: 'insideBottomRight', fontSize: 9, fontFamily: 'monospace', fill: '#B91C1C' }}
                />
                <Tooltip
                  contentStyle={{
                    border: '2px solid #000',
                    borderRadius: 0,
                    background: 'rgba(255,255,255,0.92)',
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                  labelStyle={{ fontWeight: 700, textTransform: 'uppercase' }}
                  formatter={(v: number) => [fmtTemp(v), 'Temp']}
                />
                <Line
                  type="stepAfter"
                  dataKey="temp"
                  stroke="#000"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload, index } = props as {
                      cx: number;
                      cy: number;
                      payload: { breached: boolean };
                      index: number;
                    };
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.breached ? '#B91C1C' : '#000'}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#102A43', stroke: '#000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-5 border-2 border-black">
            <Stat label="Readings" value={String(selected.telemetry.length)} />
            <Stat label="Min / Max" value={`${fmtTemp(minTemp)} / ${fmtTemp(maxTemp)}`} />
            <Stat label="Mean" value={fmtTemp(avgTemp)} />
            <Stat label="Breaches" value={String(breachCount)} danger={breachCount > 0} />
            <Stat label="Excursion" value={`${excursionHours}h`} danger={Number(excursionHours) > 0} icon={Timer} />
          </div>
        </div>

        {/* Route Map */}
        {selected.telemetry.length > 0 && (
          <div className="brutal-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" strokeWidth={2.5} />
                <h3 className="display-heavy text-[13px] uppercase">Geographic Route</h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-black/55">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#102A43]" /> Origin
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0f5132]" /> Destination
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#B91C1C]" /> Breach
                </span>
              </div>
            </div>
            <RouteMap batch={selected} height={320} />
          </div>
        )}
      </section>

      {/* Ingestion form + route grid */}
      <aside className="col-span-12 lg:col-span-4 space-y-4">
        <div className="brutal-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="display-heavy text-[13px] uppercase">Ingest Telemetry</h3>
            <Activity className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <form onSubmit={handleIngest} className="space-y-3">
            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/70">
                Temperature (°C)
              </span>
              <input
                type="number"
                step={0.1}
                value={tempInput}
                onChange={(e) => setTempInput(Number(e.target.value))}
                className="brutal-border w-full bg-white px-3 py-2 text-[13px] mono-data focus:outline-none focus:ring-2 focus:ring-black"
              />
              <div className="mt-2 flex gap-1">
                {[3.5, 5.0, 7.2, 9.5, 12.0].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTempInput(v)}
                    className={cn(
                      'border-2 px-2 py-1 text-[10px] mono-data',
                      v > SAFE_BAND.max || v < SAFE_BAND.min
                        ? 'border-[#B91C1C] text-[#B91C1C]'
                        : 'border-black/40 hover:border-black'
                    )}
                  >
                    {v.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/70">
                Carrier Seed
              </span>
              <input
                value={seedKey}
                onChange={(e) => setSeedKey(e.target.value)}
                className="brutal-border w-full bg-white px-3 py-2 text-[13px] mono-data focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="auto"
              />
            </div>
            <button
              type="submit"
              className="brutal-border brutal-shadow brutal-press flex w-full items-center justify-center gap-2 bg-black py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white"
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
              Write To Chain
            </button>
            <p className="text-[10px] uppercase tracking-[0.12em] text-black/50">
              Breach outside [2.0, 8.0]°C auto-mutates status to SPOILED on-chain.
            </p>
          </form>
        </div>

        <RouteGrid batch={selected} />

        <button
          onClick={() => exportTelemetryCSV(selected)}
          className="brutal-border brutal-shadow-sm brutal-press flex w-full items-center justify-center gap-2 bg-white py-2 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-[#F4F4F6]"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
          Export Telemetry CSV
        </button>
      </aside>
    </div>
  );
}

function RouteGrid({ batch }: { batch: Batch }) {
  return (
    <div className="brutal-card">
      <div className="border-b-2 border-black px-4 py-3">
        <h3 className="display-heavy text-[13px] uppercase">Route Checkpoints</h3>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {batch.telemetry.length === 0 ? (
          <div className="p-6 text-center text-[11px] uppercase tracking-[0.14em] text-black/50">
            No telemetry recorded yet.
          </div>
        ) : (
          <ul>
            {batch.telemetry.map((t, i) => (
              <li
                key={t.txHash}
                className="border-b border-black/15 px-4 py-3 transition-colors hover:bg-[#F4F4F6]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="mono-data text-[10px] text-black/40">
                      #{String(i + 1).padStart(2, '0')}
                    </span>
                    <Thermometer
                      className="h-3.5 w-3.5"
                      strokeWidth={2.5}
                      style={{ color: t.breached ? '#B91C1C' : '#0f5132' }}
                    />
                    <span
                      className={cn(
                        'mono-data text-[13px] font-bold',
                        t.breached && 'text-[#B91C1C]'
                      )}
                    >
                      {fmtTemp(t.temperature)}
                    </span>
                    {t.breached && (
                      <span className="border border-[#B91C1C] px-1 text-[9px] font-bold uppercase text-[#B91C1C]">
                        BREACH
                      </span>
                    )}
                  </div>
                  <span className="mono-data text-[10px] text-black/55">
                    {fmtTime(t.timestamp)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-black/55">
                  <span className="flex items-center gap-1 mono-data">
                    <MapPin className="h-3 w-3" strokeWidth={2.5} />
                    {t.lat.toFixed(4)}, {t.lng.toFixed(4)}
                  </span>
                  <span className="flex items-center gap-1 mono-data">
                    <Gauge className="h-3 w-3" strokeWidth={2.5} />
                    {shortAddr(t.signer)}
                  </span>
                  <a
                    href={txExplorerUrl(t.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mono-data text-[#102A43] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                    {shortHash(t.txHash, 6, 4)}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {batch.telemetry.length > 0 && (
        <div className="flex items-center justify-between border-t-2 border-black bg-[#F4F4F6] px-4 py-2.5 text-[10px] uppercase tracking-[0.14em]">
          <span className="flex items-center gap-1.5 text-black/60">
            <MapPin className="h-3 w-3" strokeWidth={2.5} />
            {batch.origin.label}
          </span>
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span className="flex items-center gap-1.5 text-black/60">
            {batch.destination.label}
            <MapPin className="h-3 w-3" strokeWidth={2.5} />
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
  icon: Icon,
}: {
  label: string;
  value: string;
  danger?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div
      className="border-r-2 border-black p-3 last:border-r-0"
      style={{ background: danger ? '#B91C1C' : '#fff', color: danger ? '#fff' : '#000' }}
    >
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] opacity-70">
        {Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}
        {label}
      </div>
      <div className="mt-1 mono-data text-[16px] font-bold">{value}</div>
    </div>
  );
}
