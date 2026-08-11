# 👁️ Computer Vision Verification (OpenCV)

The weakest link in any digital supply chain is the **physical-to-digital handoff**. 

A blockchain can prove a digital token is authentic, but it cannot prove that the physical box of medicine sitting on a pharmacy counter matches that digital token. To solve this, PharmaTrace utilizes **client-side Computer Vision (OpenCV.js)** to verify physical anti-tamper holographic seals.

---

## 🔍 The Verification Pipeline

When a Pharmacy Inspector receives a shipment, they open the Inspector Dashboard and activate their webcam.

1. **Capture:** The browser captures a high-resolution frame of the physical packaging and the holographic seal.
2. **Client-Side Processing:** To ensure extreme privacy and zero latency, the image is **never uploaded to a server**. It is processed entirely inside the browser using a Web Worker.
3. **Feature Extraction:** OpenCV analyzes the image for specific tampered patterns (e.g., micro-tears in the seal, incorrect optical refraction).
4. **Blockchain Sync:** If the physical packaging passes the visual integrity check, the Inspector signs a MetaMask transaction marking the batch as `DELIVERED` on the blockchain.

---

## ⚙️ OpenCV Implementation

To prevent blocking the main React UI thread during heavy matrix calculations, PharmaTrace offloads the OpenCV logic to a dedicated `cv.worker.js` Web Worker.

### Code Snippet: Sending Frames to the Web Worker
```typescript
// Inside the Pharmacy Terminal React Component
const captureAndAnalyze = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.drawImage(videoRef.current, 0, 0, 640, 480);
  
  // Extract pixel data
  const imageData = context.getImageData(0, 0, 640, 480);
  
  // Send to OpenCV Web Worker for analysis
  workerRef.current.postMessage({
    type: 'PROCESS_FRAME',
    payload: {
      imageData,
      width: 640,
      height: 480
    }
  });
};
```

### Code Snippet: OpenCV Image Processing
Inside the Web Worker, OpenCV converts the image to grayscale, applies a Gaussian Blur to reduce camera noise, and uses Edge Detection to look for structural damage to the packaging.

```javascript
// Inside cv.worker.js
self.onmessage = function(e) {
  if (e.data.type === 'PROCESS_FRAME') {
    const { imageData, width, height } = e.data.payload;
    
    // Load image matrix
    let src = cv.matFromImageData(imageData);
    let dst = new cv.Mat();
    
    // Convert to Grayscale
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    
    // Apply Edge Detection (Canny) to find package tearing
    cv.Canny(dst, dst, 50, 100, 3, false);
    
    // ... Analyze edge density to output a "Confidence Score"
    
    self.postMessage({ type: 'RESULT', score: confidenceScore });
    
    src.delete();
    dst.delete();
  }
};
```

> 🛡️ **Fail-Safe Mechanism:** 
> If the confidence score drops below the required threshold, the UI flashes red, and the Inspector is cryptographically prevented from verifying the drug.
