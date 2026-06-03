import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatButton } from '../CometChatButton';

/** Helper: wraps Icon inside Root so context is available. */
function renderIcon(
  iconChild: React.ReactNode,
  opts: { size?: 'sm' | 'md' | 'lg'; className?: string } = {}
) {
  return render(
    <CometChatButton.Root size={opts.size}>
      <CometChatButton.Icon className={opts.className}>{iconChild}</CometChatButton.Icon>
    </CometChatButton.Root>
  );
}

describe('CometChatButtonIcon', () => {
  it('renders children inside a <span> with the icon class', () => {
    renderIcon(<svg data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    const wrapper = icon.parentElement;
    expect(wrapper?.tagName).toBe('SPAN');
    expect(wrapper?.className).toMatch(/cometchat-button__icon/);
  });

  it('applies custom className', () => {
    renderIcon(<svg data-testid="icon" />, { className: 'extra-icon' });
    const wrapper = screen.getByTestId('icon').parentElement;
    expect(wrapper?.className).toContain('extra-icon');
  });

  it('reads context to adjust icon size based on button size', () => {
    const { rerender } = render(
      <CometChatButton.Root size="sm">
        <CometChatButton.Icon>
          <svg data-testid="icon" />
        </CometChatButton.Icon>
      </CometChatButton.Root>
    );
    let wrapper = screen.getByTestId('icon').parentElement;
    expect(wrapper?.className).toMatch(/sm/);

    rerender(
      <CometChatButton.Root size="lg">
        <CometChatButton.Icon>
          <svg data-testid="icon" />
        </CometChatButton.Icon>
      </CometChatButton.Root>
    );
    wrapper = screen.getByTestId('icon').parentElement;
    expect(wrapper?.className).toMatch(/lg/);
  });
});
