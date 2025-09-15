import React, { useMemo } from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  // Variants
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  // Optional icon
  icon?: React.ReactNode;
  // Dismissible
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Alert
 *
 * RetroUI-styled alert component for status messages.
 * - Multiple variants for different message types
 * - Optional icon and dismiss functionality
 * - Accessible with proper ARIA attributes
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  variant = "default",
  icon,
  dismissible = false,
  onDismiss,
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
      case "destructive":
        return {
          "--alert-custom-bg": bg || "#fef2f2",
          "--alert-custom-text": textColor || "#dc2626",
          "--alert-custom-border": borderColor || "#dc2626",
        };
      case "warning":
        return {
          "--alert-custom-bg": bg || "#fffbeb",
          "--alert-custom-text": textColor || "#d97706",
          "--alert-custom-border": borderColor || "#d97706",
        };
      case "success":
        return {
          "--alert-custom-bg": bg || "#f0fdf4",
          "--alert-custom-text": textColor || "#16a34a",
          "--alert-custom-border": borderColor || "#16a34a",
        };
      case "info":
        return {
          "--alert-custom-bg": bg || "#eff6ff",
          "--alert-custom-text": textColor || "#2563eb",
          "--alert-custom-border": borderColor || "#2563eb",
        };
      default:
        return {
          "--alert-custom-bg": bg || "#f8f9fa",
          "--alert-custom-text": textColor || "#000000",
          "--alert-custom-border": borderColor || "#000000",
        };
    }
  };

  const customStyle = {
    ...getVariantStyles(),
    "--alert-border-svg": svgString,
  } as React.CSSProperties;

  const alertClasses = [
    "pixel-alert",
    `pixel-alert--${variant}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={alertClasses}
      style={customStyle}
      role="alert"
      {...props}
    >
      {icon && (
        <div className="pixel-alert__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="pixel-alert__content">
        {children}
      </div>
      {dismissible && (
        <button
          className="pixel-alert__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
});
Alert.displayName = "Alert";

/**
 * AlertTitle
 *
 * Title heading for alert.
 */
export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(({
  className = "",
  as: Component = "h4",
  ...props
}, ref) => {
  return (
    <Component
      ref={ref as any}
      className={`pixel-alert__title ${className}`}
      {...props}
    />
  );
});
AlertTitle.displayName = "AlertTitle";

/**
 * AlertDescription
 *
 * Description content for alert.
 */
export const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pixel-alert__description ${className}`}
      {...props}
    />
  );
});
AlertDescription.displayName = "AlertDescription";