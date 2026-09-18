---
name: AccessHub
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#684000'
  on-tertiary: '#ffffff'
  tertiary-container: '#885500'
  on-tertiary-container: '#ffd4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an authoritative, highly functional, and refined digital environment tailored for enterprise operations, internal communications, and workflow automation. The aesthetic aligns with a **Corporate / Modern** paradigm—balancing operational efficiency with visual calm.

### Personality & Audience
- **Target Audience:** Enterprise employees, operations leads, department heads, and IT administrators navigating internal tooling, directory resources, compliance, and workspace services.
- **Tone & Mood:** Trustworthy, reliable, frictionless, and precise. The interface avoids frivolous ornamentation in favor of crisp delineation, high scan-ability, and reassuring predictability.
- **Visual Stance:** Utilitarian clarity executed with modern software finesse. Generous whitespace pairs with architectural borders and calculated color accents to ensure mission-critical tasks are completed without cognitive fatigue.

## Colors

The palette leverages high-contrast functional roles against cool, light-slate foundations. Color is deployed deliberately: vibrant hues signal state, action, and verification, while structural chrome remains subdued.

### Canvas & Surface Foundations
- **Base Canvas:** `#f8fafc` (Slate 50) provides a soft, eye-resting background.
- **Secondary Surfaces / Well Panels:** `#f1f5f9` (Slate 100) separates secondary content areas and table headers.
- **Card Surfaces:** `#ffffff` (Pure White) defines elevated containers, popovers, and interactive modules.
- **Structural Dividers:** `#e2e8f0` (Slate 200) delivers clean, hairline boundaries without heavy contrast breaks.

### Functional Roles
- **Primary Accent (`#4f46e5`):** Deep indigo handles primary interactive affordances, navigation active states, focus indicator rings, and critical confirmation actions. Interactive hover transitions shift to `#4338ca`.
- **Secondary / Success (`#10b981`):** Emerald green indicates active deployments, verified identities, approved tickets, and operational health.
- **Tertiary / Warning (`#f59e0b`):** Amber governs pending requests, in-review states, and non-blocking security alerts.
- **Neutral Typography Scale:**
  - Headings & High-Emphasis Text: `#0f172a` (Slate 900)
  - Body & Form Labels: `#334155` (Slate 700)
  - Secondary Metadata & Muted Captions: `#64748b` (Slate 500)
  - Disabled Elements & Inactive Placeholders: `#94a3b8` (Slate 400)

## Typography

Inter serves across all tiers to provide a clean, systematic, and highly legible visual foundation. Font tracking is kept neutral to slightly tight on display scales to create dense, structured headlines suitable for dashboards.

### Type Roles & Applications
- **Display & Large Headlines:** Used exclusively for primary portal views, hero metrics, and portal greetings. Restricted on mobile using responsive overrides to maintain balance.
- **Section & Module Titles (`title-md`):** Standard level for card headers, modal titles, and navigation group banners.
- **Body (`body-md` / `body-sm`):** The primary engine for intranet documentation, activity logs, and table data. Set at optimal line-length thresholds (60–75 characters).
- **Labels & Microcopy (`label-md` / `label-sm`):** Tuned with higher medium/semibold weights to preserve crisp legibility on badges, column headers, and form field anchors.

## Layout & Spacing

The design system uses a structured, responsive layout system composed of a persistent collapsible sidebar navigation rail, a fixed top utility header, and a fluid-width work canvas.

### Layout Mechanics
- **Grid Structure:** A 12-column fluid grid system across desktop monitors, collapsing to an 8-column layout for tablet viewports and 4 columns on mobile.
- **Canvas Behavior:** The main dashboard canvas maximizes operational density with standard gutters (`1.5rem` / `24px`), anchoring large tables and multi-widget dashboards within controlled maximum bounds (`1440px`).
- **Breakpoints:**
  - Mobile: `< 640px` (Sidebar transforms into an overlay sheet, margins drop to `1rem`).
  - Tablet: `640px – 1024px` (Sidebar converts to compact icon rail, 2-column card layouts).
  - Desktop: `> 1024px` (Full layout with multi-column widgets and detailed tables).

## Elevation & Depth

