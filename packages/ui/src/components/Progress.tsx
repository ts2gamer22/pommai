/**
 * Progress component for showing completion status
 * Alias for ProgressBar component to maintain compatibility
 */

import React from 'react';
import { ProgressBar, ProgressBarProps } from './ProgressBar';

export interface ProgressProps extends ProgressBarProps {}

/**
 * Progress component (alias for ProgressBar)
 * Maintains compatibility with existing code
 * 
 * @example
 * ```tsx
 * <Progress value={75} max={100} />
 * ```
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (props, ref) => {
return <ProgressBar {...props} />;
  }
);

Progress.displayName = 'Progress';