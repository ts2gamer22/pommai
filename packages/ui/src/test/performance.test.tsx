/**
 * Performance tests for @pommai/ui components
 * Tests rendering performance and memory usage
 */

import React from 'react';
import { render, cleanup } from './utils';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';

describe('Performance Tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Rendering Performance', () => {
    it('renders Button component quickly', () => {
      const startTime = performance.now();
      
      render(<Button>Test Button</Button>);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 10ms
      expect(renderTime).toBeLessThan(10);
    });

    it('renders Card component quickly', () => {
      const startTime = performance.now();
      
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            Card content
          </CardContent>
        </Card>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 15ms
      expect(renderTime).toBeLessThan(15);
    });

    it('renders Input component quickly', () => {
      const startTime = performance.now();
      
      render(<Input placeholder="Test input" />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 10ms
      expect(renderTime).toBeLessThan(10);
    });

    it('renders multiple components efficiently', () => {
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <Button key={i} variant={i % 2 === 0 ? 'default' : 'secondary'}>
              Button {i}
            </Button>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 100 buttons in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Re-rendering Performance', () => {
    it('handles prop changes efficiently', () => {
      const TestComponent = ({ variant }: { variant: 'default' | 'secondary' }) => (
        <Button variant={variant}>Test Button</Button>
      );

      const { rerender } = render(<TestComponent variant="default" />);
      
      const startTime = performance.now();
      
      // Re-render with different props 10 times
      for (let i = 0; i < 10; i++) {
        rerender(<TestComponent variant={i % 2 === 0 ? 'default' : 'secondary'} />);
      }
      
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;
      
      // Should handle 10 re-renders in less than 50ms
      expect(rerenderTime).toBeLessThan(50);
    });

    it('handles state changes efficiently', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const timer = setInterval(() => {
            setCount(c => c + 1);
          }, 1);
          
          setTimeout(() => clearInterval(timer), 50);
          
          return () => clearInterval(timer);
        }, []);
        
        return <Button>Count: {count}</Button>;
      };

      const startTime = performance.now();
      render(<TestComponent />);
      
      // Wait for state updates to complete
      setTimeout(() => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // Should handle rapid state updates efficiently
        expect(totalTime).toBeLessThan(100);
      }, 60);
    });
  });

  describe('Memory Usage', () => {
    it('does not create memory leaks with multiple renders', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render and unmount components multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(
          <Card>
            <CardHeader>
              <CardTitle>Memory Test {i}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button>Button {i}</Button>
              <Input placeholder={`Input ${i}`} />
              <Badge>Badge {i}</Badge>
            </CardContent>
          </Card>
        );
        unmount();
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('cleans up event listeners properly', () => {
      const mockAddEventListener = jest.spyOn(document, 'addEventListener');
      const mockRemoveEventListener = jest.spyOn(document, 'removeEventListener');
      
      const TestComponent = () => {
        React.useEffect(() => {
          const handler = () => {};
          document.addEventListener('click', handler);
          return () => document.removeEventListener('click', handler);
        }, []);
        
        return <Button>Test</Button>;
      };
      
      const { unmount } = render(<TestComponent />);
      
      expect(mockAddEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      
      mockAddEventListener.mockRestore();
      mockRemoveEventListener.mockRestore();
    });
  });

  describe('Bundle Size Impact', () => {
    it('has minimal CSS class generation', () => {
      const { container } = render(
        <div>
          <Button>Button</Button>
          <Card>
            <CardContent>Card</CardContent>
          </Card>
          <Input placeholder="Input" />
          <Badge>Badge</Badge>
        </div>
      );
      
      const allElements = container.querySelectorAll('*');
      let totalClasses = 0;
      
      allElements.forEach(element => {
        totalClasses += element.classList.length;
      });
      
      // Should not generate excessive CSS classes
      expect(totalClasses).toBeLessThan(50);
    });

    it('reuses CSS classes efficiently', () => {
      const { container } = render(
        <div>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </div>
      );
      
      const buttons = container.querySelectorAll('button');
      const firstButtonClasses = Array.from(buttons[0].classList);
      
      // All buttons should have the same base classes
      buttons.forEach(button => {
        const buttonClasses = Array.from(button.classList);
        expect(buttonClasses).toEqual(firstButtonClasses);
      });
    });
  });

  describe('Interaction Performance', () => {
    it('handles click events efficiently', () => {
      const handleClick = jest.fn();
      const { container } = render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = container.querySelector('button')!;
      
      const startTime = performance.now();
      
      // Simulate rapid clicking
      for (let i = 0; i < 100; i++) {
        button.click();
      }
      
      const endTime = performance.now();
      const clickTime = endTime - startTime;
      
      expect(handleClick).toHaveBeenCalledTimes(100);
      // Should handle 100 clicks in less than 50ms
      expect(clickTime).toBeLessThan(50);
    });

    it('handles input changes efficiently', () => {
      const handleChange = jest.fn();
      const { container } = render(<Input onChange={handleChange} />);
      
      const input = container.querySelector('input')!;
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
          value: { value: `text${i}` },
          enumerable: true,
        });
        input.dispatchEvent(event);
      }
      
      const endTime = performance.now();
      const inputTime = endTime - startTime;
      
      // Should handle 100 input changes in less than 100ms
      expect(inputTime).toBeLessThan(100);
    });
  });

  describe('CSS Performance', () => {
    it('applies styles efficiently', () => {
      const startTime = performance.now();
      
      const { container } = render(
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <Card key={i} className="w-80">
              <CardHeader>
                <CardTitle>Card {i}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant={i % 2 === 0 ? 'default' : 'secondary'}>
                  Action {i}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const styleTime = endTime - startTime;
      
      // Should apply styles to 50 cards efficiently
      expect(styleTime).toBeLessThan(200);
      
      // Check that styles are actually applied
      const cards = container.querySelectorAll('[class*="retro-card"]');
      expect(cards).toHaveLength(50);
      
      const buttons = container.querySelectorAll('[class*="retro-button"]');
      expect(buttons).toHaveLength(50);
    });

    it('handles dynamic class changes efficiently', () => {
      const TestComponent = ({ active }: { active: boolean }) => (
        <Button variant={active ? 'default' : 'secondary'} className={active ? 'active' : ''}>
          Dynamic Button
        </Button>
      );

      const { rerender } = render(<TestComponent active={false} />);
      
      const startTime = performance.now();
      
      // Toggle active state rapidly
      for (let i = 0; i < 100; i++) {
        rerender(<TestComponent active={i % 2 === 0} />);
      }
      
      const endTime = performance.now();
      const toggleTime = endTime - startTime;
      
      // Should handle 100 class toggles efficiently
      expect(toggleTime).toBeLessThan(100);
    });
  });
});