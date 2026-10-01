/**
 * Mentions in the plain text composer (enableRichTextEditor={false}).
 *
 * Regression coverage for ENG-38099: selecting a suggestion recorded the
 * mentioned user on the outgoing payload but never inserted anything into the
 * composer, so the message went out without the mention text or its SDK token.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

const MEMBER = {
  getUid: () => 'member5',
  getName: () => 'Member 5',
  getAvatar: () => '',
} as unknown as import('@cometchat/chat-sdk-javascript').CometChat.User;

// Stand-in for the suggestions dropdown: the real one renders CometChatUsers /
// CometChatGroupMembers, which need live SDK requests. Selecting from it is all
// this suite cares about.
vi.mock('../CometChatMessageComposerMentionsList', () => ({
  CometChatMessageComposerMentionsList: ({
    isOpen,
    onItemClick,
  }: {
    isOpen: boolean;
    onItemClick: (item: unknown) => void;
  }) =>
    isOpen ? (
      <div data-testid="mentions-list">
        <button
          type="button"
          data-testid="pick-member"
          onMouseDown={e => e.preventDefault()}
          onClick={() => onItemClick(MEMBER)}
        >
          Member 5
        </button>
        <button
          type="button"
          data-testid="pick-all"
          onMouseDown={e => e.preventDefault()}
          onClick={() => onItemClick(null)}
        >
          all
        </button>
      </div>
    ) : null,
}));

vi.mock('../CometChatMessageComposerAttachmentButton', () => ({
  CometChatMessageComposerAttachmentButton: () => null,
}));
vi.mock('../CometChatMessageComposerEmojiButton', () => ({
  CometChatMessageComposerEmojiButton: () => null,
}));
vi.mock('../CometChatMessageComposerStickerButton', () => ({
  CometChatMessageComposerStickerButton: () => null,
}));
vi.mock('../CometChatMessageComposerVoiceButton', () => ({
  CometChatMessageComposerVoiceButton: () => null,
}));
vi.mock('../CometChatMessageComposerEditPreview', () => ({
  CometChatMessageComposerEditPreview: () => null,
}));
vi.mock('../CometChatMessageComposerReplyPreview', () => ({
  CometChatMessageComposerReplyPreview: () => null,
}));
vi.mock('../../base/CometChatMediaRecorder/CometChatMediaRecorder', () => ({
  CometChatMediaRecorder: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Controls: () => null,
    Timer: () => null,
    RecordingView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PreviewView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ErrorView: () => null,
  },
}));
vi.mock('../../base/CometChatMediaRecorder/CometChatMediaRecorder.context', () => ({
  useCometChatMediaRecorderContext: () => ({ inlineSend: vi.fn() }),
}));

import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { CometChatMessageComposerRoot } from '../CometChatMessageComposerRoot';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

const RECEIVER = {
  getUid: () => 'cometchat-uid-2',
  getName: () => 'Andrew',
} as unknown as import('@cometchat/chat-sdk-javascript').CometChat.User;

const GROUP = {
  getGuid: () => 'group-1',
  getName: () => 'Team',
  getIcon: () => '',
} as unknown as import('@cometchat/chat-sdk-javascript').CometChat.Group;

/** Type `value` into the contentEditable and put the caret at its end. */
function typeInto(input: HTMLElement, value: string): void {
  input.focus();
  input.textContent = value;
  const textNode = input.firstChild;
  if (!textNode) throw new Error('expected a text node');
  const range = document.createRange();
  range.setStart(textNode, value.length);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  fireEvent.input(input);
}

function getInput(): HTMLElement {
  return screen.getByRole('textbox');
}

describe('plain text composer — mentions (enableRichTextEditor={false})', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
    mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue({
      getUid: () => 'cometchat-uid-1',
      getName: () => 'Andrew Joseph',
    });
    mockCometChat.sendMessage = vi.fn().mockImplementation((msg: unknown) => Promise.resolve(msg));
  });

  it('opens the suggestions list when @ is typed', () => {
    render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor={false} />, {
      wrapper,
    });

    typeInto(getInput(), '@Mem');

    expect(screen.getByTestId('mentions-list')).toBeInTheDocument();
  });

  it('inserts the selected user into the composer', () => {
    render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor={false} />, {
      wrapper,
    });
    const input = getInput();

    typeInto(input, 'hey @Mem');
    fireEvent.click(screen.getByTestId('pick-member'));

    const mention = input.querySelector('[data-uid="member5"]');
    expect(mention).not.toBeNull();
    expect(mention?.textContent).toBe('@Member 5');
    // The typed "@Mem" query is replaced, not left behind
    expect(input.textContent).toBe('hey @Member 5 ');
  });

  it('inserts the mention even after focus moved into the list (keyboard selection)', () => {
    render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor={false} />, {
      wrapper,
    });
    const input = getInput();

    typeInto(input, 'hey @Mem');
    // Arrowing into the suggestions list drops the composer's own selection
    window.getSelection()?.removeAllRanges();
    fireEvent.click(screen.getByTestId('pick-member'));

    expect(input.querySelector('[data-uid="member5"]')).not.toBeNull();
    expect(input.textContent).toBe('hey @Member 5 ');
  });

  it('closes the suggestion list on Escape without sending', () => {
    render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor={false} />, {
      wrapper,
    });
    const input = getInput();

    typeInto(input, '@Mem');
    expect(screen.getByTestId('mentions-list')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByTestId('mentions-list')).not.toBeInTheDocument();
    expect(input.textContent).toBe('@Mem');
    expect(mockCometChat.sendMessage).not.toHaveBeenCalled();
  });

  it('still sends on Enter while no suggestion list is open', async () => {
    render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor={false} />, {
      wrapper,
    });
    const input = getInput();

    typeInto(input, 'plain message');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockCometChat.sendMessage).toHaveBeenCalled();
    });
  });

  it('sends the mention as an SDK token and on the mentionedUsers list', async () => {
    render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor={false} />, {
      wrapper,
    });
    const input = getInput();

    typeInto(input, '@Mem');
    fireEvent.click(screen.getByTestId('pick-member'));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(mockCometChat.sendMessage).toHaveBeenCalled();
    });
    const sent = mockCometChat.sendMessage.mock.calls[0][0] as {
      getText: () => string;
      getMentionedUsers: () => { getUid: () => string }[];
    };
    expect(sent.getText()).toBe('<@uid:member5>');
    expect(sent.getMentionedUsers().map(u => u.getUid())).toEqual(['member5']);
  });

  it('sends @all as a channel token', async () => {
    render(<CometChatMessageComposerRoot group={GROUP} enableRichTextEditor={false} />, {
      wrapper,
    });
    const input = getInput();

    typeInto(input, 'standup @a');
    fireEvent.click(screen.getByTestId('pick-all'));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(mockCometChat.sendMessage).toHaveBeenCalled();
    });
    const sent = mockCometChat.sendMessage.mock.calls[0][0] as { getText: () => string };
    expect(sent.getText()).toBe('standup <@all:all>');
  });

  it('shows existing mentions as names when editing a message', async () => {
    const messageToEdit = {
      getId: () => 42,
      getType: () => 'text',
      getText: () => '<@uid:member5> are you around?',
      getMentionedUsers: () => [MEMBER],
      getMetadata: () => ({}),
    } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.TextMessage;

    render(
      <CometChatMessageComposerRoot
        user={RECEIVER}
        enableRichTextEditor={false}
        messageToEdit={messageToEdit}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(getInput().querySelector('[data-uid="member5"]')).not.toBeNull();
    });
    expect(getInput().textContent).toBe('@Member 5 are you around?');
  });
});
