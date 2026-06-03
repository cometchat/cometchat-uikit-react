import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatActionSheet } from '../CometChatActionSheet';
import type { CometChatActionSheetItemData } from '../CometChatActionSheet.types';

/** Helper: wraps Item inside Root so context is available. */
function renderItem(
  item: CometChatActionSheetItemData,
  opts: { layoutMode?: 'list' | 'grid'; className?: string } = {}
) {
  return render(
    <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()} layoutMode={opts.layoutMode}>
      <CometChatActionSheet.Layout mode={opts.layoutMode}>
        <CometChatActionSheet.Item item={item} className={opts.className} />
      </CometChatActionSheet.Layout>
    </CometChatActionSheet.Root>
  );
}

describe('CometChatActionSheetItem', () => {
  it('renders item title and icon', () => {
    renderItem({
      id: '1',
      title: 'Photo',
      icon: <svg data-testid="icon" />,
      onClick: vi.fn(),
    });
    expect(screen.getByText('Photo')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    renderItem({
      id: '1',
      title: 'Photo',
      subtitle: 'Take a photo',
      onClick: vi.fn(),
    });
    expect(screen.getByText('Take a photo')).toBeInTheDocument();
  });

  it('calls item.onClick when clicked', () => {
    const onClick = vi.fn();
    renderItem({ id: '1', title: 'Photo', onClick });
    fireEvent.click(screen.getByRole('button', { name: /photo/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled is true', () => {
    const onClick = vi.fn();
    renderItem({ id: '1', title: 'Photo', onClick, disabled: true });
    fireEvent.click(screen.getByRole('button', { name: /photo/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies aria-disabled="true" when disabled', () => {
    renderItem({ id: '1', title: 'Photo', onClick: vi.fn(), disabled: true });
    expect(screen.getByRole('button', { name: /photo/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders as a <button> element', () => {
    renderItem({ id: '1', title: 'Photo', onClick: vi.fn() });
    const btn = screen.getByRole('button', { name: /photo/i });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('applies custom className', () => {
    renderItem({ id: '1', title: 'Photo', onClick: vi.fn() }, { className: 'extra' });
    const btn = screen.getByRole('button', { name: /photo/i });
    expect(btn.className).toContain('extra');
  });
});
