'use client';

import { useEffect, useRef, useState } from 'react';
import { Batch } from '@/lib/types';

export function RouteMap({ batch, height = 360 }: { batch: Batch; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([20.5937, 78.9629], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapRef.current as Parameters<typeof L.map>[0] extends never ? never : ReturnType<typeof L.map>);
      }

      const map = mapRef.current as ReturnType<typeof L.map>;

      map.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const points: L.LatLngExpression[] = [
        [batch.origin.lat, batch.origin.lng],
        ...batch.telemetry.map((t) => [t.lat, t.lng] as [number, number]),
        [batch.destination.lat, batch.destination.lng],
      ];

      const originIcon = L.divIcon({
        html: '<div style="width:12px;height:12px;background:#102A43;border:2px solid #000;border-radius:50%;"></div>',
        className: '',
        iconSize: [16, 16],
      });
      const destIcon = L.divIcon({
        html: '<div style="width:12px;height:12px;background:#0f5132;border:2px solid #000;border-radius:50%;"></div>',
        className: '',
        iconSize: [16, 16],
      });
      const breachIcon = L.divIcon({
        html: '<div style="width:10px;height:10px;background:#B91C1C;border:2px solid #000;border-radius:2px;"></div>',
        className: '',
        iconSize: [14, 14],
      });
      const normalIcon = L.divIcon({
        html: '<div style="width:8px;height:8px;background:#000;border:1px solid #fff;border-radius:50%;"></div>',
        className: '',
        iconSize: [10, 10],
      });

      L.marker([batch.origin.lat, batch.origin.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>Origin</b><br/>${batch.origin.label}`);

      L.marker([batch.destination.lat, batch.destination.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destination</b><br/>${batch.destination.label}`);

      L.polyline(points, {
        color: '#102A43',
        weight: 2,
        opacity: 0.6,
        dashArray: '6 4',
      }).addTo(map);

      batch.telemetry.forEach((t, i) => {
        L.marker([t.lat, t.lng], { icon: t.breached ? breachIcon : normalIcon })
          .addTo(map)
          .bindPopup(
            `<b>Checkpoint #${i + 1}</b><br/>${t.temperature.toFixed(1)}°C<br/>${new Date(t.timestamp).toLocaleString()}<br/>${t.breached ? '<span style="color:#B91C1C;font-weight:bold">BREACH</span>' : 'OK'}`
          );
      });

      if (points.length > 1) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [30, 30] });
      }

      setTimeout(() => map.invalidateSize(), 100);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [batch]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px` }}
      className="border-2 border-black"
    />
  );
}
