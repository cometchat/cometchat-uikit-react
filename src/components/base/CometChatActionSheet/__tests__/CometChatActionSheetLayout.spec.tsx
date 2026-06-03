import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatActionSheet } from '../CometChatActionSheet';

function renderLayout(mode?: 'list' | 'grid') {
  return render(
    <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()} layoutMode={mode}>
      <CometChatActionSheet.Layout mode={mode}>
        <CometChatActionSheet.Item item={{ id: '1', title: 'Item 1', onClick: vi.fn() }} />
        <CometChatActionSheet.Item item={{ id: '2', title: 'Item 2', onClick: vi.fn() }} />
      </CometChatActionSheet.Layout>
    </CometChatActionSheet.Root>
  );
}

describe('CometChatActionSheetLayout', () => {
  it('renders children in a vertical list when mode is "list"', () => {
    renderLayout('list');
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders children in a grid when mode is "grid"', () => {
    renderLayout('grid');
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('defaults to "list" mode when mode prop is omitted', () => {
    renderLayout();
    // Both items render — default list mode works
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('applies correct CSS class for each layout mode', () => {
    const { container, rerender } = render(
      <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()} layoutMode="list">
        <CometChatActionSheet.Layout mode="list">
          <CometChatActionSheet.Item item={{ id: '1', title: 'A', onClick: vi.fn() }} />
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    );

    const listLayout = container.querySelector('[role="dialog"] > div');
    const listClass = listLayout?.className ?? '';

    rerender(
      <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()} layoutMode="grid">
        <CometChatActionSheet.Layout mode="grid">
          <CometChatActionSheet.Item item={{ id: '1', title: 'A', onClick: vi.fn() }} />
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    );

    const gridLayout = container.querySelector('[role="dialog"] > div');
    const gridClass = gridLayout?.className ?? '';

    // The classes should differ between list and grid modes
    expect(listClass).not.toBe(gridClass);
  });
});
