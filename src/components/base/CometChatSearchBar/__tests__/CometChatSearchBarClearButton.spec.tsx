import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatSearchBar } from '../CometChatSearchBar';

function renderClearButton(
  rootProps: Partial<React.ComponentProps<typeof CometChatSearchBar.Root>> = {},
  clearProps: Partial<React.ComponentProps<typeof CometChatSearchBar.ClearButton>> = {}
) {
  function Wrapper() {
    const [val, setVal] = React.useState(rootProps.searchText ?? rootProps.defaultSearchText ?? '');
    return (
      <CometChatSearchBar.Root
        {...rootProps}
        searchText={rootProps.searchText ?? val}
        onChange={v => {
          if (rootProps.searchText === undefined) setVal(v);
          rootProps.onChange?.(v);
        }}
      >
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton {...clearProps} />
      </CometChatSearchBar.Root>
    );
  }
  return render(<Wrapper />);
}

describe('CometChatSearchBarClearButton', () => {
  it('renders a <button> element with aria-label="Clear search"', () => {
    renderClearButton({ searchText: 'test' });
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn).toBeTruthy();
  });

  it('calls context clear when clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    function Wrapper() {
      const [val, setVal] = React.useState('hello');
      return (
        <CometChatSearchBar.Root
          searchText={val}
          onChange={v => {
            setVal(v);
            onChange(v);
          }}
        >
          <CometChatSearchBar.Input />
          <CometChatSearchBar.ClearButton />
        </CometChatSearchBar.Root>
      );
    }

    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('has tabIndex={-1} when input value is empty', () => {
    const { container } = renderClearButton({ searchText: '' });
    const btn = container.querySelector('button[aria-label="Clear search"]');
    expect(btn).toBeTruthy();
    expect(btn).toHaveAttribute('tabindex', '-1');
  });

  it('is visible and focusable when input has a value', () => {
    renderClearButton({ searchText: 'text' });
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn).not.toHaveAttribute('tabindex', '-1');
    expect(btn.style.visibility).not.toBe('hidden');
  });

  it('respects disabled state from context', () => {
    renderClearButton({ searchText: 'test', disabled: true });
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn).toBeDisabled();
  });

  it('renders custom icon when icon prop is provided', () => {
    renderClearButton({ searchText: 'test' }, { icon: <span data-testid="custom-icon">X</span> });
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('applies custom className', () => {
    renderClearButton({ searchText: 'test' }, { className: 'my-clear' });
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn.className).toContain('my-clear');
  });
});
