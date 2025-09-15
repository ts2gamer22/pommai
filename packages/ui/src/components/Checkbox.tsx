'use client';

import React, { useMemo } from "react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  checkedBg?: string;
  checkedTextColor?: string;
  // Size variants
  size?: "sm" | "md" | "lg";
  // Label
  label?: string;
}

/**
 * Checkbox
 *
 * RetroUI-styled checkbox component with pixel art design.
 * - Maintains accessibility with proper ARIA attributes.
 * - Supports custom styling through CSS custom properties.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  checkedBg,
  checkedTextColor,
  size = "md",
  label,
  id,
  disabled = false,
  checked,
  defaultChecked,
  onChange,
  ...props
}, ref) => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const checkmarkSvg = useMemo(() => {
    const color = checkedTextColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M2 8l3 3 8-8" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="square"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [checkedTextColor]);

  const customStyle = {
    "--checkbox-custom-bg": bg,
    "--checkbox-custom-text": textColor,
    "--checkbox-custom-border": borderColor,
    "--checkbox-custom-checked-bg": checkedBg,
    "--checkbox-custom-checked-text": checkedTextColor,
    borderImageSource: svgString,
  } as React.CSSProperties;

  const checkboxClasses = [
    "pixel-checkbox",
    size !== "md" ? `pixel-checkbox--${size}` : "",
    disabled ? "pixel-checkbox--disabled" : "",
    className
  ].filter(Boolean).join(" ");

  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="pixel-checkbox-container">
      <div className="pixel-checkbox-wrapper" style={customStyle}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="pixel-checkbox__input"
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          {...props}
        />
        <div className={checkboxClasses}>
          <div
            className="pixel-checkbox__checkmark"
            style={{
              maskImage: checkmarkSvg,
              WebkitMaskImage: checkmarkSvg,
              backgroundColor: "currentColor",
            }}
          />
        </div>
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          className={`pixel-checkbox__label ${disabled ? "pixel-checkbox__label--disabled" : ""}`}
        >
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox";