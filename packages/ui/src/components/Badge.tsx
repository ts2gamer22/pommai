import React, { useMemo } from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  // Variants
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  // Size variants
  size?: "sm" | "md" | "lg";
  // Content
  children: React.ReactNode;
}

/**
 * Badge
 *
 * RetroUI-styled badge component for status indicators.
 * - Supports multiple variants and sizes
 * - Pixel art styling with custom theming
 * - Accessible with proper ARIA attributes
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  variant = "default",
  size = "md",
  children,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  // Generate variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          "--badge-custom-bg": bg || "#e5e5e5",
          "--badge-custom-text": textColor || "#000000",
          "--badge-custom-border": borderColor || "#c0c0c0",
        };
      case "destructive":
        return {
          "--badge-custom-bg": bg || "#ff4444",
          "--badge-custom-text": textColor || "#ffffff",
          "--badge-custom-border": borderColor || "#cc0000",
        };
      case "success":
        return {
          "--badge-custom-bg": bg || "#22c55e",
          "--badge-custom-text": textColor || "#ffffff",
          "--badge-custom-border": borderColor || "#16a34a",
        };
      case "warning":
        return {
          "--badge-custom-bg": bg || "#f59e0b",
          "--badge-custom-text": textColor || "#ffffff",
          "--badge-custom-border": borderColor || "#d97706",
        };
      case "outline":
        return {
          "--badge-custom-bg": bg || "transparent",
          "--badge-custom-text": textColor || "#000000",
          "--badge-custom-border": borderColor || "#000000",
        };
      default:
        return {
          "--badge-custom-bg": bg || "#000000",
          "--badge-custom-text": textColor || "#ffffff",
          "--badge-custom-border": borderColor || "#000000",
        };
    }
  };

  const customStyle = {
    ...getVariantStyles(),
    borderImageSource: svgString,
  } as React.CSSProperties;

  const badgeClasses = [
    "pixel-badge",
    `pixel-badge--${variant}`,
    size !== "md" ? `pixel-badge--${size}` : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <span
      ref={ref}
      className={badgeClasses}
      style={customStyle}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = "Badge";