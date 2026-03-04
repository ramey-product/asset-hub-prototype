# Asset Hub — v1 Prototype Feature Set

> **Last Updated:** 2026-02-24
> **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Recharts · TypeScript
> **Purpose:** Clickable frontend prototype for demo & eventual Jira handoff to dev team
> **Run:** `cd ~/asset-hub-prototype && npm run dev` → http://localhost:3000

---

## 1. Global Shell & Navigation

### 1.1 Collapsible Sidebar
- WORKS branding with wrench icon and "Asset Hub" sub-label
- Collapse/expand toggle button (pinned to sidebar edge)
- Active page highlighting with primary color indicator
- Navigation items: Hub Dashboard, Assets, Inventory (Coming Soon), Procurement (Coming Soon), Settings
- Disabled nav items show lock icon + "Coming Soon" badge
- "Management" section label visible in expanded mode

### 1.2 Organization Switcher
- Dropdown in sidebar showing current org name, sector icon, and property count
- Two demo tenants pre-configured:
  - **Rotten Robbie** — 63 properties, commercial sector, "Properties" label
  - **Orange County Public Schools (OCPS)** — 254 schools/facilities, education sector, "Schools & Facilities" label
- Switching org replaces all data app-wide (assets, work orders, dashboard stats, categories, properties)
- Sector-aware icons (Building2 for commercial, GraduationCap for education)
- Collapsed mode shows sector icon that opens dropdown on click
- Outside-click dismissal for dropdown

### 1.3 Dark / Light Theme Toggle
- Theme toggle button in sidebar bottom section (Sun/Moon icons)
- CSS custom properties for full theme system (`--background`, `--foreground`, `--primary`, etc.)
- Separate sidebar-specific theme tokens (`--sidebar`, `--sidebar-border`, etc.)
- Tailwind v4 dark mode via `@custom-variant dark (&:where(.dark, .dark *))`
- Primary color: `#2563eb` (light) / `#60a5fa` (dark) — Facilitron blue

---

## 2. Hub Dashboard (Home Page)

### 2.1 Quick Actions Bar
- Card with horizontal button row:
  - Register New Asset → opens Register Asset Wizard
  - Create Work Order (placeholder)
  - Run Condition Report (placeholder)
  - Scan QR / Barcode (placeholder)

### 2.2 KPI Cards (4-up grid)
- **Total Assets** — count + "Across N properties/schools" + trend indicator
- **Open Work Orders** — count + overdue count + month-over-month trend
- **Critical Assets** — count + flagged-for-replacement count + weekly new count
- **YTD Maintenance Cost** — formatted currency + total asset value + year-over-year trend
- Each card shows icon in primary color background, trend arrow (emerald up / orange down)
- Values are org-specific (change when switching org)

### 2.3 Charts
- **Maintenance Spend Trend** (AreaChart, 2/3 width) — 6-month cost trend with gradient fill, formatted Y-axis ($k), tooltips
- **Asset Condition** (PieChart, 1/3 width) — donut chart with 5 condition categories (Excellent, Good, Fair, Poor, Critical), color-coded legend with counts
- **Assets by Category** (horizontal BarChart) — top 5 categories by count
- All charts use Recharts with theme-aware colors that update on dark/light toggle
- Custom tooltip styling matching card background

### 2.4 Recent Work Orders Table
- Shows last 6 work orders with: WO ID (monospaced), priority badge (Critical/High/Medium/Low), title, asset name, property name, status badge (Open/In Progress/Completed)
- "View all" link in header
- Color-coded priority and status badges with light + dark mode variants

### 2.5 Top Properties by Spend
- Ranked bar visualization showing top properties/schools by maintenance cost
- Each entry: property name, formatted cost, progress bar (relative to highest), work order count
- Org-aware label ("Top Properties" vs "Top Schools & Facilities")

---

## 3. Asset Registry (List Page)

### 3.1 Search
- Full-text search across asset name, asset tag, and serial number
- Real-time filtering as user types
- Search icon with placeholder text

### 3.2 Multi-Filter Bar
- **Category** dropdown — populated from org-specific categories
- **Condition** dropdown — Excellent, Good, Fair, Poor, Critical
- **Property** dropdown — populated from org properties (by name)
- **Lifecycle Stage** dropdown — Active, Under Maintenance, Flagged for Replacement, Decommissioned
- Active filter count indicator
- "Clear (N)" button to reset all filters + search simultaneously

### 3.3 Table View (default)
- Sortable columns: Asset Tag, Name, Category, Property, Condition, Status, Maint. Cost, Next Service
- Click any column header to sort asc/desc with ArrowUpDown icon
- Asset tag in monospaced font
- Name links to asset detail page; shows "Child of: [parent]" if part of hierarchy
- Condition and lifecycle stage shown as color-coded badges
- Maintenance cost formatted as currency
- External link icon for quick navigation to detail

