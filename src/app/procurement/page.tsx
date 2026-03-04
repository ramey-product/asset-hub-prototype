"use client";

import { ShoppingCart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProcurementPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex h-16 items-center px-8">
          <h1 className="text-xl font-bold text-[var(--foreground)]">Procurement</h1>
        </div>
      </header>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Card className="max-w-lg w-full border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="rounded-2xl bg-[var(--primary)]/10 p-5 mb-6">
              <ShoppingCart className="h-10 w-10 text-[var(--primary)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Procurement Engine</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-sm">
              Purchase orders, vendor directory, receiving workflows, and cost tracking. Coming in Phase 2.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Purchase Orders", "Vendor Directory", "Receiving", "Cost Tracking", "Approvals", "RFQ"].map((f) => (
                <span key={f} className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                  {f}
                </span>
              ))}
            </div>
            <Link href="/" className="mt-8">
              <Button variant="outline">
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to Hub Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
