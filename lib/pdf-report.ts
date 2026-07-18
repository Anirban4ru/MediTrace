// PDF chain-of-custody report generator using jsPDF
import { jsPDF } from 'jspdf';
import { Batch, SAFE_BAND } from './types';
import { fmtDate, fmtTime, fmtTemp } from './format';
import { shortHash, shortAddr } from './rng';

export function generateBatchReport(batch: Batch): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PHARMATRACE - CHAIN OF CUSTODY REPORT', margin, 20);
  doc.setTextColor(0, 0, 0);

  y = 50;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Details', margin, y);
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const details: [string, string][] = [
    ['Batch ID', batch.batchId],
    ['Product', batch.productName],
    ['Manufacturer', batch.manufacturerLabel],
    ['Manufacturer Address', batch.manufacturer],
    ['Serial (GS1)', batch.serial],
    ['Units', batch.units.toLocaleString()],
    ['Status', batch.currentStatus],
    ['Provisioned', fmtDate(batch.createdAt)],
    ['Origin', batch.origin.label],
    ['Destination', batch.destination.label],
    ['Provision Tx', shortHash(batch.provisionTx)],
    ['Provision Block', `#${batch.provisionBlock.toLocaleString()}`],
  ];

  for (const [label, value] of details) {
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 120, y);
    y += 16;
  }

  y += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Telemetry Log', margin, y);
  y += 20;
  doc.setFontSize(9);

  doc.setFont('helvetica', 'bold');
  doc.text('#', margin, y);
  doc.text('Timestamp', margin + 25, y);
  doc.text('Temp', margin + 160, y);
  doc.text('Lat', margin + 210, y);
  doc.text('Lng', margin + 270, y);
  doc.text('Signer', margin + 340, y);
  doc.text('Tx Hash', margin + 420, y);
  doc.text('Breach', margin + 500, y);
  y += 14;
  doc.setFont('helvetica', 'normal');

  for (let i = 0; i < batch.telemetry.length; i++) {
    const t = batch.telemetry[i];
    if (y > 780) {
      doc.addPage();
      y = 50;
    }
    doc.text(String(i + 1), margin, y);
    doc.text(fmtTime(t.timestamp), margin + 25, y);
    doc.text(fmtTemp(t.temperature), margin + 160, y);
    doc.text(t.lat.toFixed(4), margin + 210, y);
    doc.text(t.lng.toFixed(4), margin + 270, y);
    doc.text(shortAddr(t.signer), margin + 340, y);
    doc.text(shortHash(t.txHash, 8, 4), margin + 420, y);
    doc.text(t.breached ? 'YES' : 'no', margin + 500, y);
    if (t.breached) {
      doc.setTextColor(185, 28, 28);
      doc.text('!', margin + 530, y);
      doc.setTextColor(0, 0, 0);
    }
    y += 14;
  }

  y += 10;
  if (y > 720) {
    doc.addPage();
    y = 50;
  }

  const breachCount = batch.telemetry.filter((t) => t.breached).length;
  const excursionMs = calculateExcursionDuration(batch);
  const excursionHours = (excursionMs / 3600000).toFixed(1);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Cold-Chain Summary', margin, y);
  y += 20;
  doc.setFontSize(10);

  const summary: [string, string][] = [
    ['Total Readings', String(batch.telemetry.length)],
    ['Breaches', String(breachCount)],
    ['Safe Band', `${SAFE_BAND.min}°C — ${SAFE_BAND.max}°C`],
    ['Excursion Duration', `${excursionHours} hours`],
    ['Min Temperature', batch.telemetry.length ? fmtTemp(Math.min(...batch.telemetry.map((t) => t.temperature))) : '—'],
    ['Max Temperature', batch.telemetry.length ? fmtTemp(Math.max(...batch.telemetry.map((t) => t.temperature))) : '—'],
    ['Mean Temperature', batch.telemetry.length ? fmtTemp(batch.telemetry.reduce((s, t) => s + t.temperature, 0) / batch.telemetry.length) : '—'],
  ];

  for (const [label, value] of summary) {
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 140, y);
    y += 16;
  }

  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated ${new Date().toISOString()} · PharmaTrace · Arbitrum Sepolia L2 · Contract ${shortAddr(batch.manufacturer)}`,
    margin,
    y
  );
  doc.setTextColor(0, 0, 0);

  doc.save(`pharmatrace-${batch.batchId}.pdf`);
}

export function calculateExcursionDuration(batch: Batch): number {
  let total = 0;
  for (let i = 0; i < batch.telemetry.length; i++) {
    const t = batch.telemetry[i];
    if (t.breached) {
      if (i < batch.telemetry.length - 1) {
        const next = batch.telemetry[i + 1];
        total += next.timestamp - t.timestamp;
      } else {
        total += 4 * 3600000;
      }
    }
  }
  return total;
}
