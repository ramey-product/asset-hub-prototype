"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  BookOpen,
  Loader2,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type AssetAttachment } from "@/data/sample-data";

// ─── Simulated PDF content for demo ──────────────────────────────────
// In production, this would use pdf.js or similar to render actual PDFs.
// For the prototype, we simulate multi-page PDF content with searchable text.

interface PDFPage {
  pageNum: number;
  title: string;
  content: string;
}

function getSimulatedPDFPages(attachment: AssetAttachment): PDFPage[] {
  if (attachment.name.toLowerCase().includes("installation") || attachment.name.toLowerCase().includes("manual")) {
    return [
      {
        pageNum: 1,
        title: "Cover Page",
        content: `${attachment.name}\n\nInstallation & Operation Manual\n\nFor authorized service personnel only.\n\nRead this manual thoroughly before installing, operating, or servicing this equipment.\n\nModel: BBSN52\nManufacturer: Perlick Corporation\nMilwaukee, WI 53224\n\nDocument Rev. 4.2 — 2024`,
      },
      {
        pageNum: 2,
        title: "Table of Contents",
        content: `TABLE OF CONTENTS\n\n1. Safety Precautions ........................ 3\n2. Product Specifications ................... 4\n3. Installation Requirements ............... 5\n4. Electrical Connections .................... 7\n5. Plumbing Connections .................... 9\n6. Initial Startup Procedure ............... 11\n7. Operation Guide ............................ 13\n8. Temperature Controls ..................... 15\n9. Cleaning & Maintenance ................ 17\n10. Troubleshooting ........................... 19\n11. Replacement Parts ....................... 22\n12. Warranty Information ................... 24`,
      },
      {
        pageNum: 3,
        title: "Safety Precautions",
        content: `1. SAFETY PRECAUTIONS\n\nWARNING: To reduce the risk of fire, electric shock, or injury, observe the following:\n\n• All installation and service must be performed by qualified personnel.\n• Disconnect power supply before servicing.\n• This unit must be properly grounded in accordance with local codes.\n• Do not store or use gasoline or other flammable liquids in the vicinity.\n• Keep the area around the unit clear of combustible materials.\n\nCAUTION: The refrigerant system contains R-290 (propane) refrigerant under pressure. Only EPA-certified technicians should service the sealed refrigerant system.\n\nNOTE: This equipment complies with UL 471 and NSF/ANSI 7 standards for commercial refrigeration.`,
      },
      {
        pageNum: 4,
        title: "Product Specifications",
        content: `2. PRODUCT SPECIFICATIONS\n\nModel: BBSN52\nType: Back Bar Refrigerator, Narrow Depth\nCapacity: 12.1 cu. ft.\nExterior Dimensions: 52"W x 24.25"D x 35.75"H\nWeight: 185 lbs (shipping weight: 210 lbs)\n\nRefrigerant: R-290 (Propane), 2.12 oz charge\nCompressor: 1/5 HP, 115V/60Hz/1Ph\nAmps: 2.8A running / 13.2A locked rotor\nBTU/hr: 1,850\n\nTemperature Range: 33°F to 41°F (±2°F)\nDefrost: Automatic, off-cycle\nInsulation: 2" foamed-in-place polyurethane\nDoors: 2 solid, self-closing with 90° stay-open\nShelves: 4 adjustable epoxy-coated wire\nLighting: LED interior, top-mounted\n\nFinish: Stainless steel exterior, aluminum interior\nCasters: 4 included (2 locking)\n\nETL Listed, NSF Certified, ENERGY STAR® Qualified`,
      },
      {
        pageNum: 5,
        title: "Installation Requirements",
        content: `3. INSTALLATION REQUIREMENTS\n\nLocation Requirements:\n• Install on a level surface capable of supporting the unit weight plus contents.\n• Minimum 4" clearance on all sides for proper air circulation.\n• Ambient temperature range: 60°F to 100°F.\n• Do not install near heat sources or in direct sunlight.\n• Indoor use only.\n\nElectrical Requirements:\n• Dedicated 115V/60Hz circuit with 15-amp breaker.\n• Three-prong grounded outlet within 6 feet of unit.\n• Do not use an extension cord.\n• Do not share circuit with other appliances.\n\nVentilation:\n• This unit uses R-290 refrigerant. Ensure adequate ventilation per local codes.\n• Minimum room volume: 1,079 cubic feet per unit.\n• Do not install in below-grade or poorly ventilated areas.\n\nReceiving & Unpacking:\n• Inspect unit for shipping damage before signing delivery receipt.\n• Allow unit to stand upright for 4 hours before powering on.\n• Remove all packaging materials and protective films.`,
      },
      {
        pageNum: 6,
        title: "Electrical Connections",
        content: `4. ELECTRICAL CONNECTIONS\n\nWARNING: All electrical work must conform to local and national electrical codes.\n\nPower Supply:\n• Voltage: 115V AC, 60Hz, single phase\n• Amperage: 15-amp dedicated circuit required\n• Wire gauge: 14 AWG minimum\n\nGrounding Instructions:\nThis unit must be grounded. In the event of an electrical short circuit, grounding reduces the risk of electric shock by providing an escape wire for the electric current.\n\nThe power cord is equipped with a three-prong grounding plug. Connect to a properly grounded three-prong outlet.\n\nDo not under any circumstances cut or remove the third (ground) prong from the power plug.\n\nPower Cord Specifications:\n• Length: 6 feet\n• Type: NEMA 5-15P plug\n• Rating: 15A / 125V`,
      },
      {
        pageNum: 7,
        title: "Troubleshooting",
        content: `10. TROUBLESHOOTING\n\nUnit does not run:\n• Check power supply and circuit breaker.\n• Verify thermostat is set correctly.\n• Check for tripped overload protector — wait 5 minutes, restart.\n\nUnit runs but does not cool properly:\n• Ensure adequate ventilation clearance.\n• Clean condenser coils (see Maintenance section).\n• Check door gaskets for proper seal.\n• Verify thermostat setting.\n• Ambient temperature may be too high.\n\nExcessive noise or vibration:\n• Level the unit using adjustable casters.\n• Check for items contacting interior walls.\n• Verify unit is not touching adjacent equipment.\n\nWater leakage:\n• Check drain pan and evaporator for ice buildup.\n• Ensure drain line is not blocked.\n• Inspect door gaskets for wear.\n\nDoor does not close properly:\n• Check gasket condition and alignment.\n• Level the unit.\n• Verify door hinges are tight.\n• Self-closing mechanism may need adjustment.`,
      },
      {
        pageNum: 8,
        title: "Warranty Information",
        content: `12. WARRANTY INFORMATION\n\nPerlick Corporation warrants this product against defects in materials and workmanship:\n\nCompressor: 5 years parts and labor\nSealed Refrigerant System: 5 years parts, 1 year labor\nAll Other Parts: 2 years parts, 1 year labor\n\nThis warranty is valid from date of original purchase and applies to the original purchaser only.\n\nWarranty Exclusions:\n• Damage from misuse, abuse, or improper installation\n• Normal wear items (gaskets, light bulbs, casters)\n• Damage from power surges or incorrect voltage\n• Units modified without written authorization\n• Commercial units used for non-commercial purposes\n\nTo obtain warranty service, contact:\nPerlick Corporation Service Department\nPhone: (800) 558-5592\nEmail: service@perlick.com\nWeb: www.perlick.com/support\n\nHave model number, serial number, and date of purchase available when calling.`,
      },
    ];
  }

  if (attachment.name.toLowerCase().includes("spec sheet")) {
    return [
      {
        pageNum: 1,
        title: "Specification Sheet",
        content: `${attachment.name}\n\nPerlick BBSN52 — Back Bar Refrigerator, Narrow Depth\n\nDimensions: 52"W x 24.25"D x 35.75"H\nCapacity: 12.1 cu ft\nDoors: 2 solid, self-closing\nShelves: 4 adjustable epoxy-coated wire\n\nRefrigeration:\n• Refrigerant: R-290, 2.12 oz charge\n• Compressor: 1/5 HP hermetic\n• Temperature: 33°F to 41°F\n• Defrost: Automatic off-cycle\n• Insulation: 2" polyurethane\n\nElectrical: 115V/60Hz/1Ph, 2.8A\nFinish: Stainless Steel\nWeight: 185 lbs\n\nCertifications: ETL Listed, NSF Certified, ENERGY STAR® Qualified\n\nAccessories Included:\n• 4 epoxy-coated wire shelves\n• 4 casters (2 locking)\n• Owner's manual\n• Warranty card`,
      },
      {
        pageNum: 2,
        title: "Dimensional Drawing",
        content: `DIMENSIONAL DRAWING\n\n┌─────────────────────────────────────┐\n│         52" (1321mm)                │\n│  ┌─────────────┬─────────────┐      │\n│  │             │             │ 35.75"│\n│  │   Door 1    │   Door 2    │(908mm)│\n│  │             │             │      │\n│  └─────────────┴─────────────┘      │\n│        24.25" (616mm) depth         │\n└─────────────────────────────────────┘\n\nClearance Requirements:\n• Top: 4" minimum\n• Sides: 4" minimum\n• Rear: 4" minimum\n\nCutout Dimensions (built-in):\n• Width: 52.5"\n• Depth: 25"\n• Height: 36.5"\n\nNote: Not recommended for built-in installation due to R-290 ventilation requirements.`,
      },
    ];
  }

  // Generic fallback
  return [
    {
      pageNum: 1,
      title: "Document",
      content: `${attachment.name}\n\nThis document is attached to the asset record.\n\nType: ${attachment.type.replace("_", " ")}\nSize: ${attachment.size}\nSource: ${attachment.source === "manufacturer_auto" ? "Auto-imported from manufacturer database" : "Uploaded by user"}`,
    },
  ];
}

