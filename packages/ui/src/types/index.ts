/**
 * Base TypeScript interfaces for RetroUI components
 * 
 * Provides standardized prop interfaces and type definitions
 * for consistent component APIs across the design system.
 */

import React from 'react';

/**
 * Base component props that all RetroUI components should extend
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Child elements */
  children?: React.ReactNode;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * RetroUI theming props for customizing component appearance
 */
export interface RetroUIThemeProps {
  /** Background color override */
  bg?: string;
  /** Text color override */
  textColor?: string;
  /** Border color override */
  borderColor?: string;
  /** Shadow color override */
  shadow?: string;
}

/**
 * Size variant props for components that support multiple sizes
 */
export interface SizeVariantProps {
  /** Component size variant */
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Standard variant props for components with different visual styles
 */
export interface VariantProps {
  /** Component visual variant */
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "success" | "warning" | "info";
}

/**
 * Props for components that can be disabled
 */
export interface DisableableProps {
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Props for components with loading states
 */
export interface LoadingProps {
  /** Whether the component is in a loading state */
  loading?: boolean;
}

/**
 * Props for components that support icons
 */
export interface IconProps {
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
}

/**
 * Combined base props for interactive components
 */
export interface InteractiveComponentProps 
  extends BaseComponentProps, 
          RetroUIThemeProps, 
          SizeVariantProps, 
          VariantProps, 
          DisableableProps {}

/**
 * Combined base props for form components
 */
export interface FormComponentProps 
  extends InteractiveComponentProps {
  /** Component name for form submission */
  name?: string;
  /** Component value */
  value?: string | number | boolean;
  /** Default value */
  defaultValue?: string | number | boolean;
  /** Whether the component is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Props for components with controlled/uncontrolled state
 */
export interface ControlledProps<T = any> {
  /** Controlled value */
  value?: T;
  /** Default value for uncontrolled mode */
  defaultValue?: T;
  /** Change handler */
  onChange?: (value: T) => void;
}

/**
 * Props for components that can be opened/closed
 */
export interface OpenableProps {
  /** Whether the component is open */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Open state change handler */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Props for positioning floating elements
 */
export interface PositioningProps {
  /** Side to position relative to trigger */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment relative to trigger */
  align?: "start" | "center" | "end";
  /** Offset from the trigger */
  sideOffset?: number;
  /** Alignment offset */
  alignOffset?: number;
}

/**
 * Props for components that support asChild pattern
 */
export interface AsChildProps {
  /** Render as child element instead of default element */
  asChild?: boolean;
}

/**
 * Props for components with orientation
 */
export interface OrientationProps {
  /** Component orientation */
  orientation?: "horizontal" | "vertical";
}

/**
 * Props for components with selection
 */
export interface SelectionProps<T = string> {
  /** Selected value(s) */
  value?: T;
  /** Default selected value(s) */
  defaultValue?: T;
  /** Selection change handler */
  onValueChange?: (value: T) => void;
}

/**
 * Props for components with multiple selection
 */
export interface MultiSelectionProps<T = string> {
  /** Selected values */
  value?: T[];
  /** Default selected values */
  defaultValue?: T[];
  /** Selection change handler */
  onValueChange?: (value: T[]) => void;
}

/**
 * Animation and transition props
 */
export interface AnimationProps {
  /** Whether to animate the component */
  animate?: boolean;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation easing function */
  easing?: string;
}

/**
 * Accessibility props for enhanced screen reader support
 */
export interface AccessibilityProps {
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA labelledby */
  'aria-labelledby'?: string;
  /** ARIA describedby */
  'aria-describedby'?: string;
  /** ARIA expanded state */
  'aria-expanded'?: boolean;
  /** ARIA selected state */
  'aria-selected'?: boolean;
  /** ARIA disabled state */
  'aria-disabled'?: boolean;
  /** ARIA hidden state */
  'aria-hidden'?: boolean;
  /** Role attribute */
  role?: string;
  /** Tab index */
  tabIndex?: number;
}

/**
 * Event handler props for common interactions
 */
export interface EventHandlerProps {
  /** Click handler */
  onClick?: (event: React.MouseEvent) => void;
  /** Mouse enter handler */
  onMouseEnter?: (event: React.MouseEvent) => void;
  /** Mouse leave handler */
  onMouseLeave?: (event: React.MouseEvent) => void;
  /** Focus handler */
  onFocus?: (event: React.FocusEvent) => void;
  /** Blur handler */
  onBlur?: (event: React.FocusEvent) => void;
  /** Key down handler */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** Key up handler */
  onKeyUp?: (event: React.KeyboardEvent) => void;
}

/**
 * Validation props for form components
 */
export interface ValidationProps {
  /** Whether the component has an error */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Whether the component is valid */
  valid?: boolean;
  /** Validation message */
  validationMessage?: string;
}

/**
 * Layout props for container components
 */
export interface LayoutProps {
  /** Padding variant */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /** Margin variant */
  margin?: "none" | "sm" | "md" | "lg" | "xl";
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Maximum width */
  maxWidth?: string | number;
  /** Maximum height */
  maxHeight?: string | number;
}

/**
 * Data attribute props for testing and analytics
 */
export interface DataProps {
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Additional data attributes */
  [key: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Complete component props combining all common interfaces
 */
export interface CompleteComponentProps 
  extends BaseComponentProps,
          RetroUIThemeProps,
          SizeVariantProps,
          VariantProps,
          DisableableProps,
          LoadingProps,
          AccessibilityProps,
          EventHandlerProps,
          DataProps {}

/**
 * Ref types for different HTML elements
 */
export type ButtonRef = HTMLButtonElement;
export type InputRef = HTMLInputElement;
export type TextAreaRef = HTMLTextAreaElement;
export type DivRef = HTMLDivElement;
export type SpanRef = HTMLSpanElement;
export type AnchorRef = HTMLAnchorElement;
export type FormRef = HTMLFormElement;
export type LabelRef = HTMLLabelElement;
export type SelectRef = HTMLSelectElement;
export type OptionRef = HTMLOptionElement;
export type TableRef = HTMLTableElement;
export type ListRef = HTMLUListElement | HTMLOListElement;
export type HeadingRef = HTMLHeadingElement;
export type ParagraphRef = HTMLParagraphElement;
export type ImageRef = HTMLImageElement;

/**
 * Forward ref component type helper
 */
export type ForwardRefComponent<T, P = {}> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<T>
>;

/**
 * Polymorphic component props for components that can render as different elements
 */
export type PolymorphicProps<T extends React.ElementType = React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

/**
 * Utility type for extracting props from a component
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Utility type for making certain props required
 */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for making certain props optional
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Theme context type
 */
export interface ThemeContextType {
  /** Current theme */
  theme: string;
  /** Available themes */
  themes: string[];
  /** Set theme function */
  setTheme: (theme: string) => void;
  /** Theme configuration */
  config: Record<string, any>;
}

/**
 * Component registry type for dynamic component loading
 */
export interface ComponentRegistry {
  [key: string]: React.ComponentType<any>;
}

/**
 * Export all component-specific prop types
 */
export * from '../components/Button';
export * from '../components/Card';
export * from '../components/Input';
export * from '../components/TextArea';
export * from '../components/Select';
export * from '../components/Checkbox';
export * from '../components/RadioGroup';
export * from '../components/Switch';
export * from '../components/Slider';
export * from '../components/ProgressBar';
export * from '../components/Dialog';
export * from '../components/Sheet';
export * from '../components/Popover';
export * from '../components/Tooltip';
export * from '../components/Separator';
export * from '../components/Breadcrumb';
export * from '../components/NavigationMenu';
export * from '../components/Table';
export * from '../components/Badge';
export * from '../components/Avatar';
export * from '../components/Alert';
export * from '../components/Skeleton';
export * from '../components/Tabs';
export * from '../components/Accordion';
export * from '../components/Dropdown';
export * from '../components/Popup';
export * from '../components/Bubble';