'use client';

import { useEffect, useState, useRef } from 'react';
import { useLedger } from '@/components/ledger-context';

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
      <div className="w-full h-[400px] flex items-center justify-center bg-black brutal-card">
        <span className="mono-data text-white/50 text-[12px] uppercase tracking-[0.2em] animate-pulse">Initializing Global Telemetry...</span>
      </div>
    );
  }

  // Convert batches into arcs
  const arcs = batches.filter(b => b.currentStatus === 'InTransit' || b.currentStatus === 'Distributed' || b.currentStatus === 'Verified' || b.currentStatus === 'Spoiled').map(b => ({
    startLat: b.origin.lat,
    startLng: b.origin.lng,
    endLat: b.destination.lat,
    endLng: b.destination.lng,
    color: b.currentStatus === 'Spoiled' ? '#B91C1C' : '#ffffff'
  }));

  return (
    <div className="w-full h-[400px] bg-black brutal-card overflow-hidden flex items-center justify-center relative cursor-move">
      <div className="absolute top-4 left-4 z-10 text-white/50 mono-data text-[10px] uppercase tracking-[0.2em]">
        Live Global Network
      </div>
      <Globe
        ref={globeRef}
        width={800}
        height={400}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        arcsData={arcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcsTransitionDuration={0}
        backgroundColor="#000000"
      />
    </div>
  );
}
