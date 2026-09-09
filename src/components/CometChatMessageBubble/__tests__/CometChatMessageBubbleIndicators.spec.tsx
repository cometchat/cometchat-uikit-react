/**
 * Pin / Save indicators in the bubble meta row.
 *
 * The rendering contract: `saved • pinned • timestamp`. Each present glyph is
 * followed by a bullet, so the glyphs are separated from each other as well as
 * from the timestamp. No bullet at all when neither glyph is present.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        accessibility_message_pinned: 'Pinned',
        accessibility_message_saved: 'Saved',
        message_list_action_edited: '(edited)',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

function mockMessage(
  state: { pinnedAt?: number; savedAt?: number; editedAt?: number } = {}
): CometChat.BaseMessage {
  return {
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => 'user1',
      getName: () => 'John',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getSentAt: () => 1000,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => state.editedAt ?? 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => 'muid-1',
    getPinnedAt: () => state.pinnedAt,
    getSavedAt: () => state.savedAt,
    isPinned: () => state.pinnedAt !== undefined,
    isSaved: () => state.savedAt !== undefined,
  } as unknown as CometChat.BaseMessage;
}

function renderBubble(state: Parameters<typeof mockMessage>[0] = {}) {
  return render(
    <CometChatMessageBubble
      message={mockMessage(state)}
      alignment="left"
      contentView={<span>Hello</span>}
    />
  );
}

function separators(container: HTMLElement) {
  return container.querySelectorAll('.cometchat-message-bubble__status-info-view-separator');
}

describe('bubble pin/save indicators', () => {
  it('shows neither glyph on an ordinary message', () => {
    const { container } = renderBubble();
    expect(screen.queryByLabelText('Pinned')).toBeNull();
    expect(screen.queryByLabelText('Saved')).toBeNull();
    expect(separators(container)).toHaveLength(0);
  });

  it('shows the pin glyph when pinned', () => {
    renderBubble({ pinnedAt: 1735689600 });
    expect(screen.getByLabelText('Pinned')).toBeInTheDocument();
    expect(screen.queryByLabelText('Saved')).toBeNull();
  });

  it('shows the save glyph when saved', () => {
    renderBubble({ savedAt: 1735689600 });
    expect(screen.getByLabelText('Saved')).toBeInTheDocument();
    expect(screen.queryByLabelText('Pinned')).toBeNull();
  });

  it('treats a timestamp of 0 as set — presence is the boolean', () => {
    // An unpinned message has the attribute ABSENT, never 0. A `> 0` check here
    // would wrongly hide the indicator.
    renderBubble({ pinnedAt: 0, savedAt: 0 });
    expect(screen.getByLabelText('Pinned')).toBeInTheDocument();
    expect(screen.getByLabelText('Saved')).toBeInTheDocument();
  });

  it('renders one separator when a single glyph shows', () => {
    const { container } = renderBubble({ pinnedAt: 1 });
    expect(separators(container)).toHaveLength(1);
  });

  it('separates the two glyphs from each other as well as from the timestamp', () => {
    // saved • pinned • time — one bullet trails each present glyph.
    const { container } = renderBubble({ pinnedAt: 1, savedAt: 2 });
    expect(separators(container)).toHaveLength(2);
  });

  it('interleaves glyphs and separators in order', () => {
    const { container } = renderBubble({ pinnedAt: 1, savedAt: 2 });
    const row = container.querySelector('.cometchat-message-bubble__status-info-view');
    const classes = Array.from(row?.children ?? []).map(el => el.className);
    expect(classes[0]).toContain('--saved');
    expect(classes[1]).toContain('separator');
    expect(classes[2]).toContain('--pinned');
    expect(classes[3]).toContain('separator');
  });

  it('orders saved before pinned', () => {
    const { container } = renderBubble({ pinnedAt: 1, savedAt: 2 });
    const indicators = Array.from(
      container.querySelectorAll('.cometchat-message-bubble__status-info-view-indicator')
    );
    expect(indicators).toHaveLength(2);
    expect(indicators[0]?.className).toContain('--saved');
    expect(indicators[1]?.className).toContain('--pinned');
  });

  it('places the glyphs before the "edited" label', () => {
    const { container } = renderBubble({ pinnedAt: 1, editedAt: 5000 });
    const row = container.querySelector('.cometchat-message-bubble__status-info-view');
    const children = Array.from(row?.children ?? []);
    const glyphIndex = children.findIndex(el =>
      el.className.includes('status-info-view-indicator')
    );
    const editedIndex = children.findIndex(el =>
      el.className.includes('status-info-view-helper-text')
    );
    expect(glyphIndex).toBeGreaterThanOrEqual(0);
    expect(editedIndex).toBeGreaterThan(glyphIndex);
  });

  it('marks the separator decorative but the glyphs meaningful', () => {
    const { container } = renderBubble({ pinnedAt: 1 });
    expect(separators(container)[0]).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByLabelText('Pinned')).toHaveAttribute('role', 'img');
  });

  it('does not throw for a message lacking the pin/save accessors', () => {
    const legacy = {
      getId: () => 1,
      getType: () => 'text',
      getCategory: () => 'message',
      getSender: () => ({
        getUid: () => 'u',
        getName: () => 'N',
        getAvatar: () => '',
        getStatus: () => 'online',
      }),
      getSentAt: () => 1000,
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      getEditedAt: () => 0,
      getDeletedAt: () => 0,
      getReplyCount: () => 0,
      getReactions: () => [],
      getMetadata: () => ({}),
      getMuid: () => 'm',
    } as unknown as CometChat.BaseMessage;

    expect(() =>
      render(
        <CometChatMessageBubble message={legacy} alignment="left" contentView={<span>Hi</span>} />
      )
    ).not.toThrow();
  });
});
