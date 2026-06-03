import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatTextBubble } from '../CometChatTextBubble';
import { CometChatUrlFormatter } from '../../../../formatters/CometChatUrlFormatter';

describe('CometChatTextBubble', () => {
  it('renders text content', () => {
    render(<CometChatTextBubble text="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies outgoing styling when isSentByMe is true', () => {
    const { container } = render(<CometChatTextBubble text="Hello" isSentByMe={true} />);
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('applies incoming styling when isSentByMe is false', () => {
    const { container } = render(<CometChatTextBubble text="Hello" isSentByMe={false} />);
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('detects single emoji and applies large font class', () => {
    const { container } = render(<CometChatTextBubble text="👍" />);
    expect(container.querySelector('[class*="single-emoji"]')).toBeTruthy();
  });

  it('does not apply emoji class for text with emoji', () => {
    const { container } = render(<CometChatTextBubble text="Hello 👍" />);
    expect(container.querySelector('[class*="single-emoji"]')).toBeNull();
  });

  it('applies formatters to text content', () => {
    const urlFormatter = new CometChatUrlFormatter();
    const { container } = render(
      <CometChatTextBubble text="Visit https://example.com" textFormatters={[urlFormatter]} />
    );
    const link = container.querySelector('.cometchat-link');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com');
  });

  it('renders link preview cards from message metadata', () => {
    const mockMessage = {
      getText: () => 'Check https://example.com',
      getMetadata: () => ({
        '@injected': {
          extensions: {
            'link-preview': {
              links: [
                {
                  url: 'https://example.com',
                  title: 'Example',
                  description: 'An example site',
                },
              ],
            },
          },
        },
      }),
      getMentionedUsers: () => [],
    };

    const { container } = render(
      <CometChatTextBubble text="Check https://example.com" message={mockMessage as any} />
    );
    expect(container.querySelector('[role="article"]')).toBeTruthy();
    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  it('renders translation with separator', () => {
    const mockMessage = {
      getText: () => 'Bonjour',
      getMetadata: () => ({ translated_message: 'Hello' }),
      getMentionedUsers: () => [],
    };

    const { container } = render(
      <CometChatTextBubble text="Bonjour" message={mockMessage as any} />
    );
    // Without a LocaleProvider, useLocale().getLocalizedString() returns the key itself
    expect(screen.getByText('message_translation_label')).toBeInTheDocument();
    expect(container.querySelector('[class*="translation-separator"]')).toBeTruthy();
  });

  it('sanitizes HTML output (XSS prevention)', () => {
    const { container } = render(<CometChatTextBubble text='<script>alert("xss")</script>Hello' />);
    expect(container.innerHTML).not.toContain('<script>');
    // The escaped text should be visible
    expect(container.textContent).toContain('Hello');
  });

  it('applies custom className', () => {
    const { container } = render(<CometChatTextBubble text="Hello" className="my-custom" />);
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  it('defaults isSentByMe to true', () => {
    const { container } = render(<CometChatTextBubble text="Hello" />);
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('renders without formatters', () => {
    render(<CometChatTextBubble text="Plain text" />);
    expect(screen.getByText('Plain text')).toBeInTheDocument();
  });

  it('handles empty text', () => {
    const { container } = render(<CometChatTextBubble text="" />);
    expect(container.querySelector('[class*="cometchat-text-bubble"]')).toBeTruthy();
  });
});
