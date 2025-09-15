import React, { ReactNode, useMemo } from "react";
import { JSX } from "react/jsx-runtime";

export interface CardProps {
  children: ReactNode;
  className?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  // Enhanced props
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bg?: string;
  textColor?: string;
  borderColor?: string;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bg?: string;
  textColor?: string;
  borderColor?: string;
}

/**
 * Card
 *
 * Enhanced retro pixel-styled container with sub-components for shadcn/ui compatibility.
 * - Does not enforce any font; pass font classes via className.
 * - Reads theme variables from globals.css and supports overrides via props.
 * - Supports padding variants and hover states.
 */
export const Card = ({
  children,
  className = "",
  bg,
  textColor,
  borderColor,
  shadowColor,
  style,
  padding = "md",
  hover = false,
  ...props
}: CardProps): JSX.Element => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    ...style,
    "--card-custom-bg": bg,
    "--card-custom-text": textColor,
    "--card-custom-border": borderColor,
    "--card-custom-shadow": shadowColor,
    borderImageSource: svgString,
  };

  const cardClasses = [
    "pixel-card",
    padding !== "md" ? `pixel-card--${padding}` : "",
    hover ? "pixel-card--hover" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      className={cardClasses}
      style={customStyle}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader
 *
 * Header section for Card component with optional styling.
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  style,
  ...props
}, ref) => {
  const customStyle = {
    ...style,
    "--card-header-bg": bg,
    "--card-header-text": textColor,
    "--card-header-border": borderColor,
  };

  return (
    <div
      ref={ref}
      className={`pixel-card__header ${className}`}
      style={customStyle}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

/**
 * CardTitle
 *
 * Title heading for Card component.
 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({
  className = "",
  as: Component = "h3",
  ...props
}, ref) => {
  return (
    <Component
      ref={ref as any}
      className={`pixel-card__title ${className}`}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

/**
 * CardDescription
 *
 * Description text for Card component.
 */
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={`pixel-card__description ${className}`}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

/**
 * CardContent
 *
 * Main content area for Card component.
 */
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({
  className = "",
  padding = "md",
  style,
  ...props
}, ref) => {
  const contentClasses = [
    "pixel-card__content",
    padding !== "md" ? `pixel-card__content--${padding}` : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={contentClasses}
      style={style}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";

/**
 * CardFooter
 *
 * Footer section for Card component.
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  style,
  ...props
}, ref) => {
  const customStyle = {
    ...style,
    "--card-footer-bg": bg,
    "--card-footer-text": textColor,
    "--card-footer-border": borderColor,
  };

  return (
    <div
      ref={ref}
      className={`pixel-card__footer ${className}`}
      style={customStyle}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";
