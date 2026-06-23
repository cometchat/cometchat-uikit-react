import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChatPopover } from '../CometChatPopover';

/** Helper: render a full popover with trigger. */
function renderPopoverWithTrigger(
  rootProps: Partial<React.ComponentProps<typeof CometChatPopover.Root>> = {},
  triggerProps: Partial<React.ComponentProps<typeof CometChatPopover.Trigger>> = {},
  triggerChildren: React.ReactNode = <span>Click me</span>
) {
  return render(
    <CometChatPopover.Root {...rootProps}>
      <CometChatPopover.Trigger {...triggerProps}>{triggerChildren}</CometChatPopover.Trigger>
      <CometChatPopover.Content>
        <div>Popover content</div>
      </CometChatPopover.Content>
    </CometChatPopover.Root>
  );
}

/**
 * The trigger renders its children inside a plain `<div class="cometchat-popover__trigger">`
 * wrapper (it no longer exposes a `role="button"` / `tabIndex`). Select that wrapper
 * element by its class for assertions and interactions.
 */
function getTrigger(): HTMLElement {
  const trigger = document.querySelector<HTMLElement>('.cometchat-popover__trigger');
  if (!trigger) {
    throw new Error('Trigger wrapper (.cometchat-popover__trigger) not found');
  }
  return trigger;
}

describe('CometChatPopoverTrigger', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Rendering ───

  it('renders children inside the trigger wrapper', () => {
    renderPopoverWithTrigger();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('has displayName set to CometChatPopoverTrigger', () => {
    expect(CometChatPopover.Trigger.displayName).toBe('CometChatPopoverTrigger');
  });

  it('applies custom className to the trigger wrapper', () => {
    renderPopoverWithTrigger({}, { className: 'my-trigger' });
    const trigger = getTrigger();
    expect(trigger.className).toContain('my-trigger');
  });

  // ─── ARIA attributes ───

  it('renders the trigger wrapper around its children', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();
    expect(trigger).toBeInTheDocument();
    expect(trigger).toContainElement(screen.getByText('Click me'));
  });

  it('does not assign a role or tabindex to the trigger wrapper', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();
    expect(trigger).not.toHaveAttribute('role');
    expect(trigger).not.toHaveAttribute('tabindex');
  });

  it('sets aria-expanded=false when popover is closed', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded=true when popover is open', () => {
    renderPopoverWithTrigger({ isOpen: true });
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-haspopup="dialog" by default', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('does not set aria-haspopup in tooltip mode (showArrow + no trapFocus)', () => {
    renderPopoverWithTrigger({ showArrow: true, trapFocus: false });
    const trigger = getTrigger();
    expect(trigger).not.toHaveAttribute('aria-haspopup');
  });

  it('sets aria-haspopup="dialog" when showArrow is true and trapFocus is true', () => {
    renderPopoverWithTrigger({ showArrow: true, trapFocus: true });
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('sets aria-controls to popover id when open', () => {
    renderPopoverWithTrigger({ isOpen: true });
    const trigger = getTrigger();
    const controlsId = trigger.getAttribute('aria-controls');
    expect(controlsId).toMatch(/^cometchat-popover-/);
  });

  it('does not set aria-controls when closed', () => {
    renderPopoverWithTrigger({ isOpen: false });
    const trigger = getTrigger();
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  // ─── Click trigger ───

  it('opens popover on click', () => {
    renderPopoverWithTrigger();
    fireEvent.click(getTrigger());
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('toggles popover on repeated clicks', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();

    fireEvent.click(trigger);
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('does not toggle on click when showOnHover is true', () => {
    renderPopoverWithTrigger({ showOnHover: true });
    fireEvent.click(getTrigger());
    // Should remain closed — click is disabled in hover mode
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('stops click event propagation', () => {
    const parentClick = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
      <div onClick={parentClick}>
        <CometChatPopover.Root>
          <CometChatPopover.Trigger>
            <span>Click me</span>
          </CometChatPopover.Trigger>
          <CometChatPopover.Content>
            <div>Content</div>
          </CometChatPopover.Content>
        </CometChatPopover.Root>
      </div>
    );

    fireEvent.click(getTrigger());
    expect(parentClick).not.toHaveBeenCalled();
  });

  // ─── Keyboard trigger ───

  it('toggles popover on Enter key', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('toggles popover on Space key', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('does not toggle on Enter/Space when showOnHover is true', () => {
    renderPopoverWithTrigger({ showOnHover: true });
    const trigger = getTrigger();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('prevents default on Enter key', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    const prevented = !trigger.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it('prevents default on Space key', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    const prevented = !trigger.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it('ignores other keys (e.g., Tab, ArrowDown)', () => {
    renderPopoverWithTrigger();
    const trigger = getTrigger();

    fireEvent.keyDown(trigger, { key: 'Tab' });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  // ─── Hover trigger ───

  it('opens popover on mouse enter after debounce when showOnHover is true', () => {
    renderPopoverWithTrigger({ showOnHover: true, debounceOnHover: 200 });
    const trigger = getTrigger();

    fireEvent.mouseEnter(trigger);

    // Not yet open — debounce hasn't elapsed
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('closes popover on mouse leave after debounce when showOnHover is true', () => {
    renderPopoverWithTrigger({ showOnHover: true, debounceOnHover: 200 });
    const trigger = getTrigger();

    // Open first
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('Popover content')).toBeInTheDocument();

    // Now leave
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('cancels hover open if mouse leaves before debounce', () => {
    renderPopoverWithTrigger({ showOnHover: true, debounceOnHover: 300 });
    const trigger = getTrigger();

    fireEvent.mouseEnter(trigger);
    // Leave before debounce fires
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('does not trigger hover behavior when showOnHover is false', () => {
    renderPopoverWithTrigger({ showOnHover: false });
    const trigger = getTrigger();

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('does not re-open on mouseEnter if already open', () => {
    const onOpen = vi.fn();
    renderPopoverWithTrigger({ showOnHover: true, debounceOnHover: 100, onOpen });
    const trigger = getTrigger();

    // Open
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onOpen).toHaveBeenCalledTimes(1);

    // Mouse enter again while already open — should not schedule another open
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('does not close on mouseLeave if already closed', () => {
    const onClose = vi.fn();
    renderPopoverWithTrigger({ showOnHover: true, debounceOnHover: 100, onClose });
    const trigger = getTrigger();

    // Mouse leave without opening first
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses default debounceOnHover of 500ms', () => {
    renderPopoverWithTrigger({ showOnHover: true });
    const trigger = getTrigger();

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });
});