// ─── Search helpers ──────────────────────────────────────────────────

interface SearchMatch {
  pageNum: number;
  startIndex: number;
  length: number;
  context: string; // surrounding text snippet
}

function findMatches(pages: PDFPage[], query: string): SearchMatch[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const matches: SearchMatch[] = [];

  for (const page of pages) {
    const text = page.content.toLowerCase();
    let idx = 0;
    while ((idx = text.indexOf(q, idx)) !== -1) {
      const contextStart = Math.max(0, idx - 30);
      const contextEnd = Math.min(text.length, idx + q.length + 30);
      matches.push({
        pageNum: page.pageNum,
        startIndex: idx,
        length: q.length,
        context: "..." + page.content.slice(contextStart, contextEnd) + "...",
      });
      idx += q.length;
    }
  }

  return matches;
}

function highlightText(text: string, query: string): React.ReactNode[] {
  if (!query.trim()) return [text];
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let lastIndex = 0;

  let idx = 0;
  let key = 0;
  while ((idx = lower.indexOf(q, lastIndex)) !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <mark key={key++} className="bg-yellow-300 dark:bg-yellow-500/40 text-[var(--foreground)] rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    lastIndex = idx + q.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

// ─── Main Component ──────────────────────────────────────────────────

interface AttachmentPreviewModalProps {
  attachment: AssetAttachment;
  allAttachments: AssetAttachment[];
  onClose: () => void;
  onNavigate: (attachment: AssetAttachment) => void;
}

export default function AttachmentPreviewModal({
  attachment,
  allAttachments,
  onClose,
  onNavigate,
}: AttachmentPreviewModalProps) {
  const isPDF = attachment.mimeType === "application/pdf" || attachment.name.toLowerCase().endsWith(".pdf");
  const isImage = attachment.mimeType.startsWith("image/");

  const pages = isPDF ? getSimulatedPDFPages(attachment) : [];
  const totalPages = pages.length;

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null);

  const matches = findMatches(pages, searchQuery);
  const currentAttachmentIndex = allAttachments.findIndex((a) => a.id === attachment.id);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery("");
        } else {
          onClose();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "ArrowLeft" && !searchOpen) {
        if (isPDF && currentPage > 1) setCurrentPage((p) => p - 1);
      }
      if (e.key === "ArrowRight" && !searchOpen) {
        if (isPDF && currentPage < totalPages) setCurrentPage((p) => p + 1);
      }
      if (e.key === "Enter" && searchOpen && matches.length > 0) {
        if (e.shiftKey) {
          setCurrentMatchIndex((i) => (i - 1 + matches.length) % matches.length);
        } else {
          setCurrentMatchIndex((i) => (i + 1) % matches.length);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, currentPage, totalPages, isPDF, matches.length, onClose]);

  // Navigate to the page of the current match
  useEffect(() => {
    if (matches.length > 0 && matches[currentMatchIndex]) {
      setCurrentPage(matches[currentMatchIndex].pageNum);
    }
  }, [currentMatchIndex, matches]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setCurrentMatchIndex(0);
  }, []);

  const currentPageData = pages.find((p) => p.pageNum === currentPage);
  const matchesOnCurrentPage = matches.filter((m) => m.pageNum === currentPage);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 flex flex-col bg-[var(--background)] shadow-2xl overflow-hidden",
          isFullscreen
            ? "m-0 w-full h-full"
            : "m-6 rounded-xl border border-[var(--border)] max-w-5xl mx-auto w-full h-[calc(100vh-48px)]"
        )}
      >
        {/* ── Top Toolbar ── */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5 shrink-0 bg-[var(--card)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              {isPDF ? (
                <FileText className="h-4 w-4 text-[var(--primary)]" />
              ) : (
                <ImageIcon className="h-4 w-4 text-[var(--primary)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">{attachment.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--muted-foreground)]">{attachment.size}</span>
                {attachment.source === "manufacturer_auto" && (
                  <Badge className="text-[8px] bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 border">
                    Auto-imported
                  </Badge>
                )}
                <span className="text-[10px] capitalize text-[var(--muted-foreground)]">
                  {attachment.type.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Search toggle */}
            {isPDF && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", searchOpen && "bg-[var(--primary)]/10 text-[var(--primary)]")}
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
                  if (searchOpen) { setSearchQuery(""); }
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Zoom controls */}
            {isPDF && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-[10px] text-[var(--muted-foreground)] w-8 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}

            <div className="w-px h-5 bg-[var(--border)] mx-1" />

            {/* Download */}
            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </a>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {/* Close */}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Search Bar (collapsible) ── */}
        {searchOpen && isPDF && (
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2 bg-[var(--muted)]/30 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search in document..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-1.5 pl-8 pr-8 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <XCircle className="h-3.5 w-3.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">
                  {matches.length > 0
                    ? `${currentMatchIndex + 1} of ${matches.length}`
                    : "No results"}
                </span>
                {matches.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCurrentMatchIndex((i) => (i - 1 + matches.length) % matches.length)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCurrentMatchIndex((i) => (i + 1) % matches.length)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Document Body ── */}
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900/50" ref={pageContentRef}>
          {isPDF ? (
            <div className="flex justify-center py-8 px-4">
              <div
                className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-[var(--border)] transition-all duration-200"
                style={{
                  width: `${(8.5 * zoom) / 100 * 72}px`,
                  minHeight: `${(11 * zoom) / 100 * 72}px`,
                  fontSize: `${(14 * zoom) / 100}px`,
                }}
              >
                {currentPageData ? (
                  <div className="p-8">
                    {/* Page header */}
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                      <span
                        className="font-semibold text-zinc-800 dark:text-zinc-200"
                        style={{ fontSize: `${(16 * zoom) / 100}px` }}
                      >
                        {currentPageData.title}
                      </span>
                      <span
                        className="text-zinc-400 dark:text-zinc-500"
                        style={{ fontSize: `${(10 * zoom) / 100}px` }}
                      >
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>

                    {/* Page content with search highlighting */}
                    <div
                      className="whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-300 font-mono"
                      style={{ fontSize: `${(13 * zoom) / 100}px`, lineHeight: 1.7 }}
                    >
                      {searchQuery
                        ? highlightText(currentPageData.content, searchQuery)
                        : currentPageData.content}
                    </div>

                    {/* Match indicators on this page */}
                    {matchesOnCurrentPage.length > 0 && (
                      <div className="mt-6 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <span
                          className="text-zinc-400 dark:text-zinc-500"
                          style={{ fontSize: `${(10 * zoom) / 100}px` }}
                        >
                          {matchesOnCurrentPage.length} match{matchesOnCurrentPage.length !== 1 ? "es" : ""} on this page
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
                  </div>
                )}
              </div>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="max-w-full max-h-full rounded-lg overflow-hidden shadow-lg border border-[var(--border)] bg-white dark:bg-zinc-800">
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <ImageIcon className="h-16 w-16 text-[var(--muted-foreground)]/30 mb-4" />
                  <p className="text-sm font-medium text-[var(--foreground)]">{attachment.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Image preview — in production, the actual image would render here
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <FileText className="h-16 w-16 text-[var(--muted-foreground)]/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-[var(--foreground)]">{attachment.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Preview not available for this file type
                </p>
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="mt-4">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download to View
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Toolbar ── */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 shrink-0 bg-[var(--card)]">
          {/* Attachment navigator */}
          <div className="flex items-center gap-2">
            {allAttachments.length > 1 && (
              <>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  File {currentAttachmentIndex + 1} of {allAttachments.length}
                </span>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentAttachmentIndex <= 0}
                    onClick={() => {
                      if (currentAttachmentIndex > 0) {
                        onNavigate(allAttachments[currentAttachmentIndex - 1]);
                        setCurrentPage(1);
                        setSearchQuery("");
                      }
                    }}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentAttachmentIndex >= allAttachments.length - 1}
                    onClick={() => {
                      if (currentAttachmentIndex < allAttachments.length - 1) {
                        onNavigate(allAttachments[currentAttachmentIndex + 1]);
                        setCurrentPage(1);
                        setSearchQuery("");
                      }
                    }}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Page navigation (PDF only) */}
          {isPDF && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px]"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Prev
              </Button>

              {/* Page number buttons */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={cn(
                      "h-7 w-7 rounded text-[10px] font-medium transition-colors",
                      currentPage === pg
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px]"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="hidden sm:flex items-center gap-3 text-[9px] text-[var(--muted-foreground)]">
            <span><kbd className="px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[8px]">⌘F</kbd> Search</span>
            <span><kbd className="px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[8px]">←→</kbd> Pages</span>
            <span><kbd className="px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[8px]">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
