/**
 * Integration tests for @pommai/ui components
 * Tests component interactions and complex scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from './utils';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Input } from '../components/Input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../components/Dialog';
import { Badge } from '../components/Badge';
import { Alert } from '../components/Alert';

describe('Integration Tests', () => {
  describe('Form Integration', () => {
    it('handles complete form workflow', async () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      
      render(
        <Card>
          <CardHeader>
            <CardTitle>User Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} data-testid="registration-form">
              <div className="space-y-4">
                <Input 
                  name="username"
                  placeholder="Username"
                  data-testid="username-input"
                />
                <Input 
                  name="email"
                  type="email"
                  placeholder="Email"
                  data-testid="email-input"
                />
                <Input 
                  name="password"
                  type="password"
                  placeholder="Password"
                  data-testid="password-input"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="registration-form" data-testid="submit-button">
              Register
            </Button>
            <Button variant="outline" data-testid="cancel-button">
              Cancel
            </Button>
          </CardFooter>
        </Card>
      );
      
      // Fill out the form
      const usernameInput = screen.getByTestId('username-input');
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(usernameInput).toHaveValue('testuser');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
      
      // Submit the form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('handles form validation states', () => {
      const TestForm = () => {
        const [errors, setErrors] = React.useState<Record<string, string>>({});
        const [values, setValues] = React.useState({ email: '', password: '' });
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const newErrors: Record<string, string> = {};
          
          if (!values.email) newErrors.email = 'Email is required';
          if (!values.password) newErrors.password = 'Password is required';
          
          setErrors(newErrors);
        };
        
        return (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Input 
                  type="email"
                  placeholder="Email"
                  value={values.email}
                  onChange={(e) => setValues(v => ({ ...v, email: e.target.value }))}
                  error={!!errors.email}
                  data-testid="email-input"
                />
                {errors.email && (
                  <Alert variant="destructive" data-testid="email-error">
                    {errors.email}
                  </Alert>
                )}
              </div>
              
              <div>
                <Input 
                  type="password"
                  placeholder="Password"
                  value={values.password}
                  onChange={(e) => setValues(v => ({ ...v, password: e.target.value }))}
                  error={!!errors.password}
                  data-testid="password-input"
                />
                {errors.password && (
                  <Alert variant="destructive" data-testid="password-error">
                    {errors.password}
                  </Alert>
                )}
              </div>
              
              <Button type="submit" data-testid="submit-button">
                Submit
              </Button>
            </div>
          </form>
        );
      };
      
      render(<TestForm />);
      
      // Submit empty form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Check validation errors appear
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
      expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
      
      // Check inputs have error styling
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      
      expect(emailInput).toHaveClass('retro-input-error');
      expect(passwordInput).toHaveClass('retro-input-error');
      
      // Fill in valid data
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Submit again
      fireEvent.click(submitButton);
      
      // Errors should be cleared
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('password-error')).not.toBeInTheDocument();
    });
  });

  describe('Dialog Integration', () => {
    it('handles complete dialog workflow', async () => {
      const handleConfirm = jest.fn();
      const handleCancel = jest.fn();
      
      render(
        <div>
          <Dialog>
            <DialogTrigger data-testid="open-dialog">
              Delete Item
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>
              <div>
                Are you sure you want to delete this item? This action cannot be undone.
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={handleCancel} data-testid="cancel-button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirm}
                  data-testid="confirm-button"
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
      
      // Open dialog
      const openButton = screen.getByTestId('open-dialog');
      fireEvent.click(openButton);
      
      // Check dialog is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      });
      
      // Test cancel
      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);
      
      expect(handleCancel).toHaveBeenCalledTimes(1);
      
      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Open dialog again
      fireEvent.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Test confirm
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);
      
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('handles nested dialogs', async () => {
      render(
        <div>
          <Dialog>
            <DialogTrigger data-testid="open-first">Open First Dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>First Dialog</DialogTitle>
              </DialogHeader>
              <div>This is the first dialog</div>
              <Dialog>
                <DialogTrigger data-testid="open-second">Open Second Dialog</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Second Dialog</DialogTitle>
                  </DialogHeader>
                  <div>This is the second dialog</div>
                  <DialogFooter>
                    <DialogClose data-testid="close-second">Close Second</DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DialogFooter>
                <DialogClose data-testid="close-first">Close First</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
      
      // Open first dialog
      fireEvent.click(screen.getByTestId('open-first'));
      
      await waitFor(() => {
        expect(screen.getByText('First Dialog')).toBeInTheDocument();
      });
      
      // Open second dialog
      fireEvent.click(screen.getByTestId('open-second'));
      
      await waitFor(() => {
        expect(screen.getByText('Second Dialog')).toBeInTheDocument();
      });
      
      // Both dialogs should be present
      expect(screen.getByText('First Dialog')).toBeInTheDocument();
      expect(screen.getByText('Second Dialog')).toBeInTheDocument();
      
      // Close second dialog
      fireEvent.click(screen.getByTestId('close-second'));
      
      await waitFor(() => {
        expect(screen.queryByText('Second Dialog')).not.toBeInTheDocument();
      });
      
      // First dialog should still be open
      expect(screen.getByText('First Dialog')).toBeInTheDocument();
    });
  });

  describe('Card Interactions', () => {
    it('handles clickable cards with complex content', () => {
      const handleCardClick = jest.fn();
      const handleButtonClick = jest.fn();
      
      render(
        <Card clickable onClick={handleCardClick} data-testid="clickable-card">
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <Badge variant="secondary">New</Badge>
          </CardHeader>
          <CardContent>
            <p>This card has interactive elements inside it.</p>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
              data-testid="inner-button"
            >
              Inner Action
            </Button>
          </CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('clickable-card');
      const button = screen.getByTestId('inner-button');
      
      // Click on card (not on button)
      fireEvent.click(card);
      expect(handleCardClick).toHaveBeenCalledTimes(1);
      expect(handleButtonClick).not.toHaveBeenCalled();
      
      // Click on button inside card
      fireEvent.click(button);
      expect(handleButtonClick).toHaveBeenCalledTimes(1);
      // Card click should not be triggered due to stopPropagation
      expect(handleCardClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation on clickable cards', () => {
      const handleCardClick = jest.fn();
      
      render(
        <Card clickable onClick={handleCardClick} data-testid="keyboard-card">
          <CardContent>
            Keyboard navigable card
          </CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('keyboard-card');
      
      // Focus the card
      card.focus();
      expect(card).toHaveFocus();
      
      // Press Enter
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleCardClick).toHaveBeenCalledTimes(1);
      
      // Press Space
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleCardClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading States Integration', () => {
    it('handles async operations with loading states', async () => {
      const TestComponent = () => {
        const [loading, setLoading] = React.useState(false);
        const [data, setData] = React.useState<string | null>(null);
        const [error, setError] = React.useState<string | null>(null);
        
        const handleLoad = async () => {
          setLoading(true);
          setError(null);
          
          try {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 100));
            setData('Loaded data');
          } catch (err) {
            setError('Failed to load');
          } finally {
            setLoading(false);
          }
        };
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Async Data Loader</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" data-testid="error-alert">
                  {error}
                </Alert>
              )}
              {data && (
                <div data-testid="loaded-data">{data}</div>
              )}
              {!data && !error && !loading && (
                <div data-testid="no-data">No data loaded</div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                loading={loading}
                onClick={handleLoad}
                data-testid="load-button"
              >
                {loading ? 'Loading...' : 'Load Data'}
              </Button>
            </CardFooter>
          </Card>
        );
      };
      
      render(<TestComponent />);
      
      // Initial state
      expect(screen.getByTestId('no-data')).toBeInTheDocument();
      expect(screen.getByTestId('load-button')).toHaveTextContent('Load Data');
      
      // Click load button
      const loadButton = screen.getByTestId('load-button');
      fireEvent.click(loadButton);
      
      // Loading state
      expect(loadButton).toHaveTextContent('Loading...');
      expect(loadButton).toBeDisabled();
      expect(loadButton).toHaveClass('retro-button-loading');
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loaded-data')).toBeInTheDocument();
      });
      
      // Final state
      expect(screen.getByTestId('loaded-data')).toHaveTextContent('Loaded data');
      expect(loadButton).toHaveTextContent('Load Data');
      expect(loadButton).not.toBeDisabled();
    });
  });

  describe('Theme Integration', () => {
    it('maintains consistent styling across components', () => {
      render(
        <div data-testid="theme-container">
          <Card>
            <CardHeader>
              <CardTitle>Theme Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="default">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Input placeholder="Themed input" />
                <Badge variant="default">Default Badge</Badge>
                <Alert variant="default">
                  <div>Themed alert message</div>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      );
      
      const container = screen.getByTestId('theme-container');
      
      // Check that all components have RetroUI classes
      const card = container.querySelector('[class*="retro-card"]');
      const buttons = container.querySelectorAll('[class*="retro-button"]');
      const input = container.querySelector('[class*="retro-input"]');
      const badge = container.querySelector('[class*="retro-badge"]');
      const alert = container.querySelector('[class*="retro-alert"]');
      
      expect(card).toBeInTheDocument();
      expect(buttons).toHaveLength(2);
      expect(input).toBeInTheDocument();
      expect(badge).toBeInTheDocument();
      expect(alert).toBeInTheDocument();
      
      // Check pixel styling consistency
      const pixelElements = container.querySelectorAll('[class*="pixel-border"]');
      expect(pixelElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('handles responsive interactions', () => {
      // Mock window.matchMedia for responsive tests
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
      
      render(
        <Card data-testid="responsive-card">
          <CardHeader>
            <CardTitle>Responsive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button className="flex-1">Button 1</Button>
              <Button className="flex-1">Button 2</Button>
            </div>
          </CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('responsive-card');
      expect(card).toBeInTheDocument();
      
      // Test that components render correctly in mobile viewport
      expect(mockMatchMedia).toHaveBeenCalledWith(expect.stringContaining('max-width'));
    });
  });
});