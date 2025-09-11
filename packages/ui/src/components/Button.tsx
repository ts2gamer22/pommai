import React, { useMemo } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bg?: string;
  textColor?: string;
  shadow?: string;
  borderColor?: string;
  // Accept common size variants used in app wrappers
  size?: "sm" | "md" | "lg" | "icon" | "small";
  // Allow variant for compatibility with other UI APIs (ignored by styling)
  variant?: string;
}

/**
 * Button
 *
 * Retro pixel-styled button.
 * - Does not enforce any font; pass font-minecraft or font-geo via className as needed.
 * - Colors can be customized via props (bg, textColor, shadow, borderColor) or CSS variables.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = "",
  bg,
  textColor,
  shadow,
  borderColor,
  style,
  // variant and size are accepted for compatibility; not used directly here
  variant,
  size,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"8\" height=\"8\"><path d=\"M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z\" fill=\"${color}\"/></svg>`;
    return `url(\"data:image/svg+xml,${encodeURIComponent(svg)}\")`;
  }, [borderColor]);

  const customStyle = {
    ...style,
    "--button-custom-bg": bg,
    "--button-custom-text": textColor,
    "--button-custom-shadow": shadow,
    "--button-custom-border": borderColor,
    borderImageSource: svgString,
  } as React.CSSProperties;

  return (
    <button
      ref={ref}
      className={`pixel-button ${className}`}
      style={customStyle}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
