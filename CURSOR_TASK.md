# 🎯 Cursor Task — BSD-YBM Intelligence Platform UI Redesign (Phase 2)

## Context — What Was Already Done

This is a full-stack Israeli SaaS platform (Next.js 15 App Router, Tailwind CSS, Prisma + PostgreSQL/Neon, NextAuth v4, Framer Motion, RTL/LTR Hebrew/English support).

A first redesign pass was completed that:
- ✅ Changed design system from amber/gold to **professional blue-white** (`--primary-color: #2563eb`)
- ✅ Fully rewrote: `LandingPage.tsx`, `Navbar.tsx`, `LandingNavDrawer.tsx`, `PricingSection.tsx`, all auth pages (`AuthPageShell`, `AuthProfessionalCard`, `LoginPortal`, `RegisterPortal`), `DashboardLayoutClient.tsx`, `AccessibilityMenu.tsx`, `DashboardSidebarUserCard.tsx`
- ✅ Color-migrated (amber→blue) across 40+ files via sed
- ✅ TypeScript: 0 errors, 0 amber color classes remaining anywhere

## What Still Needs to Be Done

### 1. Design System Tokens (READ FIRST)

All components must use these CSS variables from `app/globals.css`:
```css
--primary-color: #2563eb      /* main blue */
--primary-hover: #1d4ed8      /* darker blue */
--primary-light: #eff6ff      /* light blue background */
--primary-muted: #bfdbfe      /* muted blue border/ring */
--heading-color: #1e293b
--surface-white: #ffffff
--surface-card: #f8fafc
--border-color: #e2e8f0
```

Tailwind utility classes available in `@layer components`:
- `.btn-primary` — blue filled button
- `.btn-secondary` — blue outlined button
- `.btn-ghost` — text-only button
- `.card-avenue` — standard white card with subtle border
- `.crystal-border` — card with blue-gradient border

**Color palette to use:** blue-50/100/200/600/700, slate-50/100/200/600/900, white, emerald (success), rose (error/danger)

**Fonts:** Heebo (Hebrew RTL), Assistant (Latin LTR) — loaded via `app/layout.tsx`

**RTL/LTR:** Always use logical CSS properties: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `border-s`, `border-e` instead of left/right. Direction comes from `useI18n()` hook → `dir` prop.

---

### 2. Components to Fully Redesign (Layout + UX, not just colors)

These files received color fixes only and still need proper layout/UX redesign to match the new blue-white professional style:

#### Priority 1 — Dashboard Core
- **`app/components/BsdYbmDashboard.tsx`** — Main dashboard landing widget. Should show clean stat cards, KPI summary, quick-action buttons. Use `card-avenue` cards, blue accent stats.
- **`components/ERPDashboard.tsx`** — ERP module dashboard. Clean sectioned layout: invoices, suppliers, documents. Consistent card grid.
- **`components/ErpDocumentsManager.tsx`** — Document table/manager. Professional table design with blue header, action buttons per row.
- **`components/DashboardAiHub.tsx`** — AI hub page. Blue-accented cards for each AI feature, usage stats, scan credits display.

#### Priority 2 — CRM
- **`components/crm/CrmClient.tsx`** — Full CRM client view. Tabs for contacts, organizations, pipeline. Clean table + card hybrid.
- **`components/crm/CrmOrganizationsAdminTable.tsx`** — Admin table for organizations. Sortable columns, expandable rows, blue action buttons.

#### Priority 3 — Billing
- **`components/billing/GlobalBillingPageClient.tsx`** — Main billing page wrapper. Tab navigation: Subscriptions, Invoices, Payments, Usage. Blue tab strip.
- **`components/billing/BillingUnifiedTabsClient.tsx`** — Unified tabs inside billing. Consistent with dashboard tab style.
- **`components/billing/SubscriptionPricingTable.tsx`** — Pricing cards. Popular plan: blue background + white text. Others: white + blue border. Prominent CTA buttons.
- **`components/billing/PayPlusButton.tsx`** — Israeli payment button (Pay Plus). Professional button design, clear call to action.
- **`components/billing/PayPalSubscriptionCheckout.tsx`** — PayPal checkout flow. Clean step-by-step design.
- **`components/billing/BillingWorkspaceEditor.tsx`** — Invoice/document editor. Professional form layout with labeled sections.
- **`components/billing/DocumentPrintTemplate.tsx`** — Print template for invoices. Clean, professional, print-ready layout.

