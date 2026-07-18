// Reference hologram library — curated known-good templates per product type.
// Each entry generates a deterministic synthetic reference image for SSIM comparison.

export interface ReferenceHologram {
  id: string;
  productName: string;
  pattern: 'concentric' | 'hexgrid' | 'guilloche' | 'rainbow';
  baseColor: string;
  accentColor: string;
}

export const REFERENCE_LIBRARY: ReferenceHologram[] = [
  { id: 'ref-001', productName: 'Insulin Glargine 100IU', pattern: 'concentric', baseColor: '#1a1a2e', accentColor: '#c0c0c0' },
  { id: 'ref-002', productName: 'Oncorase IV Vial', pattern: 'hexgrid', baseColor: '#0d1b2a', accentColor: '#e0e0e0' },
  { id: 'ref-003', productName: 'Pneumovax 23', pattern: 'guilloche', baseColor: '#1b1b3a', accentColor: '#d0d0d0' },
  { id: 'ref-004', productName: 'Humira Prefill Syringe', pattern: 'rainbow', baseColor: '#16213e', accentColor: '#f0f0f0' },
  { id: 'ref-005', productName: 'Enoxaparin 40mg', pattern: 'concentric', baseColor: '#0f0f23', accentColor: '#c8c8c8' },
  { id: 'ref-006', productName: 'Botulinum Toxin 50U', pattern: 'hexgrid', baseColor: '#1a1a2e', accentColor: '#b0b0b0' },
  { id: 'ref-007', productName: 'Meningococcal Conjugate', pattern: 'guilloche', baseColor: '#0d1b2a', accentColor: '#d8d8d8' },
  { id: 'ref-008', productName: 'Rituximab 10mg/mL', pattern: 'rainbow', baseColor: '#1b1b3a', accentColor: '#e8e8e8' },
];

export function findReferenceForProduct(productName: string): ReferenceHologram | null {
  return REFERENCE_LIBRARY.find((r) => r.productName === productName) ?? REFERENCE_LIBRARY[0];
}

export function generateReferenceDataUrl(ref: ReferenceHologram, width = 300, height = 300): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = ref.baseColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = ref.accentColor;
  ctx.fillStyle = ref.accentColor;

  switch (ref.pattern) {
    case 'concentric':
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, (Math.min(width, height) / 2.5) * (i / 12 + 0.1), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 'hexgrid':
      ctx.lineWidth = 1;
      const r = 20;
      for (let y = 0; y < height + r; y += r * 1.5) {
        for (let x = 0; x < width + r; x += r * Math.sqrt(3)) {
          const ox = (y / (r * 1.5)) % 2 === 0 ? 0 : r * Math.sqrt(3) / 2;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const angle = (Math.PI / 3) * k + Math.PI / 6;
            const px = x + ox + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    case 'guilloche':
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const y = height / 2 + Math.sin(x * 0.05 + i * 0.3) * (height * 0.3) * Math.sin(i * 0.15);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    case 'rainbow':
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.25, '#4ecdc4');
      gradient.addColorStop(0.5, '#45b7d1');
      gradient.addColorStop(0.75, '#f9d56e');
      gradient.addColorStop(1, '#f56565');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, (Math.min(width, height) / 2) * (i / 20), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
  }

  ctx.fillStyle = ref.accentColor;
  ctx.font = `bold ${Math.round(height * 0.07)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(ref.id.toUpperCase(), width / 2, height - 10);

  return canvas.toDataURL('image/png');
}
