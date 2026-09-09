/**
 * The bubble maps CometChatMessageOption[] onto the context menu's item shape.
 * That mapping used to drop `submenu`, which rendered "Organize" as an inert row
 * with no chevron and no fly-out — the options were built correctly and then
 * silently discarded one layer below. These tests pin that seam.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageOption } from '../../../plugins/plugin.types';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

function mockMessage(): CometChat.BaseMessage {
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
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => 'muid-1',
  } as unknown as CometChat.BaseMessage;
}

const onPin = vi.fn();
const onSave = vi.fn();

function optionsWithSubmenu(): CometChatMessageOption[] {
  return [
    { id: 'copy', title: 'Copy', onClick: vi.fn() },
    {
      id: 'organize',
      title: 'Organize',
      onClick: vi.fn(),
      submenu: [
        { id: 'pin-message', title: 'Pin message', onClick: onPin },
        { id: 'save-message', title: 'Save message', onClick: onSave },
      ],
    },
  ];
}

function renderBubble(options: CometChatMessageOption[], alignment: 'left' | 'right' = 'left') {
  const result = render(
    <CometChatMessageBubble
      message={mockMessage()}
      alignment={alignment}
      contentView={<span>Hello</span>}
      options={options}
      quickOptionsCount={0}
      toggleOptionsVisibility={true}
    />
  );
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /more/i }));
  });
  act(() => {
    vi.advanceTimersByTime(16);
  });
  return result;
}

function openFlyout() {
  const row = screen.getByRole('menuitem', { name: /Organize/, hidden: true });
  const wrapper = row.closest('.cometchat-context-menu__submenu');
  act(() => {
    fireEvent.mouseEnter(wrapper!);
  });
  act(() => {
    vi.advanceTimersByTime(121);
  });
  act(() => {
    vi.advanceTimersByTime(32);
  });
}

describe('CometChatMessageBubble — submenu passthrough', () => {
  it('renders an option carrying a submenu as a disclosure row', () => {
    renderBubble(optionsWithSubmenu());
    const row = screen.getByRole('menuitem', { name: /Organize/, hidden: true });
    expect(row).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('opens the fly-out and shows the nested options', () => {
    renderBubble(optionsWithSubmenu());
    openFlyout();
    expect(screen.getByRole('menuitem', { name: 'Pin message', hidden: true })).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Save message', hidden: true })
    ).toBeInTheDocument();
  });

  it('invokes the nested option callback with the message', () => {
    onPin.mockClear();
    renderBubble(optionsWithSubmenu());
    openFlyout();
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Pin message', hidden: true }));
    });
    expect(onPin).toHaveBeenCalledTimes(1);
    expect(onPin.mock.calls[0]?.[0]).toMatchObject({ getId: expect.any(Function) });
  });

  it('leaves options without a submenu as plain rows', () => {
    renderBubble([{ id: 'copy', title: 'Copy', onClick: vi.fn() }]);
    expect(screen.getByRole('menuitem', { name: 'Copy', hidden: true })).not.toHaveAttribute(
      'aria-haspopup'
    );
  });

  it('an empty submenu array does not create a disclosure row', () => {
    renderBubble([{ id: 'organize', title: 'Organize', onClick: vi.fn(), submenu: [] }]);
    expect(screen.getByRole('menuitem', { name: /Organize/, hidden: true })).not.toHaveAttribute(
      'aria-haspopup'
    );
  });
});
