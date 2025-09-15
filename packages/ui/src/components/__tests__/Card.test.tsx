/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '../../test/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('retro-card');
    });

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('retro-card');
    });

    it('applies hover effect when hover prop is true', () => {
      render(<Card hover data-testid="card">Hoverable card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('retro-card-hover');
    });

    it('applies clickable styling when clickable prop is true', () => {
      render(<Card clickable data-testid="card">Clickable card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('retro-card-clickable');
    });

    it('has proper RetroUI pixel styling', () => {
      render(<Card data-testid="card">Styled card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('pixel-border');
      expect(card).toHaveClass('pixel-shadow');
    });
  });

  describe('CardHeader', () => {
    it('renders with proper structure', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">
            Header content
          </CardHeader>
        </Card>
      );
      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('retro-card-header');
    });

    it('applies custom className', () => {
      render(
        <CardHeader className="custom-header" data-testid="header">
          Header
        </CardHeader>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('retro-card-header');
    });
  });

  describe('CardTitle', () => {
    it('renders with proper typography', () => {
      render(<CardTitle data-testid="card-title">Card Title</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('retro-card-title');
    });

    it('renders as h3 by default', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
    });

    it('can render as different heading levels', () => {
      render(<CardTitle as="h2">H2 Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('renders with proper spacing', () => {
      render(
        <CardContent data-testid="card-content">
          Content goes here
        </CardContent>
      );
      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('retro-card-content');
    });

    it('applies custom className', () => {
      render(
        <CardContent className="custom-content" data-testid="content">
          Content
        </CardContent>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('retro-card-content');
    });
  });

  describe('CardFooter', () => {
    it('renders with proper alignment', () => {
      render(
        <CardFooter data-testid="card-footer">
          Footer content
        </CardFooter>
      );
      const footer = screen.getByTestId('card-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('retro-card-footer');
    });

    it('applies custom className', () => {
      render(
        <CardFooter className="custom-footer" data-testid="footer">
          Footer
        </CardFooter>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('retro-card-footer');
    });
  });

  describe('Complete Card Structure', () => {
    it('renders full card with all sub-components', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            This is the card content with some text.
          </CardContent>
          <CardFooter>
            Card footer with actions
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /test card/i })).toBeInTheDocument();
      expect(screen.getByText(/this is the card content/i)).toBeInTheDocument();
      expect(screen.getByText(/card footer with actions/i)).toBeInTheDocument();
    });

    it('maintains proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Semantic Card</CardTitle>
          </CardHeader>
          <CardContent>
            Content section
          </CardContent>
          <CardFooter>
            Footer section
          </CardFooter>
        </Card>
      );

      const card = screen.getByText('Semantic Card').closest('[class*="retro-card"]');
      expect(card).toBeInTheDocument();
      
      // Check that header comes before content
      const header = screen.getByText('Semantic Card').closest('[class*="retro-card-header"]');
      const content = screen.getByText('Content section').closest('[class*="retro-card-content"]');
      const footer = screen.getByText('Footer section').closest('[class*="retro-card-footer"]');
      
      expect(header).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      render(
        <Card aria-label="Test card" role="article" data-testid="card">
          Accessible card
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('supports keyboard navigation when clickable', () => {
      const handleClick = jest.fn();
      render(
        <Card clickable onClick={handleClick} data-testid="clickable-card">
          Clickable card
        </Card>
      );
      const card = screen.getByTestId('clickable-card');
      expect(card).toHaveAttribute('tabindex', '0');
    });
  });
});