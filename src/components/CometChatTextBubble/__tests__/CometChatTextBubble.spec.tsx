import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatTextBubble } from '../CometChatTextBubble';
import { CometChatUrlFormatter } from '../../../formatters/CometChatUrlFormatter';
import { CometChatMarkdownFormatter } from '../../../formatters/CometChatMarkdownFormatter';

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

  it('previews only the link target, not a label that is also an address', () => {
    // The extension scans the raw text, so it reports both addresses. Only the
    // one the link opens describes where the reader is going.
    const drive = 'https://drive.google.com/file/d/1g3Xz3EficX_lDKh/view?usp=drive_link';
    const text = `[www.google.com](${drive})`;
    const mockMessage = {
      getText: () => text,
      getMetadata: () => ({
        '@injected': {
          extensions: {
            'link-preview': {
              links: [
                { url: 'https://www.google.com', title: 'Google' },
                { url: drive, title: 'Shared file' },
              ],
            },
          },
        },
      }),
      getMentionedUsers: () => [],
    };

    const { container } = render(<CometChatTextBubble text={text} message={mockMessage as any} />);

    expect(container.querySelectorAll('[class*="link-preview"][role="article"]')).toHaveLength(1);
    expect(screen.getByText('Shared file')).toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });

  it('previews only the link target when the message is stored as an HTML anchor', () => {
    // The bubble converts anchors to markdown before formatting, so a message
    // can reach it in either form. The previews must not differ because of it.
    const drive = 'https://drive.google.com/file/d/1g3Xz3EficX_lDKh/view?usp=drive_link';
    const text = `<a href="${drive}" target="_blank">www.google.com</a>`;
    const mockMessage = {
      getText: () => text,
      getMetadata: () => ({
        '@injected': {
          extensions: {
            'link-preview': {
              links: [
                { url: 'https://www.google.com', title: 'Google' },
                { url: drive, title: 'Shared file' },
              ],
            },
          },
        },
      }),
      getMentionedUsers: () => [],
    };

    render(<CometChatTextBubble message={mockMessage as any} />);

    expect(screen.getByText('Shared file')).toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });

  it('keeps the preview for a pasted link whose label is its own target', () => {
    const drive = 'https://drive.google.com/file/d/1g3Xz3EficX_lDKh/view?usp=drive_link';
    const text = `[${drive}](${drive})`;
    const mockMessage = {
      getText: () => text,
      getMetadata: () => ({
        '@injected': {
          extensions: {
            'link-preview': { links: [{ url: drive, title: 'Shared file' }] },
          },
        },
      }),
      getMentionedUsers: () => [],
    };

    render(<CometChatTextBubble text={text} message={mockMessage as any} />);
    expect(screen.getByText('Shared file')).toBeInTheDocument();
  });

  // The address renders as unclickable monospace, so a card for it would
  // advertise a destination the message does not go to.
  it('shows no preview card for a URL written as inline code', () => {
    const text = '`https://google.com`';
    const mockMessage = {
      getText: () => text,
      getMetadata: () => ({
        '@injected': {
          extensions: {
            'link-preview': {
              links: [{ url: 'https://google.com', title: 'Google' }],
            },
          },
        },
      }),
      getMentionedUsers: () => [],
    };

    // The formatters the text plugin supplies in the app, so the bubble renders
    // the code span rather than the raw backticks.
    const { container } = render(
      <CometChatTextBubble
        message={mockMessage as any}
        textFormatters={[new CometChatMarkdownFormatter(), new CometChatUrlFormatter()]}
      />
    );

    expect(container.querySelectorAll('[class*="link-preview"]')).toHaveLength(0);
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
    // The code itself still renders, and still is not a link.
    expect(container.querySelector('code')).toBeTruthy();
    expect(container.querySelectorAll('a')).toHaveLength(0);
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
    expect(screen.getByText('Translated Message')).toBeInTheDocument();
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
