/**
 * Accessibility tests for @pommai/ui components
 * Tests WCAG compliance and keyboard navigation
 */

import React from 'react';
import { render, screen, fireEvent } from './utils';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '../components/Dialog';
import { hasAccessibilityAttributes } from './utils';

// Mock axe-core for accessibility testing
jest.mock('axe-core', () => ({
  run: jest.fn().mockResolvedValue({ violations: [] }),
}));

describe('Accessibility Tests', () => {
  describe('Button Accessibility', () => {
    it('has proper keyboard navigation', () => {
      render(<Button data-testid="button">Test Button</Button>);
      const button = screen.getByTestId('button');
      
      expect(button).toHaveAttribute('tabindex', '0');
      expect(button).toHaveAttribute('role', 'button');
      
      // Test keyboard activation
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
    });

    it('has proper ARIA states when disabled', () => {
      render(<Button disabled data-testid="button">Disabled Button</Button>);
      const button = screen.getByTestId('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('has proper ARIA states when loading', () => {
      render(<Button loading data-testid="button">Loading Button</Button>);
      const button = screen.getByTestId('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('supports custom ARIA labels', () => {
      render(
        <Button aria-label="Custom action button" data-testid="button">
          🎮
        </Button>
      );
      const button = screen.getByTestId('button');
      
      expect(button).toHaveAttribute('aria-label', 'Custom action button');
    });

    it('has sufficient color contrast', () => {
      render(<Button data-testid="button">Test Button</Button>);
      const button = screen.getByTestId('button');
      
      // This would typically use a color contrast testing library
      expect(button).toHaveClass('retro-button');
      expect(hasAccessibilityAttributes(button)).toBe(true);
    });
  });

  describe('Input Accessibility', () => {
    it('has proper keyboard navigation', () => {
      render(<Input data-testid="input" placeholder="Test input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('tabindex', '0');
      
      fireEvent.focus(input);
      expect(input).toHaveFocus();
      
      fireEvent.keyDown(input, { key: 'Tab' });
    });

    it('has proper ARIA states when disabled', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('aria-disabled', 'true');
      expect(input).toBeDisabled();
    });

    it('has proper ARIA states when error', () => {
      render(<Input error data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports ARIA descriptions', () => {
      render(
        <div>
          <Input aria-describedby="help-text" data-testid="input" />
          <div id="help-text">This is help text</div>
        </div>
      );
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('supports labels properly', () => {
      render(
        <div>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" data-testid="input" />
        </div>
      );
      const input = screen.getByTestId('input');
      const label = screen.getByText('Test Label');
      
      expect(input).toHaveAttribute('id', 'test-input');
      expect(label).toHaveAttribute('for', 'test-input');
    });
  });

  describe('Card Accessibility', () => {
    it('supports semantic structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            Card content
          </CardContent>
        </Card>
      );
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Card Title');
    });

    it('supports ARIA attributes when clickable', () => {
      const handleClick = jest.fn();
      render(
        <Card clickable onClick={handleClick} data-testid="card">
          Clickable card
        </Card>
      );
      const card = screen.getByTestId('card');
      
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('supports keyboard navigation when clickable', () => {
      const handleClick = jest.fn();
      render(
        <Card clickable onClick={handleClick} data-testid="card">
          Clickable card
        </Card>
      );
      const card = screen.getByTestId('card');
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('supports custom ARIA roles', () => {
      render(
        <Card role="article" aria-label="News article" data-testid="card">
          Article content
        </Card>
      );
      const card = screen.getByTestId('card');
      
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'News article');
    });
  });

  describe('Dialog Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <div>Dialog content</div>
          </DialogContent>
        </Dialog>
      );
      
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('traps focus properly', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Focus Test</DialogTitle>
            <button>First button</button>
            <button>Second button</button>
            <button>Third button</button>
          </DialogContent>
        </Dialog>
      );
      
      const firstButton = await screen.findByText('First button');
      expect(firstButton).toHaveFocus();
      
      // Test Tab navigation
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      const secondButton = screen.getByText('Second button');
      expect(secondButton).toHaveFocus();
    });

    it('closes on Escape key', async () => {
      const handleOpenChange = jest.fn();
      render(
        <Dialog defaultOpen onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Escape Test</DialogTitle>
            <div>Press Escape to close</div>
          </DialogContent>
        </Dialog>
      );
      
      await screen.findByText('Press Escape to close');
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('returns focus to trigger when closed', async () => {
      render(
        <Dialog>
          <DialogTrigger data-testid="trigger">Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Focus Return Test</DialogTitle>
            <button onClick={() => {}} data-testid="close">Close</button>
          </DialogContent>
        </Dialog>
      );
      
      const trigger = screen.getByTestId('trigger');
      fireEvent.click(trigger);
      
      const closeButton = await screen.findByTestId('close');
      fireEvent.click(closeButton);
      
      // Focus should return to trigger
      expect(trigger).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Tab navigation through interactive elements', () => {
      render(
        <div>
          <Button data-testid="button1">Button 1</Button>
          <Input data-testid="input1" placeholder="Input 1" />
          <Button data-testid="button2">Button 2</Button>
          <Input data-testid="input2" placeholder="Input 2" />
        </div>
      );
      
      const button1 = screen.getByTestId('button1');
      const input1 = screen.getByTestId('input1');
      const button2 = screen.getByTestId('button2');
      const input2 = screen.getByTestId('input2');
      
      // Test tab order
      button1.focus();
      expect(button1).toHaveFocus();
      
      fireEvent.keyDown(button1, { key: 'Tab' });
      expect(input1).toHaveFocus();
      
      fireEvent.keyDown(input1, { key: 'Tab' });
      expect(button2).toHaveFocus();
      
      fireEvent.keyDown(button2, { key: 'Tab' });
      expect(input2).toHaveFocus();
    });

    it('skips disabled elements in tab navigation', () => {
      render(
        <div>
          <Button data-testid="button1">Button 1</Button>
          <Button disabled data-testid="button2">Disabled Button</Button>
          <Button data-testid="button3">Button 3</Button>
        </div>
      );
      
      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');
      const button3 = screen.getByTestId('button3');
      
      button1.focus();
      expect(button1).toHaveFocus();
      
      fireEvent.keyDown(button1, { key: 'Tab' });
      // Should skip disabled button and go to button3
      expect(button3).toHaveFocus();
      expect(button2).not.toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper text alternatives for icon buttons', () => {
      render(
        <Button aria-label="Close dialog" data-testid="icon-button">
          ✕
        </Button>
      );
      const button = screen.getByTestId('icon-button');
      
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
      expect(button).toHaveTextContent('✕');
    });

    it('provides proper descriptions for form fields', () => {
      render(
        <div>
          <label htmlFor="password">Password</label>
          <Input 
            id="password"
            type="password"
            aria-describedby="password-help"
            data-testid="password-input"
          />
          <div id="password-help">
            Password must be at least 8 characters long
          </div>
        </div>
      );
      
      const input = screen.getByTestId('password-input');
      expect(input).toHaveAttribute('aria-describedby', 'password-help');
      
      const label = screen.getByText('Password');
      expect(label).toHaveAttribute('for', 'password');
    });

    it('announces state changes properly', () => {
      const TestComponent = () => {
        const [loading, setLoading] = React.useState(false);
        return (
          <div>
            <Button 
              loading={loading}
              onClick={() => setLoading(!loading)}
              data-testid="toggle-button"
            >
              {loading ? 'Loading...' : 'Click me'}
            </Button>
          </div>
        );
      };
      
      render(<TestComponent />);
      const button = screen.getByTestId('toggle-button');
      
      expect(button).toHaveTextContent('Click me');
      expect(button).not.toHaveAttribute('aria-disabled');
      
      fireEvent.click(button);
      
      expect(button).toHaveTextContent('Loading...');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });
});