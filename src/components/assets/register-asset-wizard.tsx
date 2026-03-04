"use client";

import { useState, useCallback, useRef, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Camera,
  Upload,
  QrCode,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Building2,
  Tag,
  MapPin,
  Info,
  Barcode,
  ScanLine,
  CheckCircle2,
  Pencil,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Hash,
  Paperclip,
  Trash2,
  Download,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrg } from "@/components/layout/org-provider";
import { type Asset, type AssetAttachment, type Condition, type LifecycleStage } from "@/data/sample-data";
import {
  lookupByBarcode,
  lookupBySerialPhoto,
  lookupByQR,
  DEMO_OCR_OUTPUTS,
  type ScanResult,
  type ManufacturerProduct,
} from "@/data/manufacturer-db";

// ─── Types ───────────────────────────────────────────────────────────

type ScanSource = "barcode" | "serial_photo" | "qr_code" | "manual";

interface WizardAttachment {
  id: string;
  name: string;
  type: AssetAttachment["type"];
  mimeType: string;
  size: string;
  url: string;
  source: "manufacturer_auto" | "user_upload";
}

interface WizardData {
  // Step 1: Where
  propertyId: string;
  location: string;
  // Step 2: What
  category: string;
  // Step 3: Scan (optional)
  scanMethod: "none" | "barcode_photo" | "serial_photo" | "camera" | "qr_photo";
  uploadedImage: string | null;
  scanResult: ScanResult | null;
  scanConfirmed: boolean;
  // Step 4: Details
  name: string;
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  // Step 5: Condition & Lifecycle
  condition: Condition;
  lifecycleStage: LifecycleStage;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiration: string;
  // Specs (from scan)
  specs: Record<string, string>;
  productUrl: string;
  // Step 6: Attachments
  attachments: WizardAttachment[];
  // Step 7: Parent asset
  parentId: string;
}

const initialData: WizardData = {
  propertyId: "",
  location: "",
  category: "",
  scanMethod: "none",
  uploadedImage: null,
  scanResult: null,
  scanConfirmed: false,
  name: "",
  description: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  condition: "Good",
  lifecycleStage: "Active",
  purchaseDate: "",
  purchaseCost: "",
  warrantyExpiration: "",
  specs: {},
  productUrl: "",
  attachments: [],
  parentId: "",
};

// ─── Step definitions ────────────────────────────────────────────────

type StepId = "where" | "what" | "scan" | "scan-confirm" | "details" | "condition" | "attachments" | "review";

interface StepDef {
  id: StepId;
  label: string;
  icon: typeof Building2;
  question: string;
}

const ALL_STEPS: StepDef[] = [
  { id: "where", label: "Location", icon: MapPin, question: "Where is this asset?" },
  { id: "what", label: "Category", icon: Tag, question: "What type of asset is this?" },
  { id: "scan", label: "Identify", icon: QrCode, question: "Let's identify this asset" },
  { id: "scan-confirm", label: "Confirm", icon: CheckCircle2, question: "Confirm identified data" },
  { id: "details", label: "Details", icon: Info, question: "Tell us about this asset" },
  { id: "condition", label: "Status", icon: ScanLine, question: "What condition is it in?" },
  { id: "attachments", label: "Attachments", icon: Paperclip, question: "Attach documentation" },
  { id: "review", label: "Review", icon: Check, question: "Review & register" },
];

function getActiveSteps(data: WizardData): StepDef[] {
  return ALL_STEPS.filter((s) => {
    if (s.id === "scan-confirm") return data.scanResult?.product !== null && data.scanResult !== null;
    return true;
  });
}

// ─── Source label helpers ────────────────────────────────────────────

function getScanSourceLabel(source: ScanSource): string {
  switch (source) {
    case "barcode": return "Barcode scan";
    case "serial_photo": return "Serial plate photo (OCR)";
    case "qr_code": return "QR code scan";
    case "manual": return "Manual entry";
    default: return "Scan";
  }
}

function getScanSourceIcon(source: ScanSource) {
  switch (source) {
    case "barcode": return Barcode;
    case "serial_photo": return FileText;
    case "qr_code": return QrCode;
    default: return ScanLine;
  }
}

// ─── Asset Tag Generator ─────────────────────────────────────────────

function generateAssetTag(orgShortName: string, category: string): string {
  const catAbbrev = category.split(/[\s&]+/).map(w => w[0]).join("").toUpperCase().slice(0, 4);
  const num = Math.floor(Math.random() * 900) + 100;
  return `${orgShortName}-NEW-${catAbbrev}-${num}`;
}

// ─── Component ───────────────────────────────────────────────────────

interface RegisterAssetWizardProps {
  open: boolean;
  onClose: () => void;
}

