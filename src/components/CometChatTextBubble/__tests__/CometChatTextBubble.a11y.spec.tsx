import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatTextBubble } from '../CometChatTextBubble';

expect.extend(toHaveNoViolations);

describe('CometChatTextBubble a11y', () => {
  it('passes axe-core audit for simple text', async () => {
    const { container } = render(<CometChatTextBubble text="Hello world" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with link preview', async () => {
    const mockMessage = {
      getText: () => 'Check https://example.com',
      getMetadata: () => ({
        '@injected': {
          extensions: {
            'link-preview': {
              links: [{ url: 'https://example.com', title: 'Example' }],
            },
          },
        },
      }),
      getMentionedUsers: () => [],
    };

    const { container } = render(
      <CometChatTextBubble text="Check https://example.com" message={mockMessage as any} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('link preview cards have role="article" and aria-label', () => {
    const mockMessage = {
      getText: () => 'Check https://example.com',
      getMetadata: () => ({
        '@injected': {
          extensions: {
            'link-preview': {
              links: [{ url: 'https://example.com', title: 'Example' }],
            },
          },
        },
      }),
      getMentionedUsers: () => [],
    };

    render(<CometChatTextBubble text="Check https://example.com" message={mockMessage as any} />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label');
    expect(article).toHaveAttribute('tabindex', '0');
  });
});
