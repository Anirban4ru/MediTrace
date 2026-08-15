'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from 'recharts';
import { useLedger } from '@/components/ledger-context';

// Ink Wash Palette for Recharts (must be literal strings)
const C_INK    = '#4A4A4A';
const C_ACCENT = '#6D8196';
const C_BORDER = '#CBCBCB';
const C_BG     = '#FFFFE3';

export function RealtimeGraph() {
  const { batches } = useLedger();
  const [data, setData] = useState<{ time: string; avgTemp: number; pings: number }[]>([]);
  const prevRef = useRef(0);

  useEffect(() => {
    let totalTemp = 0, tempCount = 0, currentCount = 0;
    batches.forEach(b => {
      currentCount += b.telemetry.length;
      if (b.currentStatus === 'InTransit' && b.telemetry.length > 0) {
        totalTemp += b.telemetry[b.telemetry.length - 1].temperature;
        tempCount++;
      }
    });
    const avgTemp  = tempCount > 0 ? Number((totalTemp / tempCount).toFixed(1)) : 0;
    const rawPings = currentCount - prevRef.current;
    const pings    = prevRef.current === 0 ? 0 : Math.max(0, rawPings);
    prevRef.current = currentCount;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setData(prev => {
      if (prev.length > 0 && prev[prev.length - 1].time === timeLabel) return prev;
      const next = [...prev, { time: timeLabel, avgTemp, pings }];
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });
  }, [batches]);

  if (data.length === 0) {
    return (
      <div style={{
        border: '1px solid var(--border)', background: 'var(--bg-surface)',
        borderRadius: 'var(--radius)', padding: '1.5rem',
        height: 400, width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="mono-data label-caps" style={{ color: 'var(--ink-faint)' }}>
          Waiting for live network telemetry…
        </span>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid var(--border)', background: 'var(--bg-surface)',
      borderRadius: 'var(--radius)', padding: '1.5rem',
      height: 400, width: '100%', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="mono-data" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink)' }}>
          Live Network Telemetry
        </h3>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, background: C_INK, display: 'inline-block' }} />
            Avg Temp (°C)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, background: C_ACCENT, display: 'inline-block' }} />
            Ping Volume
          </span>
        </div>
      </div>
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={C_BORDER} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              stroke={C_INK}
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: C_INK }}
              tickLine={{ stroke: C_INK }}
            />
            <YAxis
              stroke={C_INK}
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: C_INK }}
              tickLine={{ stroke: C_INK }}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                border: `1px solid ${C_BORDER}`,
                borderRadius: 2,
                background: C_BG,
                fontFamily: 'monospace',
                fontSize: 10,
                color: C_INK,
              }}
              labelStyle={{ fontWeight: 700, marginBottom: 4, color: C_INK }}
            />
            <Area
              type="monotone" dataKey="avgTemp" name="Avg Temp (°C)"
              stroke={C_INK} fill={C_INK} fillOpacity={0.08} strokeWidth={2}
              isAnimationActive
            />
            <Area
              type="stepAfter" dataKey="pings" name="Ping Volume"
              stroke={C_ACCENT} fill={C_ACCENT} fillOpacity={0.18} strokeWidth={2}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
