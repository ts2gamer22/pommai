/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '../Dialog';

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('renders closed by default', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );
      
      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
      expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
    });

    it('opens when trigger is clicked', async () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );
      
      const trigger = screen.getByText('Open Dialog');
      fireEvent.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('Dialog content')).toBeInTheDocument();
      });
    });

    it('can be controlled externally', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button onClick={() => setOpen(true)}>External Open</button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>Controlled dialog</DialogContent>
            </Dialog>
          </div>
        );
      };

      render(<TestComponent />);
      
      const externalButton = screen.getByText('External Open');
      fireEvent.click(externalButton);
      
      await waitFor(() => {
        expect(screen.getByText('Controlled dialog')).toBeInTheDocument();
      });
    });
  });

  describe('DialogContent', () => {
    it('renders with RetroUI styling', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent data-testid="dialog-content">
            Content
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const content = screen.getByTestId('dialog-content');
        expect(content).toHaveClass('retro-dialog-content');
        expect(content).toHaveClass('pixel-border');
      });
    });

    it('applies custom className', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className="custom-dialog" data-testid="dialog-content">
            Content
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const content = screen.getByTestId('dialog-content');
        expect(content).toHaveClass('custom-dialog');
        expect(content).toHaveClass('retro-dialog-content');
      });
    });

    it('closes when overlay is clicked', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Dialog content')).toBeInTheDocument();
      });
      
      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        fireEvent.click(overlay);
        
        await waitFor(() => {
          expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
        });
      }
    });

    it('closes when escape key is pressed', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Dialog content')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
      });
    });
  });

  describe('DialogHeader', () => {
    it('renders with proper structure', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              Header content
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const header = screen.getByTestId('dialog-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('retro-dialog-header');
      });
    });
  });

  describe('DialogTitle', () => {
    it('renders as h2 by default', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const title = screen.getByRole('heading', { level: 2 });
        expect(title).toBeInTheDocument();
        expect(title).toHaveTextContent('Dialog Title');
      });
    });

    it('applies RetroUI styling', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const title = screen.getByTestId('dialog-title');
        expect(title).toHaveClass('retro-dialog-title');
      });
    });
  });

  describe('DialogDescription', () => {
    it('renders with proper styling', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogDescription data-testid="dialog-description">
                This is a description
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const description = screen.getByTestId('dialog-description');
        expect(description).toBeInTheDocument();
        expect(description).toHaveClass('retro-dialog-description');
      });
    });
  });

  describe('DialogFooter', () => {
    it('renders with proper alignment', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter data-testid="dialog-footer">
              Footer content
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const footer = screen.getByTestId('dialog-footer');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveClass('retro-dialog-footer');
      });
    });
  });

  describe('DialogClose', () => {
    it('closes dialog when clicked', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogClose>Close</DialogClose>
            <div>Dialog content</div>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Dialog content')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Complete Dialog Structure', () => {
    it('renders full dialog with all components', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Dialog</DialogTitle>
              <DialogDescription>
                This is a complete dialog example
              </DialogDescription>
            </DialogHeader>
            <div>Main content goes here</div>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /complete dialog/i })).toBeInTheDocument();
        expect(screen.getByText(/this is a complete dialog example/i)).toBeInTheDocument();
        expect(screen.getByText(/main content goes here/i)).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accessible Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('traps focus within dialog', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <button>First button</button>
            <button>Second button</button>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      );
      
      await waitFor(() => {
        const firstButton = screen.getByText('First button');
        expect(firstButton).toHaveFocus();
      });
    });

    it('returns focus to trigger when closed', async () => {
      render(
        <div>
          <button>Before</button>
          <Dialog>
            <DialogTrigger>Open Dialog</DialogTrigger>
            <DialogContent>
              <DialogClose>Close</DialogClose>
            </DialogContent>
          </Dialog>
          <button>After</button>
        </div>
      );
      
      const trigger = screen.getByText('Open Dialog');
      fireEvent.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });
});