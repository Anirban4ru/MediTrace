// Real client-side computer vision pipeline using OpenCV.js (WASM).
// Loads OpenCV from CDN, runs grayscale + adaptive threshold + contour detection,
// computes real SSIM against a reference image, and detects tamper-evident seals.

declare global {
  interface Window {
    cv?: unknown;
    __opencvLoading?: Promise<void>;
  }
}

const OPENCV_CDN = 'https://docs.opencv.org/4.x/opencv.js';

export function loadOpenCV(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.cv && (window.cv as Record<string, unknown>).Mat) return Promise.resolve();
  if (window.__opencvLoading) return window.__opencvLoading;

  window.__opencvLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = OPENCV_CDN;
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.cv && (window.cv as Record<string, unknown>).Mat) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error('OpenCV load timeout'));
      }, 30000);
    };
    script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
    document.head.appendChild(script);
  });

  return window.__opencvLoading;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CVResult {
  boundingBoxes: BoundingBox[];
  ssimDistance: number;
  authenticityScore: number;
  anomaliesDetected: boolean;
  tamperScore: number;
  processingTimeMs: number;
  contourCount: number;
  edgeDensity: number;
}

function imageElementFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function canvasFromImage(img: HTMLImageElement, maxSize = 400): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function computeSSIM(dataA: Uint8ClampedArray, dataB: Uint8ClampedArray, width: number, height: number): number {
  const N = width * height;
  if (N === 0) return 1;

  let sumA = 0, sumB = 0;
  for (let i = 0; i < N; i++) {
    sumA += dataA[i * 4];
    sumB += dataB[i * 4];
  }
  const meanA = sumA / N;
  const meanB = sumB / N;

  let varA = 0, varB = 0, cov = 0;
  for (let i = 0; i < N; i++) {
    const a = dataA[i * 4] - meanA;
    const b = dataB[i * 4] - meanB;
    varA += a * a;
    varB += b * b;
    cov += a * b;
  }
  varA /= N;
  varB /= N;
  cov /= N;

  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  const ssim = ((2 * meanA * meanB + c1) * (2 * cov + c2)) / ((meanA ** 2 + meanB ** 2 + c1) * (varA + varB + c2));
  return Math.max(0, Math.min(1, ssim));
}

function generateReferenceImage(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.15, height * 0.15, width * 0.7, height * 0.7);

  ctx.fillStyle = '#c0c0c0';
  ctx.font = `bold ${Math.round(height * 0.08)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('PHARMATRACE', width / 2, height * 0.45);
  ctx.fillText('HOLOGRAM', width / 2, height * 0.58);

  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, (Math.min(width, height) / 4) * (i / 8 + 0.2), 0, Math.PI * 2);
    ctx.stroke();
  }

  return canvas;
}

let cvWorker: Worker | null = null;
let jobIdCounter = 0;
const pendingJobs = new Map<number, { resolve: (val: CVResult) => void; reject: (err: Error) => void }>();

function getWorker(): Worker {
  if (!cvWorker && typeof window !== 'undefined') {
    cvWorker = new Worker('/cv.worker.js');
    cvWorker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const job = pendingJobs.get(id);
      if (job) {
        pendingJobs.delete(id);
        if (error) job.reject(new Error(error));
        else job.resolve(result);
      }
    };
  }
  if (!cvWorker) throw new Error('Worker unavailable (SSR)');
  return cvWorker;
}

export async function runCVPipeline(
  imageDataUrl: string,
  referenceUrl?: string
): Promise<CVResult> {
  const worker = getWorker();
  
  // 1. Prepare images on main thread
  const img = await imageElementFromDataUrl(imageDataUrl);
  const canvas = canvasFromImage(img, 400);
  const ctx = canvas.getContext('2d')!;
  const srcImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let refCanvas: HTMLCanvasElement;
  if (referenceUrl) {
    const refImg = await imageElementFromDataUrl(referenceUrl);
    refCanvas = canvasFromImage(refImg, 400);
  } else {
    refCanvas = generateReferenceImage(canvas.width, canvas.height);
  }

  const scaledRef = document.createElement('canvas');
  scaledRef.width = canvas.width;
  scaledRef.height = canvas.height;
  scaledRef.getContext('2d')!.drawImage(refCanvas, 0, 0, canvas.width, canvas.height);
  const refImageData = scaledRef.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);

  // 2. Offload OpenCV processing to Worker
  const jobId = ++jobIdCounter;
  
  return new Promise<CVResult>((resolve, reject) => {
    pendingJobs.set(jobId, { resolve, reject });
    
    worker.postMessage({
      id: jobId,
      srcImageData,
      refImageData,
      width: canvas.width,
      height: canvas.height,
    });
  });
}

export interface MultiImageResult {
  combined: CVResult;
  perImage: CVResult[];
  overallVerdict: 'AUTHENTIC' | 'ANOMALY DETECTED' | 'SPOILED';
}

export async function runMultiImagePipeline(
  images: { dataUrl: string; label: string }[],
  referenceUrl?: string
): Promise<MultiImageResult> {
  const results: CVResult[] = [];
  for (const img of images) {
    const result = await runCVPipeline(img.dataUrl, referenceUrl);
    results.push(result);
  }

  const avgScore = results.length > 0 ? results.reduce((s, r) => s + r.authenticityScore, 0) / results.length : 0;
  const avgSSIM = results.length > 0 ? results.reduce((s, r) => s + r.ssimDistance, 0) / results.length : 1;
  const avgTamper = results.length > 0 ? results.reduce((s, r) => s + r.tamperScore, 0) / results.length : 0;
  const totalBoxes = results.reduce((s, r) => s + r.boundingBoxes.length, 0);
  const totalTime = results.reduce((s, r) => s + r.processingTimeMs, 0);
  const anyAnomaly = results.some((r) => r.anomaliesDetected);

  return {
    combined: {
      boundingBoxes: results.flatMap((r) => r.boundingBoxes),
      ssimDistance: avgSSIM,
      authenticityScore: avgScore,
      anomaliesDetected: anyAnomaly,
      tamperScore: avgTamper,
      processingTimeMs: totalTime,
      contourCount: results.reduce((s, r) => s + r.contourCount, 0),
      edgeDensity: results.reduce((s, r) => s + r.edgeDensity, 0) / results.length,
    },
    perImage: results,
    overallVerdict: anyAnomaly ? 'ANOMALY DETECTED' : 'AUTHENTIC',
  };
}
