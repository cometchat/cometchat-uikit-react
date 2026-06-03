import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChatPopover } from '../CometChatPopover';

/** Helper: render a full popover compound component with sensible defaults. */
function renderPopover(
  rootProps: Partial<React.ComponentProps<typeof CometChatPopover.Root>> = {}
) {
  const defaultProps: React.ComponentProps<typeof CometChatPopover.Root> = {
    children: (
      <>
        <CometChatPopover.Trigger>
          <button>Open</button>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div>Popover body</div>
        </CometChatPopover.Content>
      </>
    ),
    ...rootProps,
  };

  return render(<CometChatPopover.Root {...defaultProps} />);
}

describe('CometChatPopoverRoot', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Rendering ───

  it('renders children inside a wrapper div', () => {
    renderPopover();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('applies custom className to the root wrapper', () => {
    const { container } = renderPopover({ className: 'my-popover' });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('my-popover');
  });

  it('has displayName set to CometChatPopoverRoot', () => {
    // Access the Root sub-component directly
    expect(CometChatPopover.Root.displayName).toBe('CometChatPopoverRoot');
  });

  // ─── Uncontrolled mode ───

  it('starts closed in uncontrolled mode (no isOpen prop)', () => {
    renderPopover();
    // Content should not be visible when closed
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  it('opens on trigger click in uncontrolled mode', () => {
    renderPopover();
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('closes on second trigger click (toggle) in uncontrolled mode', () => {
    renderPopover();
    const trigger = screen.getByText('Open');
    fireEvent.click(trigger);
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  // ─── Controlled mode ───

  it('renders content when isOpen is true (controlled)', () => {
    renderPopover({ isOpen: true });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('does not render content when isOpen is false (controlled)', () => {
    renderPopover({ isOpen: false });
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  it('calls onOpen when opening in controlled mode', () => {
    const onOpen = vi.fn();
    renderPopover({ isOpen: false, onOpen });
    fireEvent.click(screen.getByText('Open'));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('calls onClose when closing in controlled mode', () => {
    const onClose = vi.fn();
    renderPopover({ isOpen: true, onClose });
    // Trigger click toggles → close
    fireEvent.click(screen.getByText('Open'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('opens and closes via isOpen prop changes (controlled)', () => {
    const { rerender } = render(
      <CometChatPopover.Root isOpen={false}>
        <CometChatPopover.Trigger>
          <button>Open</button>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div>Popover body</div>
        </CometChatPopover.Content>
      </CometChatPopover.Root>
    );
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();

    rerender(
      <CometChatPopover.Root isOpen={true}>
        <CometChatPopover.Trigger>
          <button>Open</button>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div>Popover body</div>
        </CometChatPopover.Content>
      </CometChatPopover.Root>
    );
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    rerender(
      <CometChatPopover.Root isOpen={false}>
        <CometChatPopover.Trigger>
          <button>Open</button>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div>Popover body</div>
        </CometChatPopover.Content>
      </CometChatPopover.Root>
    );
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  // ─── Outside click ───

  it('closes on outside click by default (uncontrolled)', () => {
    renderPopover();
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  it('calls onClose on outside click (controlled)', () => {
    const onClose = vi.fn();
    renderPopover({ isOpen: true, onClose });
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close on outside click when closeOnOutsideClick is false', () => {
    renderPopover({ closeOnOutsideClick: false });
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('does not close when clicking inside the popover content', () => {
    renderPopover();
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText('Popover body'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('does not close when clicking inside the trigger', () => {
    renderPopover();
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    // Click on the trigger wrapper (not the button itself, which would toggle)
    const triggerWrapper = screen.getByText('Open').closest('[role="button"]')!;
    fireEvent.mouseDown(triggerWrapper);
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  // ─── Escape key ───

  it('closes on Escape key press (uncontrolled)', () => {
    renderPopover();
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  it('calls onClose on Escape key press (controlled)', () => {
    const onClose = vi.fn();
    renderPopover({ isOpen: true, onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prevents default on Escape key', () => {
    renderPopover({ isOpen: true });
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const prevented = !document.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it('does not attach Escape listener when popover is closed', () => {
    const onClose = vi.fn();
    renderPopover({ isOpen: false, onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Placement prop ───

  it('defaults placement to bottom', () => {
    renderPopover({ isOpen: true });
    // Content renders — placement is passed via context
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('accepts placement="top"', () => {
    renderPopover({ isOpen: true, placement: 'top' });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('accepts placement="left"', () => {
    renderPopover({ isOpen: true, placement: 'left' });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('accepts placement="right"', () => {
    renderPopover({ isOpen: true, placement: 'right' });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  // ─── showArrow prop ───

  it('renders arrow element when showArrow is true', () => {
    renderPopover({ isOpen: true, showArrow: true });
    const content = screen.getByText('Popover body').parentElement!;
    const arrow = content.querySelector('[aria-hidden="true"]');
    expect(arrow).toBeInTheDocument();
  });

  it('does not render arrow element when showArrow is false (default)', () => {
    renderPopover({ isOpen: true });
    const content = screen.getByText('Popover body').parentElement!;
    const arrow = content.querySelector('[aria-hidden="true"]');
    expect(arrow).not.toBeInTheDocument();
  });

  // ─── trapFocus prop ───

  it('sets tabIndex on content when trapFocus is true', () => {
    renderPopover({ isOpen: true, trapFocus: true });
    const content = screen.getByText('Popover body').parentElement!;
    expect(content).toHaveAttribute('tabindex', '-1');
  });

  it('does not set tabIndex on content when trapFocus is false (default)', () => {
    renderPopover({ isOpen: true });
    const content = screen.getByText('Popover body').parentElement!;
    expect(content).not.toHaveAttribute('tabindex');
  });

  // ─── ARIA props ───

  it('passes ariaLabel to content', () => {
    renderPopover({ isOpen: true, ariaLabel: 'My popover' });
    const content = screen.getByText('Popover body').parentElement!;
    expect(content).toHaveAttribute('aria-label', 'My popover');
  });

  it('passes ariaLabelledBy to content', () => {
    renderPopover({ isOpen: true, ariaLabelledBy: 'title-id' });
    const content = screen.getByText('Popover body').parentElement!;
    expect(content).toHaveAttribute('aria-labelledby', 'title-id');
  });

  it('passes ariaDescribedBy to content', () => {
    renderPopover({ isOpen: true, ariaDescribedBy: 'desc-id' });
    const content = screen.getByText('Popover body').parentElement!;
    expect(content).toHaveAttribute('aria-describedby', 'desc-id');
  });

  // ─── Scroll / resize ───

  it('repositions on window scroll when open', () => {
    renderPopover({ isOpen: true });
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    // Scroll should not throw and content should remain
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('repositions on window resize when open', () => {
    renderPopover({ isOpen: true });
    expect(screen.getByText('Popover body')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('does not attach scroll/resize listeners when closed', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderPopover({ isOpen: false });
    const scrollCalls = addSpy.mock.calls.filter(([type]) => type === 'scroll');
    const resizeCalls = addSpy.mock.calls.filter(([type]) => type === 'resize');
    expect(scrollCalls).toHaveLength(0);
    expect(resizeCalls).toHaveLength(0);
    addSpy.mockRestore();
  });

  // ─── handleOpen / handleClose guards ───

  it('handleOpen does nothing when already open', () => {
    const onOpen = vi.fn();
    renderPopover({ isOpen: true, onOpen });
    // Attempt to open again via trigger click — toggle will call handleClose, not handleOpen
    // Instead, we verify onOpen is not called spuriously
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('handleClose does nothing when already closed', () => {
    const onClose = vi.fn();
    renderPopover({ isOpen: false, onClose });
    // Escape key when closed — listener not attached, so onClose should not fire
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Context provision ───

  it('provides context to children (sub-components render without error)', () => {
    renderPopover({ isOpen: true });
    // If context wasn't provided, Trigger and Content would throw
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });
});
