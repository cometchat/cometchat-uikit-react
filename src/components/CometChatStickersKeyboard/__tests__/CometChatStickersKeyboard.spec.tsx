import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatStickersKeyboard } from '../CometChatStickersKeyboard';
import type { CometChatStickerSet } from '../CometChatStickersKeyboard.types';

const mockData: CometChatStickerSet = {
  'Set A': [
    { stickerUrl: 'https://example.com/a1.png', stickerSetName: 'Set A', stickerOrder: 1 },
    { stickerUrl: 'https://example.com/a2.png', stickerSetName: 'Set A', stickerOrder: 2 },
  ],
  'Set B': [{ stickerUrl: 'https://example.com/b1.png', stickerSetName: 'Set B', stickerOrder: 1 }],
};

describe('CometChatStickersKeyboard', () => {
  it('renders with pre-loaded data', () => {
    render(<CometChatStickersKeyboard stickerData={mockData} onStickerClick={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').length).toBe(2);
  });

  it('renders sticker grid cells', () => {
    render(<CometChatStickersKeyboard stickerData={mockData} onStickerClick={() => {}} />);
    expect(screen.getAllByRole('gridcell').length).toBe(2); // Set A has 2 stickers
  });

  it('switching tab changes grid content', () => {
    render(<CometChatStickersKeyboard stickerData={mockData} onStickerClick={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]!); // Click Set B
    expect(screen.getAllByRole('gridcell').length).toBe(1); // Set B has 1 sticker
  });

  it('calls onStickerClick when sticker is clicked', () => {
    const onClick = vi.fn();
    render(<CometChatStickersKeyboard stickerData={mockData} onStickerClick={onClick} />);
    fireEvent.click(screen.getAllByRole('gridcell')[0]!);
    expect(onClick).toHaveBeenCalledWith({
      stickerUrl: 'https://example.com/a1.png',
      stickerName: 'Set A',
    });
  });

  it('renders loading state', () => {
    render(<CometChatStickersKeyboard initialState="loading" onStickerClick={() => {}} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    render(<CometChatStickersKeyboard initialState="error" onStickerClick={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Looks like something went wrong')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<CometChatStickersKeyboard initialState="empty" onStickerClick={() => {}} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('active tab has aria-selected=true', () => {
    render(<CometChatStickersKeyboard stickerData={mockData} onStickerClick={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  describe('fetching sticker sets', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('fetches sticker sets when none are passed and activates the first set', async () => {
      vi.spyOn(CometChat, 'callExtension').mockResolvedValue({
        data: {
          defaultStickers: [
            { stickerSetName: 'Fetched A', stickerUrl: 'https://example.com/fa.png', stickerOrder: 1 },
          ],
          customStickers: [
            { stickerSetName: 'Fetched B', stickerUrl: 'https://example.com/fb.png', stickerOrder: 1 },
          ],
        },
      });
      render(<CometChatStickersKeyboard onStickerClick={() => {}} />);

      const tabs = await screen.findAllByRole('tab');
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('keyboard selection of a category tab', () => {
    it.each(['Enter', ' '])('"%s" on a tab selects that category', key => {
      render(<CometChatStickersKeyboard stickerData={mockData} onStickerClick={() => {}} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

      fireEvent.keyDown(tabs[1]!, { key });

      expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'false');
    });
  });
});
