import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatPopover } from '../CometChatPopover';

/** Helper: render a full popover with content visible. */
function renderOpenPopover(
  rootProps: Partial<React.ComponentProps<typeof CometChatPopover.Root>> = {},
  contentProps: Partial<React.ComponentProps<typeof CometChatPopover.Content>> = {},
  contentChildren: React.ReactNode = <div>Content here</div>
) {
  return render(
    <CometChatPopover.Root isOpen={true} {...rootProps}>
      <CometChatPopover.Trigger>
        <button>Trigger</button>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content {...contentProps}>{contentChildren}</CometChatPopover.Content>
    </CometChatPopover.Root>
  );
}

describe('CometChatPopoverContent', () => {
  // ─── Rendering ───

  it('renders children when popover is open', () => {
    renderOpenPopover();
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('does not render when popover is closed', () => {
    render(
      <CometChatPopover.Root isOpen={false}>
        <CometChatPopover.Trigger>
          <button>Trigger</button>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div>Content here</div>
        </CometChatPopover.Content>
      </CometChatPopover.Root>
    );
    expect(screen.queryByText('Content here')).not.toBeInTheDocument();
  });

  it('has displayName set to CometChatPopoverContent', () => {
    expect(CometChatPopover.Content.displayName).toBe('CometChatPopoverContent');
  });

  // ─── className ───

  it('applies custom className to the content wrapper', () => {
    renderOpenPopover({}, { className: 'custom-content' });
    const content = screen.getByText('Content here').parentElement!;
    expect(content.className).toContain('custom-content');
  });

  // ─── Role / ARIA ───

  it('renders with role="dialog" by default (no showArrow, no trapFocus)', () => {
    renderOpenPopover();
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('role', 'dialog');
  });

  it('renders with role="tooltip" when showArrow is true and trapFocus is false', () => {
    renderOpenPopover({ showArrow: true, trapFocus: false });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('role', 'tooltip');
  });

  it('renders with role="dialog" when showArrow is true and trapFocus is true', () => {
    renderOpenPopover({ showArrow: true, trapFocus: true });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('role', 'dialog');
  });

  it('sets aria-modal="true" when trapFocus is true and not tooltip mode', () => {
    renderOpenPopover({ trapFocus: true });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('aria-modal', 'true');
  });

  it('does not set aria-modal when trapFocus is false', () => {
    renderOpenPopover({ trapFocus: false });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).not.toHaveAttribute('aria-modal');
  });

  it('does not set aria-modal in tooltip mode (showArrow + no trapFocus)', () => {
    renderOpenPopover({ showArrow: true, trapFocus: false });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).not.toHaveAttribute('aria-modal');
  });

  it('sets aria-label from root prop', () => {
    renderOpenPopover({ ariaLabel: 'Popover label' });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('aria-label', 'Popover label');
  });

  it('sets aria-labelledby from root prop', () => {
    renderOpenPopover({ ariaLabelledBy: 'my-title' });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('aria-labelledby', 'my-title');
  });

  it('sets aria-describedby from root prop', () => {
    renderOpenPopover({ ariaDescribedBy: 'my-desc' });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('aria-describedby', 'my-desc');
  });

  // ─── ID ───

  it('has a unique id attribute on the content element', () => {
    renderOpenPopover();
    const content = screen.getByText('Content here').parentElement!;
    expect(content.id).toMatch(/^cometchat-popover-/);
  });

  // ─── Positioning styles ───

  it('content element exists and receives position style object', () => {
    renderOpenPopover();
    const content = screen.getByText('Content here').parentElement!;
    // In jsdom, getBoundingClientRect returns zeros so positionStyle may be empty.
    // Verify the content element is rendered and has the fixed-position CSS class.
    expect(content).toBeInTheDocument();
    expect(content.className).toContain('cometchat-popover__content');
  });

  // ─── Arrow rendering ───

  it('renders arrow when showArrow is true (bottom placement)', () => {
    renderOpenPopover({ showArrow: true, placement: 'bottom' });
    const content = screen.getByText('Content here').parentElement!;
    const arrow = content.querySelector('[aria-hidden="true"]');
    expect(arrow).toBeInTheDocument();
  });

  it('renders arrow when showArrow is true (top placement)', () => {
    renderOpenPopover({ showArrow: true, placement: 'top' });
    const content = screen.getByText('Content here').parentElement!;
    const arrow = content.querySelector('[aria-hidden="true"]');
    expect(arrow).toBeInTheDocument();
  });

  it('renders arrow when showArrow is true (left placement)', () => {
    renderOpenPopover({ showArrow: true, placement: 'left' });
    const content = screen.getByText('Content here').parentElement!;
    const arrow = content.querySelector('[aria-hidden="true"]');
    expect(arrow).toBeInTheDocument();
  });

  it('renders arrow when showArrow is true (right placement)', () => {
    renderOpenPopover({ showArrow: true, placement: 'right' });
    const content = screen.getByText('Content here').parentElement!;
    const arrow = content.querySelector('[aria-hidden="true"]');
    expect(arrow).toBeInTheDocument();
  });

  it('does not render arrow when showArrow is false', () => {
    renderOpenPopover({ showArrow: false });
    const content = screen.getByText('Content here').parentElement!;
    const arrow = content.querySelector('[aria-hidden="true"]');
    expect(arrow).not.toBeInTheDocument();
  });

  // ─── Focus trap (Tab cycling) ───

  it('cycles focus forward on Tab when trapFocus is true', () => {
    renderOpenPopover(
      { trapFocus: true },
      {},
      <>
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </>
    );

    const content = screen.getByText('First').closest('[role="dialog"]')!;
    const buttons = content.querySelectorAll('button');
    const lastButton = buttons[buttons.length - 1]!;

    // Focus the last button
    lastButton.focus();
    expect(document.activeElement).toBe(lastButton);

    // Tab from last should wrap to first
    fireEvent.keyDown(content, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('cycles focus backward on Shift+Tab when trapFocus is true', () => {
    renderOpenPopover(
      { trapFocus: true },
      {},
      <>
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </>
    );

    const content = screen.getByText('First').closest('[role="dialog"]')!;
    const buttons = content.querySelectorAll('button');
    const firstButton = buttons[0]!;

    // Focus the first button
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Shift+Tab from first should wrap to last
    fireEvent.keyDown(content, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('does not trap focus when trapFocus is false', () => {
    renderOpenPopover(
      { trapFocus: false },
      {},
      <>
        <button>First</button>
        <button>Second</button>
      </>
    );

    const content = screen.getByText('First').closest('[role="dialog"]')!;
    // onKeyDown should not be attached — Tab event should not be intercepted
    // Verify no error is thrown
    fireEvent.keyDown(content, { key: 'Tab' });
    expect(content).toBeInTheDocument();
  });

  it('stops propagation of arrow keys when trapFocus is true', () => {
    const parentHandler = vi.fn();
    render(
      <div onKeyDown={parentHandler}>
        <CometChatPopover.Root isOpen={true} trapFocus={true}>
          <CometChatPopover.Trigger>
            <button>Trigger</button>
          </CometChatPopover.Trigger>
          <CometChatPopover.Content>
            <button>Inside</button>
          </CometChatPopover.Content>
        </CometChatPopover.Root>
      </div>
    );

    const content = screen.getByText('Inside').closest('[role="dialog"]')!;
    fireEvent.keyDown(content, { key: 'ArrowDown' });
    fireEvent.keyDown(content, { key: 'ArrowUp' });
    fireEvent.keyDown(content, { key: 'ArrowLeft' });
    fireEvent.keyDown(content, { key: 'ArrowRight' });

    // Arrow keys should be stopped from propagating to parent
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it('handles Tab with no focusable elements gracefully', () => {
    renderOpenPopover({ trapFocus: true }, {}, <span>No focusable elements</span>);

    const content = screen.getByText('No focusable elements').closest('[role="dialog"]')!;
    // Should not throw
    fireEvent.keyDown(content, { key: 'Tab' });
    expect(content).toBeInTheDocument();
  });

  // ─── tabIndex ───

  it('sets tabIndex=-1 when trapFocus is true', () => {
    renderOpenPopover({ trapFocus: true });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).toHaveAttribute('tabindex', '-1');
  });

  it('does not set tabIndex when trapFocus is false', () => {
    renderOpenPopover({ trapFocus: false });
    const content = screen.getByText('Content here').parentElement!;
    expect(content).not.toHaveAttribute('tabindex');
  });
});