export default function RegisterAssetWizard({ open, onClose }: RegisterAssetWizardProps) {
  const router = useRouter();
  const { orgData, currentOrg, addAsset } = useOrg();
  const { properties, categories, assets } = orgData;

  const [data, setData] = useState<WizardData>({ ...initialData });
  const [currentStepId, setCurrentStepId] = useState<StepId>("where");
  const [isScanning, setIsScanning] = useState(false);
  const [scanningLabel, setScanningLabel] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const barcodeFileRef = useRef<HTMLInputElement>(null);
  const serialFileRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeSteps = getActiveSteps(data);
  const currentStepIndex = activeSteps.findIndex((s) => s.id === currentStepId);
  const currentStep = activeSteps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === activeSteps.length - 1;
  const progress = ((currentStepIndex + 1) / activeSteps.length) * 100;

  // Reset on open
  useEffect(() => {
    if (open) {
      setData({ ...initialData });
      setCurrentStepId("where");
      setShowSuccess(false);
    }
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Auto-scroll the step carousel to keep the active step visible
  useEffect(() => {
    const activeBtn = stepRefs.current.get(currentStepId);
    const container = stepsContainerRef.current;
    if (activeBtn && container) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;

      // If the button is out of view to the right
      if (btnLeft + btnWidth > scrollLeft + containerWidth - 32) {
        container.scrollTo({
          left: btnLeft - containerWidth / 2 + btnWidth / 2,
          behavior: "smooth",
        });
      }
      // If the button is out of view to the left
      if (btnLeft < scrollLeft + 32) {
        container.scrollTo({
          left: btnLeft - containerWidth / 2 + btnWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [currentStepId]);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < activeSteps.length) {
      setCurrentStepId(activeSteps[nextIdx].id);
    }
  };

  const goBack = () => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStepId(activeSteps[prevIdx].id);
    }
  };

  const canAdvance = (): boolean => {
    switch (currentStepId) {
      case "where":
        return data.propertyId !== "";
      case "what":
        return data.category !== "";
      case "scan":
        return true; // always optional
      case "scan-confirm":
        return data.scanConfirmed;
      case "details":
        return data.name.trim() !== "";
      case "condition":
        return true;
      case "attachments":
        return true; // attachments are optional
      case "review":
        return true;
      default:
        return true;
    }
  };

  // Apply scan result to wizard data
  const applyScanResult = (result: ScanResult) => {
    const product = result.product;
    if (!product) return;

    const patch: Partial<WizardData> = {
      scanResult: result,
      scanConfirmed: false,
      manufacturer: product.manufacturer,
      model: product.model,
      serialNumber: product.serialNumber,
      description: product.description || "",
      name: `${product.manufacturer} ${product.model}`,
    };

    // Apply category if matched and available in org
    if (product.category && categories.includes(product.category)) {
      patch.category = product.category;
    }

    // Apply specs
    const specs: Record<string, string> = {};
    const s = product.specs;
    if (s.dimensions) specs["Dimensions"] = s.dimensions;
    if (s.weight) specs["Weight"] = s.weight;
    if (s.voltage) specs["Electrical"] = s.voltage;
    if (s.amperage) specs["Amperage"] = s.amperage;
    if (s.capacity) specs["Capacity"] = s.capacity;
    if (s.refrigerant) specs["Refrigerant"] = s.refrigerant;
    if (s.horsepower) specs["Motor"] = s.horsepower;
    if (s.warrantyYears) specs["Warranty"] = `${s.warrantyYears} year(s)`;
    if (s.certifications) specs["Certifications"] = s.certifications.join(", ");
    if (s.msrp) specs["MSRP"] = `$${s.msrp.toLocaleString()}`;
    patch.specs = specs;

    if (s.msrp) patch.purchaseCost = s.msrp.toString();
    if (product.productUrl) patch.productUrl = product.productUrl;

    // Auto-import manufacturer documentation as attachments
    if (product.documentation && product.documentation.length > 0) {
      const autoAttachments: WizardAttachment[] = product.documentation.map((doc, i) => ({
        id: `mfg-doc-${Date.now()}-${i}`,
        name: doc.name,
        type: doc.type,
        mimeType: "application/pdf",
        size: doc.size,
        url: doc.url,
        source: "manufacturer_auto" as const,
      }));
      patch.attachments = autoAttachments;
    }

    update(patch);
  };

  // ── Scan handlers ──

  const handleBarcodeScan = (imageDataUrl: string) => {
    setIsScanning(true);
    setScanningLabel("Decoding barcode...");
    update({ scanMethod: "barcode_photo", uploadedImage: imageDataUrl });

    setTimeout(() => {
      setScanningLabel("Looking up manufacturer database...");
      setTimeout(() => {
        const result = lookupByBarcode("012345678905");
        if (result.product) {
          applyScanResult(result);
          setCurrentStepId("scan-confirm");
        }
        setIsScanning(false);
      }, 1000);
    }, 800);
  };

  const handleSerialPhotoScan = (imageDataUrl: string) => {
    setIsScanning(true);
    setScanningLabel("Running OCR on serial plate...");
    update({ scanMethod: "serial_photo", uploadedImage: imageDataUrl });

    setTimeout(() => {
      setScanningLabel("Extracting text from image...");
      setTimeout(() => {
        setScanningLabel("Matching against manufacturer database...");
        setTimeout(() => {
          const ocrText = DEMO_OCR_OUTPUTS.perlick_serial_plate;
          const result = lookupBySerialPhoto(ocrText);
          if (result.product) {
            applyScanResult(result);
            setCurrentStepId("scan-confirm");
          }
          setIsScanning(false);
        }, 800);
      }, 1000);
    }, 1200);
  };

  const handleCameraScan = () => {
    setIsScanning(true);
    setScanningLabel("Accessing camera...");
    update({ scanMethod: "camera" });

    setTimeout(() => {
      setScanningLabel("Scanning for barcode or QR code...");
      setTimeout(() => {
        setScanningLabel("Barcode detected! Looking up...");
        setTimeout(() => {
          const result = lookupByQR("https://store.perlick.com/bbsn52");
          if (result.product) {
            applyScanResult(result);
            setCurrentStepId("scan-confirm");
          }
          setIsScanning(false);
        }, 600);
      }, 1200);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "barcode" | "serial") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === "barcode") {
          handleBarcodeScan(result);
        } else {
          handleSerialPhotoScan(result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // ── Register handler — builds full Asset and persists to org ──

  const handleRegister = () => {
    const selectedProperty = properties.find((p) => p.id === data.propertyId);
    const assetId = `ast-new-${Date.now()}`;
    const assetTag = generateAssetTag(currentOrg.shortName, data.category);
    const today = new Date().toISOString().split("T")[0];

    const attachments: AssetAttachment[] = data.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      mimeType: a.mimeType,
      size: a.size,
      url: a.url,
      source: a.source,
      addedDate: today,
    }));

    const newAsset: Asset = {
      id: assetId,
      name: data.name,
      description: data.description,
      category: data.category,
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      purchaseDate: data.purchaseDate || today,
      purchaseCost: data.purchaseCost ? parseFloat(data.purchaseCost) : 0,
      warrantyExpiration: data.warrantyExpiration || "",
      propertyId: data.propertyId,
      propertyName: selectedProperty?.name || "",
      location: data.location,
      condition: data.condition,
      lifecycleStage: data.lifecycleStage,
      parentId: data.parentId || null,
      lastServiceDate: today,
      nextServiceDue: "",
      totalMaintenanceCost: 0,
      workOrderCount: 0,
      assetTag,
      attachments: attachments.length > 0 ? attachments : undefined,
      specs: Object.keys(data.specs).length > 0 ? data.specs : undefined,
      productUrl: data.productUrl || undefined,
    };

    addAsset(newAsset);
    setLastCreatedId(assetId);
    setCreatedCount((c) => c + 1);
    setShowSuccess(true);
  };

  const handleCreateAnother = () => {
    const keepProperty = data.propertyId;
    const keepLocation = data.location;
    setData({ ...initialData, propertyId: keepProperty, location: keepLocation });
    setCurrentStepId("what");
    setShowSuccess(false);
  };

  const handleDone = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!open) return null;

  const selectedProperty = properties.find((p) => p.id === data.propertyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--primary)]/10 p-2">
              <Plus className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Register New Asset</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {currentOrg.name}
                {createdCount > 0 && ` · ${createdCount} registered this session`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--muted)]">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
            style={{ width: showSuccess ? "100%" : `${progress}%` }}
          />
        </div>

        {/* Step indicators — scrollable carousel */}
        {!showSuccess && (
          <div className="relative border-b border-[var(--border)]/50">
            {/* Fade edges when scrollable */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--card)] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--card)] to-transparent z-10" />

            <div
              ref={stepsContainerRef}
              className="flex items-center gap-1 px-6 py-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {activeSteps.map((step, i) => {
                const isActive = step.id === currentStepId;
                const isComplete = i < currentStepIndex;
                return (
                  <Fragment key={step.id}>
                    {i > 0 && (
                      <div
                        className={cn(
                          "h-px w-4 shrink-0 transition-colors duration-300",
                          isComplete ? "bg-emerald-400 dark:bg-emerald-500" : "bg-[var(--border)]"
                        )}
                      />
                    )}
                    <button
                      ref={(el) => {
                        if (el) stepRefs.current.set(step.id, el);
                      }}
                      onClick={() => isComplete && setCurrentStepId(step.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all whitespace-nowrap shrink-0",
                        isActive && "bg-[var(--primary)]/10 text-[var(--primary)]",
                        isComplete && "text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
                        !isActive && !isComplete && "text-[var(--muted-foreground)]"
                      )}
                      disabled={!isComplete}
                    >
                      {isComplete ? (
                        <Check className="h-3 w-3 shrink-0" />
                      ) : (
                        <step.icon className="h-3 w-3 shrink-0" />
                      )}
                      <span>{step.label}</span>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {showSuccess ? (
            <SuccessScreen
              data={data}
              propertyName={selectedProperty?.name || ""}
              onCreateAnother={handleCreateAnother}
              onDone={handleDone}
              onViewAsset={(assetId) => {
                onClose();
                router.push(`/assets/${assetId}`);
              }}
              createdCount={createdCount}
              lastCreatedId={lastCreatedId}
            />
          ) : (
            <>
              {/* Step question */}
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                {currentStep?.question}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                {getStepSubtext(currentStepId, data, currentOrg.propertyLabel)}
              </p>

              {/* Step content */}
              {currentStepId === "where" && (
                <StepWhere
                  data={data}
                  update={update}
                  properties={properties}
                  propertyLabel={currentOrg.propertyLabel}
                />
              )}
              {currentStepId === "what" && (
                <StepWhat data={data} update={update} categories={categories} />
              )}
              {currentStepId === "scan" && (
                <StepScan
                  isScanning={isScanning}
                  scanningLabel={scanningLabel}
                  onBarcodeUpload={() => barcodeFileRef.current?.click()}
                  onSerialUpload={() => serialFileRef.current?.click()}
                  onCamera={handleCameraScan}
                  onSkip={goNext}
                />
              )}
              {currentStepId === "scan-confirm" && (
                <StepScanConfirm data={data} update={update} categories={categories} />
              )}
              {currentStepId === "details" && (
                <StepDetails data={data} update={update} hasScanData={!!data.scanResult?.product} />
              )}
              {currentStepId === "condition" && (
                <StepCondition data={data} update={update} />
              )}
              {currentStepId === "attachments" && (
                <StepAttachments data={data} update={update} />
              )}
              {currentStepId === "review" && (
                <StepReview data={data} propertyName={selectedProperty?.name || ""} />
              )}
            </>
          )}
        </div>

        {/* Footer navigation */}
        {!showSuccess && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={isFirst}
              className="text-sm"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <div className="text-xs text-[var(--muted-foreground)]">
              Step {currentStepIndex + 1} of {activeSteps.length}
            </div>

            {isLast ? (
              <Button size="sm" onClick={handleRegister} disabled={!canAdvance()}>
                <Check className="mr-1.5 h-4 w-4" />
                Register Asset
              </Button>
            ) : (
              <Button size="sm" onClick={goNext} disabled={!canAdvance()}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={barcodeFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, "barcode")}
        />
        <input
          ref={serialFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, "serial")}
        />
      </div>
    </div>
  );
}

