import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatAvatar } from '../CometChatAvatar';

vi.mock('../useCometChatAvatar', () => ({
  useCometChatAvatar: () => ({ imageLoaded: false, imageError: false }),
}));

function renderRoot(props: Partial<Parameters<typeof CometChatAvatar.Root>[0]> = {}) {
  const defaultProps = {
    name: 'John Doe',
    children: <CometChatAvatar.Initials />,
    ...props,
  };
  return render(<CometChatAvatar.Root {...defaultProps} />);
}

describe('CometChatAvatarRoot', () => {
  it('renders the root container', () => {
    const { container } = renderRoot();
    expect(container.firstElementChild).not.toBeNull();
  });

  it('defaults to medium size', () => {
    const { container } = renderRoot();
    expect(container.firstElementChild).toHaveAttribute('data-size', 'medium');
  });

  it('applies size variant via data-size attribute', () => {
    const { container } = renderRoot({ size: 'large' });
    expect(container.firstElementChild).toHaveAttribute('data-size', 'large');
  });

  it('applies custom className', () => {
    const { container } = renderRoot({ className: 'my-avatar' });
    expect(container.firstElementChild?.className).toContain('my-avatar');
  });

  it('provides context to children (Initials renders)', () => {
    renderRoot({ name: 'Jane Smith' });
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('has role="img" and aria-label with name', () => {
    renderRoot({ name: 'John Doe' });
    const root = screen.getByRole('img');
    expect(root).toHaveAttribute('aria-label', 'John Doe');
  });
});
