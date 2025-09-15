'use client';

import React, { useMemo } from "react";
import { createPortal } from "react-dom";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps {
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  // RetroUI theming props
  bg?: string;
  baseBg?: string;
  overlayBg?: string;
  textColor?: string;
  borderColor?: string;
  // Dialog specific props
  title?: string;
  description?: string;
  showClose?: boolean;
  closeLabel?: string;
  onClose?: () => void;
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

// Context for Dialog state
const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

/**
 * Dialog
 *
 * Root dialog component that manages open/close state.
 */
export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

/**
 * DialogTrigger
 *
 * Button that triggers the dialog to open.
 */
export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(({
  children,
  asChild = false,
  onClick,
  ...props
}, ref) => {
  const context = React.useContext(DialogContext);
  
  if (!context) {
    throw new Error("DialogTrigger must be used within a Dialog");
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
DialogTrigger.displayName = "DialogTrigger";

/**
 * DialogContent
 *
 * Main dialog content with RetroUI popup styling.
 */
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({
  className = "",
  overlayClassName = "",
  contentClassName = "",
  children,
  bg,
  baseBg,
  overlayBg,
  textColor,
  borderColor,
  title,
  description,
  showClose = true,
  closeLabel = "×",
  onClose,
  ...props
}, ref) => {
  const context = React.useContext(DialogContext);
  
  if (!context) {
    throw new Error("DialogContent must be used within a Dialog");
  }

  const { open, onOpenChange } = context;

  const svgString = useMemo(() => {
    const color = borderColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    "--dialog-bg": bg,
    "--dialog-base-bg": baseBg,
    "--dialog-overlay-bg": overlayBg,
    "--dialog-text": textColor,
    "--dialog-border": borderColor,
    "--dialog-border-svg": svgString,
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

  const content = (
    <div
      className={`pixel-dialog-overlay ${overlayClassName}`}
      onClick={handleOverlayClick}
      style={customStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-description" : undefined}
    >
      <div 
        ref={ref}
        className={`pixel-dialog ${className}`} 
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className={`pixel-dialog-inner ${contentClassName}`}>
          {title && <h2 id="dialog-title" className="pixel-dialog-title">{title}</h2>}
          {description && <p id="dialog-description" className="pixel-dialog-description">{description}</p>}
          {showClose && (
            <button 
              className="pixel-dialog-close-button" 
              onClick={handleClose} 
              aria-label="Close dialog"
            >
              {closeLabel}
            </button>
          )}
          <div className="pixel-dialog-content">
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
DialogContent.displayName = "DialogContent";

/**
 * DialogHeader
 *
 * Header section for dialog content.
 */
export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pixel-dialog-header ${className}`}
      {...props}
    />
  );
});
DialogHeader.displayName = "DialogHeader";

/**
 * DialogTitle
 *
 * Title heading for dialog.
 */
export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(({
  className = "",
  as: Component = "h2",
  ...props
}, ref) => {
  return (
    <Component
      ref={ref as any}
      className={`pixel-dialog-title ${className}`}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

/**
 * DialogDescription
 *
 * Description text for dialog.
 */
export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={`pixel-dialog-description ${className}`}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

/**
 * DialogFooter
 *
 * Footer section for dialog actions.
 */
export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pixel-dialog-footer ${className}`}
      {...props}
    />
  );
});
DialogFooter.displayName = "DialogFooter";