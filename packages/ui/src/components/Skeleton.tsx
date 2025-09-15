import React, { useMemo } from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  // RetroUI theming props
  bg?: string;
  highlightColor?: string;
  borderColor?: string;
  // Shape variants
  variant?: "text" | "circular" | "rectangular";
  // Size props
  width?: string | number;
  height?: string | number;
  // Animation
  animate?: boolean;
}

/**
 * Skeleton
 *
 * RetroUI-styled skeleton loading component.
 * - Multiple shape variants
 * - Customizable dimensions
 * - Pixel art styling with optional animation
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({
  className = "",
  bg,
  highlightColor,
  borderColor,
  variant = "rectangular",
  width,
  height,
  animate = true,
  style,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "#e0e0e0";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  // Generate variant-specific dimensions
  const getVariantDimensions = () => {
    switch (variant) {
      case "text":
        return {
          width: width || "100%",
          height: height || "1em",
        };
      case "circular":
        const size = width || height || "40px";
        return {
          width: size,
          height: size,
          borderRadius: "50%",
        };
      case "rectangular":
      default:
        return {
          width: width || "100%",
          height: height || "20px",
        };
    }
  };

const customStyle = {
    ...style,
    ...getVariantDimensions(),
    "--skeleton-bg": bg || "#f0f0f0",
    "--skeleton-highlight": highlightColor || "#e0e0e0",
    "--skeleton-border": borderColor || "#e0e0e0",
    "--skeleton-border-svg": svgString,
} as unknown as React.CSSProperties;

  const skeletonClasses = [
    "pixel-skeleton",
    `pixel-skeleton--${variant}`,
    animate ? "pixel-skeleton--animate" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={skeletonClasses}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
});

Skeleton.displayName = "Skeleton";