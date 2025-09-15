'use client';

import React, { useState, useRef, useCallback, useMemo } from "react";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  // Value props
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  trackBg?: string;
  fillBg?: string;
  thumbBg?: string;
  thumbBorderColor?: string;
  // Size variants
  size?: "sm" | "md" | "lg";
  // Orientation
  orientation?: "horizontal" | "vertical";
  // Label
  label?: string;
  showValue?: boolean;
}

/**
 * Slider
 *
 * RetroUI-styled range slider component with pixel art design.
 * - Supports both horizontal and vertical orientations.
 * - Maintains accessibility with proper ARIA attributes.
 * - Supports custom styling through CSS custom properties.
 */
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({
  className = "",
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  bg,
  textColor,
  borderColor,
  trackBg,
  fillBg,
  thumbBg,
  thumbBorderColor,
  size = "md",
  orientation = "horizontal",
  label,
  showValue = false,
  disabled = false,
  id,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const sliderRef = useRef<HTMLInputElement>(null);

  const actualValue = value !== undefined ? value : internalValue;

  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const thumbSvg = useMemo(() => {
    const color = thumbBorderColor || borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [thumbBorderColor, borderColor]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
    props.onChange?.(event);
  }, [onValueChange, props]);

  const percentage = ((actualValue - min) / (max - min)) * 100;

  const customStyle = {
    "--slider-custom-bg": bg,
    "--slider-custom-text": textColor,
    "--slider-custom-border": borderColor,
    "--slider-custom-track-bg": trackBg,
    "--slider-custom-fill-bg": fillBg,
    "--slider-custom-thumb-bg": thumbBg,
    "--slider-custom-thumb-border": thumbBorderColor,
    "--slider-fill-percentage": `${percentage}%`,
    borderImageSource: svgString,
  } as React.CSSProperties;

  const sliderClasses = [
    "pixel-slider",
    size !== "md" ? `pixel-slider--${size}` : "",
    orientation === "vertical" ? "pixel-slider--vertical" : "pixel-slider--horizontal",
    disabled ? "pixel-slider--disabled" : "",
    className
  ].filter(Boolean).join(" ");

  const sliderId = id || `slider-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="pixel-slider-container">
      {label && (
        <label
          htmlFor={sliderId}
          className={`pixel-slider__label ${disabled ? "pixel-slider__label--disabled" : ""}`}
        >
          {label}
          {showValue && (
            <span className="pixel-slider__value">
              {actualValue}
            </span>
          )}
        </label>
      )}
      <div className="pixel-slider-wrapper" style={customStyle}>
        <div className="pixel-slider__track">
          <div className="pixel-slider__fill" />
          <input
            ref={ref || sliderRef}
            type="range"
            id={sliderId}
            className={sliderClasses}
            value={actualValue}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={handleChange}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={actualValue}
            {...props}
          />
          <div
            className="pixel-slider__thumb"
            style={{
              borderImageSource: thumbSvg,
            }}
          />
        </div>
      </div>
    </div>
  );
});

Slider.displayName = "Slider";