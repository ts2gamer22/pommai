import React, { useMemo } from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  // Orientation
  orientation?: "horizontal" | "vertical";
  // RetroUI theming props
  color?: string;
  thickness?: number;
  // Decorative or semantic
  decorative?: boolean;
}

/**
 * Separator
 *
 * RetroUI-styled separator component with pixel art design.
 * - Can be horizontal or vertical
 * - Supports custom styling through props
 * - Maintains accessibility with proper ARIA attributes
 */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(({
  className = "",
  orientation = "horizontal",
  color,
  thickness = 2,
  decorative = true,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const separatorColor = color || "#000000";
    
    if (orientation === "horizontal") {
      // Horizontal pixel pattern
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="${thickness}"><rect width="8" height="${thickness}" fill="${separatorColor}"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    } else {
      // Vertical pixel pattern
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${thickness}" height="8"><rect width="${thickness}" height="8" fill="${separatorColor}"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    }
  }, [color, thickness, orientation]);

  const customStyle = {
    "--separator-color": color,
    "--separator-thickness": `${thickness}px`,
    backgroundImage: svgString,
  } as React.CSSProperties;

  const separatorClasses = [
    "pixel-separator",
    `pixel-separator--${orientation}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={separatorClasses}
      style={customStyle}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      {...props}
    />
  );
});

Separator.displayName = "Separator";