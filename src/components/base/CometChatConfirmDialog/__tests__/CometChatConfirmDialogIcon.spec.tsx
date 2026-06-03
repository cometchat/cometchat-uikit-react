import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConfirmDialog } from '../CometChatConfirmDialog';

/**
 * Helper: wraps Icon inside Root so context is available.
 */
function renderIcon(
  iconProps: Partial<React.ComponentProps<typeof CometChatConfirmDialog.Icon>> = {},
  rootProps: Partial<React.ComponentProps<typeof CometChatConfirmDialog.Root>> = {}
) {
  return render(
    <CometChatConfirmDialog.Root
      isOpen={true}
      onClose={vi.fn()}
      variant={rootProps.variant ?? 'danger'}
    >
      <CometChatConfirmDialog.Icon {...iconProps} />
    </CometChatConfirmDialog.Root>
  );
}

describe('CometChatConfirmDialogIcon', () => {
  // --- Default icon rendering ---

  it('renders a default icon image when no icon prop is provided', () => {
    renderIcon();
    const img = screen.getByRole('dialog').querySelector('img');
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute('aria-hidden', 'true');
    expect(img).toHaveAttribute('alt', '');
  });

  it('default icon has lazy loading attributes', () => {
    renderIcon();
    const img = screen.getByRole('dialog').querySelector('img');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('width', '36');
    expect(img).toHaveAttribute('height', '36');
  });

  it('default icon is not draggable', () => {
    renderIcon();
    const img = screen.getByRole('dialog').querySelector('img');
    expect(img).toHaveAttribute('draggable', 'false');
  });

  // --- Custom icon ---

  it('renders custom icon when icon prop is provided', () => {
    renderIcon({ icon: <svg data-testid="custom-icon" /> });
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    // Default img should not be present
    const img = screen.getByRole('dialog').querySelector('img');
    expect(img).toBeNull();
  });

  // --- Variant classes ---

  it('applies danger variant class by default', () => {
    const { container } = renderIcon({}, { variant: 'danger' });
    const iconWrapper = container.querySelector('[class*="cometchat-confirm-dialog__icon"]');
    expect(iconWrapper).toBeTruthy();
    // The wrapper should have the variant modifier class
    expect(iconWrapper?.className).toContain('icon--danger');
  });

  it('applies warning variant class', () => {
    const { container } = renderIcon({}, { variant: 'warning' });
    const iconWrapper = container.querySelector('[class*="cometchat-confirm-dialog__icon"]');
    expect(iconWrapper?.className).toContain('icon--warning');
  });

  it('applies info variant class', () => {
    const { container } = renderIcon({}, { variant: 'info' });
    const iconWrapper = container.querySelector('[class*="cometchat-confirm-dialog__icon"]');
    expect(iconWrapper?.className).toContain('icon--info');
  });

  // --- Custom className ---

  it('applies custom className to icon wrapper', () => {
    const { container } = renderIcon({ className: 'my-icon' });
    const iconWrapper = container.querySelector('.my-icon');
    expect(iconWrapper).toBeTruthy();
  });

  // --- displayName ---

  it('has correct displayName', () => {
    expect(CometChatConfirmDialog.Icon.displayName).toBe('CometChatConfirmDialogIcon');
  });
});
