import React, { useMemo } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bg?: string;
  textColor?: string;
  shadow?: string;
  borderColor?: string;
  // Enhanced size variants
  size?: "sm" | "md" | "lg" | "icon" | "small";
  // Enhanced variant system with proper RetroUI styling
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  // Enhanced states
  loading?: boolean;
  disabled?: boolean;
  // Icon support
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button
 *
 * Enhanced retro pixel-styled button with variants, states, and icon support.
 * - Does not enforce any font; pass font-minecraft or font-geo via className as needed.
 * - Colors can be customized via props (bg, textColor, shadow, borderColor) or CSS variables.
 * - Supports loading states, variants, and left/right icons.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = "",
  bg,
  textColor,
  shadow,
  borderColor,
  style,
  variant = "default",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"8\" height=\"8\"><path d=\"M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z\" fill=\"${color}\"/></svg>`;
    return `url(\"data:image/svg+xml,${encodeURIComponent(svg)}\")`;
  }, [borderColor]);

  // Generate variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          "--button-custom-bg": bg || "#e5e5e5",
          "--button-custom-text": textColor || "#000000",
          "--button-custom-shadow": shadow || "#c0c0c0",
        };
      case "destructive":
        return {
          "--button-custom-bg": bg || "#ff4444",
          "--button-custom-text": textColor || "#ffffff",
          "--button-custom-shadow": shadow || "#cc0000",
        };
      case "outline":
        return {
          "--button-custom-bg": bg || "transparent",
          "--button-custom-text": textColor || "#000000",
          "--button-custom-shadow": shadow || "transparent",
        };
      case "ghost":
        return {
          "--button-custom-bg": bg || "transparent",
          "--button-custom-text": textColor || "#000000",
          "--button-custom-shadow": shadow || "transparent",
        };
      default:
        return {
          "--button-custom-bg": bg,
          "--button-custom-text": textColor,
          "--button-custom-shadow": shadow,
        };
    }
  };

  // Generate size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
      case "small":
        return "pixel-button--sm";
      case "lg":
        return "pixel-button--lg";
      case "icon":
        return "pixel-button--icon";
      default:
        return "";
    }
  };

  const customStyle = {
    ...style,
    ...getVariantStyles(),
    "--button-custom-border": borderColor,
    borderImageSource: svgString,
  } as React.CSSProperties;

  const buttonClasses = [
    "pixel-button",
    getSizeClasses(),
    variant !== "default" ? `pixel-button--${variant}` : "",
    loading ? "pixel-button--loading" : "",
    disabled ? "pixel-button--disabled" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <button
      ref={ref}
      className={buttonClasses}
      style={customStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="pixel-button__spinner" aria-hidden="true">
          ⟳
        </span>
      )}
      {leftIcon && !loading && (
        <span className="pixel-button__left-icon" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span className="pixel-button__content">
        {children}
      </span>
      {rightIcon && !loading && (
        <span className="pixel-button__right-icon" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = "Button";
