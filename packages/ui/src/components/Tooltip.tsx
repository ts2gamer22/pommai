'use client';

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export interface TooltipContentProps {
  className?: string;
  children: React.ReactNode;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  // Positioning
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  // Behavior
  avoidCollisions?: boolean;
}

// Context for Tooltip state
const TooltipContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
triggerRef: React.MutableRefObject<HTMLElement | null>;
  delayDuration: number;
} | null>(null);

/**
 * Tooltip
 *
 * Root tooltip component that manages hover state with delay.
 */
export const Tooltip: React.FC<TooltipProps> = ({ children, delayDuration = 700 }) => {
  const [open, setOpen] = useState(false);
const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <TooltipContext.Provider value={{ open, onOpenChange: setOpen, triggerRef, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
};

/**
 * TooltipTrigger
 *
 * Element that triggers the tooltip on hover.
 */
export const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(({
  children,
  asChild = false,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const context = React.useContext(TooltipContext);
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  if (!context) {
    throw new Error("TooltipTrigger must be used within a Tooltip");
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      context.onOpenChange(true);
    }, context.delayDuration);
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
if (timeoutRef.current) clearTimeout(timeoutRef.current);
    context.onOpenChange(false);
    onMouseLeave?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
if (timeoutRef.current) clearTimeout(timeoutRef.current);
    context.onOpenChange(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
if (timeoutRef.current) clearTimeout(timeoutRef.current);
    context.onOpenChange(false);
    onBlur?.(event);
  };

  const combinedRef = React.useCallback((node: HTMLElement) => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
(ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    }
(context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
  }, [ref, context.triggerRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (asChild && React.isValidElement(children)) {
return React.cloneElement(children as React.ReactElement<any>, ({
      ref: combinedRef as any,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    } as any));
  }

  return (
    <span
ref={combinedRef as any}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </span>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

/**
 * TooltipContent
 *
 * Floating tooltip content with RetroUI bubble styling.
 */
export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(({
  className = "",
  children,
  bg,
  textColor,
  borderColor,
  side = "top",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  ...props
}, ref) => {
  const context = React.useContext(TooltipContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  
  if (!context) {
    throw new Error("TooltipContent must be used within a Tooltip");
  }

  const { open, triggerRef } = context;

  useEffect(() => {
    setMounted(true);
  }, []);

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
    let actualSide = side;

    // Calculate initial position based on side
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
    if (actualSide === "top" || actualSide === "bottom") {
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

    // Collision detection and avoidance
    if (avoidCollisions) {
      // Check if tooltip would go outside viewport and flip if needed
      if (actualSide === "top" && top < 8) {
        actualSide = "bottom";
        top = triggerRect.bottom + sideOffset;
      } else if (actualSide === "bottom" && top + contentRect.height > viewport.height - 8) {
        actualSide = "top";
        top = triggerRect.top - contentRect.height - sideOffset;
      } else if (actualSide === "left" && left < 8) {
        actualSide = "right";
        left = triggerRect.right + sideOffset;
      } else if (actualSide === "right" && left + contentRect.width > viewport.width - 8) {
        actualSide = "left";
        left = triggerRect.left - contentRect.width - sideOffset;
      }
    }

    // Ensure tooltip stays within viewport bounds
    left = Math.max(8, Math.min(left, viewport.width - contentRect.width - 8));
    top = Math.max(8, Math.min(top, viewport.height - contentRect.height - 8));

    setPosition({ top, left });
  }, [side, align, sideOffset, alignOffset, avoidCollisions]);

  // Update position when open
  useEffect(() => {
    if (open) {
      // Small delay to ensure content is rendered and measured
      const timer = setTimeout(updatePosition, 0);
      
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [open, updatePosition]);

  if (!open || !mounted) return null;

  const customStyle = {
    "--tooltip-bg": bg,
    "--tooltip-text": textColor,
    "--tooltip-border": borderColor,
    "--tooltip-border-svg": svgString,
    top: position.top,
    left: position.left,
  } as React.CSSProperties;

  const tooltipClasses = [
    "pixel-tooltip",
    `pixel-tooltip--${side}`,
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
      className={tooltipClasses}
      style={customStyle}
      role="tooltip"
      {...props}
    >
      {children}
    </div>
  );

  // Render in a portal for proper stacking
  // Only use portal after component is mounted to avoid hydration issues
  if (typeof document !== "undefined" && mounted) {
    return createPortal(content, document.body);
  }
  return content;
});
TooltipContent.displayName = "TooltipContent";