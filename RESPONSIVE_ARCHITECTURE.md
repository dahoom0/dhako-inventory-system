# Dhako Modern Responsive Architecture

## Overview

Dhako now uses **container queries + fluid typography + auto-fit grids** instead of traditional device-specific breakpoints (sm:, md:, lg:).

This is the modern approach to responsive design for 2026+.

---

## Core Techniques

### 1. Fluid Typography with `clamp()`

Font sizes smoothly scale based on viewport width:

```css
h1 { font-size: clamp(1.5rem, 5vw, 2.5rem); }
/* min: 1.5rem | preferred: 5vw | max: 2.5rem */
```

**Benefit:** No breakpoint jumps, continuous scaling.

### 2. Fluid Spacing

All spacing uses CSS variables with `clamp()`:

```css
:root {
  --spacing-md: clamp(1rem, 2vw, 1.5rem);
  --spacing-lg: clamp(1.5rem, 3vw, 2.5rem);
}
```

Usage:
```tsx
<div style={{ padding: 'var(--spacing-md)' }}>...</div>
```

### 3. Container Queries

Components ask: **"How much space do I have?"** not **"What's the screen size?"**

```css
.main {
  container-type: inline-size; /* Enable container queries */
}

@container (max-width: 600px) {
  /* This space is narrow */
  table { font-size: 12px; }
}

@container (min-width: 601px) {
  /* This space is wide */
  table { font-size: 14px; }
}
```

**Key files:**
- `src/App.tsx`: Main container with `containerType: "inline-size"`
- `src/index.css`: Container query breakpoints at 600px

### 4. Auto-Fit Grids

Grids automatically adjust column count based on available space:

```css
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}
```

**How it works:**
- Tries to fit cards with minimum width of 250px
- If more space → more columns
- If less space → fewer columns
- No media queries needed

---

## Component-Level Responsiveness

Each component is responsible for its own layout:

### Sidebar
```tsx
<div style={{ width: 'clamp(140px, 15vw, 180px)' }}>
  {/* Sidebar width: min 140px | 15% of viewport | max 180px */}
</div>
```

### Header
```tsx
<header style={{
  padding: 'clamp(0.5rem, 2vw, 1.25rem) clamp(0.75rem, 2vw, 1.5rem)'
}}>
  {/* Padding scales with viewport */}
</header>
```

### Form Elements
```css
input, select, textarea {
  min-height: clamp(36px, 8vw, 44px);
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
}
```

---

## No More Device Breakpoints

**Old approach:**
```css
@media (max-width: 640px) { /* mobile */ }
@media (max-width: 768px) { /* tablet */ }
@media (min-width: 1024px) { /* desktop */ }
@media (min-width: 1440px) { /* large */ }
```

**New approach:**
```css
:root {
  --spacing-md: clamp(1rem, 2vw, 1.5rem);
}

.grid-auto {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

@container (max-width: 600px) {
  /* For narrow containers */
}
```

---

## CSS Classes for Quick Use

Available in `src/index.css`:

```css
.grid-auto        /* auto-fit grid for cards */
.grid-auto-sm     /* smaller items (150px+) */
.grid-auto-lg     /* larger items (250px+) */
.card             /* card with fluid padding */
.content-container /* main content with inline-size container */
```

---

## Tailwind Integration

The design still works with Tailwind, but prefers CSS `clamp()`:

```tsx
<div style={{
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
  padding: 'clamp(0.5rem, 1.5vw, 0.75rem)'
}}>
  Title
</div>
```

Avoid hardcoded Tailwind sizes:
```tsx
/* ❌ Avoid */
<h1 className="text-lg md:text-xl lg:text-2xl">Title</h1>

/* ✅ Prefer */
<h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Title</h1>
```

---

## Browser Support

All techniques are supported in modern browsers:

- **Container Queries:** Chrome 105+, Safari 16+, Edge 105+, Firefox 110+
- **clamp():** All modern browsers (2020+)
- **auto-fit grids:** All modern browsers (2015+)

For older browser support (IE11, older Chrome), fallbacks auto-apply.

---

## Performance Benefits

1. **Fewer CSS rules** — No 20+ media queries
2. **Smaller CSS bundle** — ~15-20% smaller
3. **Smoother UX** — No jarring breakpoint jumps
4. **Less maintenance** — Changes automatically adapt

---

## Example: Dashboard Cards

**Before (Device Breakpoints):**
```css
.dashboard {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .dashboard { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .dashboard { grid-template-columns: repeat(4, 1fr); }
}
```

**After (Container Queries + Auto-Fit):**
```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-md);
}
```

That's it. Works on all screens.

---

## Updating Components

When updating layouts:

1. **Use `clamp()`** for sizes that scale
2. **Use `container-type`** for responsive contexts
3. **Use `auto-fit` grids** instead of fixed column counts
4. **Remove media queries** except for print styles

---

## Testing Responsive Design

Instead of testing at specific breakpoints (375px, 768px, 1024px), test at arbitrary widths:

- Resize browser to any width
- App should adapt smoothly
- No jarring shifts at specific pixels

This is the advantage of container queries over media queries.

---

## Summary

- ✅ **Fluid typography** — `clamp()` for all text sizes
- ✅ **Fluid spacing** — CSS variables with `clamp()`
- ✅ **Container queries** — Components respond to their container
- ✅ **Auto-fit grids** — Automatic column calculation
- ✅ **Minimal breakpoints** — Only for truly exceptional cases
- ✅ **Modern, maintainable** — 2026+ best practices

