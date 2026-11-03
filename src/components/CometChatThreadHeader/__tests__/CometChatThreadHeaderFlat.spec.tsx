/**
 * Unit tests for the flat <CometChatThreadHeader /> API: plain props go to
 * Root's own layout; header, subtitle and bubble views build it from parts.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { part, mocks } = vi.hoisted(() => ({
  part: (name: string) => () => <div data-testid={name} />,
  mocks: { rootProps: undefined as Record<string, unknown> | undefined },
}));

vi.mock('../CometChatThreadHeaderRoot', () => ({
  CometChatThreadHeaderRoot: ({ children, ...props }: { children?: React.ReactNode }) => {
    mocks.rootProps = props;
    return <div data-testid="root">{children ?? 'root default layout'}</div>;
  },
}));
vi.mock('../CometChatThreadHeaderTopBar', () => ({ CometChatThreadHeaderTopBar: part('top-bar') }));
vi.mock('../CometChatThreadHeaderParentBubble', () => ({
  CometChatThreadHeaderParentBubble: part('parent-bubble'),
}));
vi.mock('../CometChatThreadHeaderReplyCount', () => ({
  CometChatThreadHeaderReplyCount: part('reply-count'),
}));

import { CometChatThreadHeader } from '../CometChatThreadHeader';
import { CometChatThreadHeaderRoot } from '../CometChatThreadHeaderRoot';

const parentMessage = { getId: () => 1 } as never;
const childIds = () =>
  Array.from(screen.getByTestId('root').children).map(
    c => c.getAttribute('data-testid') ?? c.textContent
  );

describe('CometChatThreadHeader (flat API)', () => {
  beforeEach(() => {
    mocks.rootProps = undefined;
  });

  it('without view props, lets Root render its own layout and passes the props through', () => {
    const onClose = vi.fn();
    render(<CometChatThreadHeader parentMessage={parentMessage} onClose={onClose} />);
    expect(screen.getByTestId('root')).toHaveTextContent('root default layout');
    expect(mocks.rootProps).toMatchObject({ parentMessage, onClose });
  });

  it('a custom bubble keeps the default top bar and reply count', () => {
    render(
      <CometChatThreadHeader parentMessage={parentMessage} messageBubbleView={<p>bubble</p>} />
    );
    expect(childIds()).toEqual(['top-bar', 'bubble', 'reply-count']);
  });

  it('custom header and subtitle are placed above the default bubble', () => {
    render(
      <CometChatThreadHeader
        parentMessage={parentMessage}
        headerView={<p>header</p>}
        subtitleView={<p>subtitle</p>}
      />
    );
    expect(childIds()).toEqual(['header', 'subtitle', 'parent-bubble', 'reply-count']);
  });

  it('exposes the compound parts', () => {
    expect(CometChatThreadHeader.Root).toBe(CometChatThreadHeaderRoot);
    for (const name of [
      'TopBar',
      'Title',
      'SenderName',
      'CloseButton',
      'SubscriptionToggle',
      'ParentBubble',
      'ReplyCount',
    ] as const) {
      expect(CometChatThreadHeader[name]).toBeDefined();
    }
  });
});
