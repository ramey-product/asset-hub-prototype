# Asset Hub — Scan & Recognition Dependencies

This document tracks the external libraries required for the barcode scanning, QR reading, and OCR (serial plate photo recognition) features in the Register Asset wizard.

## Current Status: Prototype (Simulated)

The wizard currently **simulates** scan/OCR behavior using a local manufacturer product database (`src/data/manufacturer-db.ts`). No external scan libraries are loaded at runtime yet. When moving to production, install the packages below.

---

## Required Libraries

### 1. Tesseract.js — OCR (Serial Plate Photo Recognition)

| Field | Value |
|-------|-------|
| **Package** | `tesseract.js` |
| **Version** | `^6.0.0` |
| **NPM** | https://www.npmjs.com/package/tesseract.js |
| **GitHub** | https://github.com/naptha/tesseract.js |
| **Purpose** | Extract text from photos of serial number plates, data plates, and labels |
| **Runs in** | Browser (WebAssembly) — no server needed |
| **Size** | ~2-3 MB (WASM engine + English training data) |
| **Maintained** | Yes — active project, v6 released 2025 |

**Install:**
```bash
npm install tesseract.js
```

**Usage pattern:**
```typescript
import Tesseract from 'tesseract.js';

const result = await Tesseract.recognize(imageFile, 'eng');
const extractedText = result.data.text;
// Pass to lookupBySerialPhoto(extractedText) from manufacturer-db.ts
```

**Notes:**
- Runs entirely client-side via Web Workers (no server round-trip)
- Pre-process images for best results: grayscale, high contrast, deskew
- Supports 100+ languages but we only need `eng` for equipment plates
- Training data is lazy-loaded on first use

---

### 2. @zxing/browser — Barcode & QR Code Scanning

| Field | Value |
|-------|-------|
| **Package** | `@zxing/browser` + `@zxing/library` |
| **Version** | `^0.1.6` / `^0.21.3` |
| **NPM** | https://www.npmjs.com/package/@zxing/browser |
| **GitHub** | https://github.com/zxing-js/library |
| **Purpose** | Scan 1D barcodes (UPC, EAN, Code128) and 2D codes (QR) from camera or image |
| **Runs in** | Browser |
| **Maintained** | Maintenance mode — stable, accepting patches |

**Install:**
```bash
npm install @zxing/browser @zxing/library
```

**Usage pattern:**
```typescript
import { BrowserMultiFormatReader } from '@zxing/browser';

const reader = new BrowserMultiFormatReader();
// From image element:
const result = await reader.decodeFromImageElement(imgElement);
// From camera:
await reader.decodeFromVideoDevice(deviceId, videoElement, (result) => {
  if (result) {
    const upc = result.getText();
    // Pass to lookupByBarcode(upc) from manufacturer-db.ts
  }
});
```

**Alternative (if zxing maintenance stalls):**
- `@scanapp/html5-qrcode` — active fork of html5-qrcode
- `zbar-wasm` — WebAssembly port of ZBar (C-based, very fast)

---

### 3. react-zxing (Optional — React wrapper)

| Field | Value |
|-------|-------|
| **Package** | `react-zxing` |
| **Version** | `^2.0.2` |
| **NPM** | https://www.npmjs.com/package/react-zxing |
| **Purpose** | React hook (`useZxing`) for easy camera barcode scanning |
| **Maintained** | Community-maintained |

```bash
npm install react-zxing
```

---

## File Structure

```
asset-hub/
├── docs/
│   └── DEPENDENCIES.md          ← This file
├── src/
│   ├── data/
│   │   └── manufacturer-db.ts   ← Product lookup database + scan simulation
│   └── components/
│       └── assets/
│           └── register-asset-wizard.tsx  ← Wizard with scan UI
```

## Production Checklist

- [ ] `npm install tesseract.js @zxing/browser @zxing/library`
- [ ] Replace `simulateOCR()` in wizard with real Tesseract.js call
- [ ] Replace `simulateBarcodeScan()` with real @zxing/browser call
- [ ] Add image pre-processing (grayscale, contrast boost) before OCR
- [ ] Connect to external UPC lookup API for broader product coverage
- [ ] Add error handling for camera permissions denied
- [ ] Add loading states for WASM engine initialization (~2-3s first load)
- [ ] Test on mobile Safari and Chrome (camera access behavior differs)
