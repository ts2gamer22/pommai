/**
 * Textarea component for multi-line text input
 * Provides accessible text area with RetroUI styling
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Size variant of the textarea
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Whether the textarea has an error state
   */
  error?: boolean;
  /**
   * Whether the textarea should resize
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /**
   * RetroUI theming props
   */
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadow?: string;
}

/**
 * Textarea component with RetroUI styling
 * 
 * @example
 * ```tsx
 * <Textarea 
 *   placeholder="Enter your message..."
 *   rows={4}
 * />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = 'default', error, resize = 'vertical', bg, textColor, borderColor, shadow, ...props }, ref) => {
    const customStyle = {
      '--textarea-custom-bg': bg,
      '--textarea-custom-text': textColor,
      '--textarea-custom-border': borderColor,
      '--textarea-custom-shadow': shadow,
    } as React.CSSProperties;

    return (
      <textarea
        ref={ref}
        style={customStyle}
        className={cn(
          // Base styles
          'retro-textarea',
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          
          // RetroUI pixel styling
          'pixel-border pixel-shadow',
          'transition-all duration-200',
          
          // Size variants
          {
['retro-textarea-sm text-xs px-2 py-1']: size === 'sm' ? true : false,
            'retro-textarea-default text-sm px-3 py-2': size === 'default',
            'retro-textarea-lg text-base px-4 py-3': size === 'lg',
          },
          
          // Error state
          {
            'retro-textarea-error border-red-500 focus-visible:ring-red-500': error,
          },
          
          // Resize behavior
          {
            'resize-none': resize === 'none',
            'resize-y': resize === 'vertical',
            'resize-x': resize === 'horizontal',
            'resize': resize === 'both',
          },
          
          // Hover and focus states
          'hover:pixel-hover',
          'focus:pixel-focus',
          
          // Disabled state
          'disabled:retro-textarea-disabled',
          
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';