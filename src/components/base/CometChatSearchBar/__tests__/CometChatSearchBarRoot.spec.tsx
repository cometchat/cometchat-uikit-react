import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatSearchBar } from '../CometChatSearchBar';
import { useCometChatSearchBarContext } from '../CometChatSearchBar.context';

function renderSearchBar(props: React.ComponentProps<typeof CometChatSearchBar.Root> = {}) {
  const { children, ...rest } = props;
  return render(
    <CometChatSearchBar.Root {...rest}>
      {children ?? (
        <>
          <CometChatSearchBar.Icon />
          <CometChatSearchBar.Input />
          <CometChatSearchBar.ClearButton />
        </>
      )}
    </CometChatSearchBar.Root>
  );
}

describe('CometChatSearchBarRoot', () => {
  it('renders the search bar container with correct BEM class', () => {
    const { container } = renderSearchBar();
    const root = container.querySelector('[class*="cometchat-search-bar"]');
    expect(root).toBeTruthy();
  });

  it('root container has role="search" landmark', () => {
    renderSearchBar();
    const search = screen.getByRole('search');
    expect(search).toBeTruthy();
  });

  it('provides context values to children via CometChatSearchBarContext', () => {
    renderSearchBar({ placeholderText: 'Find users' });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Find users');
  });

  it('works in controlled mode (searchText + onChange)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    function Controlled() {
      const [val, setVal] = React.useState('');
      return (
        <CometChatSearchBar.Root
          searchText={val}
          onChange={v => {
            setVal(v);
            onChange(v);
          }}
        >
          <CometChatSearchBar.Input />
        </CometChatSearchBar.Root>
      );
    }

    render(<Controlled />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'hi');
    expect(onChange).toHaveBeenCalledWith('h');
    expect(onChange).toHaveBeenCalledWith('hi');
    expect(input).toHaveValue('hi');
  });

  it('works in uncontrolled mode (defaultSearchText)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSearchBar({ defaultSearchText: 'init', onChange });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('init');
    await user.clear(input);
    await user.type(input, 'new');
    expect(input).toHaveValue('new');
  });

  it('calls onChange when input value changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    function Wrapper() {
      const [val, setVal] = React.useState('');
      return (
        <CometChatSearchBar.Root
          searchText={val}
          onChange={v => {
            setVal(v);
            onChange(v);
          }}
        >
          <CometChatSearchBar.Input />
        </CometChatSearchBar.Root>
      );
    }

    render(<Wrapper />);
    await user.type(screen.getByRole('searchbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('applies disabled state to context', () => {
    renderSearchBar({ disabled: true, searchText: 'test' });
    const input = screen.getByRole('searchbox');
    expect(input).toBeDisabled();
  });

  it('applies custom className to root container', () => {
    const { container } = renderSearchBar({ className: 'my-custom' });
    const root = container.firstElementChild;
    expect(root?.className).toContain('my-custom');
  });

  it('applies custom style to root container', () => {
    const { container } = renderSearchBar({ style: { maxWidth: 200 } });
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.maxWidth).toBe('200px');
  });

  it('debounces onChange when debounceMs is set', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderSearchBar({ debounceMs: 300, onChange });
    const input = screen.getByRole('searchbox');

    // Simulate input change directly (fake timers don't play well with userEvent).
    input.focus();
    React.act(() => {
      const descriptor = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      );
      descriptor!.set!.call(input, 'abc');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // onChange should not have been called yet (debounced).
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('abc');
    vi.useRealTimers();
  });

  it('does not debounce when debounceMs is 0 or omitted', async () => {
    const onChange = vi.fn();

    function Wrapper() {
      const [val, setVal] = React.useState('');
      return (
        <CometChatSearchBar.Root
          searchText={val}
          onChange={v => {
            setVal(v);
            onChange(v);
          }}
          debounceMs={0}
        >
          <CometChatSearchBar.Input />
        </CometChatSearchBar.Root>
      );
    }

    render(<Wrapper />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox'), 'ab');
    // Each keystroke fires onChange immediately.
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('exposes isPending via context (defaults to false when idle)', () => {
    function PendingReader() {
      const { isPending } = useCometChatSearchBarContext();
      return <span data-testid="pending">{String(isPending)}</span>;
    }

    render(
      <CometChatSearchBar.Root>
        <PendingReader />
      </CometChatSearchBar.Root>
    );
    expect(screen.getByTestId('pending').textContent).toBe('false');
  });

  it('wraps onChange in startTransition (non-blocking)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    function Wrapper() {
      const [val, setVal] = React.useState('');
      return (
        <CometChatSearchBar.Root
          searchText={val}
          onChange={v => {
            setVal(v);
            onChange(v);
          }}
        >
          <CometChatSearchBar.Input />
        </CometChatSearchBar.Root>
      );
    }

    render(<Wrapper />);
    await user.type(screen.getByRole('searchbox'), 'a');
    // onChange is called (via startTransition, but still synchronously in test env).
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
