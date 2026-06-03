import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatMessageBubbleWrapper } from '../CometChatMessageBubbleWrapper';

describe('CometChatMessageBubbleWrapper', () => {
  it('renders children', () => {
    render(
      <CometChatMessageBubbleWrapper alignment="left">
        <span data-testid="child">Hello</span>
      </CometChatMessageBubbleWrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies left alignment class', () => {
    const { container } = render(
      <CometChatMessageBubbleWrapper alignment="left">
        <span>Content</span>
      </CometChatMessageBubbleWrapper>
    );
    expect((container.firstChild as HTMLElement).className).toContain('left');
  });

  it('applies right alignment class', () => {
    const { container } = render(
      <CometChatMessageBubbleWrapper alignment="right">
        <span>Content</span>
      </CometChatMessageBubbleWrapper>
    );
    expect((container.firstChild as HTMLElement).className).toContain('right');
  });

  it('applies center alignment class', () => {
    const { container } = render(
      <CometChatMessageBubbleWrapper alignment="center">
        <span>Content</span>
      </CometChatMessageBubbleWrapper>
    );
    expect((container.firstChild as HTMLElement).className).toContain('center');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatMessageBubbleWrapper alignment="left" className="custom-class">
        <span>Content</span>
      </CometChatMessageBubbleWrapper>
    );
    expect((container.firstChild as HTMLElement).className).toContain('custom-class');
  });
});
