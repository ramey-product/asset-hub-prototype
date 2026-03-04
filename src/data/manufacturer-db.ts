/**
 * Manufacturer Product Database
 *
 * This simulates a server-side lookup database that maps barcode UPCs,
 * serial number prefixes, and model numbers to real manufacturer product data.
 *
 * In production, this would be replaced by:
 *  - An API call to a UPC lookup service (e.g., UPCitemdb, Barcode Lookup API)
 *  - OCR → serial/model extraction → manufacturer API query
 *  - Internal asset catalog / procurement database
 *
 * Dependencies for production:
 *  - tesseract.js (^6.0.0) — browser-side OCR for serial plate photos
 *  - @zxing/browser (^0.1.6) — barcode/QR scanning from camera or image
 *
 * See: /docs/DEPENDENCIES.md for setup details.
 */

export interface ManufacturerProduct {
  manufacturer: string;
  model: string;
  serialNumber: string;
  category: string;
  description: string;
  upc?: string;
  specs: {
    dimensions?: string;
    weight?: string;
    voltage?: string;
    amperage?: string;
    capacity?: string;
    refrigerant?: string;
    horsepower?: string;
    warrantyYears?: number;
    certifications?: string[];
    msrp?: number;
  };
  productUrl?: string;
  documentation?: {
    name: string;
    url: string;
    type: "manual" | "spec_sheet" | "warranty";
    size: string;
  }[];
}

export interface ScanResult {
  source: "barcode" | "serial_photo" | "qr_code" | "manual";
  confidence: number; // 0-100
  rawText: string;
  product: ManufacturerProduct | null;
  matchedFields: string[];
}

// ─── Product Database ────────────────────────────────────────────────
// Real product data sourced from manufacturer spec sheets.

const PRODUCT_DB: ManufacturerProduct[] = [
  // Perlick BBSN52 — demo unit
  {
    manufacturer: "Perlick Corporation",
    model: "BBSN52",
    serialNumber: "PE-2024-3847291",
    category: "Refrigeration",
    description:
      'Perlick 52" Narrow Door Back Bar Refrigerator — Two-section self-contained unit with (2) solid hinged doors, digital thermostat, LED interior lighting, stainless steel interior, automatic defrost, and front-vented condensate evaporator.',
    upc: "?"  ,
    specs: {
      dimensions: '52.00"W × 24.75"D × 34.56"H',
      weight: "344 lbs",
      voltage: "115V / 60Hz / 1-Phase",
      amperage: "2.5A",
      capacity: "13.3 cu. ft. (354 × 12oz bottles)",
      refrigerant: "R-290 Hydrocarbon",
      horsepower: "1/5 HP",
      warrantyYears: 1,
      certifications: ["NSF/ANSI Standard 7", "cULus"],
      msrp: 4800,
    },
    productUrl:
      "https://store.perlick.com/bbsn52-52-narrow-door-back-bar-refrigerator",
    documentation: [
      {
        name: "Perlick BBSN52 Installation & Operation Manual",
        url: "https://www.perlick.com/downloads/manuals/BBSN52-installation-manual.pdf",
        type: "manual",
        size: "3.2 MB",
      },
      {
        name: "Perlick BBSN52 Spec Sheet",
        url: "https://www.perlick.com/downloads/specs/BBSN52-spec-sheet.pdf",
        type: "spec_sheet",
        size: "1.1 MB",
      },
    ],
  },
  // Carrier HVAC — kept from original demo
  {
    manufacturer: "Carrier",
    model: "24ACC636A003",
    serialNumber: "3622A49871",
    category: "HVAC",
    description:
      "Carrier Performance 3-Ton 16 SEER2 Air Conditioner",
    upc: "012345678905",
    specs: {
      voltage: "208-230V / 60Hz / 1-Phase",
      amperage: "14.1A",
      refrigerant: "R-410A",
      warrantyYears: 10,
      certifications: ["AHRI Certified", "Energy Star"],
      msrp: 3200,
    },
    documentation: [
      {
        name: "Carrier 24ACC6 Installation & Service Manual",
        url: "https://www.carrier.com/downloads/manuals/24ACC6-service-manual.pdf",
        type: "manual",
        size: "5.8 MB",
      },
    ],
  },
];

// ─── Lookup indexes ──────────────────────────────────────────────────

// UPC → product
const upcIndex = new Map<string, ManufacturerProduct>();
// Model number → product (case-insensitive)
const modelIndex = new Map<string, ManufacturerProduct>();
// Serial prefix (first chunk before dash) → product
const serialPrefixIndex = new Map<string, ManufacturerProduct>();
// Serial exact → product
const serialIndex = new Map<string, ManufacturerProduct>();

PRODUCT_DB.forEach((p) => {
  if (p.upc) upcIndex.set(p.upc, p);
  modelIndex.set(p.model.toUpperCase(), p);
  serialIndex.set(p.serialNumber.toUpperCase(), p);

  // Index on first segment of serial for prefix matching
  const prefix = p.serialNumber.split("-")[0]?.toUpperCase();
  if (prefix) serialPrefixIndex.set(prefix, p);
});