### 3.4 Grid View (card layout)
- Toggle between Table and Grid via icon buttons (List / LayoutGrid)
- 3-column card grid showing: asset tag, name, property, condition badge, category, maintenance cost, work order count, lifecycle status badge
- Hover effect with primary color border and shadow
- Each card links to asset detail page

### 3.5 Header Actions
- **Export** button (placeholder)
- **Scan** button (placeholder)
- **Add Asset** button → opens Register Asset Wizard
- Asset count display with "(filtered)" indicator when filters active

---

## 4. Asset Detail Page

### 4.1 Header Bar
- Back arrow → returns to Asset Registry
- Asset name + condition badge + lifecycle stage badge
- Asset tag + property name subtext
- Action buttons: QR Code (placeholder), Create Work Order (placeholder), Edit Asset (placeholder)

### 4.2 Tab Navigation
- **Overview** — default tab, full asset info
- **Maintenance History** — work order history
- **Hierarchy** — parent/child asset tree

### 4.3 Overview Tab
**Key Metrics (4-up cards):**
- Purchase Cost, Maintenance Cost, Work Order Count, Warranty Status (Expired indicator + expiration date)
- Color-coded icons per metric

**Asset Details Card:**
- 2-column grid: Manufacturer, Model, Serial Number, Category, Purchase Date, Location, Last Service, Next Service Due

**Condition History Timeline:**
- Vertical timeline with color-coded condition dots
- For newly created assets (id starts with `ast-new-`): single "Initial registration" entry with today's date
- For existing assets: 4-entry history showing condition progression over time

**Sidebar Cards:**
- **Property Card** — property name + location with building icon
- **Asset Hierarchy Preview** — tree visualization if asset has parent/children, "Full view" link to Hierarchy tab
- **Recent Work Orders** — related WOs for this specific asset with ID, status badge, title, assignee, date
- **Attachments** — see Section 5
- **Specifications** — key-value pairs from manufacturer scan data (dimensions, weight, electrical, etc.), camelCase auto-formatted to readable labels
- **Alerts** — conditional card showing warranty expiration warning and/or critical condition warning with orange/red styling

### 4.4 Maintenance History Tab
- Full list of work orders related to asset or its property
- Each WO shows: ID, priority badge, title, assignee, created date, completed date (if applicable), status badge, cost

### 4.5 Hierarchy Tab
- **Asset Hierarchy Tree** — recursive tree component (`HierarchyNode`) showing Property → System → Component structure
- Tree node shows: expand/leaf icon, asset name (truncated), condition badge
- Active asset highlighted in primary color
- Tree connectors via left border + left padding
- **Hierarchy Details Panel** — Parent Asset link, Child Assets list with condition badges, Roll-Up Summary (total components count, total maintenance cost across hierarchy)

---

## 5. Attachment System

### 5.1 Attachment Data Model
- `AssetAttachment` interface: id, name, type (manual/warranty/spec_sheet/photo/other), mimeType, size, url, source (manufacturer_auto/user_upload), addedDate

### 5.2 Attachments on Asset Detail Page
- File list with: type-colored icon (blue for auto-imported, zinc for user), file name, size, type label, "Auto" badge for manufacturer-sourced files
- Hover reveals Eye (preview) + Download icons
- Click any attachment → opens Attachment Preview Modal
- "View manufacturer product page" external link (if productUrl exists)
- Empty state with Paperclip icon + "No attachments" text

### 5.3 Attachment Preview Modal
- **Full-screen overlay** with blur backdrop, closeable via Escape or backdrop click
- **Top Toolbar:** file icon, name, size, source badge, type label + Search toggle, Zoom In/Out (50-200% in 25% steps), Download link, Fullscreen toggle, Close
- **Search Bar (collapsible):** real-time text search across all pages, match counter ("3 of 12"), Prev/Next match navigation, clear button, auto-navigates to page containing current match
- **PDF Viewer:** simulated multi-page content rendered as a white page with monospaced text, page header with title + page indicator, search highlights with yellow `<mark>` tags, match count per page footer, zoom scales page dimensions and font size
- **Simulated Content:** 8 pages for Perlick installation manual (Cover, TOC, Safety, Specs, Installation, Electrical, Troubleshooting, Warranty), 2 pages for spec sheet (specs + dimensional drawing), generic fallback for other files
- **Image Preview:** placeholder with icon and "in production" note
- **Bottom Toolbar:** Attachment navigator (File X of Y with Prev/Next), Page pagination (numbered buttons + Prev/Next), Keyboard shortcuts legend (⌘F Search, ←→ Pages, Esc Close)
- **Keyboard Shortcuts:** ⌘F opens search, ←→ navigates pages, Esc closes (search first, then modal), Enter/Shift+Enter cycles through matches

