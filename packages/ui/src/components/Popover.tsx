'use client';

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  children: React.ReactNode;
}

export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface PopoverContentProps {
  className?: string;
  children: React.ReactNode;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  // Positioning
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  // Behavior
  modal?: boolean;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
}

// Context for Popover state
const PopoverContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
} | null>(null);

/**
 * Popover
 *
 * Root popover component that manages open/close state.
 */
export const Popover: React.FC<PopoverProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
<PopoverContext.Provider value={{ open, onOpenChange: setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

/**
 * PopoverTrigger
 *
 * Button that triggers the popover to open/close.
 */
export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(({
  children,
  asChild = false,
  onClick,
  ...props
}, ref) => {
  const context = React.useContext(PopoverContext);
  
  if (!context) {
    throw new Error("PopoverTrigger must be used within a Popover");
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(!context.open);
    onClick?.(event);
  };

  const combinedRef = React.useCallback((node: HTMLButtonElement) => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
    (context.triggerRef as React.MutableRefObject<HTMLElement>).current = node;
  }, [ref, context.triggerRef]);

  if (asChild && React.isValidElement(children)) {
return React.cloneElement(children as React.ReactElement<any>, ({
      ref: combinedRef as any,
      onClick: handleClick,
    } as any));
  }

  return (
    <button ref={combinedRef} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

/**
 * PopoverContent
 *
 * Floating popover content with RetroUI bubble styling.
 */
export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(({
  className = "",
  children,
  bg,
  textColor,
  borderColor,
  shadowColor,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  modal = false,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  ...props
}, ref) => {
  const context = React.useContext(PopoverContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  if (!context) {
    throw new Error("PopoverContent must be used within a Popover");
  }

  const { open, onOpenChange, triggerRef } = context;

  const svgString = useMemo(() => {
    const color = borderColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  // Calculate position based on trigger element
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let top = 0;
    let left = 0;

    // Calculate position based on side
    switch (side) {
      case "top":
        top = triggerRect.top - contentRect.height - sideOffset;
        break;
      case "bottom":
        top = triggerRect.bottom + sideOffset;
        break;
      case "left":
        left = triggerRect.left - contentRect.width - sideOffset;
        break;
      case "right":
        left = triggerRect.right + sideOffset;
        break;
    }

    // Calculate alignment
    if (side === "top" || side === "bottom") {
      switch (align) {
        case "start":
          left = triggerRect.left + alignOffset;
          break;
        case "center":
          left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2 + alignOffset;
          break;
        case "end":
          left = triggerRect.right - contentRect.width + alignOffset;
          break;
      }
    } else {
      switch (align) {
        case "start":
          top = triggerRect.top + alignOffset;
          break;
        case "center":
          top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2 + alignOffset;
          break;
        case "end":
          top = triggerRect.bottom - contentRect.height + alignOffset;
          break;
      }
    }

    // Ensure popover stays within viewport
    left = Math.max(8, Math.min(left, viewport.width - contentRect.width - 8));
    top = Math.max(8, Math.min(top, viewport.height - contentRect.height - 8));

    setPosition({ top, left });
  }, [side, align, sideOffset, alignOffset]);

  // Update position when open
  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [open, updatePosition]);

  // Handle outside clicks
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onPointerDownOutside?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, onPointerDownOutside, onEscapeKeyDown]);

  if (!open) return null;

  const customStyle = {
    "--popover-bg": bg,
    "--popover-text": textColor,
    "--popover-border": borderColor,
    "--popover-shadow": shadowColor,
    "--popover-border-svg": svgString,
    top: position.top,
    left: position.left,
  } as React.CSSProperties;

  const popoverClasses = [
    "pixel-popover",
    `pixel-popover--${side}`,
    className
  ].filter(Boolean).join(" ");

  const content = (
    <div
      ref={(node) => {
        contentRef.current = node;
        if (ref) {
          if (typeof ref === 'function') {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      }}
      className={popoverClasses}
      style={customStyle}
      role="dialog"
      aria-modal={modal}
      {...props}
    >
      {children}
    </div>
  );

  // Render in a portal for proper stacking
  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
});
PopoverContent.displayName = "PopoverContent";