/**
 * Tests for useListKeyboardNavigation.
 */
import React, { useRef } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useListKeyboardNavigation } from '../useListKeyboardNavigation';
import type { UseListKeyboardNavigationOptions } from '../useListKeyboardNavigation';

function Listbox({
  count = 3,
  options,
}: {
  count?: number;
  options?: UseListKeyboardNavigationOptions;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = useListKeyboardNavigation(ref, options);
  return (
    <div ref={ref} role="listbox" tabIndex={0} onKeyDown={onKeyDown}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          role="option"
          aria-selected={false}
          tabIndex={0}
          data-testid={`opt-${String(i)}`}
        >
          Option {i}
        </div>
      ))}
    </div>
  );
}

function options() {
  return screen.getAllByRole('option');
}

describe('useListKeyboardNavigation', () => {
  beforeEach(() => {
    // jsdom implements focus; nothing to stub.
  });

  it('ArrowDown moves focus to the next item', () => {
    render(<Listbox />);
    const [first, second] = options();
    first?.focus();
    fireEvent.keyDown(first!, { key: 'ArrowDown' });
    expect(second).toHaveFocus();
  });

  it('ArrowUp moves focus to the previous item', () => {
    render(<Listbox />);
    const [first, second] = options();
    second?.focus();
    fireEvent.keyDown(second!, { key: 'ArrowUp' });
    expect(first).toHaveFocus();
  });

  it('clamps at the last item by default (no loop)', () => {
    render(<Listbox count={3} />);
    const opts = options();
    const last = opts[2]!;
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowDown' });
    expect(last).toHaveFocus();
  });

  it('clamps at the first item by default (no loop)', () => {
    render(<Listbox count={3} />);
    const first = options()[0]!;
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(first).toHaveFocus();
  });

  it('wraps around when loop is enabled', () => {
    render(<Listbox count={3} options={{ loop: true }} />);
    const opts = options();
    opts[2]!.focus();
    fireEvent.keyDown(opts[2]!, { key: 'ArrowDown' });
    expect(opts[0]).toHaveFocus();

    opts[0]!.focus();
    fireEvent.keyDown(opts[0]!, { key: 'ArrowUp' });
    expect(opts[2]).toHaveFocus();
  });

  it('Home / End jump to first / last', () => {
    render(<Listbox count={4} />);
    const opts = options();
    opts[1]!.focus();
    fireEvent.keyDown(opts[1]!, { key: 'End' });
    expect(opts[3]).toHaveFocus();

    fireEvent.keyDown(opts[3]!, { key: 'Home' });
    expect(opts[0]).toHaveFocus();
  });

  it('ArrowDown from no active item focuses the first', () => {
    render(<Listbox />);
    const container = screen.getByRole('listbox');
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    expect(options()[0]).toHaveFocus();
  });

  it('resolves the item when focus is on a child (e.g. a checkbox)', () => {
    function WithCheckbox() {
      const ref = useRef<HTMLDivElement>(null);
      const onKeyDown = useListKeyboardNavigation(ref);
      return (
        <div ref={ref} role="listbox" tabIndex={0} onKeyDown={onKeyDown}>
          <div role="option" aria-selected={false} tabIndex={0} data-testid="opt-0">
            <input type="checkbox" data-testid="cb-0" />
          </div>
          <div role="option" aria-selected={false} tabIndex={0} data-testid="opt-1" />
        </div>
      );
    }
    render(<WithCheckbox />);
    const checkbox = screen.getByTestId('cb-0');
    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: 'ArrowDown' });
    expect(screen.getByTestId('opt-1')).toHaveFocus();
  });

  it('supports a custom itemSelector', () => {
    function ListitemList() {
      const ref = useRef<HTMLDivElement>(null);
      const onKeyDown = useListKeyboardNavigation(ref, { itemSelector: '[role="listitem"]' });
      return (
        <div ref={ref} role="list" onKeyDown={onKeyDown}>
          <div role="listitem" tabIndex={0} data-testid="li-0" />
          <div role="listitem" tabIndex={0} data-testid="li-1" />
        </div>
      );
    }
    render(<ListitemList />);
    const first = screen.getByTestId('li-0');
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(screen.getByTestId('li-1')).toHaveFocus();
  });

  it('is a no-op when disabled', () => {
    render(<Listbox options={{ enabled: false }} />);
    const [first, second] = options();
    first?.focus();
    fireEvent.keyDown(first!, { key: 'ArrowDown' });
    expect(first).toHaveFocus();
    expect(second).not.toHaveFocus();
  });

  it('ignores non-navigation keys', () => {
    render(<Listbox />);
    const first = options()[0]!;
    first.focus();
    fireEvent.keyDown(first, { key: 'a' });
    expect(first).toHaveFocus();
  });
});
