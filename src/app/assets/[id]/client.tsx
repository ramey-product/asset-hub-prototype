"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  MapPin,
  Calendar,
  DollarSign,
  Wrench,
  QrCode,
  ChevronRight,
  Shield,
  Clock,
  Activity,
  FileText,
  AlertTriangle,
  Tag,
  Building,
  Cpu,
  ChevronDown,
  ExternalLink,
  Paperclip,
  Download,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Asset, type AssetAttachment } from "@/data/sample-data";
import { cn, formatCurrency, formatDate, getConditionBg, getLifecycleBg } from "@/lib/utils";
import { useState } from "react";
import { useOrg } from "@/components/layout/org-provider";
import AttachmentPreviewModal from "@/components/assets/attachment-preview-modal";
import { Eye } from "lucide-react";

function HierarchyNode({ assetId, currentId, allAssets, depth = 0 }: { assetId: string; currentId: string; allAssets: Asset[]; depth?: number }) {
  const asset = allAssets.find((a) => a.id === assetId);
  if (!asset) return null;

  const children = allAssets.filter((a) => a.parentId === assetId);
  const isCurrent = asset.id === currentId;

  return (
    <div className={cn("ml-0", depth > 0 && "ml-5 border-l border-[var(--border)] pl-4")}>
      <Link href={`/assets/${asset.id}`}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
            isCurrent
              ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {children.length > 0 ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <Cpu className="h-3 w-3 shrink-0 opacity-50" />
          )}
          <span className="truncate">{asset.name}</span>
          <Badge className={cn("ml-auto text-[9px] border shrink-0", getConditionBg(asset.condition))}>
            {asset.condition}
          </Badge>
        </div>
      </Link>
      {children.map((child) => (
        <HierarchyNode key={child.id} assetId={child.id} currentId={currentId} allAssets={allAssets} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function AssetDetailClient() {
  const params = useParams();
  const assetId = params.id as string;
  const { orgData } = useOrg();
  const { assets, recentWorkOrders } = orgData;
  const asset = assets.find((a) => a.id === assetId);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "hierarchy">("overview");
  const [previewAttachment, setPreviewAttachment] = useState<AssetAttachment | null>(null);

  if (!asset) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Asset not found</p>
      </div>
    );
  }

  const parent = asset.parentId ? assets.find((a) => a.id === asset.parentId) : null;
  const children = assets.filter((a) => a.parentId === asset.id);
  const rootId = parent ? parent.parentId ? assets.find(a => a.id === parent.parentId)?.id || parent.id : parent.id : asset.id;
  const relatedWOs = recentWorkOrders.filter((wo) => wo.assetId === asset.id);
  const warrantyExpired = new Date(asset.warrantyExpiration) < new Date();

  const isNewlyCreated = asset.id.startsWith("ast-new-");
  const today = new Date().toISOString().split("T")[0];

  const conditionHistory = isNewlyCreated
    ? [{ date: today, condition: asset.condition, note: "Initial registration" }]
    : [
        { date: "2025-06-15", condition: "Excellent", note: "Post-installation inspection" },
        { date: "2025-09-20", condition: "Good", note: "Routine maintenance check" },
        { date: "2025-12-10", condition: "Good", note: "Quarterly inspection" },
        { date: "2026-01-28", condition: asset.condition, note: "Most recent assessment" },
      ];

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: FileText },
    { key: "history" as const, label: "Maintenance History", icon: Clock },
    { key: "hierarchy" as const, label: "Hierarchy", icon: Box },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href="/assets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--foreground)]">{asset.name}</h1>
                <Badge className={cn("text-[10px] border", getConditionBg(asset.condition))}>
                  {asset.condition}
                </Badge>
                <Badge className={cn("text-[10px] border", getLifecycleBg(asset.lifecycleStage))}>
                  {asset.lifecycleStage}
                </Badge>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                {asset.assetTag} · {asset.propertyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <QrCode className="mr-2 h-3.5 w-3.5" />
              QR Code
            </Button>
            <Button variant="outline" size="sm">
              <Wrench className="mr-2 h-3.5 w-3.5" />
              Create Work Order
            </Button>
            <Button size="sm">
              Edit Asset
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="col-span-2 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  {
                    label: "Purchase Cost",
                    value: formatCurrency(asset.purchaseCost),
                    icon: DollarSign,
                    color: "text-emerald-700 dark:text-emerald-400",
                  },
                  {
                    label: "Maint. Cost",
                    value: formatCurrency(asset.totalMaintenanceCost),
                    icon: Wrench,
                    color: "text-blue-700 dark:text-blue-400",
                  },
                  {
                    label: "Work Orders",
                    value: asset.workOrderCount.toString(),
                    icon: FileText,
                    color: "text-violet-700 dark:text-violet-400",
                  },
                  {
                    label: "Warranty",
                    value: warrantyExpired ? "Expired" : formatDate(asset.warrantyExpiration),
                    icon: Shield,
                    color: warrantyExpired ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400",
                  },
                ].map((metric) => (
                  <Card key={metric.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <metric.icon className={cn("h-4 w-4", metric.color)} />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                          {metric.label}
                        </span>
                      </div>
                      <p className="mt-2 text-lg font-bold text-[var(--foreground)]">{metric.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Details Grid */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Asset Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      { label: "Manufacturer", value: asset.manufacturer },
                      { label: "Model", value: asset.model },
                      { label: "Serial Number", value: asset.serialNumber },
                      { label: "Category", value: asset.category },
                      { label: "Purchase Date", value: formatDate(asset.purchaseDate) },
                      { label: "Location", value: asset.location },
                      { label: "Last Service", value: formatDate(asset.lastServiceDate) },
                      { label: "Next Service Due", value: formatDate(asset.nextServiceDue) },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between border-b border-[var(--border)]/50 pb-2">
                        <span className="text-xs text-[var(--muted-foreground)]">{item.label}</span>
                        <span className="text-xs font-medium text-[var(--foreground)]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Condition History */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Condition History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-0">
                    {conditionHistory.map((entry, i) => (
                      <div key={i} className="flex gap-4 pb-4">
                        <div className="flex flex-col items-center">
                          <div className={cn("h-3 w-3 rounded-full border-2", getConditionBg(entry.condition))} />
                          {i < conditionHistory.length - 1 && (
                            <div className="w-px flex-1 bg-[var(--border)]" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-[10px] border", getConditionBg(entry.condition))}>
                              {entry.condition}
                            </Badge>
                            <span className="text-xs text-[var(--muted-foreground)]">{formatDate(entry.date)}</span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{entry.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Property Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[var(--primary)]/10 p-2">
                      <Building className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{asset.propertyName}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{asset.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hierarchy Preview */}
              {(parent || children.length > 0) && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Asset Hierarchy</CardTitle>
                      <button
                        onClick={() => setActiveTab("hierarchy")}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        Full view
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <HierarchyNode assetId={rootId} currentId={asset.id} allAssets={assets} />
                  </CardContent>
                </Card>
              )}

              {/* Related Work Orders */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Recent Work Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedWOs.length > 0 ? (
                    <div className="space-y-2">
                      {relatedWOs.map((wo) => (
                        <div key={wo.id} className="rounded-lg border border-[var(--border)] p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{wo.id}</span>
                            <Badge
                              className={cn(
                                "text-[9px] border",
                                wo.status === "Open" ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                                wo.status === "In Progress" ? "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20" :
                                "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                              )}
                            >
                              {wo.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs font-medium text-[var(--foreground)]">{wo.title}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            {wo.assignedTo} · {formatDate(wo.createdDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--muted-foreground)]">No recent work orders for this asset.</p>
                  )}
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      <Paperclip className="mr-2 inline h-4 w-4" />
                      Attachments
                    </CardTitle>
                    {asset.attachments && asset.attachments.length > 0 && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {asset.attachments.length} file{asset.attachments.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {asset.attachments && asset.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {asset.attachments.map((att) => (
                        <button
                          key={att.id}
                          onClick={() => setPreviewAttachment(att)}
                          className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-2.5 group hover:bg-[var(--muted)]/50 hover:border-[var(--primary)]/30 transition-colors w-full text-left cursor-pointer"
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              att.source === "manufacturer_auto"
                                ? "bg-blue-100 dark:bg-blue-500/10"
                                : "bg-zinc-100 dark:bg-zinc-500/10"
                            )}
                          >
                            <FileText
                              className={cn(
                                "h-4 w-4",
                                att.source === "manufacturer_auto"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-zinc-500 dark:text-zinc-400"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-medium text-[var(--foreground)]">
                              {att.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--muted-foreground)]">{att.size}</span>
                              {att.source === "manufacturer_auto" && (
                                <Badge className="text-[8px] bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 border">
                                  Auto
                                </Badge>
                              )}
                              <span className="text-[10px] capitalize text-[var(--muted-foreground)]">
                                {att.type.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-3.5 w-3.5 text-[var(--primary)]" />
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="h-3.5 w-3.5 text-[var(--muted-foreground)] hover:text-[var(--primary)]" />
                            </a>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 text-center">
                      <Paperclip className="h-6 w-6 text-[var(--muted-foreground)]/40 mb-2" />
                      <p className="text-xs text-[var(--muted-foreground)]">No attachments</p>
                    </div>
                  )}
                  {asset.productUrl && (
                    <a
                      href={asset.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View manufacturer product page
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Specs (from manufacturer scan) */}
              {asset.specs && Object.keys(asset.specs).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      <Info className="mr-2 inline h-4 w-4" />
                      Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(asset.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-[var(--border)]/50 pb-1.5">
                          <span className="text-[10px] text-[var(--muted-foreground)] capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span className="text-[10px] font-medium text-[var(--foreground)] text-right max-w-[60%]">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alerts */}
              {(warrantyExpired || asset.condition === "Critical" || asset.condition === "Poor") && (
                <Card className="border-orange-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="mr-2 inline h-4 w-4" />
                      Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {warrantyExpired && (
                        <div className="rounded-lg bg-orange-50 border border-orange-300 p-2.5 text-xs font-medium text-orange-800 dark:bg-orange-500/5 dark:text-orange-400 dark:border-orange-500/20">
                          Warranty expired on {formatDate(asset.warrantyExpiration)}
                        </div>
                      )}
                      {(asset.condition === "Critical" || asset.condition === "Poor") && (
                        <div className="rounded-lg bg-red-50 border border-red-300 p-2.5 text-xs font-medium text-red-800 dark:bg-red-500/5 dark:text-red-400 dark:border-red-500/20">
                          Asset condition is {asset.condition} — maintenance recommended
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWorkOrders
                  .filter((wo) => wo.assetId === asset.id || wo.propertyName === asset.propertyName)
                  .slice(0, 10)
                  .map((wo) => (
                    <div key={wo.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[var(--muted-foreground)]">{wo.id}</span>
                          <Badge
                            className={cn(
                              "text-[10px] border",
                              wo.priority === "Critical" ? "bg-red-100 text-red-900 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" :
                              wo.priority === "High" ? "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" :
                              "bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20"
                            )}
                          >
                            {wo.priority}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{wo.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Assigned: {wo.assignedTo} · Created: {formatDate(wo.createdDate)}
                          {wo.completedDate && ` · Completed: ${formatDate(wo.completedDate)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={cn(
                            "text-[10px] border",
                            wo.status === "Completed" ? "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                            wo.status === "In Progress" ? "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20" :
                            "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                          )}
                        >
                          {wo.status}
                        </Badge>
                        {wo.cost > 0 && (
                          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{formatCurrency(wo.cost)}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "hierarchy" && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Asset Hierarchy Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <HierarchyNode assetId={rootId} currentId={asset.id} allAssets={assets} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Hierarchy Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parent && (
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Parent Asset</span>
                      <Link href={`/assets/${parent.id}`} className="mt-1 block rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--muted)]/50 transition-colors">
                        <p className="text-sm font-medium text-[var(--foreground)]">{parent.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{parent.assetTag}</p>
                      </Link>
                    </div>
                  )}
                  {children.length > 0 && (
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                        Child Assets ({children.length})
                      </span>
                      <div className="mt-1 space-y-2">
                        {children.map((child) => (
                          <Link key={child.id} href={`/assets/${child.id}`} className="block rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--muted)]/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-[var(--foreground)]">{child.name}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">{child.assetTag}</p>
                              </div>
                              <Badge className={cn("text-[10px] border", getConditionBg(child.condition))}>
                                {child.condition}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      Roll-Up Summary
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[var(--muted)] p-3">
                        <p className="text-[10px] text-[var(--muted-foreground)]">Total Components</p>
                        <p className="text-lg font-bold text-[var(--foreground)]">{children.length + 1}</p>
                      </div>
                      <div className="rounded-lg bg-[var(--muted)] p-3">
                        <p className="text-[10px] text-[var(--muted-foreground)]">Total Maint. Cost</p>
                        <p className="text-lg font-bold text-[var(--foreground)]">
                          {formatCurrency(
                            asset.totalMaintenanceCost +
                              children.reduce((sum, c) => sum + c.totalMaintenanceCost, 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && asset.attachments && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          allAttachments={asset.attachments}
          onClose={() => setPreviewAttachment(null)}
          onNavigate={(att) => setPreviewAttachment(att)}
        />
      )}
    </div>
  );
}
