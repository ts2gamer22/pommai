'use client';

import React, { createContext, useContext, useMemo } from "react";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options?: RadioOption[];
  value?: string;
  defaultValue?: string;
  name: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  // Layout
  orientation?: "horizontal" | "vertical";
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  checkedBg?: string;
  checkedTextColor?: string;
}

export interface RadioItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "size"> {
  value: string;
  label?: string;
  // RetroUI theming props
  bg?: string;
  textColor?: string;
  borderColor?: string;
  checkedBg?: string;
  checkedTextColor?: string;
  // Size variants
  size?: "sm" | "md" | "lg";
}

interface RadioContextType {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  checkedBg?: string;
  checkedTextColor?: string;
}

const RadioContext = createContext<RadioContextType | null>(null);

/**
 * RadioGroup
 *
 * RetroUI-styled radio group component with pixel art design.
 * - Can be used with options prop or children RadioItem components.
 * - Maintains accessibility with proper ARIA attributes.
 */
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(({
  options,
  value,
  defaultValue,
  name,
  onValueChange,
  disabled = false,
  className = "",
  children,
  orientation = "vertical",
  bg,
  textColor,
  borderColor,
  checkedBg,
  checkedTextColor,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  
  const actualValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const groupClasses = [
    "pixel-radio-group",
    orientation === "horizontal" ? "pixel-radio-group--horizontal" : "pixel-radio-group--vertical",
    disabled ? "pixel-radio-group--disabled" : "",
    className
  ].filter(Boolean).join(" ");

  const contextValue = {
    name,
    value: actualValue,
    onValueChange: handleValueChange,
    disabled,
    bg,
    textColor,
    borderColor,
    checkedBg,
    checkedTextColor,
  };

  return (
    <RadioContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={groupClasses}
        role="radiogroup"
        {...props}
      >
        {options ? (
          options.map((option) => (
            <RadioItem
              key={option.value}
              value={option.value}
              label={option.label}
              disabled={option.disabled || disabled}
            />
          ))
        ) : (
          children
        )}
      </div>
    </RadioContext.Provider>
  );
});

RadioGroup.displayName = "RadioGroup";

/**
 * RadioItem
 *
 * Individual radio button item for use within RadioGroup.
 */
export const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(({
  value,
  label,
  className = "",
  bg,
  textColor,
  borderColor,
  checkedBg,
  checkedTextColor,
  size = "md",
  disabled,
  id,
  ...props
}, ref) => {
  const context = useContext(RadioContext);
  
  if (!context) {
    throw new Error("RadioItem must be used within a RadioGroup");
  }

  const svgString = useMemo(() => {
    const color = borderColor || context.borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor, context.borderColor]);

  const dotSvg = useMemo(() => {
    const color = checkedTextColor || context.checkedTextColor || "#000000";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [checkedTextColor, context.checkedTextColor]);

  const isChecked = context.value === value;
  const isDisabled = disabled || context.disabled;

  const customStyle = {
    "--radio-custom-bg": bg || context.bg,
    "--radio-custom-text": textColor || context.textColor,
    "--radio-custom-border": borderColor || context.borderColor,
    "--radio-custom-checked-bg": checkedBg || context.checkedBg,
    "--radio-custom-checked-text": checkedTextColor || context.checkedTextColor,
    borderImageSource: svgString,
  } as React.CSSProperties;

  const radioClasses = [
    "pixel-radio",
    size !== "md" ? `pixel-radio--${size}` : "",
    isDisabled ? "pixel-radio--disabled" : "",
    className
  ].filter(Boolean).join(" ");

  const radioId = id || `radio-${context.name}-${value}`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDisabled && context.onValueChange) {
      context.onValueChange(value);
    }
    props.onChange?.(event);
  };

  return (
    <div className="pixel-radio-container">
      <div className="pixel-radio-wrapper" style={customStyle}>
        <input
          ref={ref}
          type="radio"
          id={radioId}
          name={context.name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={handleChange}
          className="pixel-radio__input"
          {...props}
        />
        <div className={radioClasses}>
          <div
            className="pixel-radio__dot"
            style={{
              maskImage: dotSvg,
              WebkitMaskImage: dotSvg,
              backgroundColor: "currentColor",
            }}
          />
        </div>
      </div>
      {label && (
        <label
          htmlFor={radioId}
          className={`pixel-radio__label ${isDisabled ? "pixel-radio__label--disabled" : ""}`}
        >
          {label}
        </label>
      )}
    </div>
  );
});

RadioItem.displayName = "RadioItem";