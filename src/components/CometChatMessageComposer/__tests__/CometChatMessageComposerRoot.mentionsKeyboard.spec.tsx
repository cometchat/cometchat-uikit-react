/**
 * Keyboard navigation of the mention suggestions from the composer input
 * (ENG-37419), in both editor modes.
 *
 * The composer keeps focus while the list is open: ArrowDown/ArrowUp move the
 * highlight, Enter/Tab select the highlighted suggestion instead of sending, and
 * Escape closes the list. The rich text editor and the plain text input
 * (enableRichTextEditor={false}) share one handler, so they must behave alike.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

type TestUser = import('@cometchat/chat-sdk-javascript').CometChat.User;

const makeUser = (uid: string, name: string) =>
  ({ getUid: () => uid, getName: () => name, getAvatar: () => '' }) as unknown as TestUser;

const MEMBERS = [makeUser('member1', 'Member 1'), makeUser('member2', 'Member 2')];

/** Flipped by the "still loading" test so the mock reports zero options. */
let mockListIsEmpty = false;

// Stand-in for the suggestions dropdown that exposes the same imperative
// handle as the real one (moveHighlight / selectHighlighted). The real list
// renders CometChatUsers, which needs live SDK requests.
vi.mock('../CometChatMessageComposerMentionsList', () => ({
  CometChatMessageComposerMentionsList: forwardRef(function MockMentionsList(
    {
      isOpen,
      onItemClick,
      listboxId,
      onHighlightChange,
    }: {
      isOpen: boolean;
      onItemClick: (item: unknown) => void;
      listboxId?: string;
      onHighlightChange?: (id: string | null) => void;
    },
    ref: React.ForwardedRef<{
      moveHighlight: (delta: number) => boolean;
      selectHighlighted: () => boolean;
    }>
  ) {
    const [active, setActive] = useState(0);
    const activeRef = useRef(0);
    const emptyRef = useRef(false);
    emptyRef.current = mockListIsEmpty;
    useImperativeHandle(ref, () => ({
      moveHighlight: (delta: number) => {
        // Mirrors the real list: no options yet (still loading) => not handled.
        if (emptyRef.current) return false;
        const next = (activeRef.current + delta + MEMBERS.length) % MEMBERS.length;
        activeRef.current = next;
        setActive(next);
        onHighlightChange?.(`${listboxId ?? 'listbox'}-opt-${String(next)}`);
        return true;
      },
      selectHighlighted: () => {
        onItemClick(MEMBERS[activeRef.current]);
        return true;
      },
    }));
    // The real list reports null when it closes.
    useEffect(() => {
      if (!isOpen) onHighlightChange?.(null);
    }, [isOpen, onHighlightChange]);
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="mentions-list" id={listboxId}>
        {MEMBERS.map((m, i) => (
          <div
            key={m.getUid()}
            role="option"
            aria-selected={i === active}
            id={`${listboxId ?? 'listbox'}-opt-${String(i)}`}
            data-testid={`option-${String(m.getUid())}`}
          >
            {m.getName()}
          </div>
        ))}
      </div>
    );
  }),
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

function renderComposer(enableRichTextEditor: boolean) {
  return render(
    <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor={enableRichTextEditor} />,
    { wrapper }
  );
}

function highlightedUid(): string | undefined {
  return screen
    .getAllByRole('option')
    .find(o => o.getAttribute('aria-selected') === 'true')
    ?.getAttribute('data-testid')
    ?.replace('option-', '');
}

describe('mention keyboard navigation — plain text composer (enableRichTextEditor={false})', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListIsEmpty = false;
    mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
    mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue({
      getUid: () => 'cometchat-uid-1',
      getName: () => 'Andrew Joseph',
    });
    mockCometChat.sendMessage = vi.fn().mockImplementation((msg: unknown) => Promise.resolve(msg));
  });

  it('ArrowDown / ArrowUp move the highlight and keep focus in the input', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');
    expect(highlightedUid()).toBe('member1');

    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    expect(highlightedUid()).toBe('member2');

    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });
    expect(highlightedUid()).toBe('member1');
    expect(document.activeElement).toBe(input);
  });

  it('prevents the default caret movement for arrow keys while the list is open', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');

    const notCancelled = fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(notCancelled).toBe(false);
  });

  it('Enter selects the highlighted suggestion instead of sending', async () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, 'hey @Mem');

    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.querySelector('[data-uid="member2"]')).not.toBeNull();
    // MentionManager follows a mention with a non-breaking space
    expect(input.textContent).toBe('hey @Member 2\u00A0');
    expect(screen.queryByTestId('mentions-list')).not.toBeInTheDocument();
    // Give any stray send a chance to fire before asserting it didn't
    await new Promise(r => setTimeout(r, 0));
    expect(mockCometChat.sendMessage).not.toHaveBeenCalled();
  });

  it('Tab selects the highlighted suggestion', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');

    const notCancelled = fireEvent.keyDown(input, { key: 'Tab' });

    expect(notCancelled).toBe(false);
    expect(input.querySelector('[data-uid="member1"]')).not.toBeNull();
  });

  it('sends the selected mention as an SDK token after keyboard selection', async () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');
    fireEvent.keyDown(input, { key: 'Enter' }); // selects member1
    fireEvent.keyDown(input, { key: 'Enter' }); // list closed → sends

    await waitFor(() => {
      expect(mockCometChat.sendMessage).toHaveBeenCalledTimes(1);
    });
    const sent = mockCometChat.sendMessage.mock.calls[0][0] as { getText: () => string };
    expect(sent.getText()).toBe('<@uid:member1>');
  });

  it('Shift+Tab does not select — it leaves focus free to move backward', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');

    const notCancelled = fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });

    expect(notCancelled).toBe(true);
    expect(input.querySelector('[data-uid]')).toBeNull();
    expect(screen.getByTestId('mentions-list')).toBeInTheDocument();
  });

  it('ignores arrows and Enter while an IME is composing', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');

    // A CJK IME owns these keys for candidate selection / conversion commit.
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true });
    });
    expect(highlightedUid()).toBe('member1'); // highlight did not move

    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(input.querySelector('[data-uid]')).toBeNull(); // nothing inserted
  });

  it('exposes the highlighted option to screen readers via aria-activedescendant', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');

    // aria-controls points at the open listbox
    const listboxId = screen.getByTestId('mentions-list').id;
    expect(listboxId).toBeTruthy();
    expect(input).toHaveAttribute('aria-controls', listboxId);

    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });

    const activeId = input.getAttribute('aria-activedescendant');
    expect(activeId).toBe(screen.getByTestId('option-member2').id);
  });

  it('clears aria-activedescendant when the list closes', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    expect(input.getAttribute('aria-activedescendant')).toBeTruthy();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(input).not.toHaveAttribute('aria-controls');
  });

  it('Escape still closes the list without selecting or sending', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByTestId('mentions-list')).not.toBeInTheDocument();
    expect(input.querySelector('[data-uid]')).toBeNull();
    expect(mockCometChat.sendMessage).not.toHaveBeenCalled();
  });

  // Review #13: while the dropdown is open but still fetching it holds no
  // options. Claiming the arrow key there would freeze the caret for the length
  // of the request while doing nothing visible.
  it('lets arrow keys through while the open list has no options yet', () => {
    mockListIsEmpty = true;
    renderComposer(false);
    const input = getInput();
    typeInto(input, '@Mem');
    expect(screen.getByTestId('mentions-list')).toBeInTheDocument();

    const notCancelled = fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(notCancelled).toBe(true); // caret movement not prevented
  });

  it('leaves arrow keys alone when no list is open', () => {
    renderComposer(false);
    const input = getInput();
    typeInto(input, 'plain text');

    const notCancelled = fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(notCancelled).toBe(true);
  });
});
