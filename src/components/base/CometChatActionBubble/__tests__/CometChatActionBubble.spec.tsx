import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatActionBubble } from '../CometChatActionBubble';

describe('CometChatActionBubble', () => {
  it('renders the message text', () => {
    render(<CometChatActionBubble messageText="Alice joined the group" />);
    expect(screen.getByText('Alice joined the group')).toBeInTheDocument();
  });

  it('renders nothing when messageText is empty', () => {
    const { container } = render(<CometChatActionBubble messageText="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when messageText is only whitespace', () => {
    const { container } = render(<CometChatActionBubble messageText="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('has role="status"', () => {
    render(<CometChatActionBubble messageText="Call ended" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('sets aria-label to the messageText', () => {
    render(<CometChatActionBubble messageText="Missed call" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Missed call');
  });

  it('renders icon when iconClassName is provided', () => {
    const { container } = render(
      <CometChatActionBubble messageText="Call" iconClassName="my-icon-class" />
    );
    const icon = container.querySelector('.cometchat-action-bubble__icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('my-icon-class');
  });

  it('does not render icon when iconClassName is not provided', () => {
    const { container } = render(<CometChatActionBubble messageText="Call" />);
    expect(container.querySelector('.cometchat-action-bubble__icon')).toBeNull();
  });

  it('icon has aria-hidden="true"', () => {
    const { container } = render(<CometChatActionBubble messageText="Call" iconClassName="ic" />);
    expect(container.querySelector('.cometchat-action-bubble__icon')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('applies error color class to icon when iconErrorColor is true', () => {
    const { container } = render(
      <CometChatActionBubble messageText="Error" iconClassName="ic" iconErrorColor={true} />
    );
    expect(container.querySelector('.cometchat-action-bubble__icon')).toHaveClass(
      'cometchat-action-bubble__icon--error'
    );
  });

  it('applies error color class to text when iconErrorColor is true', () => {
    const { container } = render(
      <CometChatActionBubble messageText="Error" iconErrorColor={true} />
    );
    expect(container.querySelector('.cometchat-action-bubble__text')).toHaveClass(
      'cometchat-action-bubble__text--error'
    );
  });

  it('does not apply error class when iconErrorColor is false', () => {
    const { container } = render(
      <CometChatActionBubble messageText="Ok" iconClassName="ic" iconErrorColor={false} />
    );
    expect(container.querySelector('.cometchat-action-bubble__icon')).not.toHaveClass(
      'cometchat-action-bubble__icon--error'
    );
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatActionBubble messageText="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('always includes the base class', () => {
    const { container } = render(<CometChatActionBubble messageText="Test" />);
    expect(container.firstChild).toHaveClass('cometchat-action-bubble');
  });
});
