# BSD-YBM v2 Blueprint

## Goal
BSD-YBM v2 is not a cosmetic refresh. It is a full front-end and product-structure rewrite that keeps the working business logic where possible, while rebuilding the user experience, layout system, design language, and implementation boundaries.

The current product has strong capability density:
- CRM
- ERP and billing
- AI-assisted workflows
- Admin and control surfaces
- industry-aware behavior

The current weakness is not feature depth. It is fragmentation:
- too many visual directions
- oversized UI files
- inconsistent information hierarchy
- overlapping navigation concepts
- marketing and product language that do not feel like one company

v2 should make BSD-YBM feel like one intentional operating system for professional businesses in Israel, not a collection of powerful modules.

---

## Product Positioning
### One sentence
BSD-YBM is the operational intelligence system for service businesses that need CRM, billing, document intelligence, and execution in one place.

### Primary audience
- owner-led service businesses
- small to mid-size firms
- operations-heavy teams
- professional practices with recurring documents and client workflows

### Secondary audience
- accountants
- contractors
- legal offices
- clinics
- real-estate operators

### Product promise
- fewer tools
- fewer handoffs
- faster decisions
- less admin work
- AI that feels embedded, not bolted on

---

## Core Principles
1. One product, one voice
Every page should feel like it belongs to the same system.

2. Calm command center
The UI should feel precise, decisive, and trustworthy rather than flashy.

3. AI is infrastructure
AI should appear as a native capability inside flows, not as a separate gimmick.

4. Business before decoration
Every screen must answer one of these:
- What needs attention?
- What changed?
- What should I do next?

5. Rewrite by slice, not by explosion
We keep the stable backend and migrate front-end surfaces in controlled phases.

---

## Strategic Decision
### Keep
- Next.js App Router
- Prisma and Neon
- NextAuth and current auth strategy
- existing API routes and business logic where stable
- existing domain model
- internationalization infrastructure

### Rewrite
- landing and public marketing experience
- auth UI
- app shell
- dashboard navigation
- CRM surface
- billing surface
- settings surface
- visual system and component primitives

### Refactor, not rewrite immediately
- Meckano
- executive dashboards
- AI assistant orchestration
- admin control tools

---

## Information Architecture v2
### Public routes
- `/`
  Marketing home with sharp positioning and clear CTA paths
- `/product`
  Product overview by workflow, not by feature dump
- `/solutions`
  Industry and team use cases
- `/pricing`
  Cleaner packaging and buyer confidence
- `/about`
- `/contact`
- `/login`
- `/register`

### Authenticated routes
- `/app`
  New default authenticated home
- `/app/inbox`
  Urgent items, approvals, reminders, system signals
- `/app/clients`
  CRM
- `/app/documents`
  Scanned and generated documents
- `/app/billing`
  invoices, payments, subscriptions, reporting
- `/app/operations`
  team execution, workflows, automations
- `/app/insights`
  executive and AI insights
- `/app/settings`
  organization, AI, integrations, billing configuration
- `/app/admin`
  internal platform controls

### Mapping from current structure
- current `/dashboard` becomes `/app`
- current CRM, ERP, invoices, settings, intelligence, control-center become subareas inside a single app navigation model
- current “AI page” should stop being its own conceptual island and become embedded in all major surfaces

---

## Navigation Model
### Top-level authenticated navigation
- Home
- Inbox
- Clients
- Documents
- Billing
- Operations
- Insights
- Settings

### Secondary navigation rules
- never more than 5 local tabs in a section
- all sections need a default summary view
- every section has:
  - overview
  - working area
  - history/reporting

### Global actions
- New client
- New document
- New invoice
- Ask AI
- Search

### Remove
- overlapping floating controls that compete for attention
- multiple dashboard metaphors on the same page
- duplicated action entry points

---

## Visual Direction
### Desired feeling
- premium
- clear
- modern Israeli business software
- operational, not decorative
- lighter and more editorial than current admin-heavy styling

### Visual language
- clean off-white surfaces with strong structure
- dark ink text
- disciplined brand color usage
- selective saturated accents
- purposeful motion
- generous spacing
- fewer borders, stronger layout rhythm

### Typography
- choose a more intentional pair for Hebrew and Latin
- one display family
- one operational UI family
- strong hierarchy and fewer ad-hoc font treatments

### Color system
- define semantic tokens:
  - canvas
  - surface
  - elevated
  - ink
  - muted
  - line
  - accent
  - success
  - warning
  - danger
  - info
- remove the current drift between indigo, blue, emerald, violet, and ad-hoc gradients

### Motion
- page transitions should be subtle and structural
- list insertions and task completion can be expressive
- avoid floating chrome effects unless they serve a workflow

---

