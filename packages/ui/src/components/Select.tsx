'use client';

import React, { useState, useRef, useEffect, useMemo, createContext, useContext } from "react";
import { cn } from '../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Context for Select components
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

// New compound Select interface
export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Select Root Component
 * 
 * Provides context for compound select components
 */
export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const selectRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
    setOpen(false);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        onOpenChange: setOpen,
        disabled,
      }}
    >
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// SelectTrigger Component
export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>((
  { className, children, disabled, asChild = false, ...props },
  ref
) => {
  const context = useSelectContext();

  const handleClick = () => {
    if (!context.disabled && !disabled) {
      context.onOpenChange(!context.open);
    }
  };

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children, {
      ...childProps,
      onClick: (e: React.MouseEvent) => {
        handleClick();
        if (childProps.onClick) {
          childProps.onClick(e);
        }
      },
      'aria-expanded': context.open,
      'aria-haspopup': 'listbox',
      disabled: context.disabled || disabled,
      ...props,
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "pixel-border pixel-shadow",
        className
      )}
      onClick={handleClick}
      aria-expanded={context.open}
      aria-haspopup="listbox"
      disabled={context.disabled || disabled}
      {...props}
    >
      {children}
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-4 w-4 opacity-50", context.open && "rotate-180")}
      >
        <path
          d="m4.5 6 3 3 3-3"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
});

SelectTrigger.displayName = "SelectTrigger";

// SelectValue Component
export interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = useSelectContext();
  
  return (
    <span>
      {context.value || placeholder}
    </span>
  );
};

// SelectContent Component
export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>((
  { className, children, ...props },
  ref
) => {
  const context = useSelectContext();

  if (!context.open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "pixel-border pixel-shadow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

SelectContent.displayName = "SelectContent";

// SelectItem Component
export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>((
  { className, children, value, disabled = false, ...props },
  ref
) => {
  const context = useSelectContext();

  const handleClick = () => {
    if (!disabled) {
      context.onValueChange(value);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        context.value === value && "bg-accent text-accent-foreground",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {context.value === value && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
          >
            <path
              d="m11.5 3.5-6 6-3-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      {children}
    </div>
  );
});

SelectItem.displayName = "SelectItem";