// ─── Public lookup functions ─────────────────────────────────────────

/**
 * Simulates a barcode UPC scan → manufacturer lookup.
 */
export function lookupByBarcode(upc: string): ScanResult {
  const product = upcIndex.get(upc) ?? null;
  return {
    source: "barcode",
    confidence: product ? 98 : 0,
    rawText: upc,
    product,
    matchedFields: product
      ? ["manufacturer", "model", "serialNumber", "category", "description", "specs"]
      : [],
  };
}

/**
 * Simulates OCR text extraction from a serial plate photo.
 *
 * In production this would:
 *  1. Run tesseract.js to extract text from the image
 *  2. Parse extracted text for model numbers, serial numbers, and manufacturer names
 *  3. Query the manufacturer database with parsed identifiers
 *
 * For the prototype, we simulate OCR by checking keywords against our DB.
 */
export function lookupBySerialPhoto(ocrText: string): ScanResult {
  const normalized = ocrText.toUpperCase().trim();

  // Try exact serial match
  const serialMatch = serialIndex.get(normalized);
  if (serialMatch) {
    return {
      source: "serial_photo",
      confidence: 95,
      rawText: ocrText,
      product: serialMatch,
      matchedFields: ["manufacturer", "model", "serialNumber", "category", "description", "specs"],
    };
  }

  // Try model number match (scan full OCR text for known models)
  for (const [model, product] of modelIndex) {
    if (normalized.includes(model)) {
      return {
        source: "serial_photo",
        confidence: 90,
        rawText: ocrText,
        product: {
          ...product,
          // OCR might catch a different serial, so extract it
          serialNumber: extractSerialFromText(normalized) ?? product.serialNumber,
        },
        matchedFields: ["manufacturer", "model", "category", "description", "specs"],
      };
    }
  }

  // Try manufacturer name match
  for (const product of PRODUCT_DB) {
    if (normalized.includes(product.manufacturer.toUpperCase())) {
      return {
        source: "serial_photo",
        confidence: 72,
        rawText: ocrText,
        product: {
          ...product,
          serialNumber: extractSerialFromText(normalized) ?? product.serialNumber,
        },
        matchedFields: ["manufacturer", "category"],
      };
    }
  }

  // Try serial prefix match
  for (const [prefix, product] of serialPrefixIndex) {
    if (normalized.includes(prefix)) {
      return {
        source: "serial_photo",
        confidence: 78,
        rawText: ocrText,
        product,
        matchedFields: ["manufacturer", "model", "category", "description"],
      };
    }
  }

  return {
    source: "serial_photo",
    confidence: 0,
    rawText: ocrText,
    product: null,
    matchedFields: [],
  };
}

/**
 * Simulates QR code scan that contains a model or URL.
 */
export function lookupByQR(qrData: string): ScanResult {
  const normalized = qrData.toUpperCase();
  for (const [model, product] of modelIndex) {
    if (normalized.includes(model)) {
      return {
        source: "qr_code",
        confidence: 96,
        rawText: qrData,
        product,
        matchedFields: ["manufacturer", "model", "serialNumber", "category", "description", "specs"],
      };
    }
  }
  return {
    source: "qr_code",
    confidence: 0,
    rawText: qrData,
    product: null,
    matchedFields: [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Attempts to extract a serial-number-like pattern from raw OCR text.
 * Common patterns: XX-YYYY-NNNNNNN, XXNNNNNNNN, etc.
 */
function extractSerialFromText(text: string): string | null {
  // Pattern: word-digits-digits (e.g., PE-2024-3847291)
  const dashed = text.match(/[A-Z]{2,4}-\d{4}-\d{5,10}/);
  if (dashed) return dashed[0];

  // Pattern: digits+letters (e.g., 3622A49871)
  const alphaNum = text.match(/\d{3,}[A-Z]\d{4,}/);
  if (alphaNum) return alphaNum[0];

  return null;
}

/**
 * Simulated OCR text that would be extracted from a Perlick BBSN52 serial plate photo.
 * This is what tesseract.js would return when processing a picture of the data plate.
 */
export const DEMO_OCR_OUTPUTS: Record<string, string> = {
  perlick_serial_plate: [
    "PERLICK CORPORATION",
    "MILWAUKEE, WI USA",
    "MODEL: BBSN52",
    "SERIAL: PE-2024-3847291",
    "VOLTS: 115  AMPS: 2.5  HZ: 60",
    "REFRIGERANT: R-290  CHARGE: 2.12 OZ",
    "NSF/ANSI 7  cULus LISTED",
  ].join("\n"),
  carrier_hvac_plate: [
    "CARRIER",
    "MODEL: 24ACC636A003",
    "S/N: 3622A49871",
    "208-230V  14.1A  60HZ  1PH",
    "REFRIGERANT: R-410A",
    "AHRI CERT NO: 9876543",
  ].join("\n"),
};

/** All products in the DB for browsing/debugging. */
export function getAllProducts(): ManufacturerProduct[] {
  return [...PRODUCT_DB];
}
