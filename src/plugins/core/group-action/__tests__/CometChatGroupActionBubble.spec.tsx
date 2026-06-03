import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatActionBubble } from '../../../../components/CometChatActionBubble';

describe('CometChatActionBubble', () => {
  it('renders the message text', () => {
    render(<CometChatActionBubble messageText="Alice joined the group" />);
    expect(screen.getByText('Alice joined the group')).toBeInTheDocument();
  });

  it('has role="status"', () => {
    render(<CometChatActionBubble messageText="Alice joined" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label matching the message text', () => {
    render(<CometChatActionBubble messageText="Alice joined" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Alice joined');
  });

  it('renders nothing when messageText is empty', () => {
    const { container } = render(<CometChatActionBubble messageText="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when messageText is whitespace only', () => {
    const { container } = render(<CometChatActionBubble messageText="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render icon when iconClassName is not provided', () => {
    const { container } = render(<CometChatActionBubble messageText="Alice joined" />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeNull();
  });

  it('renders icon when iconClassName is provided', () => {
    const { container } = render(
      <CometChatActionBubble
        messageText="Outgoing Call"
        iconClassName="cometchat-action-bubble__icon--outgoing-video"
      />
    );
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('applies error class to icon when iconErrorColor is true', () => {
    const { container } = render(
      <CometChatActionBubble
        messageText="Missed Call"
        iconClassName="cometchat-action-bubble__icon--missed-video"
        iconErrorColor
      />
    );
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon?.className).toContain('error');
  });

  it('applies error class to text when iconErrorColor is true', () => {
    const { container } = render(
      <CometChatActionBubble
        messageText="Missed Call"
        iconClassName="cometchat-action-bubble__icon--missed-video"
        iconErrorColor
      />
    );
    const text = container.querySelector('span');
    expect(text?.className).toContain('error');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatActionBubble messageText="Alice joined" className="custom-class" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('custom-class');
  });
});
