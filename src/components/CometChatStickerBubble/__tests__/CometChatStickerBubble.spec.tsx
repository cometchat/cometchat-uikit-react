import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatStickerBubble } from '../CometChatStickerBubble';

// Mock useLoggedInUser — returns a user whose uid matches `me` by default, so
// alignment defaulting (sender vs logged-in user) is deterministic in tests.
vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => ({ getUid: () => 'me', getName: () => 'Me', getAvatar: () => '' }),
}));

interface MockStickerOptions {
  url?: string;
  name?: string;
  senderUid?: string;
}

function mockStickerMessage(overrides: MockStickerOptions = {}) {
  const { url = 'https://example.com/s.png', name, senderUid = 'other' } = overrides;
  return {
    getId: () => 1,
    getType: () => 'extension_sticker',
    getCategory: () => 'custom',
    getSender: () => ({ getUid: () => senderUid }),
    getMetadata: () => (url ? { sticker_url: url } : {}),
    getCustomData: () => (name ? { sticker_name: name } : {}),
    getDeletedAt: () => null,
  } as never;
}

describe('CometChatStickerBubble', () => {
  it('extracts and renders the sticker image from the message', () => {
    render(<CometChatStickerBubble message={mockStickerMessage()} />);
    const img = screen.getByAltText('Sticker');
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', 'https://example.com/s.png');
  });

  it('sets aria-label from the extracted sticker name', () => {
    render(<CometChatStickerBubble message={mockStickerMessage({ name: 'Cool' })} />);
    expect(screen.getByLabelText('Cool')).toBeInTheDocument();
  });

  it('uses default aria-label when no sticker name is present', () => {
    render(<CometChatStickerBubble message={mockStickerMessage()} />);
    expect(screen.getByLabelText('Sticker')).toBeInTheDocument();
  });

  it('does not render img when no sticker URL can be extracted', () => {
    render(<CometChatStickerBubble message={mockStickerMessage({ url: '' })} />);
    expect(screen.queryByAltText('Sticker')).toBeNull();
  });

  it('defaults to incoming alignment for messages from other users', () => {
    const { container } = render(
      <CometChatStickerBubble message={mockStickerMessage({ senderUid: 'other' })} />
    );
    expect(container.querySelector('[class*="incoming"]')).not.toBeNull();
  });

  it('defaults to outgoing alignment for messages from the logged-in user', () => {
    const { container } = render(
      <CometChatStickerBubble message={mockStickerMessage({ senderUid: 'me' })} />
    );
    expect(container.querySelector('[class*="outgoing"]')).not.toBeNull();
  });

  it('applies incoming class when alignment="left"', () => {
    const { container } = render(
      <CometChatStickerBubble message={mockStickerMessage({ senderUid: 'me' })} alignment="left" />
    );
    expect(container.querySelector('[class*="incoming"]')).not.toBeNull();
  });

  it('applies outgoing class when alignment="right"', () => {
    const { container } = render(
      <CometChatStickerBubble
        message={mockStickerMessage({ senderUid: 'other' })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="outgoing"]')).not.toBeNull();
  });

  it('forwards a custom className', () => {
    const { container } = render(
      <CometChatStickerBubble message={mockStickerMessage()} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });

  it('image has lazy loading and async decoding', () => {
    render(<CometChatStickerBubble message={mockStickerMessage()} />);
    const img = screen.getByAltText('Sticker');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });
});
