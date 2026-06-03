import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatAvatarStatusIndicator } from '../CometChatAvatarStatusIndicator';

function renderIndicator(status: 'online' | 'offline', className?: string) {
  return render(<CometChatAvatarStatusIndicator status={status} className={className} />);
}

describe('CometChatAvatarStatusIndicator', () => {
  it('renders with data-status="online" when status is online', () => {
    const { container } = renderIndicator('online');
    expect(container.firstElementChild).toHaveAttribute('data-status', 'online');
  });

  it('renders with data-status="offline" when status is offline', () => {
    const { container } = renderIndicator('offline');
    expect(container.firstElementChild).toHaveAttribute('data-status', 'offline');
  });

  it('has aria-label "Online" for online status', () => {
    const { container } = renderIndicator('online');
    expect(container.firstElementChild).toHaveAttribute('aria-label', 'Online');
  });

  it('has aria-label "Offline" for offline status', () => {
    const { container } = renderIndicator('offline');
    expect(container.firstElementChild).toHaveAttribute('aria-label', 'Offline');
  });

  it('applies custom className', () => {
    const { container } = renderIndicator('online', 'status-extra');
    expect(container.firstElementChild?.className).toContain('status-extra');
  });
});
