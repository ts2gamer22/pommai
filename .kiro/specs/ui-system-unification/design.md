# Design Document

## Overview

The UI System Unification project will transform Pommai's inconsistent dual-component system into a unified RetroUI-based design system. The solution establishes @pommai/ui as the single source of truth for all UI components, converts existing shadcn/ui components to RetroUI styling, and creates a comprehensive component library that maintains the clean, modern retro aesthetic throughout the platform.

## Architecture

### Component System Hierarchy

```
@pommai/ui (Primary Design System)
├── Core Components (Button, Card, Input, etc.)
├── Layout Components (Dialog, Sheet, Popover, etc.)
├── Form Components (Select, Checkbox, Radio, etc.)
├── Data Components (Table, Badge, Avatar, etc.)
├── Navigation Components (Dropdown, Tabs, etc.)
└── Feedback Components (Alert, Toast, Progress, etc.)

apps/web/src/components/ui/ (Compatibility Layer)
├── Re-exports from @pommai/ui
├── RetroUI-styled Radix primitives
└── Backward compatibility wrappers
```

### Design System Principles

1. **RetroUI First**: All components use pixel art styling with consistent border-image patterns
2. **CSS Custom Properties**: Theming through CSS variables for consistent customization
3. **Radix Integration**: Complex components built on Radix primitives with RetroUI styling
4. **API Consistency**: Standardized prop interfaces across all components
5. **TypeScript Support**: Full type safety with proper prop definitions

## Components and Interfaces

### Core Component Categories

#### 1. Form Components
- **Button**: Enhanced with more variant support while maintaining pixel styling
- **Input**: Text inputs with icon support and validation states
- **TextArea**: Multi-line text input with RetroUI styling
- **Select**: Dropdown selection with RetroUI-styled options
- **Checkbox**: Pixel-styled checkboxes with proper accessibility
- **RadioGroup**: Grouped radio buttons with RetroUI styling
- **Switch**: Toggle switches with pixel art design
- **Slider**: Range inputs with RetroUI track and thumb styling

#### 2. Layout Components
- **Card**: Enhanced with more sub-components (Header, Content, Footer)
- **Dialog**: Modal dialogs using Radix with RetroUI popup styling
- **Sheet**: Side panels and drawers with RetroUI styling
- **Popover**: Floating content containers with pixel borders
- **Tooltip**: Hover information with RetroUI bubble styling
- **Separator**: Visual dividers with pixel art styling

#### 3. Navigation Components
- **Tabs**: Enhanced tab system with RetroUI styling
- **DropdownMenu**: Context menus with pixel art styling
- **Accordion**: Collapsible content sections
- **Breadcrumb**: Navigation trails with RetroUI styling

#### 4. Data Display Components
- **Table**: Data tables with RetroUI borders and styling
- **Badge**: Status indicators with pixel styling
- **Avatar**: User profile images with RetroUI frames
- **Alert**: Status messages with RetroUI styling
- **Progress**: Loading and progress indicators
- **Skeleton**: Loading placeholders with RetroUI styling

### Component API Design

#### Standardized Props Interface
```typescript
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadow?: string;
}

interface SizeVariantProps {
  size?: "sm" | "md" | "lg";
}

interface VariantProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
}
```

#### Enhanced Button Component
```typescript
interface ButtonProps extends BaseComponentProps, SizeVariantProps, VariantProps {
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### Enhanced Card Component
```typescript
interface CardProps extends BaseComponentProps {
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

// Sub-components for shadcn compatibility
interface CardHeaderProps extends BaseComponentProps {}
interface CardContentProps extends BaseComponentProps {}
interface CardFooterProps extends BaseComponentProps {}
```

### CSS Architecture

#### RetroUI CSS Structure
```css
@layer components {
  /* Base pixel styling utilities */
  .pixel-border { /* Shared border-image styling */ }
  .pixel-shadow { /* Consistent shadow patterns */ }
  .pixel-hover { /* Hover state animations */ }
  
  /* Component-specific styles */
  .pixel-button { /* Button styling */ }
  .pixel-card { /* Card styling */ }
  .pixel-input { /* Input styling */ }
  /* ... other components */
  
  /* Variant modifiers */
  .pixel-button--secondary { /* Button variants */ }
  .pixel-card--hover { /* Card hover states */ }
  /* ... other variants */
}
```

#### CSS Custom Properties Theme
```css
:root {
  /* Color system */
  --retro-primary: #000000;
  --retro-secondary: #666666;
  --retro-background: #ffffff;
  --retro-surface: #f0f0f0;
  --retro-border: #000000;
  --retro-shadow: #000000;
  
  /* Typography */
  --retro-font-primary: /* Primary font */;
  --retro-font-secondary: /* Secondary font */;
  --retro-font-accent: /* Accent font */;
  
  /* Spacing */
  --retro-spacing-xs: 4px;
  --retro-spacing-sm: 8px;
  --retro-spacing-md: 16px;
  --retro-spacing-lg: 24px;
  --retro-spacing-xl: 32px;
}
```

## Data Models

### Component Registry
```typescript
interface ComponentDefinition {
  name: string;
  category: 'form' | 'layout' | 'navigation' | 'data' | 'feedback';
  hasRetroStyling: boolean;
  usesRadix: boolean;
  apiCompatibility: 'full' | 'partial' | 'breaking';
  migrationPath: string;
}

interface MigrationMapping {
  oldImport: string;
  newImport: string;
  propsChanges: PropChange[];
  styleChanges: string[];
}
```

### Theme Configuration
```typescript
interface RetroTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    border: string;
    shadow: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    accent: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
```

## Error Handling

### Component Error Boundaries
- Wrap complex components with error boundaries
- Provide fallback UI with RetroUI styling
- Log component errors for debugging

### Prop Validation
- Use TypeScript for compile-time validation
- Provide runtime warnings for invalid prop combinations
- Default to safe fallback values

### CSS Fallbacks
- Provide fallback styles for unsupported browsers
- Graceful degradation of pixel art effects
- Maintain functionality without advanced CSS features

## Testing Strategy

### Component Testing
1. **Visual Regression Testing**: Screenshot comparisons for RetroUI styling
2. **Accessibility Testing**: Ensure all components meet WCAG standards
3. **API Testing**: Verify prop interfaces and component behavior
4. **Integration Testing**: Test component interactions and theming

### Migration Testing
1. **Before/After Comparisons**: Visual diffs of migrated components
2. **Functionality Testing**: Ensure no behavioral regressions
3. **Performance Testing**: Monitor bundle size and runtime performance
4. **Cross-browser Testing**: Verify RetroUI styling across browsers

### Testing Tools
- **Jest + React Testing Library**: Unit and integration tests
- **Storybook**: Component documentation and visual testing
- **Chromatic**: Visual regression testing
- **Axe**: Accessibility testing

### Test Coverage Requirements
- 90%+ test coverage for all components
- Visual regression tests for all RetroUI components
- Accessibility tests for all interactive components
- Performance benchmarks for component rendering