Visual hierarchy is maintained through crisp surface layering and razor-thin borders, supported by minimal, highly diffused ambient drop shadows (`shadow-sm`).

### Elevation Levels
- **Level 0 (Flat Canvas):** The `#f8fafc` viewport canvas. Elements resting directly on this tier carry no shadow.
- **Level 1 (Cards & Data Panels):** Surfaces use pure `#ffffff` paired with a mandatory `1px solid #e2e8f0` border and an ambient shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Dropdowns & Popovers):** Elevated contextual menus and autocomplete lists maintain a `1px solid #e2e8f0` stroke with enhanced diffusion: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals & Slide-out Panels):** Critical system dialogues and detail sheets float over a `#0f172a` backdrop (rendered at 40% opacity with a subtle `backdrop-blur-sm`), supported by `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`.

## Shapes

The design system maintains a refined, professional geometry. Corners are slightly softened (`Soft` preset) to balance enterprise precision with contemporary software warmth.

### Corner Curvature Rules
- **Base Controls (`0.25rem` / `4px` - `rounded`):** Applied to badges, table row highlights, and micro-inputs.
- **Standard UI Elements (`0.5rem` / `8px` - `rounded-lg`):** Applied to buttons, form text inputs, select boxes, chips, and toast alerts.
- **Structural Containers (`0.75rem` / `12px` - `rounded-xl`):** Applied to content cards, system widgets, modal dialogues, and outer panel wrappers.
- **Pill Exception (`9999px`):** Status indicator pills, profile avatars, and filter count badges feature fully rounded ends to immediately convey metadata semantics.

## Components

### Buttons
- **Primary:** Solid `#4f46e5` fill, `#ffffff` typography, `rounded-lg`, height `38px`, padding `0 16px`. Hover state triggers `#4338ca`. Focus ring uses `2px` offset with `#4f46e5` at 50% opacity.
- **Secondary / Outline:** Background `#ffffff`, border `1px solid #e2e8f0`, text `#334155`. Hover shifts background to `#f8fafc` and text to `#0f172a`.
- **Ghost:** Borderless, text `#64748b`. Hover transitions to `#f1f5f9` with text `#0f172a`.

### Cards & Panels
- Constructed from pure `#ffffff` with a `1px solid #e2e8f0` border, `rounded-xl` boundary, and standard `1.5rem` internal padding. Card headers contain bold title labels, contextual metadata, and optional right-aligned action buttons separated by an optional hairline divider.

### Status Pills & Badges
- **Active / Approved:** Background `#ecfdf5`, text `#065f46`, border `1px solid #a7f3d0`. Optional leading `6px` solid emerald dot.
- **Pending / In Review:** Background `#fffbeb`, text `#92400e`, border `1px solid #fde68a`.
- **Neutral / Draft:** Background `#f1f5f9`, text `#475569`, border `1px solid #e2e8f0`.
- Shape: Full pill (`9999px`), typography: `label-sm`, padding: `2px 8px`.

### Data Tables
- Header cells: `#f8fafc` background, `1px solid #e2e8f0` bottom border, typography `label-sm` in `#64748b`, uppercase tracking.
- Row items: Background `#ffffff`, border-bottom `1px solid #f1f5f9`, text `body-md` in `#334155`. Hover transitions the row background to `#f8fafc`. Row height defaults to `48px` for data density.

### Form Inputs & Selects
- Height `38px`, background `#ffffff`, border `1px solid #cbd5e1`, `rounded-lg`, typography `body-md` in `#0f172a`.
- Hover: Border shifts to `#94a3b8`.
- Focus: Border shifts to `#4f46e5` with a `3px` glow ring tinted with `#4f46e5` at 15% opacity.
- Error state: Border `#ef4444`, ring `#ef4444` at 15% opacity.

### Checkboxes & Radio Buttons
- Checkboxes: `16px x 16px`, `rounded` (`4px`), border `1px solid #cbd5e1`. Checked state fills `#4f46e5` with a white checkmark.
- Radio buttons: `16px x 16px`, circular (`rounded-full`), border `1px solid #cbd5e1`. Selected state renders a centered `#4f46e5` inner dot.