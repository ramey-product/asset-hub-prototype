"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  QrCode,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Asset, type Condition, type LifecycleStage } from "@/data/sample-data";
import { cn, formatCurrency, formatDate, getConditionBg, getLifecycleBg } from "@/lib/utils";
import { useOrg } from "@/components/layout/org-provider";
import RegisterAssetWizard from "@/components/assets/register-asset-wizard";

const conditions: Condition[] = ["Excellent", "Good", "Fair", "Poor", "Critical"];
const lifecycleStages: LifecycleStage[] = ["Active", "Under Maintenance", "Flagged for Replacement", "Decommissioned"];

export default function AssetsPage() {
  const { orgData } = useOrg();
  const [showRegisterWizard, setShowRegisterWizard] = useState(false);
  const { assets, properties, categories } = orgData;
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortField, setSortField] = useState<keyof Asset>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.assetTag.toLowerCase().includes(search.toLowerCase()) && !a.serialNumber.toLowerCase().includes(search.toLowerCase())) return false;
        if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
        if (selectedCondition !== "all" && a.condition !== selectedCondition) return false;
        if (selectedProperty !== "all" && a.propertyId !== selectedProperty) return false;
        if (selectedLifecycle !== "all" && a.lifecycleStage !== selectedLifecycle) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
  }, [search, selectedCategory, selectedCondition, selectedProperty, selectedLifecycle, sortField, sortDir]);

  const toggleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const activeFilters = [selectedCategory, selectedCondition, selectedProperty, selectedLifecycle].filter(f => f !== "all").length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Asset Registry</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {filteredAssets.length} assets{activeFilters > 0 ? ` (filtered)` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-3.5 w-3.5" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <QrCode className="mr-2 h-3.5 w-3.5" />
              Scan
            </Button>
            <Button size="sm" onClick={() => setShowRegisterWizard(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Asset
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-4">
        {/* Search & Filters Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by name, tag, or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] pl-9 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="all">All Categories</option>
            {categories.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="all">All Conditions</option>
            {conditions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedLifecycle}
            onChange={(e) => setSelectedLifecycle(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="all">All Stages</option>
            {lifecycleStages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[var(--muted-foreground)]"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedCondition("all");
                setSelectedProperty("all");
                setSelectedLifecycle("all");
                setSearch("");
              }}
            >
              Clear ({activeFilters})
            </Button>
          )}

          <div className="ml-auto flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "table" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {[
                      { key: "assetTag" as keyof Asset, label: "Asset Tag" },
                      { key: "name" as keyof Asset, label: "Name" },
                      { key: "category" as keyof Asset, label: "Category" },
                      { key: "propertyName" as keyof Asset, label: "Property" },
                      { key: "condition" as keyof Asset, label: "Condition" },
                      { key: "lifecycleStage" as keyof Asset, label: "Status" },
                      { key: "totalMaintenanceCost" as keyof Asset, label: "Maint. Cost" },
                      { key: "nextServiceDue" as keyof Asset, label: "Next Service" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        onClick={() => toggleSort(col.key)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[var(--muted-foreground)]">{asset.assetTag}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/assets/${asset.id}`} className="group">
                          <div className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                            {asset.name}
                          </div>
                          {asset.parentId && (
                            <div className="text-[10px] text-[var(--muted-foreground)]">
                              Child of: {assets.find((a) => a.id === asset.parentId)?.name}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--muted-foreground)]">{asset.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--muted-foreground)]">{asset.propertyName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] border", getConditionBg(asset.condition))}>
                          {asset.condition}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] border", getLifecycleBg(asset.lifecycleStage))}>
                          {asset.lifecycleStage}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {formatCurrency(asset.totalMaintenanceCost)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--muted-foreground)]">{formatDate(asset.nextServiceDue)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/assets/${asset.id}`}>
                          <ExternalLink className="h-3.5 w-3.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`}>
                <Card className="hover:border-[var(--primary)]/30 transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{asset.assetTag}</span>
                        <h3 className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{asset.name}</h3>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">{asset.propertyName}</p>
                      </div>
                      <Badge className={cn("text-[10px] border", getConditionBg(asset.condition))}>
                        {asset.condition}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Category</div>
                        <div className="text-xs font-medium text-[var(--foreground)]">{asset.category}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Maint. Cost</div>
                        <div className="text-xs font-medium text-[var(--foreground)]">{formatCurrency(asset.totalMaintenanceCost)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Work Orders</div>
                        <div className="text-xs font-medium text-[var(--foreground)]">{asset.workOrderCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Status</div>
                        <Badge className={cn("text-[10px] border mt-0.5", getLifecycleBg(asset.lifecycleStage))}>
                          {asset.lifecycleStage}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Register Asset Wizard */}
      <RegisterAssetWizard open={showRegisterWizard} onClose={() => setShowRegisterWizard(false)} />
    </div>
  );
}