// ─── Step Subtext ────────────────────────────────────────────────────

function getStepSubtext(step: StepId, data: WizardData, propertyLabel: string): string {
  switch (step) {
    case "where":
      return `Select the ${propertyLabel.toLowerCase()} and specific location where this asset is installed.`;
    case "what":
      return "Choose the category that best describes this asset.";
    case "scan":
      return "Upload a photo of the barcode, serial plate, or QR code — or use your camera. We'll auto-fill manufacturer details.";
    case "scan-confirm": {
      const source = data.scanResult?.source;
      if (source === "serial_photo") {
        return "We extracted text from your serial plate photo using OCR. Please review the matched data and confirm.";
      }
      return "We found product data from your scan. Please review and confirm — you can edit any field.";
    }
    case "details":
      return data.scanResult?.product
        ? "Some fields were pre-filled from the scan. Add or edit any details."
        : "Enter the key identifying information for this asset.";
    case "condition":
      return "Rate the current condition and set the lifecycle status.";
    case "attachments": {
      const autoCount = data.attachments.filter(a => a.source === "manufacturer_auto").length;
      if (autoCount > 0) {
        return `We found ${autoCount} manufacturer document${autoCount > 1 ? "s" : ""} for this product. You can add more files below.`;
      }
      return "Attach manuals, spec sheets, warranty documents, or photos to this asset.";
    }
    case "review":
      return "Double-check everything before registering this asset.";
    default:
      return "";
  }
}

