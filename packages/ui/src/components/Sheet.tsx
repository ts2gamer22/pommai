'use client';

import React, { useMemo } from "react";
import { createPortal } from "react-dom";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface SheetContentProps {
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  overlayBg?: string;
  // Sheet specific props
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  title?: string;
  description?: string;
  showClose?: boolean;
  closeLabel?: string;
  onClose?: () => void;
}

export interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}
export interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

// Context for Sheet state
const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

/**
 * Sheet
 *
 * Root sheet component that manages open/close state.
 */
export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
};

/**
 * SheetTrigger
 *
 * Button that triggers the sheet to open.
 */
export const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(({
  children,
  asChild = false,
  onClick,
  ...props
}, ref) => {
  const context = React.useContext(SheetContext);
  
  if (!context) {
    throw new Error("SheetTrigger must be used within a Sheet");
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(true);
    onClick?.(event);
  };

  if (asChild && React.isValidElement(children)) {
return React.cloneElement(children as React.ReactElement<any>, ({
      onClick: handleClick,
    } as any));
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
SheetTrigger.displayName = "SheetTrigger";

/**
 * SheetContent
 *
 * Main sheet content with RetroUI styling and slide animations.
 */
export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(({
  className = "",
  overlayClassName = "",
  contentClassName = "",
  children,
  bg,
  textColor,
  borderColor,
  overlayBg,
  side = "right",
  size = "md",
  title,
  description,
  showClose = true,
  closeLabel = "×",
  onClose,
  ...props
}, ref) => {
  const context = React.useContext(SheetContext);
  
  if (!context) {
    throw new Error("SheetContent must be used within a Sheet");
  }

  const { open, onOpenChange } = context;

  const svgString = useMemo(() => {
    const color = borderColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    "--sheet-bg": bg,
    "--sheet-text": textColor,
    "--sheet-border": borderColor,
    "--sheet-overlay-bg": overlayBg,
    "--sheet-border-svg": svgString,
  } as React.CSSProperties;

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  // Lock body scroll and add ESC handler while open
  React.useEffect(() => {
    if (!open) return;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const sheetClasses = [
    "pixel-sheet",
    `pixel-sheet--${side}`,
    `pixel-sheet--${size}`,
    className
  ].filter(Boolean).join(" ");

  const content = (
    <div
      className={`pixel-sheet-overlay ${overlayClassName}`}
      onClick={handleOverlayClick}
      style={customStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "sheet-title" : undefined}
      aria-describedby={description ? "sheet-description" : undefined}
    >
      <div 
        ref={ref}
        className={sheetClasses}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className={`pixel-sheet-inner ${contentClassName}`}>
          {title && <h2 id="sheet-title" className="pixel-sheet-title">{title}</h2>}
          {description && <p id="sheet-description" className="pixel-sheet-description">{description}</p>}
          {showClose && (
            <button 
              className="pixel-sheet-close-button" 
              onClick={handleClose} 
              aria-label="Close sheet"
            >
              {closeLabel}
            </button>
          )}
          <div className="pixel-sheet-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Render in a portal to avoid stacking-context issues
  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
});
SheetContent.displayName = "SheetContent";

/**
 * SheetHeader
 *
 * Header section for sheet content.
 */
export const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pixel-sheet-header ${className}`}
      {...props}
    />
  );
});
SheetHeader.displayName = "SheetHeader";

/**
 * SheetTitle
 *
 * Title heading for sheet.
 */
export const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(({
  className = "",
  as: Component = "h2",
  ...props
}, ref) => {
  return (
    <Component
      ref={ref as any}
      className={`pixel-sheet-title ${className}`}
      {...props}
    />
  );
});
SheetTitle.displayName = "SheetTitle";

/**
 * SheetDescription
 *
 * Description text for sheet.
 */
export const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={`pixel-sheet-description ${className}`}
      {...props}
    />
  );
});
SheetDescription.displayName = "SheetDescription";

/**
 * SheetFooter
 *
 * Footer section for sheet actions.
 */
export const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pixel-sheet-footer ${className}`}
      {...props}
    />
  );
});
SheetFooter.displayName = "SheetFooter";