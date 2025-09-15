import React, { useState, useMemo } from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  // Size variants
  size?: "sm" | "md" | "lg" | "xl";
  // Shape variants
  shape?: "square" | "rounded";
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Avatar
 *
 * RetroUI-styled avatar component with pixel art frames.
 * - Supports images with fallback text
 * - Multiple sizes and shapes
 * - Automatic fallback handling
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  size = "md",
  shape = "square",
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    "--avatar-bg": bg,
    "--avatar-text": textColor,
    "--avatar-border": borderColor,
    "--avatar-border-svg": svgString,
  } as React.CSSProperties;

  const avatarClasses = [
    "pixel-avatar",
    `pixel-avatar--${size}`,
    `pixel-avatar--${shape}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={avatarClasses}
      style={customStyle}
      {...props}
    />
  );
});
Avatar.displayName = "Avatar";

/**
 * AvatarImage
 *
 * Image element for avatar with fallback handling.
 */
export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({
  className = "",
  fallback,
  onError,
  ...props
}, ref) => {
  const [hasError, setHasError] = useState(false);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    onError?.(event);
  };

  if (hasError && fallback) {
    return (
      <div className={`pixel-avatar__fallback ${className}`}>
        {fallback}
      </div>
    );
  }

  return (
    <img
      ref={ref}
      className={`pixel-avatar__image ${className}`}
      onError={handleError}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

/**
 * AvatarFallback
 *
 * Fallback content when image fails to load.
 */
export const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pixel-avatar__fallback ${className}`}
      {...props}
    />
  );
});
AvatarFallback.displayName = "AvatarFallback";