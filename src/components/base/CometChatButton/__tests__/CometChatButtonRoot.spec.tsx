import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatButton } from '../CometChatButton';

function renderButton(props: Partial<Parameters<typeof CometChatButton.Root>[0]> = {}) {
  const defaultProps = {
    children: <CometChatButton.Text>Click me</CometChatButton.Text>,
    ...props,
  };
  return render(<CometChatButton.Root {...defaultProps} />);
}

describe('CometChatButtonRoot', () => {
  it('renders a native <button> element', () => {
    renderButton();
    const btn = screen.getByRole('button');
    expect(btn.tagName).toBe('BUTTON');
  });

  it('defaults type to "button"', () => {
    renderButton();
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('applies variant class modifier (primary, secondary, ghost)', () => {
    const { rerender } = render(
      <CometChatButton.Root variant="primary">
        <CometChatButton.Text>Test</CometChatButton.Text>
      </CometChatButton.Root>
    );
    expect(screen.getByRole('button').className).toMatch(/primary/);

    rerender(
      <CometChatButton.Root variant="secondary">
        <CometChatButton.Text>Test</CometChatButton.Text>
      </CometChatButton.Root>
    );
    expect(screen.getByRole('button').className).toMatch(/secondary/);

    rerender(
      <CometChatButton.Root variant="ghost">
        <CometChatButton.Text>Test</CometChatButton.Text>
      </CometChatButton.Root>
    );
    expect(screen.getByRole('button').className).toMatch(/ghost/);
  });

  it('applies size class modifier (sm, md, lg)', () => {
    const { rerender } = render(
      <CometChatButton.Root size="sm">
        <CometChatButton.Text>Test</CometChatButton.Text>
      </CometChatButton.Root>
    );
    expect(screen.getByRole('button').className).toMatch(/sm/);

    rerender(
      <CometChatButton.Root size="lg">
        <CometChatButton.Text>Test</CometChatButton.Text>
      </CometChatButton.Root>
    );
    expect(screen.getByRole('button').className).toMatch(/lg/);
  });

  it('defaults to variant="primary" and size="md" when not specified', () => {
    renderButton();
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/primary/);
    expect(btn.className).toMatch(/md/);
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    renderButton({ onClick });
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled is true', () => {
    const onClick = vi.fn();
    renderButton({ disabled: true, onClick });
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when isLoading is true', () => {
    const onClick = vi.fn();
    renderButton({ isLoading: true, onClick });
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets disabled and aria-disabled="true" when disabled', () => {
    renderButton({ disabled: true });
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('sets aria-busy="true" when loading', () => {
    renderButton({ isLoading: true });
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a spinner when isLoading is true', () => {
    const { container } = renderButton({ isLoading: true });
    const spinner = container.querySelector('[class*="spinner"]');
    expect(spinner).not.toBeNull();
  });

  it('hides children content visually (but keeps in DOM for layout) when loading', () => {
    const { container } = renderButton({ isLoading: true });
    const hidden = container.querySelector('[class*="content--hidden"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.textContent).toBe('Click me');
  });

  it('applies custom className alongside default classes', () => {
    renderButton({ className: 'my-custom' });
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('my-custom');
    expect(btn.className).toMatch(/cometchat-button/);
  });

  it('forwards native button attributes (id, name, form, etc.)', () => {
    renderButton({ id: 'send-btn', name: 'send' });
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('id', 'send-btn');
    expect(btn).toHaveAttribute('name', 'send');
  });

  it('provides ButtonContextValue to children via ButtonContext', () => {
    // If context wasn't provided, CometChatButton.Icon would throw.
    // Rendering successfully proves context is provided.
    render(
      <CometChatButton.Root variant="secondary" size="lg">
        <CometChatButton.Icon>
          <svg data-testid="icon" />
        </CometChatButton.Icon>
        <CometChatButton.Text>Test</CometChatButton.Text>
      </CometChatButton.Root>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
