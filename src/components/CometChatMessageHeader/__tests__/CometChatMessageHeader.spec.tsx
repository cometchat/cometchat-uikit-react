import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mock Root + sub-components as simple, identifiable elements ──────────────
// The flat component delegates to Root (passing rootProps), and hands its view
// props to Root's layout through the views context. We mock each so we can
// assert delegation without pulling in the full SDK stack; the layout itself is
// covered against the real Root in CometChatMessageHeader.props.spec.tsx.

vi.mock('../CometChatMessageHeaderRoot', () => ({
  CometChatMessageHeaderRoot: vi.fn(
    ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => {
      const views = React.useContext(CometChatMessageHeaderViewsContext);
      return (
        <div data-testid="root" data-props={JSON.stringify(Object.keys(props))}>
          {children}
          {Object.entries(views).map(([name, view]) => (
            <React.Fragment key={name}>{view}</React.Fragment>
          ))}
        </div>
      );
    }
  ),
}));

vi.mock('../CometChatMessageHeaderBackButton', () => ({
  CometChatMessageHeaderBackButton: () => <div data-testid="back-button" />,
}));
vi.mock('../CometChatMessageHeaderAvatar', () => ({
  CometChatMessageHeaderAvatar: () => <div data-testid="avatar" />,
}));
vi.mock('../CometChatMessageHeaderTitle', () => ({
  CometChatMessageHeaderTitle: () => <div data-testid="title" />,
}));
vi.mock('../CometChatMessageHeaderSubtitle', () => ({
  CometChatMessageHeaderSubtitle: () => <div data-testid="subtitle" />,
}));
vi.mock('../CometChatMessageHeaderCallButtons', () => ({
  CometChatMessageHeaderCallButtons: () => <div data-testid="call-buttons" />,
}));
vi.mock('../CometChatMessageHeaderSearchButton', () => ({
  CometChatMessageHeaderSearchButton: () => <div data-testid="search-button" />,
}));
vi.mock('../CometChatMessageHeaderSummaryButton', () => ({
  CometChatMessageHeaderSummaryButton: () => <div data-testid="summary-button" />,
}));
vi.mock('../CometChatMessageHeaderOverflowMenu', () => ({
  CometChatMessageHeaderOverflowMenu: () => <div data-testid="overflow-menu" />,
}));
vi.mock('../CometChatMessageHeaderAuxiliaryButtons', () => ({
  CometChatMessageHeaderAuxiliaryButtons: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="aux-buttons">{children}</div>
  ),
}));

import { CometChatMessageHeader } from '../CometChatMessageHeader';
import { CometChatMessageHeaderRoot } from '../CometChatMessageHeaderRoot';
import { CometChatMessageHeaderBackButton } from '../CometChatMessageHeaderBackButton';
import { CometChatMessageHeaderAvatar } from '../CometChatMessageHeaderAvatar';
import { CometChatMessageHeaderTitle } from '../CometChatMessageHeaderTitle';
import { CometChatMessageHeaderSubtitle } from '../CometChatMessageHeaderSubtitle';
import { CometChatMessageHeaderCallButtons } from '../CometChatMessageHeaderCallButtons';
import { CometChatMessageHeaderSearchButton } from '../CometChatMessageHeaderSearchButton';
import { CometChatMessageHeaderSummaryButton } from '../CometChatMessageHeaderSummaryButton';
import { CometChatMessageHeaderOverflowMenu } from '../CometChatMessageHeaderOverflowMenu';
import { CometChatMessageHeaderAuxiliaryButtons } from '../CometChatMessageHeaderAuxiliaryButtons';
import { CometChatMessageHeaderViewsContext } from '../CometChatMessageHeader.context';
import { buildUser, buildGroup } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const user = buildUser({ name: 'John Doe' }) as unknown as CometChat.User;
const group = buildGroup({ name: 'Design Team' }) as unknown as CometChat.Group;

describe('CometChatMessageHeader (flat)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compound API surface', () => {
    it('exposes Root and all sub-components on the function object', () => {
      expect(CometChatMessageHeader.Root).toBe(CometChatMessageHeaderRoot);
      expect(CometChatMessageHeader.BackButton).toBe(CometChatMessageHeaderBackButton);
      expect(CometChatMessageHeader.Avatar).toBe(CometChatMessageHeaderAvatar);
      expect(CometChatMessageHeader.Title).toBe(CometChatMessageHeaderTitle);
      expect(CometChatMessageHeader.Subtitle).toBe(CometChatMessageHeaderSubtitle);
      expect(CometChatMessageHeader.CallButtons).toBe(CometChatMessageHeaderCallButtons);
      expect(CometChatMessageHeader.SearchButton).toBe(CometChatMessageHeaderSearchButton);
      expect(CometChatMessageHeader.SummaryButton).toBe(CometChatMessageHeaderSummaryButton);
      expect(CometChatMessageHeader.OverflowMenu).toBe(CometChatMessageHeaderOverflowMenu);
      expect(CometChatMessageHeader.AuxiliaryButtons).toBe(CometChatMessageHeaderAuxiliaryButtons);
    });

    it('has the expected displayName', () => {
      expect(CometChatMessageHeader.displayName).toBe('CometChatMessageHeader');
    });
  });

  describe('no convenience props → delegates to Root with no children', () => {
    it('renders Root and forwards root props', () => {
      render(<CometChatMessageHeader user={user} hideBackButton />);
      expect(screen.getByTestId('root')).toBeInTheDocument();
      // No default sub-components are rendered as children in this path.
      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('title')).not.toBeInTheDocument();
      // Root received props (user + hideBackButton).
      const call = vi.mocked(CometChatMessageHeaderRoot).mock.calls[0]![0] as Record<
        string,
        unknown
      >;
      expect(call.user).toBe(user);
      expect(call.hideBackButton).toBe(true);
      expect(call.children).toBeUndefined();
    });

    it('works for a group conversation', () => {
      render(<CometChatMessageHeader group={group} />);
      const call = vi.mocked(CometChatMessageHeaderRoot).mock.calls[0]![0] as Record<
        string,
        unknown
      >;
      expect(call.group).toBe(group);
    });
  });

  describe('view props → handed to Root\'s own layout', () => {
    it('reach Root through the views context, with the root props and no children', () => {
      render(
        <CometChatMessageHeader
          user={user}
          hideBackButton
          leadingView={<span>lead</span>}
          titleView={<span>head</span>}
          subtitleView={<span>sub</span>}
          trailingView={<span>trail</span>}
          auxiliaryButtonView={<span>aux</span>}
        />
      );
      for (const text of ['lead', 'head', 'sub', 'trail', 'aux']) {
        expect(screen.getByText(text)).toBeInTheDocument();
      }
      const call = vi.mocked(CometChatMessageHeaderRoot).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(call.user).toBe(user);
      expect(call.hideBackButton).toBe(true);
      expect(call.children).toBeUndefined();
      expect(call).not.toHaveProperty('titleView');
    });
  });
});