---

## 6. Register Asset Wizard

### 6.1 Wizard Shell
- Modal overlay with backdrop blur, closeable via X button or Escape key
- WORKS branding header with org name + session registration count
- Progress bar (continuous, animated) showing completion percentage
- **Scrollable step carousel** with auto-scroll to active step, gradient fade edges, hidden scrollbars, colored connector lines (emerald for completed steps), completed steps are clickable for back-navigation
- Back/Continue footer navigation with step counter ("Step N of M")
- "Register Asset" button on final step

### 6.2 Step 1 — Location ("Where is this asset?")
- Property selector with searchable list (filters by name + address)
- Selected property highlighted with checkmark
- Specific location free-text input (e.g., "Pump Island 3, Room 204")
- Required: property selection to advance

### 6.3 Step 2 — Category ("What type of asset is this?")
- 2-column button grid of org-specific categories
- Selected category highlighted with primary color border + shadow
- Rotten Robbie categories: Fuel System, HVAC, Refrigeration, POS & IT, Lighting, Signage, Safety, Plumbing, Electrical
- OCPS categories: HVAC, Electrical, Plumbing, Roofing, Flooring, Fire & Life Safety, IT & Network, Kitchen Equipment, Playground & Athletic, Furniture & Fixtures, Portables & Relocatables, Elevator & Accessibility

### 6.4 Step 3 — Identify ("Let's identify this asset")
- Three scan method cards in 3-column grid:
  - **Barcode Photo** — upload image, simulates UPC decode → manufacturer DB lookup
  - **Serial Plate Photo** — upload image, simulates OCR text extraction → text matching → DB lookup
  - **Use Camera** — simulates live barcode/QR scan
- "How it works" info panel explaining each scan type
- "Skip — I'll enter details manually" bypass option
- Scanning animation: loading spinner, progress label updates (e.g., "Decoding barcode...", "Looking up manufacturer database..."), animated dots
- All scan paths lead to the same DB lookup and auto-populate wizard data

### 6.5 Step 4 — Scan Confirm (conditional, only appears after successful scan)
- **Confidence banner** — color-coded (emerald ≥85%, amber 60-84%, red <60%) with source label and match percentage
- **Manufacturer documentation found alert** — blue info box listing auto-imported docs with file names and sizes
- **OCR text viewer** (serial plate scans only) — collapsible accordion showing raw extracted text
- **Editable fields** — pre-populated from scan: Manufacturer, Model, Serial Number, Asset Name, Description, all with pencil edit icon
- **Suggested Category** badge from scan data
- **Product Specifications accordion** — collapsible panel showing all spec key-value pairs + product page link
- "Confirm Scanned Data" button (changes to "Data Confirmed" checkmark once clicked)
- Required: confirmation to advance

### 6.6 Step 5 — Details ("Tell us about this asset")
- 5 text fields: Asset Name (required), Description, Manufacturer, Model, Serial Number
- Scan-populated fields show green border + "From [OCR/Barcode/QR]" badge
- Non-scanned fields show standard gray styling
- Required: asset name to advance

### 6.7 Step 6 — Status ("What condition is it in?")
- **Condition Rating** — 5 radio-style buttons: Excellent, Good, Fair, Poor, Critical, each with description and color-coded styling
- **Lifecycle Status** — 2x2 grid: Active, Under Maintenance, Flagged for Replacement, Decommissioned
- **Financial fields** — 3-column: Purchase Date (date picker), Cost (text), Warranty Expiration (date picker)
- Cost auto-fills from MSRP if scanned

### 6.8 Step 7 — Attachments ("Attach documentation")
- **Auto-imported manufacturer docs** — blue-styled cards showing file name, type badge, size, with individual remove buttons
- **User uploads section** — gray-styled cards for manually added files
- **Upload drop zone** — dashed border, click-to-upload, accepts all file types, multi-file support
- **Summary footer** — "N files will be attached to this asset"
- Attachment types: Manual, Spec Sheet, Warranty, Photo, Other

### 6.9 Step 8 — Review ("Review & register")
- Organized into collapsible sections: Location, Asset Info, Status & Financials
- Each section shows label-value pairs in bordered card format
- Scan source indicator (if applicable) with confidence percentage
- Product Specs accordion (collapsible)
- Attachments list with Auto/User badges
- "Register Asset" button in footer triggers full asset creation

