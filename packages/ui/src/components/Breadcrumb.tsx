import React, { useMemo } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  linkColor?: string;
  activeColor?: string;
  // Separator
  separator?: React.ReactNode;
  // Behavior
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
}

export interface BreadcrumbListProps extends React.HTMLAttributes<HTMLOListElement> {}
export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {}
export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
}
export interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {}
export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {}
export interface BreadcrumbEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * Breadcrumb
 *
 * RetroUI-styled breadcrumb navigation component.
 * - Supports automatic truncation with ellipsis
 * - Custom separators and styling
 * - Keyboard navigation support
 */
export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(({
  items,
  className = "",
  bg,
  textColor,
  borderColor,
  linkColor,
  activeColor,
  separator = "/",
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 1,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    "--breadcrumb-bg": bg,
    "--breadcrumb-text": textColor,
    "--breadcrumb-border": borderColor,
    "--breadcrumb-link": linkColor,
    "--breadcrumb-active": activeColor,
    borderImageSource: svgString,
  } as React.CSSProperties;

  // Handle item truncation
  const displayItems = useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }

    const totalItems = items.length;
    const itemsToShow = maxItems - 1; // -1 for ellipsis
    
    if (itemsToShow <= itemsBeforeCollapse + itemsAfterCollapse) {
      // Show first and last items only
      return [
        ...items.slice(0, itemsBeforeCollapse),
        { label: "...", disabled: true },
        ...items.slice(totalItems - itemsAfterCollapse)
      ];
    }

    return [
      ...items.slice(0, itemsBeforeCollapse),
      { label: "...", disabled: true },
      ...items.slice(totalItems - itemsAfterCollapse)
    ];
  }, [items, maxItems, itemsBeforeCollapse, itemsAfterCollapse]);

  const breadcrumbClasses = [
    "pixel-breadcrumb",
    className
  ].filter(Boolean).join(" ");

  return (
    <nav
      ref={ref}
      className={breadcrumbClasses}
      style={customStyle}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol className="pixel-breadcrumb__list">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === "...";

          return (
            <React.Fragment key={index}>
              <li className="pixel-breadcrumb__item">
                {isEllipsis ? (
                  <span className="pixel-breadcrumb__ellipsis" aria-hidden="true">
                    {item.label}
                  </span>
                ) : isLast ? (
                  <span 
                    className="pixel-breadcrumb__page"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className={`pixel-breadcrumb__link ${item.disabled ? 'pixel-breadcrumb__link--disabled' : ''}`}
                    aria-disabled={item.disabled}
                  >
                    {item.label}
                  </a>
                )}
              </li>
              {!isLast && (
                <li className="pixel-breadcrumb__separator" aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
});

Breadcrumb.displayName = "Breadcrumb";

/**
 * BreadcrumbList
 *
 * Ordered list container for breadcrumb items.
 */
export const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <ol
      ref={ref}
      className={`pixel-breadcrumb__list ${className}`}
      {...props}
    />
  );
});
BreadcrumbList.displayName = "BreadcrumbList";

/**
 * BreadcrumbItem
 *
 * Individual breadcrumb item container.
 */
export const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <li
      ref={ref}
      className={`pixel-breadcrumb__item ${className}`}
      {...props}
    />
  );
});
BreadcrumbItem.displayName = "BreadcrumbItem";

/**
 * BreadcrumbLink
 *
 * Clickable breadcrumb link.
 */
export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(({
  className = "",
  asChild = false,
  children,
  ...props
}, ref) => {
  if (asChild && React.isValidElement(children)) {
return React.cloneElement(children as React.ReactElement<any>, ({
      className: `pixel-breadcrumb__link ${className}`,
    } as any));
  }

  return (
    <a
      ref={ref}
      className={`pixel-breadcrumb__link ${className}`}
      {...props}
    >
      {children}
    </a>
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

/**
 * BreadcrumbPage
 *
 * Current page indicator (non-clickable).
 */
export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <span
      ref={ref}
      className={`pixel-breadcrumb__page ${className}`}
      aria-current="page"
      {...props}
    />
  );
});
BreadcrumbPage.displayName = "BreadcrumbPage";

/**
 * BreadcrumbSeparator
 *
 * Visual separator between breadcrumb items.
 */
export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(({
  className = "",
  children = "/",
  ...props
}, ref) => {
  return (
    <li
      ref={ref}
      className={`pixel-breadcrumb__separator ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </li>
  );
});
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

/**
 * BreadcrumbEllipsis
 *
 * Ellipsis indicator for collapsed items.
 */
export const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(({
  className = "",
  children = "...",
  ...props
}, ref) => {
  return (
    <span
      ref={ref}
      className={`pixel-breadcrumb__ellipsis ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </span>
  );
});
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";