#### Priority 4 — Intelligence / Executive
- **`components/intelligence/IntelligenceHub.tsx`** — AI intelligence dashboard. Data cards, charts, insights. Blue gradient accents.
- **`components/intelligence/ExecutiveSuite.tsx`** — Executive overview. KPI cards, financial summary, trend indicators.
- **`app/app/erp/page.tsx`** / דפי workspace תחת `app/app/**` — מעטפת הפעילות העסקית (כולל ERP ומסמכים).
- **`components/executive/AdminSubscriptionControlCenter.tsx`** — Admin subscription management tool. Table of users/organizations, subscription controls, action buttons. Professional admin UI.

#### Priority 5 — Other Modules
- **`components/MultiEngineScanner.tsx`** — AI document scanner. Upload area, engine selector (Gemini/OpenAI), results display. Modern drag-drop style.
- **`components/FinancialInsightsWidget.tsx`** — Financial widget. Mini charts, trend arrows, summary numbers.
- **`components/SupplierPriceBoard.tsx`** — Supplier price comparison board. Table with sortable columns, price highlights.
- **`app/contact/ContactPageClient.tsx`** — Contact/support page. Clean form, company info, map or address card.

---

### 3. Pages to Review for Missing Buttons/Flows

Check each page has all necessary action buttons wired up:

| Page | Required Buttons |
|------|-----------------|
| Settings (`/settings`) | Save, Cancel, Tab navigation (account/erp/crm/ai/billing/cloud) |
| ERP | New Document, New Invoice, Filter, Search, Export |
| CRM | Add Contact, Add Organization, Import, Export, Search |
| Billing | Upgrade Plan, Download Invoice, Payment History, Add Credits |
| Executive | Date range filter, Export Report, Refresh |
| Admin | Manage Subscription (per user), Send Email, Export CSV |
| Scanner | Upload File, Select Engine, Scan, Download Result, Clear |
| Intelligence | Refresh Data, Date filter, Export Insights |

---

### 4. Specific UX Improvements Needed

1. **Empty states** — Every list/table should have a designed empty state (not just `null`). Use an icon + headline + CTA button pattern.

2. **Loading states** — Skeleton loaders instead of plain spinners where possible. Blue pulse animation.

3. **Error states** — Consistent error banner design: `border-rose-200 bg-rose-50 text-rose-700` with an X button to dismiss.

4. **Mobile responsiveness** — All dashboard pages should work on mobile. Sidebar is already handled in `DashboardLayoutClient.tsx`. Make sure tables become scrollable or card-stack on mobile.

5. **Consistent heading hierarchy** — Every page section should use:
   ```tsx
   <h1 className="text-2xl font-black italic text-slate-900">Title</h1>
   <p className="text-sm text-slate-500 mt-1">Subtitle</p>
   ```

---

### 5. DO NOT Touch These (Already Done Correctly)

- `components/AccessibilityMenu.tsx` — color bubble system, DO NOT change
- `components/AiBubble.tsx` — floating AI bubble, DO NOT change
- `components/ScannerBubble.tsx` — floating scanner bubble, DO NOT change
- `components/Themer.tsx` — color sync system, DO NOT change
- `app/globals.css` CSS variables — DO NOT change existing tokens
- `components/DashboardLayoutClient.tsx` — sidebar layout, DO NOT change
- All auth components — `LoginPortal.tsx`, `RegisterPortal.tsx`, etc.
- All landing components — `LandingPage.tsx`, `Navbar.tsx`, `PricingSection.tsx`
- RTL/LTR direction system — `useI18n()` hook, `I18nProvider`, `dir` attribute

---

### 6. Architecture Constraints

- **Next.js 15 App Router** — Server Components by default. Add `"use client"` only when using hooks, state, browser APIs
- **No new dependencies** — Use only what's already installed (Lucide icons, Framer Motion, Recharts for charts)
- **Subscription tiers:** `FREE | HOUSEHOLD | DEALER | COMPANY | CORPORATE`
- **Scan credits:** `cheap` (Gemini) and `premium` (OpenAI/Anthropic)
- **Payments:** PayPal + Pay Plus (Israeli payment gateway)
- **Database:** Prisma 6 + PostgreSQL (Neon) — don't modify schema unless necessary

---

### 7. Design Reference

The following files show the target design language. Read these before starting:
- `components/LandingPage.tsx` — full redesign example (hero, cards, footer)
- `components/DashboardLayoutClient.tsx` — sidebar nav pattern, active state, card styles
- `app/globals.css` — all design tokens and utility classes

**Card pattern:**
```tsx
<div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/80">
```

**Blue accent card:**
```tsx
<div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
```

**Section header:**
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="text-xl font-black italic text-slate-900 flex items-center gap-2">
      <Icon size={20} className="text-blue-600" /> Section Title
    </h2>
    <p className="text-sm text-slate-500 mt-0.5">Subtitle</p>
  </div>
  <button className="btn-primary">Action</button>
</div>
```