## Design System v2
### Foundation tokens
- spacing scale
- radius scale
- elevation scale
- typography scale
- motion scale
- semantic color tokens

### Primitive components
- button
- input
- textarea
- select
- checkbox
- radio
- switch
- badge
- avatar
- dialog
- drawer
- popover
- table
- data card
- section header
- empty state
- toast
- command palette

### Composite components
- app sidebar
- top bar
- page header
- metric strip
- activity feed
- AI response panel
- document list
- invoice editor
- client board
- timeline
- task panel

### Rule
No page-specific snowflake components before the design tokens and primitives are stable.

---

## Page Rewrites
### 1. Marketing home
Current issue:
- impressive pieces, but inconsistent message and too many aesthetic experiments

v2 direction:
- one strong narrative
- one main CTA
- workflow-based storytelling
- trust through clarity, not hype

Sections:
- Hero
- Why BSD-YBM
- Workflow strip
- Product modules
- Industry fit
- Pricing
- Proof
- Final CTA

### 2. Auth
Current issue:
- functional, but not product-defining

v2 direction:
- cleaner trust cues
- much shorter path to entry
- better handling of invite, org join, and direct plan states

### 3. App shell
Current issue:
- dashboard shell already has power, but it mixes control-center energy, mobile dock experiments, and too many navigation patterns

v2 direction:
- one sidebar
- one top bar
- one command palette
- one global AI entry

### 4. CRM
Current issue:
- feature-rich but oversized and difficult to maintain

v2 direction:
- split into:
  - clients overview
  - pipeline board
  - client detail
  - projects/relationships
  - automations

### 5. Billing
Current issue:
- business-critical but dense

v2 direction:
- separate:
  - billing home
  - invoices/documents
  - payment collections
  - subscription/admin controls
  - reporting

### 6. Settings
Current issue:
- impressive ambition, but too “wizardy” for repeat admin use

v2 direction:
- configuration console with clear sections
- onboarding wizard only when needed

---

## Engineering Architecture v2
### Folder direction
- `app/(marketing)`
- `app/(auth)`
- `app/(app)`
- `components/system`
- `components/marketing`
- `components/app-shell`
- `components/crm`
- `components/billing`
- `components/documents`
- `components/insights`
- `components/settings`
- `lib/domain`
- `lib/ui`
- `lib/server`

### Separation rules
- page files should compose, not contain business logic
- server actions should stay thin and delegate to domain services
- component files above 250-300 lines are suspect
- client and server concerns should be explicit

### New technical standards
- no new “god components”
- no page-specific ad-hoc color values unless tokenized
- no mixed layout systems inside a single screen
- every major module gets tests for core logic and route behavior

---

## Rewrite Phases
### Phase 0: Blueprint and system prep
- finalize IA
- define tokens
- define typography
- define shell behavior
- create component inventory

### Phase 1: Public-facing rewrite
- landing
- pricing
- login/register
- public shell

Reason:
Fastest way to establish the new language without destabilizing internal workflows.

### Phase 2: App shell rewrite
- new `/app` shell
- command palette
- unified navigation
- inbox/home

### Phase 3: CRM rewrite
- clients index
- pipeline
- detail page
- modularize current CRM logic

### Phase 4: Billing and documents rewrite
- invoice flows
- issued documents
- payment reporting
- collections and subscriptions

### Phase 5: Insights and operations
- intelligence
- automations
- execution workflows
- team and zone-related tooling

### Phase 6: Admin and specialized modules
- Meckano
- platform admin
- system health
- edge operational tools

---

## First Build Slice Recommendation
The first implementation slice should be:
- new token system
- new marketing shell
- new home page
- new login/register

Why:
- highest visible impact
- lowest backend risk
- establishes the v2 visual grammar
- gives reusable foundations for the app rewrite

---

## Success Criteria
v2 is successful if:
- a new user understands the product in under 30 seconds
- a logged-in user can tell what needs attention in under 10 seconds
- the app feels like one system rather than many tools
- main UI files shrink dramatically
- new screens can be built from shared primitives instead of one-off styling

---

## Immediate Next Actions
1. Create `v2` design tokens and CSS variables.
2. Build a new marketing shell and home page.
3. Rewrite login and register to match the new system.
4. Introduce the new authenticated app shell behind a controlled route migration.

---

## Non-Goals
- rewriting stable backend logic just because the UI changes
- changing the domain model without product reason
- redesigning every screen before establishing the system
- shipping a giant all-at-once rewrite with no migration path

---

## Final Recommendation
Proceed with a controlled full rewrite of the front-end experience and app structure.

Do not do a blind rewrite of the entire product stack.

BSD-YBM v2 should be:
- new shell
- new design system
- new public experience
- new page composition model
- same proven business engine underneath, until a specific backend area needs deeper refactor
