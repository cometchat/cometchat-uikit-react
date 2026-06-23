import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatSearchBar } from '../CometChatSearchBar';

function renderInput(
  rootProps: Partial<React.ComponentProps<typeof CometChatSearchBar.Root>> & {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
  } = {},
  inputProps: Partial<React.ComponentProps<typeof CometChatSearchBar.Input>> = {}
) {
  // Extract test-specific shorthand props
  const { value, placeholder, ...rest } = rootProps;

  function Wrapper() {
    const [val, setVal] = React.useState(value ?? rest.searchText ?? '');
    return (
      <CometChatSearchBar.Root
        {...rest}
        searchText={value ?? rest.searchText ?? val}
        placeholderText={placeholder ?? rest.placeholderText}
        onChange={v => {
          setVal(v);
          rest.onChange?.(v);
        }}
      >
        <CometChatSearchBar.Input {...inputProps} />
      </CometChatSearchBar.Root>
    );
  }
  return render(<Wrapper />);
}

describe('CometChatSearchBarInput', () => {
  it('renders an <input> element with role="searchbox"', () => {
    renderInput();
    expect(screen.getByRole('searchbox')).toBeTruthy();
  });

  it('reads value, placeholder, and disabled from context', () => {
    renderInput({ value: 'test', placeholder: 'Find...', disabled: true });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('test');
    expect(input).toHaveAttribute('placeholder', 'Find...');
    expect(input).toBeDisabled();
  });

  it('calls context setValue on input change', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderInput({ onChange });
    await user.type(screen.getByRole('searchbox'), 'x');
    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('clears input on Escape key press', async () => {
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
        </CometChatSearchBar.Root>
      );
    }

    render(<Wrapper />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('hello');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('applies custom className', () => {
    renderInput({}, { className: 'my-input' });
    const input = screen.getByRole('searchbox');
    expect(input.className).toContain('my-input');
  });

  it('forwards additional HTML input attributes', () => {
    renderInput({}, { autoFocus: true, maxLength: 50 });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('maxlength', '50');
  });

  it('has aria-label when no visible label is present', () => {
    renderInput({ placeholder: 'Search users' });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search users');
  });
});

describe('CometChatSearchBarInput ref forwarding', () => {
  it('forwards a ref to the underlying input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(
      <CometChatSearchBar.Root>
        <CometChatSearchBar.Input ref={ref} />
      </CometChatSearchBar.Root>
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByRole('searchbox'));
  });

  it('uses inputRef from Root when no direct ref is provided', () => {
    const inputRef = React.createRef<HTMLInputElement>();
    render(
      <CometChatSearchBar.Root inputRef={inputRef}>
        <CometChatSearchBar.Input />
      </CometChatSearchBar.Root>
    );
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(inputRef.current).toBe(screen.getByRole('searchbox'));
  });

  it('prefers direct ref over inputRef from Root', () => {
    const directRef = React.createRef<HTMLInputElement>();
    const rootRef = React.createRef<HTMLInputElement>();
    render(
      <CometChatSearchBar.Root inputRef={rootRef}>
        <CometChatSearchBar.Input ref={directRef} />
      </CometChatSearchBar.Root>
    );
    expect(directRef.current).toBeInstanceOf(HTMLInputElement);
    // rootRef should NOT be set since direct ref takes precedence
    expect(rootRef.current).toBeNull();
  });
});
