'use client';

import { useEffect, useState, useRef } from 'react';
import { useLedger } from '@/components/ledger-context';

// Ink Wash palette literals for Three.js (cannot use CSS variables)
const GLOBE_BG       = '#2A2A2A'; // Charcoal dark — transparent Three.js bg
const ARC_DEFAULT    = '#FFFFE3'; // Soft Ivory
const ARC_DANGER     = '#8B6565'; // Muted Rose

export function GlobeComponent() {
  const [Globe, setGlobe] = useState<any>(null);
  const globeRef = useRef<any>(null);
  const { batches } = useLedger();

  useEffect(() => {
    import('react-globe.gl').then((mod) => setGlobe(() => mod.default));
  }, []);

  useEffect(() => {
    if (Globe) {
      setTimeout(() => {
        if (globeRef.current && globeRef.current.controls) {
          globeRef.current.controls().autoRotate = true;
          globeRef.current.controls().autoRotateSpeed = 1.0;
        }
      }, 500);
    }
  }, [Globe]);

  if (!Globe) {
    return (
      <div style={{
        width: '100%', height: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}>
        <span className="mono-data label-caps" style={{ color: 'var(--ink-faint)' }}>
          Initializing globe…
        </span>
      </div>
    );
  }

  const arcs = batches
    .filter(b => ['InTransit','Distributed','Verified','Spoiled'].includes(b.currentStatus))
    .map(b => ({
      startLat: b.origin.lat,
      startLng: b.origin.lng,
      endLat:   b.destination.lat,
      endLng:   b.destination.lng,
      color: b.currentStatus === 'Spoiled' ? ARC_DANGER : ARC_DEFAULT,
    }));

  return (
    <div style={{
      width: '100%', height: 400,
      background: GLOBE_BG,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'move',
    }}>
      <div style={{
        position: 'absolute', top: 12, left: 14, zIndex: 10,
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(255,255,227,0.4)',
      }}>
        Live Global Network
      </div>
      <Globe
        ref={globeRef}
        width={600}
        height={400}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        arcsData={arcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcsTransitionDuration={0}
        backgroundColor={GLOBE_BG}
      />
    </div>
  );
}
