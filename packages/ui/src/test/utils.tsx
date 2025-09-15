/**
 * Test utilities for @pommai/ui components
 * Provides common testing helpers and custom render functions
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that includes common providers
 */
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <div data-testid="test-wrapper">{children}</div>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Test helper to check if element has RetroUI pixel styling
 */
export const hasPixelStyling = (element: HTMLElement): boolean => {
  const classList = Array.from(element.classList);
  return classList.some(className => 
    className.includes('pixel') || 
    className.includes('retro') ||
    className.includes('border-2')
  );
};

/**
 * Test helper to check if element has proper accessibility attributes
 */
export const hasAccessibilityAttributes = (element: HTMLElement): boolean => {
  const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
  const hasRole = element.hasAttribute('role');
  const hasTabIndex = element.hasAttribute('tabindex');
  
  return hasAriaLabel || hasRole || hasTabIndex;
};

/**
 * Test helper to simulate user interactions
 */
export const userInteractions = {
  clickAndWait: async (element: HTMLElement, delay = 100) => {
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(element);
    await new Promise(resolve => setTimeout(resolve, delay));
  },
  
  hoverAndWait: async (element: HTMLElement, delay = 100) => {
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.mouseEnter(element);
    await new Promise(resolve => setTimeout(resolve, delay));
  },
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };