import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatThreadView } from '../CometChatThreadView';

describe('CometChatThreadViewIcon', () => {
  it('renders the default reply icon', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.Icon />
      </CometChatThreadView.Root>
    );
    const icon = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('renders a custom icon when iconURL is provided', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.Icon iconURL="https://example.com/icon.svg" />
      </CometChatThreadView.Root>
    );
    const icon = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect((icon as HTMLElement).style.backgroundImage).toContain('https://example.com/icon.svg');
  });

  it('applies custom className', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.Icon className="custom-icon" />
      </CometChatThreadView.Root>
    );
    const icon = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect((icon as HTMLElement).className).toContain('custom-icon');
  });

  it('icon has aria-hidden="true" (decorative)', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.Icon />
      </CometChatThreadView.Root>
    );
    const icon = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
