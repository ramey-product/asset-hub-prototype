# Asset Hub — WORKS Prototype

Interactive frontend prototype for asset lifecycle management within the Facilitron WORKS platform. Built for stakeholder demos and dev team handoff — all data is simulated locally, no backend required.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## What This Prototype Covers

Asset Hub gives facility owners and operators a unified view of their physical assets — from gas station refrigeration units to school HVAC systems — with tools to register, track condition, view maintenance history, and understand costs.

### Live Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | **Hub Dashboard** | KPI cards, maintenance spend trends, condition breakdown, recent work orders, quick actions |
| `/assets` | **Asset Registry** | Searchable/filterable list with table and grid views, category/condition/property/lifecycle filters |
| `/assets/[id]` | **Asset Detail** | Tabbed detail view — Overview (metrics, condition timeline, specs, attachments), Maintenance History, and Hierarchy (parent/child tree) |

### Stubbed Pages (Phase 2)

| Route | Page |
|-------|------|
| `/inventory` | Parts catalog, stock tracking, reorder alerts |
| `/procurement` | Purchase orders, vendor directory, receiving workflows |

### Key Features

**Register Asset Wizard** — 8-step modal flow covering location, category, scan/OCR identification, manufacturer doc auto-import, details, status, attachments, and review.

**Scan Simulation** — Barcode UPC lookup, serial plate OCR (simulated Tesseract output), and QR code scanning with confidence scoring and cascading match strategy against a manufacturer database.

**Attachment Preview** — In-modal PDF viewer with multi-page navigation, full-text search with match highlighting, zoom control (50–200%), keyboard shortcuts (⌘F, ←→, Esc), and fullscreen toggle.

**Multi-Tenant Org Switching** — Toggle between two demo orgs (Rotten Robbie, 63 gas stations; Orange County Public Schools, 254 facilities) with org-aware categories, labels, dashboard stats, and asset data.

**Dark/Light Theme** — Full CSS custom property system with localStorage persistence. Charts and all UI elements respond to theme changes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| UI | React 19, TypeScript 5.9 |
| Styling | Tailwind CSS v4, CSS custom properties |
| Charts | Recharts |
| Icons | Lucide React |
| Components | Custom Card, Badge, Button with `cn()` class merging |
| Deployment | GitHub Pages via GitHub Actions |

### Future Dependencies (for production scan features)

- `tesseract.js` — browser-side OCR
- `@zxing/browser` + `@zxing/library` — barcode/QR scanning

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Hub Dashboard
│   ├── layout.tsx                  # Root layout + providers
│   ├── globals.css                 # Theme tokens + Tailwind
│   ├── assets/
│   │   ├── page.tsx                # Asset Registry
│   │   └── [id]/
│   │       ├── page.tsx            # Asset Detail (static params)
│   │       └── client.tsx          # Asset Detail client component
│   ├── inventory/page.tsx          # Phase 2 stub
│   └── procurement/page.tsx        # Phase 2 stub
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx             # Collapsible nav + org switcher
│   │   ├── org-provider.tsx        # Multi-tenant context provider
│   │   └── theme-provider.tsx      # Dark/light theme context
│   ├── assets/
│   │   ├── register-asset-wizard.tsx   # 8-step registration flow
│   │   └── attachment-preview-modal.tsx # PDF/image viewer
│   └── ui/
│       ├── card.tsx
│       ├── badge.tsx
│       └── button.tsx
├── data/
│   ├── sample-data.ts              # Assets, properties, WOs, dashboard stats
│   ├── manufacturer-db.ts          # Scan simulation + product database
│   └── ocps-data.ts                # OCPS org-specific data
└── lib/
    ├── utils.ts                    # cn() class utility
    └── chart-theme.ts              # Theme-aware chart colors
```

## Data Model

The prototype uses static TypeScript data that mirrors the planned production schema:

- **Asset** — core entity with category, condition (5-level), lifecycle stage, hierarchy (parent/child), specs, attachments, and maintenance cost rollups
- **Property** — facility/location with address and asset counts
- **WorkOrder** — linked to asset with status, priority, cost, and assignment
- **Organization** — tenant with sector, property label overrides, and category definitions

Two complete demo datasets ship with the prototype: Rotten Robbie (commercial/gas stations) and Orange County Public Schools (education).

## Build & Deploy

```bash
# Production build (static export to ./out)
npm run build

# Deploys automatically to GitHub Pages on push to main
# Live at: https://ramey-product.github.io/asset-hub-prototype/
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles CI/CD — builds on every push to `main` and deploys the static export to GitHub Pages.

## Architecture Notes

- **All client-side rendering** — pages use `"use client"` for interactive features (filters, modals, dropdowns)
- **Static generation with dynamic routes** — `generateStaticParams()` pre-renders all asset detail pages from both org datasets
- **Context over state library** — `OrgProvider` manages tenant switching and mutable asset layer without Redux/Zustand
- **Simulation-ready for real APIs** — manufacturer database, scan functions, and OCR are isolated in `src/data/` for clean swap to production services
- **Theme tokens via CSS custom properties** — runtime resolution for chart colors via `resolveVar()` utility

## Related Docs

- [V1 Feature Set](./V1-FEATURE-SET.md) — full feature specification for Phase 1
- [Dependencies](./docs/DEPENDENCIES.md) — package documentation and rationale
