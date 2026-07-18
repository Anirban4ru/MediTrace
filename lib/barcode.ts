// GS1 DataMatrix / barcode decode using @zxing/library
// Reads 2D barcodes from packaging images to extract serials and auto-match batches.

import { BrowserMultiFormatReader } from '@zxing/library';

let reader: BrowserMultiFormatReader | null = null;

function getReader(): BrowserMultiFormatReader {
  if (!reader) {
    reader = new BrowserMultiFormatReader();
  }
  return reader;
}

export interface BarcodeResult {
  text: string;
  format: string;
  timestamp: number;
}

export async function decodeBarcodeFromImage(
  imageElement: HTMLImageElement
): Promise<BarcodeResult | null> {
  try {
    const r = getReader();
    const result = await r.decodeFromImageElement(imageElement);
    return {
      text: result.getText(),
      format: result.getBarcodeFormat().toString(),
      timestamp: result.getTimestamp(),
    };
  } catch {
    return null;
  }
}

export async function decodeBarcodeFromDataUrl(dataUrl: string): Promise<BarcodeResult | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const result = await decodeBarcodeFromImage(img);
      resolve(result);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function parseGS1(text: string): { serial?: string; gtin?: string; batch?: string } {
  const result: { serial?: string; gtin?: string; batch?: string } = {};
  const aiMap: Record<string, keyof typeof result> = {
    '01': 'gtin',
    '21': 'serial',
    '10': 'batch',
  };
  for (const [ai, field] of Object.entries(aiMap)) {
    const idx = text.indexOf(ai);
    if (idx >= 0) {
      const start = idx + ai.length;
      let end = start;
      while (end < text.length && !text[end].match(/[^\x20-\x7E]/)) end++;
      if (field === 'serial') {
        result[field] = text.slice(start, Math.min(end, start + 20));
      } else if (field === 'gtin') {
        result[field] = text.slice(start, start + 14);
      } else {
        result[field] = text.slice(start, Math.min(end, start + 20));
      }
    }
  }
  return result;
}
