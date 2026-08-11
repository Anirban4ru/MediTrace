import jsPDF from 'jspdf';
import { Batch } from './types';

export function calculateExcursionDuration(batch: Batch | null): number {
  if (!batch || !batch.telemetry) return 0;
  // Simple heuristic: each breached checkpoint counts as a 5-minute excursion
  const breaches = batch.telemetry.filter(cp => cp.breached);
  return breaches.length * 5 * 60 * 1000;
}

export function generatePDFReport(batch: Batch) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("MediTrace Audit Report", 20, 20);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Official Record for Batch: ${batch.batchId}`, 20, 30);
  
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  doc.setTextColor(0);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Batch Information", 20, 45);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${batch.productName}`, 20, 55);
  doc.text(`Manufacturer: ${batch.manufacturerLabel}`, 20, 65);
  doc.text(`Status: ${batch.currentStatus}`, 20, 75);
  
  let mfgStr = 'Unknown';
  if (batch.createdAt) {
    const d = new Date(batch.createdAt);
    if (!isNaN(d.getTime())) mfgStr = d.toLocaleDateString();
  }
  
  doc.text(`Mfg Date: ${mfgStr}`, 110, 55);
  doc.text(`Units: ${batch.units}`, 110, 65);
  doc.text(`Serial: ${batch.serial}`, 110, 75);

  doc.setFont("helvetica", "bold");
  doc.text("Telemetry Checkpoints", 20, 95);
  
  doc.setFont("helvetica", "normal");
  if (!batch.telemetry || batch.telemetry.length === 0) {
    doc.text("No checkpoints recorded.", 20, 105);
  } else {
    let yPos = 105;
    batch.telemetry.forEach((cp, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const tsStr = new Date(cp.timestamp).toLocaleString();
      const status = cp.breached ? "BREACHED" : "OK";
      doc.text(`${index + 1}. [${tsStr}] Temp: ${cp.temperature}C - Status: ${status}`, 20, yPos);
      doc.text(`   Location: [${cp.lat}, ${cp.lng}] | Reporter: ${cp.signer}`, 20, yPos + 7);
      
      yPos += 16;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    const dateStr = new Date().toLocaleString();
    doc.text(`MediTrace Immutable Log - Generated ${dateStr} - Page ${i} of ${pageCount}`, 20, 285);
  }

  doc.save(`MediTrace_Audit_${batch.batchId}.pdf`);
}

export const generateBatchReport = generatePDFReport;
