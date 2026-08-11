// CSV export utility for regulatory submissions
import { Batch } from './types';
import { fmtTime } from './format';

export function exportBatchesCSV(batches: Batch[]): void {
  const headers = [
    'Batch ID', 'Product', 'Manufacturer', 'Serial', 'Status', 'Units',
    'Origin', 'Destination', 'Provisioned', 'Provision Tx', 'Provision Block',
    'Telemetry Count', 'Breaches', 'Excursion Hours',
  ];

  const rows = batches.map((b) => {
    const breaches = b.telemetry.filter((t) => t.breached).length;
    let excursionMs = 0;
    for (let i = 0; i < b.telemetry.length; i++) {
      if (b.telemetry[i].breached) {
        if (i < b.telemetry.length - 1) {
          excursionMs += b.telemetry[i + 1].timestamp - b.telemetry[i].timestamp;
        } else {
          excursionMs += 4 * 3600000;
        }
      }
    }
    return [
      b.batchId, b.productName, b.manufacturerLabel, b.serial, b.currentStatus,
      String(b.units), b.origin.label, b.destination.label, fmtTime(b.createdAt),
      b.provisionTx, String(b.provisionBlock), String(b.telemetry.length),
      String(breaches), (excursionMs / 3600000).toFixed(1),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadCSV(csv, 'meditrace-batches.csv');
}

export function exportTelemetryCSV(batch: Batch): void {
  const headers = [
    'Checkpoint #', 'Timestamp', 'Temperature (C)', 'Latitude', 'Longitude',
    'Signer', 'Tx Hash', 'Breached',
  ];

  const rows = batch.telemetry.map((t, i) => [
    String(i + 1), fmtTime(t.timestamp), t.temperature.toFixed(1),
    t.lat.toFixed(4), t.lng.toFixed(4), t.signer, t.txHash,
    t.breached ? 'YES' : 'NO',
  ]);

  const csv = [`# Batch: ${batch.batchId} (${batch.productName})`, headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

  downloadCSV(csv, `meditrace-telemetry-${batch.batchId}.csv`);
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
