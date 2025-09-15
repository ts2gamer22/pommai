/**
 * Label component for form elements
 * Provides accessible labeling with RetroUI styling
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Whether the label is for a required field
   */
  required?: boolean;
  /**
   * Size variant of the label
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Whether the label should be visually hidden (for screen readers only)
   */
  srOnly?: boolean;
}

/**
 * Label component with RetroUI styling
 * 
 * @example
 * ```tsx
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" type="email" />
 * ```
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, size = 'default', srOnly, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          // Base styles
          'retro-label',
          'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          
          // Size variants
          {
['retro-label-sm text-sm']: size === 'sm' ? true : false,
            'retro-label-default text-sm': size === 'default',
            'retro-label-lg text-base': size === 'lg',
          },
          
          // Screen reader only
          {
            'sr-only': srOnly,
          },
          
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';