### 6.10 Success Screen
- Green checkmark animation
- Asset name + property confirmation
- Session count ("You've registered N assets this session")
- Scan source badge (if applicable)
- Summary card: Category, Manufacturer, Model, Condition, Status, Attachment count
- Three action buttons:
  - **Done** — closes wizard
  - **View Asset** — navigates to the newly created asset's detail page
  - **Register Another** — resets wizard, keeps property/location, jumps to Category step

### 6.11 Asset Persistence
- New assets get unique ID (`ast-new-{timestamp}`) and auto-generated asset tag (`{orgShortName}-NEW-{catAbbrev}-{num}`)
- Asset added to org context via `addAsset()` — immediately visible in registry and detail page
- "Create Another" workflow preserves property/location from previous registration
- Attachments converted from wizard format to `AssetAttachment` format with `addedDate`

---

## 7. Manufacturer Product Database

### 7.1 Database Structure
- `ManufacturerProduct` interface: manufacturer, model, serialNumber, category, description, upc, specs (dimensions/weight/voltage/amperage/capacity/refrigerant/horsepower/warrantyYears/certifications/msrp), productUrl, documentation array
- Indexed for fast lookup: UPC → product, model number → product (case-insensitive), serial prefix → product, exact serial → product

### 7.2 Demo Products
- **Perlick BBSN52** — Back bar refrigerator with full specs, 2 docs (manual + spec sheet)
- **Carrier 24ACC636A003** — HVAC unit with specs, 1 doc (service manual)

### 7.3 Scan Simulation
- `lookupByBarcode(upc)` — UPC match → 98% confidence
- `lookupBySerialPhoto(ocrText)` — cascading match strategy: exact serial (95%) → model in text (90%) → manufacturer name (72%) → serial prefix (78%)
- `lookupByQR(qrData)` — model match in QR data → 96% confidence
- `extractSerialFromText()` — regex patterns for serial-number-like strings (dashed alphanumeric, digits+letter+digits)
- `DEMO_OCR_OUTPUTS` — simulated tesseract.js text for Perlick serial plate and Carrier HVAC plate

---

## 8. Multi-Tenant Data Layer

### 8.1 OrgProvider Context
- React Context providing: `currentOrg`, `orgData`, `switchOrg()`, `addAsset()`, `allOrgs`
- Static data per org loaded from separate data modules (`sample-data.ts` for RRC, `ocps-data.ts` for OCPS)
- Mutable asset layer: `addedAssets` state merged on top of static data (`[...added, ...static]`)
- Categories, properties, dashboard stats, chart data all org-specific

### 8.2 Data Shape
- Each org provides: assets, properties, recentWorkOrders, dashboardStats, conditionDistribution, maintenanceCostByMonth, assetsByCategory, topPropertiesByMaintenance, categories
- Asset model: id, name, description, category, manufacturer, model, serialNumber, purchaseDate, purchaseCost, warrantyExpiration, propertyId, propertyName, location, condition, lifecycleStage, parentId, lastServiceDate, nextServiceDue, totalMaintenanceCost, workOrderCount, assetTag, attachments?, specs?, productUrl?
- 3-tier hierarchy: Property → System → Component (via parentId references)

---

## 9. Theming & UI System

### 9.1 Component Library
- Custom `Card`, `CardContent`, `CardHeader`, `CardTitle` components
- Custom `Badge` component with `cn()` utility for class merging
- Custom `Button` component with variants: default, outline, ghost, size: sm/icon/default
- All components use CSS custom properties for theme awareness

### 9.2 Color System
- Condition badges: Excellent (emerald), Good (blue), Fair (amber), Poor (orange), Critical (red)
- Lifecycle badges: Active (emerald), Under Maintenance (violet), Flagged for Replacement (amber), Decommissioned (zinc)
- Priority badges: Critical (red), High (orange), Medium (amber), Low (zinc)
- Status badges: Open (blue), In Progress (violet), Completed (emerald)
- All badge colors have dual light/dark definitions using `-100`/`-900`/`-300` (light) and `-500/10`/`-400`/`-500/20` (dark)

### 9.3 Utility Functions
- `formatCurrency()` — USD formatting
- `formatNumber()` — locale-aware number formatting
- `formatDate()` — human-readable date strings
- `getConditionBg()` / `getLifecycleBg()` — condition/lifecycle → Tailwind class mapping
- `resolveVar()` — runtime CSS variable resolution for chart colors

---

## 10. Placeholder / Future Pages

- **Inventory** (`/inventory`) — "Coming Soon" stub
- **Procurement** (`/procurement`) — "Coming Soon" stub
- **Settings** — disabled nav link

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-02-24 | Initial v1 feature set document created from full prototype audit |

