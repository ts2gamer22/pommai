/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '../../test/utils';
import { Input } from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('retro-input');
    });

    it('renders with placeholder text', () => {
      render(<Input placeholder="Enter text here" />);
      const input = screen.getByPlaceholderText('Enter text here');
      expect(input).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Input defaultValue="Default text" />);
      const input = screen.getByDisplayValue('Default text');
      expect(input).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Input className="custom-input" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-input');
      expect(input).toHaveClass('retro-input');
    });
  });

  describe('Input Types', () => {
    it('renders as text input by default', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders as email input', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders as password input', () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders as number input', () => {
      render(<Input type="number" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('retro-input-disabled');
    });

    it('handles readonly state', () => {
      render(<Input readOnly data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveClass('retro-input-readonly');
    });

    it('handles error state', () => {
      render(<Input error data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('retro-input-error');
    });

    it('handles focus state', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      fireEvent.focus(input);
      expect(input).toHaveClass('retro-input-focus');
    });
  });

  describe('Sizes', () => {
    it('applies default size styling', () => {
      render(<Input size="default" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('retro-input-default-size');
    });

    it('applies small size styling', () => {
      render(<Input size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('retro-input-sm');
    });

    it('applies large size styling', () => {
      render(<Input size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('retro-input-lg');
    });
  });

  describe('Interactions', () => {
    it('calls onChange handler when value changes', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({ value: 'new value' })
      }));
    });

    it('calls onFocus handler when focused', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur handler when blurred', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('does not call onChange when disabled', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} disabled data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      render(
        <Input 
          aria-label="Custom input"
          aria-describedby="help-text"
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-label', 'Custom input');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('has proper disabled ARIA state', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('has proper invalid ARIA state when error', () => {
      render(<Input error data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports keyboard navigation', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toHaveAttribute('tabindex', '0');
      
      fireEvent.keyDown(input, { key: 'Tab' });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
  });

  describe('RetroUI Styling', () => {
    it('has pixel art styling classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pixel-border');
      expect(input).toHaveClass('retro-input');
    });

    it('applies hover effects', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      fireEvent.mouseEnter(input);
      expect(input).toHaveClass('pixel-hover');
    });

    it('applies focus effects', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      fireEvent.focus(input);
      expect(input).toHaveClass('pixel-focus');
    });
  });

  describe('Form Integration', () => {
    it('works with form submission', () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Input name="test-input" defaultValue="test value" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('supports controlled input pattern', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="controlled-input"
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByTestId('controlled-input');
      
      fireEvent.change(input, { target: { value: 'controlled value' } });
      expect(input).toHaveValue('controlled value');
    });
  });
});