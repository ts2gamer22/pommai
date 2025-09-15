'use client';

import React, { useMemo } from "react";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  checkedBg?: string;
  checkedTextColor?: string;
  thumbBg?: string;
  // Size variants
  size?: "sm" | "md" | "lg";
  // Label
  label?: string;
}

/**
 * Switch
 *
 * RetroUI-styled toggle switch component with pixel art design.
 * - Maintains accessibility with proper ARIA attributes.
 * - Supports custom styling through CSS custom properties.
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({
  className = "",
  bg,
  textColor,
  borderColor,
  checkedBg,
  checkedTextColor,
  thumbBg,
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

  const thumbSvg = useMemo(() => {
    const color = thumbBg || "#ffffff";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [thumbBg]);

  const customStyle = {
    "--switch-custom-bg": bg,
    "--switch-custom-text": textColor,
    "--switch-custom-border": borderColor,
    "--switch-custom-checked-bg": checkedBg,
    "--switch-custom-checked-text": checkedTextColor,
    "--switch-custom-thumb-bg": thumbBg,
    borderImageSource: svgString,
  } as React.CSSProperties;

  const switchClasses = [
    "pixel-switch",
    size !== "md" ? `pixel-switch--${size}` : "",
    disabled ? "pixel-switch--disabled" : "",
    className
  ].filter(Boolean).join(" ");

  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="pixel-switch-container">
      <div className="pixel-switch-wrapper" style={customStyle}>
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          className="pixel-switch__input"
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          role="switch"
          aria-checked={checked}
          {...props}
        />
        <div className={switchClasses}>
          <div className="pixel-switch__track">
            <div
              className="pixel-switch__thumb"
              style={{
                borderImageSource: thumbSvg,
              }}
            />
          </div>
        </div>
      </div>
      {label && (
        <label
          htmlFor={switchId}
          className={`pixel-switch__label ${disabled ? "pixel-switch__label--disabled" : ""}`}
        >
          {label}
        </label>
      )}
    </div>
  );
});

Switch.displayName = "Switch";