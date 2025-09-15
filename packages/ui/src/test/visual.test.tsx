/**
 * Visual regression tests for @pommai/ui components
 * These tests capture screenshots and compare them for visual changes
 */

import React from 'react';
import { render } from './utils';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Alert } from '../components/Alert';

describe('Visual Regression Tests', () => {
  // Mock window.matchMedia for visual tests
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Button Visual Tests', () => {
    it('renders all button variants correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <Button variant="default">Default Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('button-variants');
    });

    it('renders all button sizes correctly', () => {
      const { container } = render(
        <div className="p-4 space-x-4 flex items-center">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">🎮</Button>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('button-sizes');
    });

    it('renders button states correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('button-states');
    });
  });

  describe('Card Visual Tests', () => {
    it('renders complete card structure correctly', () => {
      const { container } = render(
        <div className="p-4">
          <Card className="w-80">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is the card content with some example text to show how it looks.</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
              <Button variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('card-complete');
    });

    it('renders card variants correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <Card className="w-80">
            <CardContent>Default Card</CardContent>
          </Card>
          <Card hover className="w-80">
            <CardContent>Hoverable Card</CardContent>
          </Card>
          <Card clickable className="w-80">
            <CardContent>Clickable Card</CardContent>
          </Card>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('card-variants');
    });
  });

  describe('Input Visual Tests', () => {
    it('renders input variants correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <Input placeholder="Default input" />
          <Input placeholder="Small input" size="sm" />
          <Input placeholder="Large input" size="lg" />
          <Input placeholder="Disabled input" disabled />
          <Input placeholder="Error input" error />
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('input-variants');
    });

    it('renders different input types correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <Input type="text" placeholder="Text input" />
          <Input type="email" placeholder="Email input" />
          <Input type="password" placeholder="Password input" />
          <Input type="number" placeholder="Number input" />
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('input-types');
    });
  });

  describe('Badge Visual Tests', () => {
    it('renders badge variants correctly', () => {
      const { container } = render(
        <div className="p-4 space-x-2 flex items-center">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('badge-variants');
    });

    it('renders badge sizes correctly', () => {
      const { container } = render(
        <div className="p-4 space-x-2 flex items-center">
          <Badge size="sm">Small</Badge>
          <Badge size="default">Default</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('badge-sizes');
    });
  });

  describe('Alert Visual Tests', () => {
    it('renders alert variants correctly', () => {
      const { container } = render(
        <div className="p-4 space-y-4">
          <Alert variant="default">
            <div>Default alert message</div>
          </Alert>
          <Alert variant="destructive">
            <div>Destructive alert message</div>
          </Alert>
          <Alert variant="warning">
            <div>Warning alert message</div>
          </Alert>
          <Alert variant="success">
            <div>Success alert message</div>
          </Alert>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('alert-variants');
    });
  });

  describe('RetroUI Theme Visual Tests', () => {
    it('renders components with consistent RetroUI styling', () => {
      const { container } = render(
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Buttons</h3>
            <div className="space-x-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Form Elements</h3>
            <div className="space-y-2">
              <Input placeholder="Enter text here" />
              <div className="space-x-2">
                <Badge>New</Badge>
                <Badge variant="secondary">Updated</Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Cards</h3>
            <Card className="w-80">
              <CardHeader>
                <CardTitle>RetroUI Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the RetroUI pixel art styling with consistent borders and shadows.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('retroui-theme-consistency');
    });
  });
});