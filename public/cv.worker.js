importScripts('https://docs.opencv.org/4.x/opencv.js');

let cvLoaded = false;
let cvResolve;
const cvPromise = new Promise(r => { cvResolve = r; });

// Wait for OpenCV to initialize
function checkCv() {
  if (typeof cv !== 'undefined' && cv.Mat) {
    cvLoaded = true;
    cvResolve();
  } else {
    setTimeout(checkCv, 100);
  }
}
checkCv();

function computeSSIM(dataA, dataB, width, height) {
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

self.onmessage = async function(e) {
  const { id, srcImageData, refImageData, width, height } = e.data;
  
  await cvPromise;
  
  const t0 = performance.now();
  
  const ssim = computeSSIM(srcImageData.data, refImageData.data, width, height);
  const ssimDistance = Math.max(0, Math.min(1, 1 - ssim));

  // matFromImageData
  const src = cv.matFromImageData(srcImageData);
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
  cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const contourCount = contours.size();
  const boundingBoxes = [];
  let totalArea = 0;

  for (let i = 0; i < contourCount && boundingBoxes.length < 20; i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    if (area > 50) {
      const rect = cv.boundingRect(contour);
      boundingBoxes.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      totalArea += area;
    }
    contour.delete();
  }

  const totalPixels = width * height;
  const edgeDensity = totalPixels > 0 ? totalArea / totalPixels : 0;

  const edges = new cv.Mat();
  cv.Canny(gray, edges, 50, 150);
  const edgeData = edges.data;
  let edgePixels = 0;
  for (let i = 0; i < edgeData.length; i++) if (edgeData[i] > 0) edgePixels++;
  const cannyDensity = edgePixels / totalPixels;

  const tamperScore = Math.max(0, Math.min(1, cannyDensity * 3));

  const authenticityScore = Math.max(
    0,
    Math.min(1, ssim * 0.7 + Math.min(1, edgeDensity * 5) * 0.15 + (1 - Math.min(1, tamperScore * 2)) * 0.15)
  );
  const anomaliesDetected = authenticityScore < 0.85 || tamperScore > 0.3;

  src.delete();
  gray.delete();
  binary.delete();
  contours.delete();
  hierarchy.delete();
  edges.delete();

  const t1 = performance.now();
  
  self.postMessage({
    id,
    result: {
      boundingBoxes,
      ssimDistance,
      authenticityScore,
      anomaliesDetected,
      tamperScore,
      processingTimeMs: Math.round(t1 - t0),
      contourCount,
      edgeDensity,
    }
  });
};
