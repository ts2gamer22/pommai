import React, { useMemo } from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  headerBg?: string;
  headerTextColor?: string;
  stripedRows?: boolean;
  stripedBg?: string;
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  striped?: boolean;
}
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

/**
 * Table
 *
 * RetroUI-styled table component with pixel art borders.
 * - Supports striped rows and custom theming
 * - Maintains accessibility with proper table structure
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  headerBg,
  headerTextColor,
  stripedRows = false,
  stripedBg,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    "--table-bg": bg,
    "--table-text": textColor,
    "--table-border": borderColor,
    "--table-header-bg": headerBg,
    "--table-header-text": headerTextColor,
    "--table-striped-bg": stripedBg,
    "--table-border-svg": svgString,
  } as React.CSSProperties;

  const tableClasses = [
    "pixel-table",
    stripedRows ? "pixel-table--striped" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className="pixel-table-container">
      <table
        ref={ref}
        className={tableClasses}
        style={customStyle}
        {...props}
      />
    </div>
  );
});
Table.displayName = "Table";

/**
 * TableHeader
 *
 * Table header section.
 */
export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <thead
      ref={ref}
      className={`pixel-table__header ${className}`}
      {...props}
    />
  );
});
TableHeader.displayName = "TableHeader";

/**
 * TableBody
 *
 * Table body section.
 */
export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <tbody
      ref={ref}
      className={`pixel-table__body ${className}`}
      {...props}
    />
  );
});
TableBody.displayName = "TableBody";

/**
 * TableFooter
 *
 * Table footer section.
 */
export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <tfoot
      ref={ref}
      className={`pixel-table__footer ${className}`}
      {...props}
    />
  );
});
TableFooter.displayName = "TableFooter";

/**
 * TableRow
 *
 * Table row element.
 */
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({
  className = "",
  striped = false,
  ...props
}, ref) => {
  const rowClasses = [
    "pixel-table__row",
    striped ? "pixel-table__row--striped" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <tr
      ref={ref}
      className={rowClasses}
      {...props}
    />
  );
});
TableRow.displayName = "TableRow";

/**
 * TableHead
 *
 * Table header cell.
 */
export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <th
      ref={ref}
      className={`pixel-table__head ${className}`}
      {...props}
    />
  );
});
TableHead.displayName = "TableHead";

/**
 * TableCell
 *
 * Table data cell.
 */
export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <td
      ref={ref}
      className={`pixel-table__cell ${className}`}
      {...props}
    />
  );
});
TableCell.displayName = "TableCell";

/**
 * TableCaption
 *
 * Table caption element.
 */
export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(({
  className = "",
  ...props
}, ref) => {
  return (
    <caption
      ref={ref}
      className={`pixel-table__caption ${className}`}
      {...props}
    />
  );
});
TableCaption.displayName = "TableCaption";