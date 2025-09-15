'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";

export interface NavigationMenuProps {
  children: React.ReactNode;
  className?: string;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  // Behavior
  orientation?: "horizontal" | "vertical";
  delayDuration?: number;
  skipDelayDuration?: number;
}

export interface NavigationMenuListProps extends React.HTMLAttributes<HTMLUListElement> {}

export interface NavigationMenuItemProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
}

export interface NavigationMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface NavigationMenuContentProps {
  children: React.ReactNode;
  className?: string;
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
}

export interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
  active?: boolean;
}

export interface NavigationMenuIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {}

// Context for NavigationMenu state
const NavigationMenuContext = createContext<{
  activeValue: string | null;
  onValueChange: (value: string | null) => void;
  orientation: "horizontal" | "vertical";
  delayDuration: number;
  skipDelayDuration: number;
} | null>(null);

// Context for NavigationMenuItem
const NavigationMenuItemContext = createContext<{
  value: string;
  isActive: boolean;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
} | null>(null);

/**
 * NavigationMenu
 *
 * Root navigation menu component with RetroUI styling.
 * - Supports horizontal and vertical orientations
 * - Hover and focus management with delays
 * - Keyboard navigation support
 */
export const NavigationMenu = React.forwardRef<HTMLElement, NavigationMenuProps>(({
  children,
  className = "",
  bg,
  textColor,
  borderColor,
  orientation = "horizontal",
  delayDuration = 200,
  skipDelayDuration = 300,
  ...props
}, ref) => {
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const customStyle = {
    "--nav-menu-bg": bg,
    "--nav-menu-text": textColor,
    "--nav-menu-border": borderColor,
  } as React.CSSProperties;

  const navClasses = [
    "pixel-navigation-menu",
    `pixel-navigation-menu--${orientation}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <NavigationMenuContext.Provider
      value={{
        activeValue,
        onValueChange: setActiveValue,
        orientation,
        delayDuration,
        skipDelayDuration,
      }}
    >
      <nav
        ref={ref}
        className={navClasses}
        style={customStyle}
        {...props}
      >
        {children}
      </nav>
    </NavigationMenuContext.Provider>
  );
});
NavigationMenu.displayName = "NavigationMenu";

/**
 * NavigationMenuList
 *
 * List container for navigation menu items.
 */
export const NavigationMenuList = React.forwardRef<HTMLUListElement, NavigationMenuListProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <ul
      ref={ref}
      className={`pixel-navigation-menu__list ${className}`}
      {...props}
    />
  );
});
NavigationMenuList.displayName = "NavigationMenuList";

/**
 * NavigationMenuItem
 *
 * Individual navigation menu item container.
 */
export const NavigationMenuItem: React.FC<NavigationMenuItemProps> = ({
  children,
  className = "",
  value = Math.random().toString(36).substr(2, 9),
}) => {
  const context = useContext(NavigationMenuContext);
const triggerRef = useRef<HTMLElement | null>(null);
  
  if (!context) {
    throw new Error("NavigationMenuItem must be used within a NavigationMenu");
  }

  const isActive = context.activeValue === value;

  const itemClasses = [
    "pixel-navigation-menu__item",
    isActive ? "pixel-navigation-menu__item--active" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <NavigationMenuItemContext.Provider
      value={{
        value,
        isActive,
        triggerRef,
      }}
    >
      <li className={itemClasses}>
        {children}
      </li>
    </NavigationMenuItemContext.Provider>
  );
};

/**
 * NavigationMenuTrigger
 *
 * Button that triggers navigation menu content.
 */
export const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(({
  children,
  className = "",
  asChild = false,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  ...props
}, ref) => {
  const menuContext = useContext(NavigationMenuContext);
  const itemContext = useContext(NavigationMenuItemContext);
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  if (!menuContext || !itemContext) {
    throw new Error("NavigationMenuTrigger must be used within a NavigationMenuItem");
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      menuContext.onValueChange(itemContext.value);
    }, menuContext.delayDuration);
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      menuContext.onValueChange(null);
    }, menuContext.skipDelayDuration);
    onMouseLeave?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    menuContext.onValueChange(itemContext.value);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    // Don't close immediately on blur, let other focus events handle it
    onBlur?.(event);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    menuContext.onValueChange(itemContext.isActive ? null : itemContext.value);
    onClick?.(event);
  };

  const combinedRef = React.useCallback((node: HTMLButtonElement) => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    }
(itemContext.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
  }, [ref, itemContext.triggerRef]);

  const triggerClasses = [
    "pixel-navigation-menu__trigger",
    itemContext.isActive ? "pixel-navigation-menu__trigger--active" : "",
    className
  ].filter(Boolean).join(" ");

  if (asChild && React.isValidElement(children)) {
return React.cloneElement(children as React.ReactElement<any>, ({
      ref: combinedRef as any,
      className: triggerClasses,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
    } as any));
  }

  return (
    <button
      ref={combinedRef}
      className={triggerClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

/**
 * NavigationMenuContent
 *
 * Dropdown content for navigation menu items.
 */
export const NavigationMenuContent = React.forwardRef<HTMLDivElement, NavigationMenuContentProps>(({
  children,
  className = "",
  bg,
  textColor,
  borderColor,
  shadowColor,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  ...props
}, ref) => {
  const menuContext = useContext(NavigationMenuContext);
  const itemContext = useContext(NavigationMenuItemContext);
  
  if (!menuContext || !itemContext) {
    throw new Error("NavigationMenuContent must be used within a NavigationMenuItem");
  }

  const svgString = useMemo(() => {
    const color = borderColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  if (!itemContext.isActive) return null;

  const customStyle = {
    "--nav-content-bg": bg,
    "--nav-content-text": textColor,
    "--nav-content-border": borderColor,
    "--nav-content-shadow": shadowColor,
    "--nav-content-border-svg": svgString,
  } as React.CSSProperties;

  const contentClasses = [
    "pixel-navigation-menu__content",
    `pixel-navigation-menu__content--${side}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={contentClasses}
      style={customStyle}
      {...props}
    >
      {children}
    </div>
  );
});
NavigationMenuContent.displayName = "NavigationMenuContent";

/**
 * NavigationMenuLink
 *
 * Link item within navigation menu.
 */
export const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(({
  children,
  className = "",
  asChild = false,
  active = false,
  ...props
}, ref) => {
  const linkClasses = [
    "pixel-navigation-menu__link",
    active ? "pixel-navigation-menu__link--active" : "",
    className
  ].filter(Boolean).join(" ");

  if (asChild && React.isValidElement(children)) {
return React.cloneElement(children as React.ReactElement<any>, ({
      className: linkClasses,
    } as any));
  }

  return (
    <a
      ref={ref}
      className={linkClasses}
      {...props}
    >
      {children}
    </a>
  );
});
NavigationMenuLink.displayName = "NavigationMenuLink";

/**
 * NavigationMenuIndicator
 *
 * Visual indicator for active navigation item.
 */
export const NavigationMenuIndicator = React.forwardRef<HTMLDivElement, NavigationMenuIndicatorProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`pixel-navigation-menu__indicator ${className}`}
      {...props}
    />
  );
});
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";