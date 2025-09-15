/**
 * RetroUI Theme Configuration
 * 
 * Centralized theme system for consistent styling across all components.
 * Supports CSS custom properties for runtime theming.
 */

export interface RetroTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    border: string;
    shadow: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
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
    "2xl": string;
  };
  zIndex: {
    dropdown: number;
    sticky: number;
    fixed: number;
    modalBackdrop: number;
    modal: number;
    popover: number;
    tooltip: number;
  };
}

export const defaultTheme: RetroTheme = {
  colors: {
    primary: "#000000",
    secondary: "#666666",
    background: "#ffffff",
    surface: "#f0f0f0",
    border: "#000000",
    shadow: "#000000",
    accent: "#c381b5",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#dc2626",
    info: "#2563eb",
  },
  fonts: {
    primary: "inherit",
    secondary: "inherit",
    accent: "inherit",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

/**
 * Apply theme to CSS custom properties
 */
export function applyTheme(theme: Partial<RetroTheme>, element: HTMLElement = document.documentElement): void {
  const fullTheme = { ...defaultTheme, ...theme };
  
  // Apply color variables
  if (theme.colors) {
for (const key in theme.colors) {
      const value = theme.colors[key as keyof typeof theme.colors] as string;
      element.style.setProperty(`--retro-${key}`, value);
    }
}
  
  // Apply font variables
  if (theme.fonts) {
for (const key in theme.fonts) {
      const value = theme.fonts[key as keyof typeof theme.fonts] as string;
      element.style.setProperty(`--retro-font-${key}`, value);
    }
}
  
  // Apply spacing variables
  if (theme.spacing) {
for (const key in theme.spacing) {
      const value = theme.spacing[key as keyof typeof theme.spacing] as string;
      element.style.setProperty(`--spacing-${key}`, value);
    }
}
  
  // Apply z-index variables
  if (theme.zIndex) {
for (const key in theme.zIndex) {
      const value = theme.zIndex[key as keyof typeof theme.zIndex] as number;
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      element.style.setProperty(`--z-${cssKey}`, value.toString());
    }
  }
}

/**
 * Create a theme variant
 */
export function createTheme(overrides: Partial<RetroTheme>): RetroTheme {
  return {
    colors: { ...defaultTheme.colors, ...overrides.colors },
    fonts: { ...defaultTheme.fonts, ...overrides.fonts },
    spacing: { ...defaultTheme.spacing, ...overrides.spacing },
    zIndex: { ...defaultTheme.zIndex, ...overrides.zIndex },
  };
}

/**
 * Predefined theme variants
 */
export const themes = {
  default: defaultTheme,
  
dark: createTheme({
    colors: {
      primary: "#ffffff",
      secondary: "#cccccc",
      background: "#1a1a1a",
      surface: "#2a2a2a",
      border: "#ffffff",
      shadow: "#000000",
      accent: "#c381b5",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#dc2626",
      info: "#2563eb",
    },
  }),
  
retro: createTheme({
    colors: {
      primary: "#000000",
      secondary: "#666666",
      background: "#f8f8f8",
      surface: "#e0e0e0",
      border: "#000000",
      shadow: "#8b5fa3",
      accent: "#c381b5",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#dc2626",
      info: "#2563eb",
    },
  }),
  
neon: createTheme({
    colors: {
      primary: "#00ff00",
      secondary: "#00cccc",
      background: "#000000",
      surface: "#1a1a1a",
      border: "#00ff00",
      shadow: "#004400",
      accent: "#ff00ff",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#dc2626",
      info: "#2563eb",
    },
  }),
} as const;

/**
 * Component-specific theme utilities
 */
export const componentThemes = {
  button: {
    variants: {
      default: {
        bg: "var(--retro-surface)",
        text: "var(--retro-primary)",
        border: "var(--retro-border)",
        shadow: "var(--retro-shadow)",
      },
      primary: {
        bg: "var(--retro-primary)",
        text: "var(--retro-background)",
        border: "var(--retro-primary)",
        shadow: "var(--retro-shadow)",
      },
      secondary: {
        bg: "var(--retro-secondary)",
        text: "var(--retro-background)",
        border: "var(--retro-secondary)",
        shadow: "var(--retro-shadow)",
      },
      destructive: {
        bg: "var(--retro-error)",
        text: "var(--retro-background)",
        border: "var(--retro-error)",
        shadow: "var(--retro-shadow)",
      },
      success: {
        bg: "var(--retro-success)",
        text: "var(--retro-background)",
        border: "var(--retro-success)",
        shadow: "var(--retro-shadow)",
      },
    },
  },
  
  alert: {
    variants: {
      default: {
        bg: "var(--retro-surface)",
        text: "var(--retro-primary)",
        border: "var(--retro-border)",
      },
      success: {
        bg: "#f0fdf4",
        text: "var(--retro-success)",
        border: "var(--retro-success)",
      },
      warning: {
        bg: "#fffbeb",
        text: "var(--retro-warning)",
        border: "var(--retro-warning)",
      },
      error: {
        bg: "#fef2f2",
        text: "var(--retro-error)",
        border: "var(--retro-error)",
      },
      info: {
        bg: "#eff6ff",
        text: "var(--retro-info)",
        border: "var(--retro-info)",
      },
    },
  },
} as const;

/**
 * Generate SVG border pattern for components
 */
export function generateBorderSvg(color: string = "#000000"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Generate arrow SVG for dropdowns and navigation
 */
export function generateArrowSvg(color: string = "currentColor"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><path d="M127 21h44v43h43v42h43v43h42v43h43v42h42v44h-42v43h-43v42h-42v43h-43v42h-43v43h-44z" fill="${color}" /></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}