/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '../../test/utils';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('retro-button');
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('retro-button');
    });

    it('renders as different HTML elements when asChild is used', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveClass('retro-button');
    });
  });

  describe('Variants', () => {
    it('applies default variant styling', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-default');
    });

    it('applies secondary variant styling', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-secondary');
    });

    it('applies destructive variant styling', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-destructive');
    });

    it('applies outline variant styling', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-outline');
    });

    it('applies ghost variant styling', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-ghost');
    });
  });

  describe('Sizes', () => {
    it('applies default size styling', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-default-size');
    });

    it('applies small size styling', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-sm');
    });

    it('applies large size styling', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-lg');
    });

    it('applies icon size styling', () => {
      render(<Button size="icon">🎮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('retro-button-icon');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('retro-button-disabled');
    });

    it('handles loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('retro-button-loading');
    });

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByTestId('button-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation', () => {
      render(<Button>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('tabindex', '0');
      
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('has proper disabled ARIA state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('has proper loading ARIA state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('RetroUI Styling', () => {
    it('has pixel art styling classes', () => {
      render(<Button>Retro Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('pixel-border');
      expect(button).toHaveClass('pixel-shadow');
    });

    it('applies hover effects', () => {
      render(<Button>Hover me</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(button).toHaveClass('pixel-hover');
    });
  });
});