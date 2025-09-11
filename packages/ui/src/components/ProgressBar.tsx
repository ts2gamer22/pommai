import React, { useMemo } from "react";

export interface ProgressBarProps {
  progress?: number;
  value?: number; // alias for compatibility with other UI APIs
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  borderColor?: string;
}

/**
 * ProgressBar
 *
 * Pixel-styled progress indicator reading theme tokens.
 */
export const ProgressBar = ({
  progress,
  value,
  className = "",
  size = "md",
  color,
  borderColor,
}: ProgressBarProps): JSX.Element => {
  const raw = typeof value === 'number' ? value : (progress ?? 0);
  const clampedProgress = Math.min(Math.max(raw, 0), 100);

  const svgString = useMemo(() => {
    const svgColor = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${svgColor}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const containerClasses = `pixel-progressbar-container pixel-progressbar-${size} ${className}`.trim();

  const customStyle = {
    "--progressbar-custom-color": color,
    "--progressbar-custom-border-color": borderColor,
    borderImageSource: svgString,
  } as React.CSSProperties;

  return (
    <div
      className={containerClasses}
      style={customStyle}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="pixel-progressbar"
        style={{ width: `${clampedProgress}%` }}
      ></div>
    </div>
  );
};
