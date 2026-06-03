import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatCollaborativeBubble } from '../CometChatCollaborativeBubble';

describe('CometChatCollaborativeBubble', () => {
  it('renders title, subtitle, and button', () => {
    render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="incoming"
        title="Doc"
        subtitle="Edit together"
        buttonText="Open"
      />
    );
    expect(screen.getByText('Doc')).toBeInTheDocument();
    expect(screen.getByText('Edit together')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('button is enabled when URL is provided', () => {
    render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="incoming"
        title="T"
        subtitle="S"
        buttonText="Open"
      />
    );
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('button is disabled when URL is empty', () => {
    render(
      <CometChatCollaborativeBubble
        url=""
        variant="incoming"
        title="T"
        subtitle="S"
        buttonText="Open"
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('button is disabled when disabled prop is true', () => {
    render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="incoming"
        title="T"
        subtitle="S"
        buttonText="Open"
        disabled
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onButtonClick with URL when button clicked', () => {
    const onClick = vi.fn();
    render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="incoming"
        title="T"
        subtitle="S"
        buttonText="Open"
        onButtonClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('https://example.com');
  });

  it('renders banner image when provided', () => {
    const { container } = render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="incoming"
        title="T"
        subtitle="S"
        buttonText="Open"
        bannerImageUrl="https://example.com/banner.png"
      />
    );
    const img = container.querySelector('img[src="https://example.com/banner.png"]');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://example.com/banner.png');
  });

  it('applies incoming class', () => {
    const { container } = render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="incoming"
        title="T"
        subtitle="S"
        buttonText="Open"
      />
    );
    expect(container.querySelector('[class*="incoming"]')).not.toBeNull();
  });

  it('applies outgoing class', () => {
    const { container } = render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="outgoing"
        title="T"
        subtitle="S"
        buttonText="Open"
      />
    );
    expect(container.querySelector('[class*="outgoing"]')).not.toBeNull();
  });

  it('button has aria-label', () => {
    render(
      <CometChatCollaborativeBubble
        url="https://example.com"
        variant="incoming"
        title="T"
        subtitle="S"
        buttonText="Open Doc"
      />
    );
    expect(screen.getByLabelText('Open Doc')).toBeInTheDocument();
  });
});
