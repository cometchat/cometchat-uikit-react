import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mock Root + sub-components as simple, identifiable elements ──────────────
// The flat component delegates to Root (passing rootProps) and renders default
// sub-components when convenience props are supplied. We mock each so we can
// assert delegation/composition without pulling in the full SDK stack.

vi.mock('../CometChatMessageHeaderRoot', () => ({
  CometChatMessageHeaderRoot: vi.fn(
    ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div data-testid="root" data-props={JSON.stringify(Object.keys(props))}>
        {children}
      </div>
    )
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
      const call = vi.mocked(CometChatMessageHeaderRoot).mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(call.user).toBe(user);
      expect(call.hideBackButton).toBe(true);
      expect(call.children).toBeUndefined();
    });

    it('works for a group conversation', () => {
      render(<CometChatMessageHeader group={group} />);
      const call = vi.mocked(CometChatMessageHeaderRoot).mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(call.group).toBe(group);
    });
  });

  describe('convenience props → composes default layout', () => {
    it('renders default Avatar/Title/Subtitle/CallButtons/OverflowMenu when only subtitleView is set', () => {
      render(<CometChatMessageHeader user={user} subtitleView={<span>custom-sub</span>} />);
      expect(screen.getByTestId('root')).toBeInTheDocument();
      // back button shown (hideBackButton not set)
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
      // leadingView not set → default avatar
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      // titleView not set → default title
      expect(screen.getByTestId('title')).toBeInTheDocument();
      // subtitleView provided → custom, no default subtitle
      expect(screen.getByText('custom-sub')).toBeInTheDocument();
      expect(screen.queryByTestId('subtitle')).not.toBeInTheDocument();
      // trailingView not set → call buttons + overflow menu
      expect(screen.getByTestId('call-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('overflow-menu')).toBeInTheDocument();
    });

    it('renders leadingView/titleView when provided instead of defaults', () => {
      render(
        <CometChatMessageHeader
          user={user}
          leadingView={<span>lead</span>}
          titleView={<span>head</span>}
        />
      );
      expect(screen.getByText('lead')).toBeInTheDocument();
      expect(screen.getByText('head')).toBeInTheDocument();
      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('title')).not.toBeInTheDocument();
      // subtitle default still rendered (subtitleView not set)
      expect(screen.getByTestId('subtitle')).toBeInTheDocument();
    });

    it('omits back button when hideBackButton is true (with convenience props)', () => {
      render(<CometChatMessageHeader user={user} hideBackButton titleView={<span>t</span>} />);
      expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
    });

    it('renders trailingView instead of call buttons/overflow when provided', () => {
      render(
        <CometChatMessageHeader
          user={user}
          titleView={<span>t</span>}
          trailingView={<span>trail</span>}
        />
      );
      expect(screen.getByText('trail')).toBeInTheDocument();
      expect(screen.queryByTestId('call-buttons')).not.toBeInTheDocument();
      expect(screen.queryByTestId('overflow-menu')).not.toBeInTheDocument();
    });

    it('wraps auxiliaryButtonView in AuxiliaryButtons instead of overflow menu', () => {
      render(<CometChatMessageHeader user={user} auxiliaryButtonView={<button>aux</button>} />);
      expect(screen.getByTestId('aux-buttons')).toBeInTheDocument();
      expect(screen.getByText('aux')).toBeInTheDocument();
      expect(screen.queryByTestId('overflow-menu')).not.toBeInTheDocument();
    });

    it('hides call buttons when both voice and video are hidden', () => {
      render(
        <CometChatMessageHeader
          user={user}
          titleView={<span>t</span>}
          hideVoiceCallButton
          hideVideoCallButton
        />
      );
      expect(screen.queryByTestId('call-buttons')).not.toBeInTheDocument();
    });

    it('keeps call buttons when only one of voice/video is hidden', () => {
      render(<CometChatMessageHeader user={user} titleView={<span>t</span>} hideVoiceCallButton />);
      expect(screen.getByTestId('call-buttons')).toBeInTheDocument();
    });
  });
});
