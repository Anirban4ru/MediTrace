'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { useLedger } from '@/components/ledger-context';

export function RealtimeGraph() {
  const { batches } = useLedger();
  const [data, setData] = useState<{ time: string; avgTemp: number; pings: number }[]>([]);
  const prevTelemetryCountRef = useRef(0);

  useEffect(() => {
    let totalTemp = 0;
    let tempCount = 0;
    let currentTelemetryCount = 0;

    batches.forEach(b => {
      currentTelemetryCount += b.telemetry.length;
      if (b.currentStatus === 'InTransit' && b.telemetry.length > 0) {
        totalTemp += b.telemetry[b.telemetry.length - 1].temperature;
        tempCount++;
      }
    });

    const avgTemp = tempCount > 0 ? Number((totalTemp / tempCount).toFixed(1)) : 0;
    const pings = currentTelemetryCount - prevTelemetryCountRef.current;
    
    // Ignore massive jump on first load
    const finalPings = prevTelemetryCountRef.current === 0 ? 0 : Math.max(0, pings);
    prevTelemetryCountRef.current = currentTelemetryCount;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setData(prev => {
      if (prev.length > 0 && prev[prev.length - 1].time === timeLabel) {
        return prev;
      }
      const next = [...prev, { time: timeLabel, avgTemp, pings: finalPings }];
      if (next.length > 20) return next.slice(next.length - 20);
      return next;
    });
  }, [batches]);

  if (data.length === 0) {
    return (
      <div className="border shadow-ambient bg-card rounded-xl p-6 h-[400px] w-full flex items-center justify-center">
        <span className="mono-data text-[12px] uppercase tracking-[0.1em] text-ink/50">Waiting for live network telemetry...</span>
      </div>
    );
  }

  return (
    <div className="border shadow-ambient bg-card rounded-xl p-6 h-[400px] w-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="display-heavy text-[16px] uppercase">Live Network Telemetry</h3>
        <div className="flex gap-4 text-[10px] uppercase font-bold tracking-[0.1em]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[var(--ink)]"></span> Avg Temp (°C)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#102A43]"></span> Ping Volume</span>
        </div>
      </div>
      <div className="flex-1 w-full border-2 border-black bg-base/60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E5E5E9" strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              stroke="var(--ink)" 
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: 'var(--ink)' }}
            />
            <YAxis 
              stroke="var(--ink)" 
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: 'var(--ink)' }}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                border: '2px solid var(--ink)',
                borderRadius: 0,
                background: 'rgba(255,255,255,0.95)',
                fontFamily: 'monospace',
                fontSize: 11,
              }}
              labelStyle={{ fontWeight: 700, marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="avgTemp" 
              name="Avg Temp (°C)"
              stroke="var(--ink)" 
              fill="var(--ink)" 
              fillOpacity={0.1} 
              strokeWidth={2.5}
              isAnimationActive={true}
            />
            <Area 
              type="stepAfter" 
              dataKey="pings" 
              name="Ping Volume"
              stroke="#102A43" 
              fill="#102A43" 
              fillOpacity={0.3} 
              strokeWidth={2}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