// ─── Step: Where ─────────────────────────────────────────────────────

function StepWhere({
  data,
  update,
  properties,
  propertyLabel,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  properties: { id: string; name: string; address?: string; city?: string }[];
  propertyLabel: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
          {propertyLabel}
        </label>
        <input
          type="text"
          placeholder={`Search ${propertyLabel.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        />
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)]">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => update({ propertyId: p.id })}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors",
                data.propertyId === p.id
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <div>
                <div className="font-medium">{p.name}</div>
                {p.city && (
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {p.address}, {p.city}
                  </div>
                )}
              </div>
              {data.propertyId === p.id && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
              No matches found
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
          Specific Location (optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Pump Island 3, Room 204, Main Hallway..."
          value={data.location}
          onChange={(e) => update({ location: e.target.value })}
          className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        />
      </div>
    </div>
  );
}

// ─── Step: What ──────────────────────────────────────────────────────

function StepWhat({
  data,
  update,
  categories,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  categories: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => update({ category: cat })}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all",
            data.category === cat
              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm"
              : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/30 hover:bg-[var(--muted)]"
          )}
        >
          <Tag className="h-4 w-4 shrink-0 opacity-60" />
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Step: Scan ──────────────────────────────────────────────────────

function StepScan({
  isScanning,
  scanningLabel,
  onBarcodeUpload,
  onSerialUpload,
  onCamera,
  onSkip,
}: {
  isScanning: boolean;
  scanningLabel: string;
  onBarcodeUpload: () => void;
  onSerialUpload: () => void;
  onCamera: () => void;
  onSkip: () => void;
}) {
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="h-20 w-20 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[var(--primary)] animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--foreground)]">{scanningLabel}</p>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse [animation-delay:200ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse [animation-delay:400ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary scan options */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onBarcodeUpload}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-6 text-center transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
        >
          <div className="rounded-xl bg-[var(--primary)]/10 p-3">
            <Barcode className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--foreground)]">Barcode Photo</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              UPC, EAN, Code128
            </div>
          </div>
        </button>

        <button
          onClick={onSerialUpload}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-6 text-center transition-all hover:border-amber-400/40 hover:bg-amber-50 dark:hover:bg-amber-500/5"
        >
          <div className="rounded-xl bg-amber-100 dark:bg-amber-500/10 p-3">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--foreground)]">Serial Plate Photo</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              OCR reads plate text
            </div>
          </div>
        </button>

        <button
          onClick={onCamera}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-6 text-center transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
        >
          <div className="rounded-xl bg-[var(--primary)]/10 p-3">
            <Camera className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--foreground)]">Use Camera</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              Live scan any code
            </div>
          </div>
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]/50 p-4">
        <p className="text-xs font-semibold text-[var(--foreground)] mb-2">How it works</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 rounded-full bg-[var(--primary)]/10 p-1"><Barcode className="h-3 w-3 text-[var(--primary)]" /></div>
            <div className="text-xs text-[var(--muted-foreground)]">
              <strong className="text-[var(--foreground)]">Barcode/QR:</strong> Decodes UPC and looks up the manufacturer product database instantly.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 p-1"><FileText className="h-3 w-3 text-amber-600 dark:text-amber-400" /></div>
            <div className="text-xs text-[var(--muted-foreground)]">
              <strong className="text-[var(--foreground)]">Serial Plate:</strong> Uses OCR (tesseract.js) to read text from the equipment data plate, then matches model/serial against the database.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted-foreground)]">or</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <button
        onClick={onSkip}
        className="w-full rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        Skip — I'll enter details manually
      </button>
    </div>
  );
}

// ─── Step: Scan Confirm ──────────────────────────────────────────────

function StepScanConfirm({
  data,
  update,
  categories,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  categories: string[];
}) {
  const [showOcrText, setShowOcrText] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const result = data.scanResult;
  const source = result?.source ?? "manual";
  const confidence = result?.confidence ?? 0;
  const SourceIcon = getScanSourceIcon(source);
  const autoDocCount = data.attachments.filter(a => a.source === "manufacturer_auto").length;

  const fields: { key: keyof WizardData; label: string }[] = [
    { key: "manufacturer", label: "Manufacturer" },
    { key: "model", label: "Model" },
    { key: "serialNumber", label: "Serial Number" },
    { key: "name", label: "Asset Name" },
    { key: "description", label: "Description" },
  ];

  return (
    <div className="space-y-4">
      {/* Source + confidence banner */}
      <div className={cn(
        "rounded-xl border p-4",
        confidence >= 85
          ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5"
          : confidence >= 60
          ? "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5"
          : "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SourceIcon className={cn("h-4 w-4", confidence >= 85 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")} />
            <span className={cn("text-sm font-medium", confidence >= 85 ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300")}>
              {getScanSourceLabel(source)}
            </span>
          </div>
          <Badge className={cn(
            "text-[10px]",
            confidence >= 85
              ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
          )}>
            {confidence}% match
          </Badge>
        </div>
        <p className={cn("text-xs mt-1", confidence >= 85 ? "text-emerald-700 dark:text-emerald-400/70" : "text-amber-700 dark:text-amber-400/70")}>
          {result?.matchedFields.length} fields populated · Review and edit below before confirming.
        </p>
      </div>

      {/* Manufacturer documentation found tooltip */}
      {autoDocCount > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 p-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                Manufacturer documentation found!
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400/70 mt-0.5">
                {autoDocCount} document{autoDocCount > 1 ? "s" : ""} from the manufacturer will be auto-attached to this asset. You can review and add more in the Attachments step.
              </p>
              <div className="mt-2 space-y-1">
                {data.attachments.filter(a => a.source === "manufacturer_auto").map((att) => (
                  <div key={att.id} className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-400">
                    <BookOpen className="h-3 w-3" />
                    <span>{att.name}</span>
                    <span className="text-blue-500/60">({att.size})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR raw text toggle (only for serial plate scans) */}
      {source === "serial_photo" && result?.rawText && (
        <div className="rounded-lg border border-[var(--border)]">
          <button
            onClick={() => setShowOcrText(!showOcrText)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>View extracted OCR text</span>
            </div>
            {showOcrText ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showOcrText && (
            <div className="border-t border-[var(--border)] px-3 py-2.5">
              <pre className="text-[11px] font-mono text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">
                {result.rawText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Editable fields */}
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {field.label}
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                value={data[field.key] as string}
                onChange={(e) => update({ [field.key]: e.target.value })}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 pr-8 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              />
              <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--muted-foreground)]" />
            </div>
          </div>
        ))}

        {data.scanResult?.product?.category && (
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Suggested Category
            </label>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                {data.category}
              </Badge>
              <span className="text-xs text-[var(--muted-foreground)]">from scan data</span>
            </div>
          </div>
        )}
      </div>

      {/* Specs accordion */}
      {Object.keys(data.specs).length > 0 && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>Product Specifications</span>
              <Badge className="text-[9px] bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]">
                {Object.keys(data.specs).length} fields
              </Badge>
            </div>
            {showSpecs ? <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />}
          </button>
          {showSpecs && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]/50">
              {Object.entries(data.specs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-[var(--muted-foreground)]">{key}</span>
                  <span className="text-xs font-medium text-[var(--foreground)]">{value}</span>
                </div>
              ))}
              {data.productUrl && (
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-[var(--muted-foreground)]">Product Page</span>
                  <a
                    href={data.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    View <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Button
        className="w-full"
        size="sm"
        onClick={() => update({ scanConfirmed: true })}
        disabled={data.scanConfirmed}
      >
        {data.scanConfirmed ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            Data Confirmed
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Confirm Scanned Data
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Step: Details ───────────────────────────────────────────────────

function StepDetails({
  data,
  update,
  hasScanData,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  hasScanData: boolean;
}) {
  const source = data.scanResult?.source;
  const sourceLabel = source === "serial_photo" ? "OCR" : source === "barcode" ? "Barcode" : source === "qr_code" ? "QR" : "Scan";

  const fields = [
    { key: "name" as keyof WizardData, label: "Asset Name *", placeholder: "e.g. Main HVAC Unit", prefilled: hasScanData && !!data.name },
    { key: "description" as keyof WizardData, label: "Description", placeholder: "Brief description of the asset", prefilled: hasScanData && !!data.description },
    { key: "manufacturer" as keyof WizardData, label: "Manufacturer", placeholder: "e.g. Carrier, Honeywell, Perlick", prefilled: hasScanData && !!data.manufacturer },
    { key: "model" as keyof WizardData, label: "Model", placeholder: "e.g. BBSN52, 24ACC636A003", prefilled: hasScanData && !!data.model },
    { key: "serialNumber" as keyof WizardData, label: "Serial Number", placeholder: "e.g. PE-2024-3847291", prefilled: hasScanData && !!data.serialNumber },
  ];

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {field.label}
            </label>
            {field.prefilled && (
              <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                From {sourceLabel}
              </Badge>
            )}
          </div>
          <input
            type="text"
            placeholder={field.placeholder}
            value={data[field.key] as string}
            onChange={(e) => update({ [field.key]: e.target.value })}
            className={cn(
              "mt-1 h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30",
              field.prefilled
                ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
            )}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Step: Condition ─────────────────────────────────────────────────

const CONDITIONS: { value: Condition; label: string; desc: string; color: string }[] = [
  { value: "Excellent", label: "Excellent", desc: "Like new, fully operational", color: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { value: "Good", label: "Good", desc: "Working well, minor wear", color: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300" },
  { value: "Fair", label: "Fair", desc: "Functional, needs attention soon", color: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" },
  { value: "Poor", label: "Poor", desc: "Degraded, frequent issues", color: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300" },
  { value: "Critical", label: "Critical", desc: "Failing, needs immediate action", color: "border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" },
];

const LIFECYCLE_STAGES: { value: LifecycleStage; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Under Maintenance", label: "Under Maintenance" },
  { value: "Flagged for Replacement", label: "Flagged for Replacement" },
  { value: "Decommissioned", label: "Decommissioned" },
];

function StepCondition({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
          Condition Rating
        </label>
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ condition: c.value })}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                data.condition === c.value ? c.color + " shadow-sm" : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <div>
                <div className="text-sm font-medium">{c.label}</div>
                <div className="text-xs opacity-70">{c.desc}</div>
              </div>
              {data.condition === c.value && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
          Lifecycle Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LIFECYCLE_STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => update({ lifecycleStage: s.value })}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                data.lifecycleStage === s.value
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Purchase Date
          </label>
          <input
            type="date"
            value={data.purchaseDate}
            onChange={(e) => update({ purchaseDate: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Cost
          </label>
          <input
            type="text"
            placeholder="$0.00"
            value={data.purchaseCost}
            onChange={(e) => update({ purchaseCost: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Warranty Exp.
          </label>
          <input
            type="date"
            value={data.warrantyExpiration}
            onChange={(e) => update({ warrantyExpiration: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step: Attachments ──────────────────────────────────────────────

function StepAttachments({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  const attachmentFileRef = useRef<HTMLInputElement>(null);
  const autoAttachments = data.attachments.filter(a => a.source === "manufacturer_auto");
  const userAttachments = data.attachments.filter(a => a.source === "user_upload");

  const handleUserFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: WizardAttachment[] = Array.from(files).map((file, i) => ({
      id: `user-doc-${Date.now()}-${i}`,
      name: file.name,
      type: "other" as const,
      mimeType: file.type || "application/octet-stream",
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
      source: "user_upload" as const,
    }));

    update({ attachments: [...data.attachments, ...newAttachments] });
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    update({ attachments: data.attachments.filter(a => a.id !== id) });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "manual": return BookOpen;
      case "spec_sheet": return FileText;
      case "warranty": return FileText;
      case "photo": return Camera;
      default: return Paperclip;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "manual": return "Manual";
      case "spec_sheet": return "Spec Sheet";
      case "warranty": return "Warranty";
      case "photo": return "Photo";
      default: return "File";
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-imported manufacturer docs */}
      {autoAttachments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-[var(--foreground)]">
              Auto-imported from manufacturer
            </span>
          </div>
          <div className="space-y-2">
            {autoAttachments.map((att) => {
              const TypeIcon = getTypeIcon(att.type);
              return (
                <div key={att.id} className="flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 px-4 py-3">
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-500/10 p-2">
                    <TypeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{att.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                        {getTypeLabel(att.type)}
                      </Badge>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{att.size}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User uploaded attachments */}
      {userAttachments.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-[var(--foreground)] mb-2 block">
            Your uploads
          </span>
          <div className="space-y-2">
            {userAttachments.map((att) => {
              const TypeIcon = getTypeIcon(att.type);
              return (
                <div key={att.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
                  <div className="rounded-lg bg-[var(--muted)] p-2">
                    <TypeIcon className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{att.name}</p>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{att.size}</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={() => attachmentFileRef.current?.click()}
        className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] px-6 py-8 text-center transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
      >
        <div className="rounded-xl bg-[var(--primary)]/10 p-3">
          <Upload className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--foreground)]">Upload attachments</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Manuals, spec sheets, warranty docs, photos, or any file
          </div>
        </div>
      </button>

      <input
        ref={attachmentFileRef}
        type="file"
        accept="*/*"
        multiple
        className="hidden"
        onChange={handleUserFileUpload}
      />

      {/* Summary */}
      {data.attachments.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]/50 px-3 py-2">
          <Paperclip className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <span className="text-xs text-[var(--muted-foreground)]">
            {data.attachments.length} file{data.attachments.length !== 1 ? "s" : ""} will be attached to this asset
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Step: Review ────────────────────────────────────────────────────

function StepReview({
  data,
  propertyName,
}: {
  data: WizardData;
  propertyName: string;
}) {
  const scanSource = data.scanResult?.source;
  const [showSpecs, setShowSpecs] = useState(false);

  const sections = [
    {
      title: "Location",
      items: [
        { label: "Property", value: propertyName },
        { label: "Specific Location", value: data.location || "—" },
      ],
    },
    {
      title: "Asset Info",
      items: [
        { label: "Category", value: data.category },
        { label: "Name", value: data.name },
        { label: "Description", value: data.description || "—" },
        { label: "Manufacturer", value: data.manufacturer || "—" },
        { label: "Model", value: data.model || "—" },
        { label: "Serial Number", value: data.serialNumber || "—" },
      ],
    },
    {
      title: "Status & Financials",
      items: [
        { label: "Condition", value: data.condition },
        { label: "Lifecycle", value: data.lifecycleStage },
        { label: "Purchase Date", value: data.purchaseDate || "—" },
        { label: "Cost", value: data.purchaseCost ? `$${data.purchaseCost}` : "—" },
        { label: "Warranty Exp.", value: data.warrantyExpiration || "—" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {scanSource && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2">
          {(() => { const Icon = getScanSourceIcon(scanSource); return <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />; })()}
          <span className="text-xs text-emerald-700 dark:text-emerald-400">
            Populated via {getScanSourceLabel(scanSource)} · {data.scanResult?.confidence}% confidence
          </span>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.title} className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="bg-[var(--muted)]/50 px-4 py-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {section.title}
            </h4>
          </div>
          <div className="divide-y divide-[var(--border)]/50">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-[var(--muted-foreground)]">{item.label}</span>
                <span className="text-sm font-medium text-[var(--foreground)] max-w-[60%] text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Specs in review */}
      {Object.keys(data.specs).length > 0 && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="flex w-full items-center justify-between bg-[var(--muted)]/50 px-4 py-2"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Product Specs ({Object.keys(data.specs).length})
            </h4>
            {showSpecs ? <ChevronUp className="h-3 w-3 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />}
          </button>
          {showSpecs && (
            <div className="divide-y divide-[var(--border)]/50">
              {Object.entries(data.specs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-[var(--muted-foreground)]">{key}</span>
                  <span className="text-xs font-medium text-[var(--foreground)]">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attachments in review */}
      {data.attachments.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="bg-[var(--muted)]/50 px-4 py-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Attachments ({data.attachments.length})
            </h4>
          </div>
          <div className="divide-y divide-[var(--border)]/50">
            {data.attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--foreground)] truncate">{att.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[var(--muted-foreground)]">{att.size}</span>
                  {att.source === "manufacturer_auto" && (
                    <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                      Auto
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Success Screen ──────────────────────────────────────────────────

function SuccessScreen({
  data,
  propertyName,
  onCreateAnother,
  onDone,
  onViewAsset,
  createdCount,
  lastCreatedId,
}: {
  data: WizardData;
  propertyName: string;
  onCreateAnother: () => void;
  onDone: () => void;
  onViewAsset: (assetId: string) => void;
  createdCount: number;
  lastCreatedId: string | null;
}) {
  const scanSource = data.scanResult?.source;

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      <h3 className="mt-5 text-xl font-bold text-[var(--foreground)]">Asset Registered!</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-sm">
        <strong>{data.name}</strong> has been added to <strong>{propertyName}</strong> and is now visible in the Asset Registry.
        {createdCount > 1 && ` You've registered ${createdCount} assets this session.`}
      </p>

      {scanSource && (
        <div className="mt-3 flex items-center gap-1.5">
          <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            {getScanSourceLabel(scanSource)}
          </Badge>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 w-full max-w-sm text-left">
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <span className="text-[var(--muted-foreground)]">Category</span>
          <span className="text-[var(--foreground)] font-medium text-right">{data.category}</span>
          <span className="text-[var(--muted-foreground)]">Manufacturer</span>
          <span className="text-[var(--foreground)] font-medium text-right">{data.manufacturer || "—"}</span>
          <span className="text-[var(--muted-foreground)]">Model</span>
          <span className="text-[var(--foreground)] font-medium text-right">{data.model || "—"}</span>
          <span className="text-[var(--muted-foreground)]">Condition</span>
          <span className="text-[var(--foreground)] font-medium text-right">{data.condition}</span>
          <span className="text-[var(--muted-foreground)]">Status</span>
          <span className="text-[var(--foreground)] font-medium text-right">{data.lifecycleStage}</span>
          {data.attachments.length > 0 && (
            <>
              <span className="text-[var(--muted-foreground)]">Attachments</span>
              <span className="text-[var(--foreground)] font-medium text-right">
                {data.attachments.length} file{data.attachments.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onDone}>
          Done
        </Button>
        {lastCreatedId && (
          <Button variant="outline" size="sm" onClick={() => onViewAsset(lastCreatedId)}>
            <Eye className="mr-1.5 h-4 w-4" />
            View Asset
          </Button>
        )}
        <Button size="sm" onClick={onCreateAnother}>
          <Plus className="mr-1.5 h-4 w-4" />
          Register Another
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
