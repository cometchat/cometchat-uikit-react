import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatStickerBubble } from '../CometChatStickerBubble';

describe('CometChatStickerBubble', () => {
  it('renders sticker image', () => {
    render(<CometChatStickerBubble stickerUrl="https://example.com/s.png" variant="incoming" />);
    const img = screen.getByAltText('Sticker');
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
  });

  it('sets aria-label from stickerName', () => {
    render(
      <CometChatStickerBubble
        stickerUrl="https://example.com/s.png"
        stickerName="Cool"
        variant="incoming"
      />
    );
    expect(screen.getByLabelText('Cool')).toBeInTheDocument();
  });

  it('uses default aria-label when stickerName not provided', () => {
    render(<CometChatStickerBubble stickerUrl="https://example.com/s.png" variant="incoming" />);
    expect(screen.getByLabelText('Sticker')).toBeInTheDocument();
  });

  it('does not render img when stickerUrl is empty', () => {
    render(<CometChatStickerBubble stickerUrl="" variant="incoming" />);
    expect(screen.queryByAltText('Sticker')).toBeNull();
  });

  it('applies incoming class', () => {
    const { container } = render(
      <CometChatStickerBubble stickerUrl="https://example.com/s.png" variant="incoming" />
    );
    expect(container.querySelector('[class*="incoming"]')).not.toBeNull();
  });

  it('applies outgoing class', () => {
    const { container } = render(
      <CometChatStickerBubble stickerUrl="https://example.com/s.png" variant="outgoing" />
    );
    expect(container.querySelector('[class*="outgoing"]')).not.toBeNull();
  });

  it('image has lazy loading', () => {
    render(<CometChatStickerBubble stickerUrl="https://example.com/s.png" variant="incoming" />);
    const img = screen.getByAltText('Sticker');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });
});
