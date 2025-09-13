# Pommai RetroUI Design System (v1)

This guide documents the core UI/UX decisions for the Pommai web application. It ensures a clean, readable, and delightful retro aesthetic with consistent typography, spacing, and responsive patterns.

## Typography

- Display/Primary Headings: Use the pixel font for prominent titles only.
  - Class: font-minecraft
  - Recommended usage: h1, h2, tab titles, hero titles, key section headings
- Body Text and Supporting UI: Use Work Sans for all content, labels, paragraphs, subheadings, inputs, helpers.
  - Class: font-geo

Base defaults
- Body defaults to font-geo (Work Sans)
- h1, h2 default to the pixel font via global CSS
- h3–h6 default to Work Sans via global CSS

Responsive sizing for primary titles (recommended)
- text-base sm:text-lg lg:text-xl on step/page headings for dense clarity across devices

Examples
```tsx path=null start=null
// Good (primary heading in pixel font)
<h2 className="font-minecraft text-base sm:text-lg lg:text-xl uppercase tracking-wider">
  📦 Device Hub
</h2>

// Good (supporting text in Work Sans)
<p className="font-geo text-sm sm:text-base text-gray-700">
  Add details to personalize your toy.
</p>
```

## Spacing System

Use CSS variables for consistent spacing across components. Prefer p-[var(--spacing-*)], m-[var(--spacing-*)], and gap-[var(--spacing-*)] for paddings, margins, and grid gaps.

Tokens
- --spacing-xs: 4px
- --spacing-sm: 8px
- --spacing-md: 16px
- --spacing-lg: 24px
- --spacing-xl: 32px
- --spacing-2xl: 48px
- --spacing-3xl: 64px

Examples
```tsx path=null start=null
<div className="px-[var(--spacing-md)] py-[var(--spacing-lg)]">
  <Card className="p-[var(--spacing-lg)] sm:p-[var(--spacing-xl)] lg:p-[var(--spacing-2xl)]" />
</div>

<div className="grid gap-[var(--spacing-sm)] sm:gap-[var(--spacing-md)] lg:gap-[var(--spacing-lg)]" />
```

## Colors & Theme Variables

RetroUI components read theme tokens from :root in globals.css. Do not hardcode colors when a variable exists.
- Button: --bg-button, --text-button, --shadow-button, --border-button
- Card: --bg-card, --text-card, --shadow-card, --border-card
- Input: --bg-input, --text-input, --border-input
- TextArea: --bg-textarea, --text-textarea, --border-textarea
- ProgressBar: --color-progressbar, --border-progressbar
- Dropdown, Accordion, Bubble: dedicated tokens are provided

Prefer setting component props (bg, textColor, shadow, borderColor) with palette colors and rely on CSS variables for consistency.

## Responsive Guidelines

- Use Tailwind responsive prefixes directly in JSX (sm:, md:, lg:). Avoid CSS !important overrides in globals.
- Keep headings compact on small screens and scale up at sm and lg breakpoints (see Typography section).
- Prefer collapsing multi-column grids to a single column on small screens using grid-cols-1 sm:grid-cols-2 (or md) patterns.

## Do & Don’t

Do
- Use font-minecraft for h1/h2, tab titles, and major section headings only.
- Use font-geo for all other text (subheads, paragraphs, labels, inputs, helpers).
- Use p-[var(--spacing-*)], m-[var(--spacing-*)], gap-[var(--spacing-*)] consistently.
- Keep UI tokens centralized in globals.css.

Don’t
- Don’t apply font-minecraft to paragraphs, labels, inputs, or help text.
- Don’t rely on CSS !important to force Tailwind sizes; set responsive classes in JSX.
- Don’t hardcode arbitrary colors when a theme variable exists.

## Component Patterns

- Page wrappers: container mx-auto px-[var(--spacing-md)] max-w-7xl
- Section spacers: mb-[var(--spacing-lg)] sm:mb-[var(--spacing-xl)] lg:mb-[var(--spacing-2xl)]
- Cards: p-[var(--spacing-lg)] sm:p-[var(--spacing-xl)] lg:p-[var(--spacing-2xl)]
- Wizard steps: top h2 should use font-minecraft; all text below uses font-geo

Example: Step Header
```tsx path=null start=null
<div className="text-center sm:text-left">
  <h2 className="font-minecraft text-base sm:text-lg lg:text-xl uppercase tracking-wider">🧸 Create Your AI Toy</h2>
  <p className="font-geo text-sm sm:text-base text-gray-600">Design the perfect companion!</p>
</div>
```

## Notes

- Keep files under 500 lines.
- Prefer Airbnb style conventions for TSX/JS.
- Add JSDoc where meaningful to describe component intent.
- When creating new components, place them under the appropriate component folder and follow the patterns above.

