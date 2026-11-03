/**
 * The public props of <CometChatMessageComposer />, one case each: the prop is set (or left out) on
 * the real component and the test checks what it changes. Only the SDK's network calls are mocked;
 * its message, user and group classes are the real ones.
 *
 * Props that don't do what their types say are pinned with `it.fails` under "known issues", at the end.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageComposer } from '../CometChatMessageComposer';
import { LocaleContext } from '../../../context/locale/LocaleContext';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  sendMediaMessage: vi.fn(),
  editMessage: vi.fn(),
  startTyping: vi.fn(),
  endTyping: vi.fn(),
  createUploadFileRequest: vi.fn(),
  UsersRequestBuilder: vi.fn(),
  GroupMembersRequestBuilder: vi.fn(),
  fetchUsers: vi.fn(),
  fetchMembers: vi.fn(),
}));

// jsdom has no scrollIntoView (the mention list scrolls its highlighted suggestion into view).
Element.prototype.scrollIntoView = vi.fn();

// The real SDK (its classes and constants), with the calls that would reach the network mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const actual = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>(
    '@cometchat/chat-sdk-javascript'
  );
  const me = new actual.CometChat.User({ uid: 'me', name: 'Me' });
  return {
    ...actual,
    CometChat: Object.assign({}, actual.CometChat, {
      isInitialized: () => true,
      getLoggedinUser: () => Promise.resolve(me),
      sendMessage: sdk.sendMessage,
      sendMediaMessage: sdk.sendMediaMessage,
      editMessage: sdk.editMessage,
      startTyping: sdk.startTyping,
      endTyping: sdk.endTyping,
      createUploadFileRequest: sdk.createUploadFileRequest,
      UsersRequestBuilder: sdk.UsersRequestBuilder,
      GroupMembersRequestBuilder: sdk.GroupMembersRequestBuilder,
      addUserListener: vi.fn(),
      removeUserListener: vi.fn(),
      addGroupListener: vi.fn(),
      removeGroupListener: vi.fn(),
      // Left pending: the composer keeps its fallback limit (10 per batch) instead of updating it
      // after the test has finished, outside act().
      getMaxAttachmentCount: () => new Promise<number>(() => undefined),
      addMessageListener: vi.fn(),
      removeMessageListener: vi.fn(),
      addConnectionListener: vi.fn(),
      removeConnectionListener: vi.fn(),
    }),
  };
});

const bob = new CometChat.User({ uid: 'bob', name: 'Bob' });
const alice = new CometChat.User({ uid: 'alice', name: 'Alice' });
const team = new CometChat.Group('team', 'Team', CometChat.GROUP_TYPE.PUBLIC);
const carol = new CometChat.User({ uid: 'carol', name: 'Carol' });
const dave = new CometChat.GroupMember('dave', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
dave.setName('Dave');

interface Builder {
  setLimit: (limit: number) => Builder;
  setSearchKeyword: (keyword: string) => Builder;
  build: () => { fetchNext: () => Promise<unknown[]> };
}

/** A request builder an app passes in, returning its own people. */
function appBuilder(people: CometChat.User[]) {
  const fetchNext = vi.fn().mockResolvedValue(people);
  const builder = {
    setLimit: vi.fn(),
    setSearchKeyword: vi.fn(),
    build: vi.fn(() => ({ fetchNext })),
  };
  builder.setLimit.mockReturnValue(builder);
  builder.setSearchKeyword.mockReturnValue(builder);
  return { builder, fetchNext };
}

/** A text message from `sender` in the chat with Bob. */
function textMessage(id: number, text: string, sender: CometChat.User = alice) {
  const message = new CometChat.TextMessage('bob', text, CometChat.RECEIVER_TYPE.USER);
  message.setId(id);
  message.setSender(sender);
  return message;
}

/** Wraps `#word` in a span, as an app's display formatter would. */
class HashtagFormatter extends CometChatTextFormatter {
  readonly id = 'hashtag';
  override format(text: string): string {
    return text.replace(/(#\w+)/g, '<span class="hashtag">$1</span>');
  }
}

const textbox = () => screen.getByRole('textbox');
const sendButton = () => screen.getByRole('button', { name: 'Send' });
const composerRoot = (container: HTMLElement) => {
  const root = container.querySelector<HTMLElement>('.cometchat-message-composer');
  if (!root) throw new Error('no composer');
  return root;
};
const editPreview = (container: HTMLElement) =>
  container.querySelector('.cometchat-message-composer__edit-preview');
const replyPreview = (container: HTMLElement) =>
  container.querySelector('.cometchat-message-composer__reply-preview');
const placeholderText = (container: HTMLElement) =>
  container.querySelector('.cometchat-message-composer__input-placeholder')?.textContent;

/** Types into the composer's contentEditable the way a browser would: text, caret at the end, input event. */
function type(value: string) {
  const box = textbox();
  box.focus();
  box.textContent = value;
  const node = box.firstChild;
  if (node) {
    const range = document.createRange();
    range.setStart(node, value.length);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  fireEvent.input(box);
}

/** Lets the composer's async send path (logged-in user lookup, SDK promise) settle. */
const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

/** The SDK's upload request for one batch of staged files. */
function uploadRequest() {
  return {
    setParentMessageId: vi.fn(),
    getBatchId: () => 'batch-1',
    uploadAttachments: vi.fn(),
    removeAttachment: vi.fn(),
    retryAttachment: vi.fn(),
    clearAll: vi.fn(),
  };
}

/** The text message handed to the SDK to send. */
const sentText = () => sdk.sendMessage.mock.calls[0]?.[0] as CometChat.TextMessage;

/** Opens the attachment menu and returns the titles of its options. */
function openAttachmentMenu(): string[] {
  fireEvent.click(screen.getByRole('button', { name: 'Attachments' }));
  return Array.from(
    document.querySelectorAll('.cometchat-message-composer__attachment-option-title'),
    el => el.textContent ?? ''
  );
}

/**
 * Picks `files` through an attachment option. The browser's file dialog is the one thing jsdom
 * can't open, so the picker input the composer creates is caught when it is clicked and given the
 * files, as the dialog would.
 */
function pickFiles(option: string, files: File[]): HTMLInputElement {
  const pickers: HTMLInputElement[] = [];
  const click = vi
    .spyOn(HTMLInputElement.prototype, 'click')
    .mockImplementation(function (this: HTMLInputElement) {
      pickers.push(this);
    });
  openAttachmentMenu();
  fireEvent.click(screen.getByRole('button', { name: option }));
  click.mockRestore();
  const picker = pickers[0];
  if (!picker) throw new Error(`"${option}" opened no file picker`);
  Object.defineProperty(picker, 'files', { value: files });
  act(() => {
    picker.dispatchEvent(new Event('change'));
  });
  return picker;
}

const tray = () => screen.queryByRole('list', { name: 'Staged attachments' });
const stagedTray = () => screen.getByRole('list', { name: 'Staged attachments' });
const suggestions = () => screen.queryByRole('listbox', { name: 'Mention suggestions' });
const suggestionList = () => screen.getByRole('listbox', { name: 'Mention suggestions' });

const OUTGOING_SOUND = 'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingmessage.wav';

/** Watches audio playback (jsdom plays nothing) and returns the URLs played. */
function watchSounds(): () => string[] {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play');
  return () => play.mock.contexts.map(audio => (audio as HTMLAudioElement).src);
}

/** Types, sends, and waits until the SDK has acknowledged the message. */
async function sendAndWait(text = 'hello') {
  type(text);
  fireEvent.click(sendButton());
  await waitFor(() => {
    expect(sdk.sendMessage).toHaveBeenCalled();
  });
  await settle();
}

const pdf = () => new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' });
const fileDrag = (files: File[] = []) => ({ dataTransfer: { types: ['Files'], files, dropEffect: 'none' } });

beforeEach(() => {
  sdk.sendMessage.mockReset().mockImplementation((message: unknown) => Promise.resolve(message));
  sdk.sendMediaMessage.mockReset().mockImplementation((message: unknown) => Promise.resolve(message));
  sdk.editMessage.mockReset().mockImplementation((message: unknown) => Promise.resolve(message));
  sdk.startTyping.mockReset();
  sdk.endTyping.mockReset();
  sdk.createUploadFileRequest.mockReset().mockImplementation(uploadRequest);
  sdk.fetchUsers.mockReset().mockResolvedValue([carol]);
  sdk.fetchMembers.mockReset().mockResolvedValue([dave]);
  sdk.UsersRequestBuilder.mockReset().mockImplementation(function (this: Builder) {
    this.setLimit = () => this;
    this.setSearchKeyword = () => this;
    this.build = () => ({ fetchNext: sdk.fetchUsers });
  });
  sdk.GroupMembersRequestBuilder.mockReset().mockImplementation(function (this: Builder) {
    this.setLimit = () => this;
    this.setSearchKeyword = () => this;
    this.build = () => ({ fetchNext: sdk.fetchMembers });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatMessageComposer props', () => {
  describe('layout and input', () => {
    it('compact puts the attachment button before the input; it is the default', () => {
      covers('CometChatMessageComposer.layout', 'compact', 'default');
      for (const props of [{ layout: 'compact' as const }, {}]) {
        const { container, unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        const root = composerRoot(container);
        expect(root).toHaveClass('cometchat-message-composer--compact');
        const attach = screen.getByRole('button', { name: 'Attachments' });
        expect(attach.closest('.cometchat-message-composer__actions')).toBeNull();
        expect(attach.compareDocumentPosition(textbox()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        unmount();
      }
    });

    it('multiline moves the attachment button into the actions row, after the input', () => {
      covers('CometChatMessageComposer.layout', 'multiline');
      const { container } = render(<CometChatMessageComposer user={bob} layout="multiline" />);
      expect(composerRoot(container)).toHaveClass('cometchat-message-composer--multiline');
      const attach = screen.getByRole('button', { name: 'Attachments' });
      expect(attach.closest('.cometchat-message-composer__actions')).not.toBeNull();
      expect(attach.compareDocumentPosition(textbox()) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('initialText pre-fills the input and enables Send; by default the input starts empty', () => {
      covers('CometChatMessageComposer.initialText', 'set', 'default');
      const { container, unmount } = render(<CometChatMessageComposer user={bob} initialText="Draft reply" />);
      expect(textbox()).toHaveTextContent('Draft reply');
      expect(placeholderText(container)).toBeUndefined();
      expect(sendButton()).toBeEnabled();
      unmount();

      const view = render(<CometChatMessageComposer user={bob} />);
      expect(textbox()).toBeEmptyDOMElement();
      expect(placeholderText(view.container)).toBe('Enter your message here');
      expect(sendButton()).toBeDisabled();
    });

    it('text controls the input: it shows the value and follows every change of it', () => {
      covers('CometChatMessageComposer.text', 'set');
      const { rerender } = render(<CometChatMessageComposer user={bob} text="Hi" />);
      expect(textbox()).toHaveTextContent('Hi');
      rerender(<CometChatMessageComposer user={bob} text="Hi there" />);
      expect(textbox()).toHaveTextContent('Hi there');
      rerender(<CometChatMessageComposer user={bob} text="" />);
      expect(textbox()).toBeEmptyDOMElement();
    });

    it('without text the composer keeps what the user types across re-renders', () => {
      covers('CometChatMessageComposer.text', 'default');
      const { rerender } = render(<CometChatMessageComposer user={bob} />);
      type('typed by the user');
      rerender(<CometChatMessageComposer user={bob} placeholder="Say something" />);
      expect(textbox()).toHaveTextContent('typed by the user');
      expect(sendButton()).toBeEnabled();
    });

    it('placeholder replaces the hint shown in the empty input; by default the localized one', () => {
      covers('CometChatMessageComposer.placeholder', 'set', 'default');
      const { container, unmount } = render(<CometChatMessageComposer user={bob} placeholder="Say something" />);
      expect(placeholderText(container)).toBe('Say something');
      unmount();
      const view = render(<CometChatMessageComposer user={bob} />);
      expect(placeholderText(view.container)).toBe('Enter your message here');
    });

    it("placeholder wins over the locale's string", () => {
      covers('CometChatMessageComposer.placeholder', 'overrides-context');
      const Spanish: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const locale = React.useContext(LocaleContext);
        const getLocalizedString = (key: string) =>
          key === 'message_composer_placeholder' ? 'Escribe un mensaje' : locale.getLocalizedString(key);
        return (
          <LocaleContext.Provider value={{ ...locale, getLocalizedString }}>{children}</LocaleContext.Provider>
        );
      };
      const { container, unmount } = render(
        <Spanish>
          <CometChatMessageComposer user={bob} />
        </Spanish>
      );
      expect(placeholderText(container)).toBe('Escribe un mensaje');
      unmount();
      const view = render(
        <Spanish>
          <CometChatMessageComposer user={bob} placeholder="Say something" />
        </Spanish>
      );
      expect(placeholderText(view.container)).toBe('Say something');
    });

    it('maxInputHeight caps the input height; 200px by default', () => {
      covers('CometChatMessageComposer.maxInputHeight', 'set', 'default');
      const { unmount } = render(<CometChatMessageComposer user={bob} maxInputHeight={120} />);
      expect(textbox()).toHaveStyle({ maxHeight: '120px' });
      unmount();
      render(<CometChatMessageComposer user={bob} />);
      expect(textbox()).toHaveStyle({ maxHeight: '200px' });
    });

    it('showScrollbar shows the input scrollbar; hidden by default', () => {
      covers('CometChatMessageComposer.showScrollbar', 'true', 'false', 'default');
      for (const [props, hidden] of [
        [{ showScrollbar: true }, false],
        [{ showScrollbar: false }, true],
        [{}, true],
      ] as const) {
        const { container, unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        const area = container.querySelector('.cometchat-message-composer__input-area');
        expect(area?.classList.contains('cometchat-message-composer__input-area--hide-scrollbar')).toBe(hidden);
        unmount();
      }
    });

    it('className is added to the root; by default the root has only its own classes', () => {
      covers('CometChatMessageComposer.className', 'set', 'default');
      const { container, unmount } = render(<CometChatMessageComposer user={bob} className="support-composer" />);
      expect(composerRoot(container)).toHaveClass('cometchat-message-composer', 'support-composer');
      unmount();
      const view = render(<CometChatMessageComposer user={bob} />);
      expect(Array.from(composerRoot(view.container).classList)).toEqual([
        'cometchat-message-composer',
        'cometchat-message-composer--compact',
      ]);
    });

    it('children replace the default layout with the parts given, still wired to send', async () => {
      covers('CometChatMessageComposer.children', 'custom');
      render(
        <CometChatMessageComposer user={bob}>
          <CometChatMessageComposer.Input />
          <CometChatMessageComposer.SendButton />
        </CometChatMessageComposer>
      );
      expect(screen.queryByRole('button', { name: 'Attachments' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Emoji' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Voice recording' })).toBeNull();
      type('from a custom layout');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getText()).toBe('from a custom layout');
    });
  });

  describe('Enter key', () => {
    it('send (the default) sends on Enter but not on Shift+Enter', async () => {
      covers('CometChatMessageComposer.enterKeyBehavior', 'send', 'default');
      for (const props of [{ enterKeyBehavior: 'send' as const }, {}]) {
        sdk.sendMessage.mockClear();
        const { unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        type('hello');
        expect(fireEvent.keyDown(textbox(), { key: 'Enter', shiftKey: true })).toBe(true);
        await settle();
        expect(sdk.sendMessage).not.toHaveBeenCalled();
        expect(fireEvent.keyDown(textbox(), { key: 'Enter' })).toBe(false);
        await waitFor(() => {
          expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
        });
        unmount();
      }
    });

    it('newline leaves Enter to the browser (a line break) and sends nothing', async () => {
      covers('CometChatMessageComposer.enterKeyBehavior', 'newline');
      render(<CometChatMessageComposer user={bob} enterKeyBehavior="newline" />);
      type('hello');
      expect(fireEvent.keyDown(textbox(), { key: 'Enter' })).toBe(true);
      await settle();
      expect(sdk.sendMessage).not.toHaveBeenCalled();
      expect(textbox()).toHaveTextContent('hello');
    });

    it('none swallows Enter: no line break and nothing sent', async () => {
      covers('CometChatMessageComposer.enterKeyBehavior', 'none');
      render(<CometChatMessageComposer user={bob} enterKeyBehavior="none" />);
      type('hello');
      expect(fireEvent.keyDown(textbox(), { key: 'Enter' })).toBe(false);
      await settle();
      expect(sdk.sendMessage).not.toHaveBeenCalled();
      expect(textbox()).toHaveTextContent('hello');
    });
  });

  describe('conversation', () => {
    it('user sends to that user', async () => {
      covers('CometChatMessageComposer.user', 'set');
      render(<CometChatMessageComposer user={bob} />);
      type('Hi Bob');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getReceiverId()).toBe('bob');
      expect(sentText().getReceiverType()).toBe('user');
      expect(sentText().getText()).toBe('Hi Bob');
    });

    it('group sends to that group', async () => {
      covers('CometChatMessageComposer.group', 'set');
      render(<CometChatMessageComposer group={team} />);
      type('Hi team');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getReceiverId()).toBe('team');
      expect(sentText().getReceiverType()).toBe('group');
    });

    it('with neither a user nor a group, Send clears the input but sends nothing', async () => {
      covers('CometChatMessageComposer.user', 'default');
      covers('CometChatMessageComposer.group', 'default');
      render(<CometChatMessageComposer />);
      type('to nobody');
      fireEvent.click(sendButton());
      await settle();
      expect(sdk.sendMessage).not.toHaveBeenCalled();
      expect(textbox()).toBeEmptyDOMElement();
    });

    it('parentMessageId sends into that thread, and the thread composer offers no polls or collaborative tools', async () => {
      covers('CometChatMessageComposer.parentMessageId', 'set');
      render(<CometChatMessageComposer user={bob} parentMessageId={42} />);
      type('in the thread');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getParentMessageId()).toBe(42);
      expect(openAttachmentMenu()).toEqual(['Attach Image', 'Attach Video', 'Attach Audio', 'Attach File']);
    });

    it('without parentMessageId the message goes to the main conversation', async () => {
      covers('CometChatMessageComposer.parentMessageId', 'default');
      render(<CometChatMessageComposer user={bob} />);
      type('in the chat');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getParentMessageId()).toBeFalsy();
      expect(openAttachmentMenu()).toContain('Polls');
    });
  });

  describe('attachments', () => {
    const defaultOptions = [
      'Attach Image',
      'Attach Video',
      'Attach Audio',
      'Attach File',
      'Polls',
      'Collaborative Document',
      'Collaborative Whiteboard',
    ];

    it('by default the menu offers every built-in option', () => {
      covers('CometChatMessageComposer.attachmentOptions', 'default');
      covers('CometChatMessageComposer.hideAttachmentOptions', 'default');
      render(<CometChatMessageComposer user={bob} />);
      expect(openAttachmentMenu()).toEqual(defaultOptions);
    });

    it("attachmentOptions replace the built-in options, and picking one runs the app's handler", () => {
      covers('CometChatMessageComposer.attachmentOptions', 'set');
      const onClick = vi.fn();
      render(
        <CometChatMessageComposer
          user={bob}
          attachmentOptions={[{ id: 'location', title: 'Share location', iconURL: 'pin.svg', onClick }]}
        />
      );
      expect(openAttachmentMenu()).toEqual(['Share location']);
      fireEvent.click(screen.getByRole('button', { name: 'Share location' }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('hideAttachmentOptions removes the options it names', () => {
      covers('CometChatMessageComposer.hideAttachmentOptions', 'set');
      render(<CometChatMessageComposer user={bob} hideAttachmentOptions={{ image: true, polls: true }} />);
      expect(openAttachmentMenu()).toEqual(
        defaultOptions.filter(option => option !== 'Attach Image' && option !== 'Polls')
      );
    });

    it('allowedFileTypes limits what the file picker accepts; by default each option accepts its own kind', () => {
      covers('CometChatMessageComposer.allowedFileTypes', 'set', 'default');
      const { unmount } = render(
        <CometChatMessageComposer user={bob} allowedFileTypes={['image/png', 'image/jpeg']} />
      );
      expect(pickFiles('Attach Image', []).accept).toBe('image/png,image/jpeg');
      unmount();
      render(<CometChatMessageComposer user={bob} />);
      expect(pickFiles('Attach Image', []).accept).toBe('image/*');
    });

    it('enableMultipleAttachments (the default) stages picked files in the tray instead of sending them', () => {
      covers('CometChatMessageComposer.enableMultipleAttachments', 'true', 'default');
      for (const props of [{ enableMultipleAttachments: true }, {}]) {
        sdk.createUploadFileRequest.mockClear();
        const { unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        const picker = pickFiles('Attach File', [pdf()]);
        expect(picker.multiple).toBe(true);
        expect(sdk.createUploadFileRequest).toHaveBeenCalledWith('bob', 'user');
        expect(within(stagedTray()).getByText('notes.pdf')).toBeInTheDocument();
        expect(sdk.sendMediaMessage).not.toHaveBeenCalled();
        unmount();
      }
    });

    it('enableMultipleAttachments={false} sends a picked file at once, one file at a time', async () => {
      covers('CometChatMessageComposer.enableMultipleAttachments', 'false');
      render(<CometChatMessageComposer user={bob} enableMultipleAttachments={false} />);
      const file = pdf();
      const picker = pickFiles('Attach File', [file]);
      expect(picker.multiple).toBe(false);
      await waitFor(() => {
        expect(sdk.sendMediaMessage).toHaveBeenCalledTimes(1);
      });
      const sent = sdk.sendMediaMessage.mock.calls[0]?.[0] as CometChat.MediaMessage;
      expect(sent.getReceiverId()).toBe('bob');
      expect(sent.getType()).toBe('file');
      expect(tray()).toBeNull();
      expect(sdk.createUploadFileRequest).not.toHaveBeenCalled();
    });

    it('drag and drop stages dropped files, with a drop hint while dragging; on by default', () => {
      covers('CometChatMessageComposer.disableDragAndDrop', 'false', 'default');
      for (const props of [{ disableDragAndDrop: false }, {}]) {
        const { container, unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        const root = composerRoot(container);
        fireEvent.dragEnter(root, fileDrag());
        expect(screen.getByText('Drop files here')).toBeInTheDocument();
        fireEvent.drop(root, fileDrag([pdf()]));
        expect(screen.queryByText('Drop files here')).toBeNull();
        expect(within(stagedTray()).getByText('notes.pdf')).toBeInTheDocument();
        unmount();
      }
    });

    it('disableDragAndDrop ignores dragged files', () => {
      covers('CometChatMessageComposer.disableDragAndDrop', 'true');
      const { container } = render(<CometChatMessageComposer user={bob} disableDragAndDrop />);
      const root = composerRoot(container);
      fireEvent.dragEnter(root, fileDrag());
      expect(screen.queryByText('Drop files here')).toBeNull();
      fireEvent.drop(root, fileDrag([pdf()]));
      expect(tray()).toBeNull();
      expect(sdk.createUploadFileRequest).not.toHaveBeenCalled();
    });

    // Not claimed for the matrix: these handlers only fire in single-send mode. With the tray (the
    // default) neither fires; see the known issues below.
    it('in single-send mode, onAttachmentAdded gets the file being sent', async () => {
      const onAttachmentAdded = vi.fn();
      render(
        <CometChatMessageComposer user={bob} enableMultipleAttachments={false} onAttachmentAdded={onAttachmentAdded} />
      );
      const file = pdf();
      pickFiles('Attach File', [file]);
      await waitFor(() => {
        expect(onAttachmentAdded).toHaveBeenCalledWith(file);
      });
    });

    it('in single-send mode, onAttachmentRemoved gets the file back when sending it fails', async () => {
      sdk.sendMediaMessage.mockRejectedValue(
        new CometChat.CometChatException({ code: 'ERR_UPLOAD', message: 'upload failed' })
      );
      const onAttachmentRemoved = vi.fn();
      render(
        <CometChatMessageComposer
          user={bob}
          enableMultipleAttachments={false}
          onAttachmentRemoved={onAttachmentRemoved}
        />
      );
      const file = pdf();
      pickFiles('Attach File', [file]);
      await waitFor(() => {
        expect(onAttachmentRemoved).toHaveBeenCalledWith(file);
      });
    });

    it('hideError hides the error toast for a file of the wrong kind; shown by default', async () => {
      covers('CometChatMessageComposer.hideError', 'true', 'false', 'default');
      const wrongKind = 'You selected a different type of file. Please choose the appropriate file.';
      const { unmount } = render(
        <CometChatMessageComposer user={bob} enableMultipleAttachments={false} hideError />
      );
      pickFiles('Attach Image', [pdf()]);
      await settle();
      expect(screen.queryByText(wrongKind)).toBeNull();
      expect(sdk.sendMediaMessage).not.toHaveBeenCalled();
      unmount();
      for (const props of [{ hideError: false }, {}]) {
        const view = render(<CometChatMessageComposer user={bob} enableMultipleAttachments={false} {...props} />);
        pickFiles('Attach Image', [pdf()]);
        expect(await screen.findByText(wrongKind)).toBeInTheDocument();
        view.unmount();
      }
    });
  });

  describe('mentions', () => {
    it("typing @ suggests users from the SDK's user list; on by default", async () => {
      covers('CometChatMessageComposer.disableMentions', 'false', 'default');
      covers('CometChatMessageComposer.mentionsUsersRequestBuilder', 'default');
      for (const props of [{ disableMentions: false }, {}]) {
        sdk.UsersRequestBuilder.mockClear();
        const { unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        type('hey @');
        expect(await within(suggestionList()).findByRole('option', { name: /Carol/ })).toBeInTheDocument();
        expect(sdk.UsersRequestBuilder).toHaveBeenCalled();
        unmount();
      }
    });

    it('disableMentions turns off member suggestions; in a group @all is still offered', async () => {
      covers('CometChatMessageComposer.disableMentions', 'true');
      const { unmount } = render(<CometChatMessageComposer user={bob} disableMentions />);
      type('hey @');
      await settle();
      expect(suggestions()).toBeNull();
      expect(sdk.fetchUsers).not.toHaveBeenCalled();
      unmount();

      render(<CometChatMessageComposer group={team} disableMentions />);
      type('hey @');
      const list = suggestionList();
      expect(within(list).getAllByRole('option')).toHaveLength(1);
      expect(within(list).getByRole('option')).toHaveTextContent('@all');
      await settle();
      expect(sdk.fetchMembers).not.toHaveBeenCalled();
    });

    it("an app's mentionsUsersRequestBuilder is the one suggestions come from", async () => {
      covers('CometChatMessageComposer.mentionsUsersRequestBuilder', 'used');
      const { builder, fetchNext } = appBuilder([new CometChat.User({ uid: 'erin', name: 'Erin' })]);
      render(
        <CometChatMessageComposer
          user={bob}
          mentionsUsersRequestBuilder={builder as unknown as CometChat.UsersRequestBuilder}
        />
      );
      type('hey @');
      expect(await within(suggestionList()).findByRole('option', { name: /Erin/ })).toBeInTheDocument();
      expect(fetchNext).toHaveBeenCalled();
      expect(sdk.fetchUsers).not.toHaveBeenCalled();
    });

    it("in a group, suggestions are the group's members, by default from the SDK's member list", async () => {
      covers('CometChatMessageComposer.mentionsGroupMembersRequestBuilder', 'default');
      render(<CometChatMessageComposer group={team} />);
      type('hey @');
      expect(await within(suggestionList()).findByRole('option', { name: /Dave/ })).toBeInTheDocument();
      expect(sdk.GroupMembersRequestBuilder).toHaveBeenCalledWith('team');
    });

    it("an app's mentionsGroupMembersRequestBuilder is the one member suggestions come from", async () => {
      covers('CometChatMessageComposer.mentionsGroupMembersRequestBuilder', 'used');
      const frank = new CometChat.GroupMember('frank', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      frank.setName('Frank');
      const { builder, fetchNext } = appBuilder([frank]);
      render(
        <CometChatMessageComposer
          group={team}
          mentionsGroupMembersRequestBuilder={builder as unknown as CometChat.GroupMembersRequestBuilder}
        />
      );
      type('hey @');
      expect(await within(suggestionList()).findByRole('option', { name: /Frank/ })).toBeInTheDocument();
      expect(fetchNext).toHaveBeenCalled();
      expect(sdk.fetchMembers).not.toHaveBeenCalled();
    });

    it('in a group @all is offered first, labelled "all", and inserts @all; on by default', async () => {
      covers('CometChatMessageComposer.disableMentionAll', 'false', 'default');
      covers('CometChatMessageComposer.mentionAllLabel', 'default');
      for (const props of [{ disableMentionAll: false }, {}]) {
        const { unmount } = render(<CometChatMessageComposer group={team} {...props} />);
        type('hey @');
        const list = suggestionList();
        await within(list).findByRole('option', { name: /Dave/ });
        const all = within(list).getByRole('option', { name: /@all/ });
        expect(within(list).getAllByRole('option')[0]).toBe(all);
        expect(all).toHaveTextContent('Notify everyone in this group');
        fireEvent.click(all);
        expect(textbox().querySelector('[data-uid="all"]')).toHaveTextContent('@all');
        unmount();
      }
    });

    it('disableMentionAll leaves @all out of the suggestions', async () => {
      covers('CometChatMessageComposer.disableMentionAll', 'true');
      render(<CometChatMessageComposer group={team} disableMentionAll />);
      type('hey @');
      const list = suggestionList();
      await within(list).findByRole('option', { name: /Dave/ });
      expect(within(list).getAllByRole('option')).toHaveLength(1);
      expect(within(list).queryByText(/@all/)).toBeNull();
    });

    it('onMentionSelected gets the picked user, and the mention is inserted', async () => {
      covers('CometChatMessageComposer.onMentionSelected', 'called');
      const onMentionSelected = vi.fn();
      render(<CometChatMessageComposer user={bob} onMentionSelected={onMentionSelected} />);
      type('hey @');
      fireEvent.click(await within(suggestionList()).findByRole('option', { name: /Carol/ }));
      expect(onMentionSelected).toHaveBeenCalledWith(carol);
      expect(textbox().querySelector('[data-uid="carol"]')).toHaveTextContent('@Carol');
      expect(suggestions()).toBeNull();
    });
  });

  describe('sending', () => {
    it('sendTextMessageOverride is called with the text instead of the SDK', async () => {
      covers('CometChatMessageComposer.sendTextMessageOverride', 'set');
      const sendTextMessageOverride = vi.fn(() => 'muid-1');
      render(<CometChatMessageComposer user={bob} sendTextMessageOverride={sendTextMessageOverride} />);
      type('  optimistic  ');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sendTextMessageOverride).toHaveBeenCalledWith('optimistic');
      });
      await settle();
      expect(sdk.sendMessage).not.toHaveBeenCalled();
      expect(textbox()).toBeEmptyDOMElement();
    });

    it('without sendTextMessageOverride the SDK sends the message', async () => {
      covers('CometChatMessageComposer.sendTextMessageOverride', 'default');
      render(<CometChatMessageComposer user={bob} />);
      await sendAndWait('via the SDK');
      expect(sentText().getText()).toBe('via the SDK');
      expect(textbox()).toBeEmptyDOMElement();
    });

    it("onSendButtonClick gets the SDK's sent message and the 'send' mode", async () => {
      covers('CometChatMessageComposer.onSendButtonClick', 'called');
      const onSendButtonClick = vi.fn();
      render(<CometChatMessageComposer user={bob} onSendButtonClick={onSendButtonClick} />);
      await sendAndWait('hello');
      expect(onSendButtonClick).toHaveBeenCalledTimes(1);
      expect(onSendButtonClick).toHaveBeenCalledWith(sentText(), 'send');
    });

    it('onError gets the error when sending fails', async () => {
      covers('CometChatMessageComposer.onError', 'called');
      const error = new CometChat.CometChatException({ code: 'ERR_BLOCKED', message: 'blocked' });
      sdk.sendMessage.mockRejectedValue(error);
      const onError = vi.fn();
      render(<CometChatMessageComposer user={bob} onError={onError} />);
      type('hello');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('onTextChange gets the text as the user types', () => {
      covers('CometChatMessageComposer.onTextChange', 'called');
      const onTextChange = vi.fn();
      render(<CometChatMessageComposer user={bob} onTextChange={onTextChange} />);
      type('he');
      type('hey');
      expect(onTextChange.mock.calls).toEqual([['he'], ['hey']]);
    });

    it('typing tells the other side the user is typing; on by default', async () => {
      covers('CometChatMessageComposer.disableTypingEvents', 'false', 'default');
      for (const props of [{ disableTypingEvents: false }, {}]) {
        sdk.startTyping.mockClear();
        const { unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        type('hey');
        await waitFor(() => {
          expect(sdk.startTyping).toHaveBeenCalledTimes(1);
        });
        const indicator = sdk.startTyping.mock.calls[0]?.[0] as CometChat.TypingIndicator;
        expect(indicator.getReceiverId()).toBe('bob');
        expect(indicator.getReceiverType()).toBe('user');
        unmount();
      }
    });

    it('disableTypingEvents sends no typing indicators', async () => {
      covers('CometChatMessageComposer.disableTypingEvents', 'true');
      render(<CometChatMessageComposer user={bob} disableTypingEvents />);
      type('hey');
      await settle();
      type('');
      await settle();
      expect(sdk.startTyping).not.toHaveBeenCalled();
      expect(sdk.endTyping).not.toHaveBeenCalled();
    });

    it('a sent message plays the outgoing sound; on by default', async () => {
      covers('CometChatMessageComposer.disableSoundForMessage', 'false', 'default');
      covers('CometChatMessageComposer.customSoundForMessage', 'default');
      for (const props of [{ disableSoundForMessage: false }, {}]) {
        sdk.sendMessage.mockClear();
        const sounds = watchSounds();
        const { unmount } = render(<CometChatMessageComposer user={bob} {...props} />);
        await sendAndWait();
        expect(sounds()).toEqual([OUTGOING_SOUND]);
        vi.restoreAllMocks();
        unmount();
      }
    });

    it('disableSoundForMessage sends silently', async () => {
      covers('CometChatMessageComposer.disableSoundForMessage', 'true');
      const sounds = watchSounds();
      render(<CometChatMessageComposer user={bob} disableSoundForMessage />);
      await sendAndWait();
      expect(sounds()).toEqual([]);
    });

    it('customSoundForMessage is the sound played on send', async () => {
      covers('CometChatMessageComposer.customSoundForMessage', 'set');
      const sounds = watchSounds();
      render(<CometChatMessageComposer user={bob} customSoundForMessage="https://example.com/whoosh.mp3" />);
      await sendAndWait();
      expect(sounds()).toEqual(['https://example.com/whoosh.mp3']);
    });
  });

  describe('rich text', () => {
    it('enableRichTextEditor adds the formatting toolbar and sends its formatting as markdown; off by default', async () => {
      covers('CometChatMessageComposer.enableRichTextEditor', 'true', 'false', 'default');
      const { unmount } = render(<CometChatMessageComposer user={bob} enableRichTextEditor />);
      const toolbar = screen.getByRole('toolbar');
      expect(within(toolbar).getByRole('button', { name: /bold/i })).toBeInTheDocument();
      const editor = textbox();
      editor.innerHTML = '<b>ship</b> it';
      fireEvent.input(editor);
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getText()).toBe('**ship** it');
      unmount();

      for (const props of [{ enableRichTextEditor: false }, {}]) {
        sdk.sendMessage.mockClear();
        const view = render(<CometChatMessageComposer user={bob} {...props} />);
        expect(screen.queryByRole('toolbar')).toBeNull();
        const input = textbox();
        input.innerHTML = '<b>ship</b> it';
        fireEvent.input(input);
        fireEvent.click(sendButton());
        await waitFor(() => {
          expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
        });
        expect(sentText().getText()).toBe('ship it');
        view.unmount();
      }
    });

    it('hideRichTextFormattingOptions hides the toolbar but keeps the rich text editor; shown by default', () => {
      covers('CometChatMessageComposer.hideRichTextFormattingOptions', 'true', 'false', 'default');
      const { unmount } = render(
        <CometChatMessageComposer user={bob} enableRichTextEditor hideRichTextFormattingOptions />
      );
      expect(screen.queryByRole('toolbar')).toBeNull();
      expect(textbox()).toHaveAttribute('data-placeholder', 'Enter your message here');
      unmount();
      for (const props of [{ hideRichTextFormattingOptions: false }, {}]) {
        const view = render(<CometChatMessageComposer user={bob} enableRichTextEditor {...props} />);
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
        view.unmount();
      }
    });

    it('toolbarTrailingView is added after the built-in formatting buttons', () => {
      covers('CometChatMessageComposer.toolbarTrailingView', 'custom');
      render(
        <CometChatMessageComposer
          user={bob}
          enableRichTextEditor
          toolbarTrailingView={<button type="button">Colour</button>}
        />
      );
      const buttons = within(screen.getByRole('toolbar')).getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
      expect(buttons[buttons.length - 1]).toHaveTextContent('Colour');
    });
  });

  describe('edit and reply', () => {
    it('messageToEdit opens edit mode: the preview, its text in the input, and Save edits that message', async () => {
      covers('CometChatMessageComposer.messageToEdit', 'set');
      const onSendButtonClick = vi.fn();
      const { container } = render(
        <CometChatMessageComposer
          user={bob}
          messageToEdit={textMessage(7, 'old text')}
          onSendButtonClick={onSendButtonClick}
        />
      );
      expect(editPreview(container)).toHaveTextContent('Edit message');
      expect(editPreview(container)).toHaveTextContent('old text');
      expect(textbox()).toHaveTextContent('old text');
      type('new text');
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => {
        expect(sdk.editMessage).toHaveBeenCalledTimes(1);
      });
      const edited = sdk.editMessage.mock.calls[0]?.[0] as CometChat.TextMessage;
      expect(edited.getId()).toBe(7);
      expect(edited.getText()).toBe('new text');
      expect(sdk.sendMessage).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(onSendButtonClick).toHaveBeenCalledWith(edited, 'edit');
      });
      expect(editPreview(container)).toBeNull();
    });

    it('without messageToEdit there is no edit preview and the button sends', () => {
      covers('CometChatMessageComposer.messageToEdit', 'default');
      const { container } = render(<CometChatMessageComposer user={bob} />);
      expect(editPreview(container)).toBeNull();
      expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
      expect(sendButton()).toBeInTheDocument();
    });

    it("messageToReply shows the reply preview and quotes that message in what's sent", async () => {
      covers('CometChatMessageComposer.messageToReply', 'set');
      const { container } = render(<CometChatMessageComposer user={bob} messageToReply={textMessage(9, 'Lunch?')} />);
      expect(replyPreview(container)).toHaveTextContent('Alice');
      expect(replyPreview(container)).toHaveTextContent('Lunch?');
      type('Sure');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getQuotedMessageId()).toBe(9);
      expect(replyPreview(container)).toBeNull();
    });

    it('without messageToReply there is no reply preview and nothing is quoted', async () => {
      covers('CometChatMessageComposer.messageToReply', 'default');
      const { container } = render(<CometChatMessageComposer user={bob} />);
      expect(replyPreview(container)).toBeNull();
      type('Hello');
      fireEvent.click(sendButton());
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
      expect(sentText().getQuotedMessageId()).toBeFalsy();
    });

    it('onClosePreview fires when the reply or edit preview is closed', () => {
      covers('CometChatMessageComposer.onClosePreview', 'called');
      const onClosePreview = vi.fn();
      const { container, unmount } = render(
        <CometChatMessageComposer
          user={bob}
          messageToReply={textMessage(9, 'Lunch?')}
          onClosePreview={onClosePreview}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Close reply preview' }));
      expect(onClosePreview).toHaveBeenCalledTimes(1);
      expect(replyPreview(container)).toBeNull();
      unmount();

      const view = render(
        <CometChatMessageComposer
          user={bob}
          messageToEdit={textMessage(7, 'old text')}
          onClosePreview={onClosePreview}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cancel edit' }));
      expect(onClosePreview).toHaveBeenCalledTimes(2);
      expect(editPreview(view.container)).toBeNull();
    });

    it('headerView takes the place of the reply and edit previews', () => {
      covers('CometChatMessageComposer.headerView', 'custom');
      const { container } = render(
        <CometChatMessageComposer
          user={bob}
          messageToReply={textMessage(9, 'Lunch?')}
          headerView={<div>Be kind in this chat</div>}
        />
      );
      expect(screen.getByText('Be kind in this chat')).toBeInTheDocument();
      expect(replyPreview(container)).toBeNull();
    });

    it('textFormatters format the text shown in the reply preview; by default it is shown as is', () => {
      covers('CometChatMessageComposer.textFormatters', 'set', 'default');
      const reply = textMessage(9, 'ship #release today');
      const { container, unmount } = render(
        <CometChatMessageComposer user={bob} messageToReply={reply} textFormatters={[new HashtagFormatter()]} />
      );
      expect(replyPreview(container)?.querySelector('span.hashtag')).toHaveTextContent('#release');
      unmount();
      const view = render(<CometChatMessageComposer user={bob} messageToReply={reply} />);
      expect(replyPreview(view.container)?.querySelector('span.hashtag')).toBeNull();
      expect(replyPreview(view.container)).toHaveTextContent('ship #release today');
    });
  });

  describe('buttons', () => {
    it('each hide…Button prop removes its button; every button is shown by default', () => {
      covers('CometChatMessageComposer.hideAttachmentButton', 'true', 'false', 'default');
      covers('CometChatMessageComposer.hideEmojiKeyboardButton', 'true', 'false', 'default');
      covers('CometChatMessageComposer.hideVoiceRecordingButton', 'true', 'false', 'default');
      covers('CometChatMessageComposer.hideStickersButton', 'true', 'false', 'default');
      covers('CometChatMessageComposer.hideSendButton', 'true', 'false', 'default');
      const buttons = [
        ['hideAttachmentButton', 'Attachments'],
        ['hideEmojiKeyboardButton', 'Emoji'],
        ['hideVoiceRecordingButton', 'Voice recording'],
        ['hideStickersButton', 'Sticker'],
        ['hideSendButton', 'Send'],
      ] as const;
      for (const [prop, label] of buttons) {
        const { unmount } = render(<CometChatMessageComposer user={bob} {...{ [prop]: true }} />);
        expect(screen.queryByRole('button', { name: label })).toBeNull();
        // Only that one: the others stay.
        for (const [, other] of buttons) {
          if (other !== label) expect(screen.getByRole('button', { name: other })).toBeInTheDocument();
        }
        unmount();
        for (const props of [{ [prop]: false }, {}]) {
          const view = render(<CometChatMessageComposer user={bob} {...props} />);
          expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
          view.unmount();
        }
      }
    });

    it('sendButtonView replaces the icon inside Send, which still sends', async () => {
      covers('CometChatMessageComposer.sendButtonView', 'custom');
      render(<CometChatMessageComposer user={bob} sendButtonView={<span>Go</span>} />);
      const send = sendButton();
      expect(send).toHaveTextContent('Go');
      expect(send.querySelector('img')).toBeNull();
      type('custom send');
      fireEvent.click(send);
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
      });
    });

    it('auxiliaryButtonView adds buttons to the actions row, before Send', () => {
      covers('CometChatMessageComposer.auxiliaryButtonView', 'custom');
      const { container } = render(
        <CometChatMessageComposer user={bob} auxiliaryButtonView={<button type="button">Share location</button>} />
      );
      const extra = screen.getByRole('button', { name: 'Share location' });
      const actions = container.querySelector<HTMLElement>('.cometchat-message-composer__actions');
      if (!actions) throw new Error('no actions row');
      expect(within(actions).getByRole('button', { name: 'Share location' })).toBe(extra);
      expect(extra.compareDocumentPosition(sendButton()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  /*
   * Props that don't do what their types say. `it.fails` passes while the issue is there and fails
   * as soon as it is fixed: then change it to `it`, and claim the case with covers().
   */
  describe('known issues', () => {
    // Known issue: Root puts these three views in context, but the attachment, emoji and voice
    // buttons never read them and always draw their own icon.
    it.fails('attachmentButtonIconView replaces the icon inside the attachment button', () => {
      render(<CometChatMessageComposer user={bob} attachmentButtonIconView={<span>Clip</span>} />);
      expect(screen.getByRole('button', { name: 'Attachments' })).toHaveTextContent('Clip');
    });

    it.fails('emojiButtonIconView replaces the icon inside the emoji button', () => {
      render(<CometChatMessageComposer user={bob} emojiButtonIconView={<span>Smile</span>} />);
      expect(screen.getByRole('button', { name: 'Emoji' })).toHaveTextContent('Smile');
    });

    it.fails('voiceRecordingButtonIconView replaces the icon inside the voice recording button', () => {
      render(<CometChatMessageComposer user={bob} voiceRecordingButtonIconView={<span>Mic</span>} />);
      expect(screen.getByRole('button', { name: 'Voice recording' })).toHaveTextContent('Mic');
    });

    // Known issue: the input focuses itself on desktop and never on mobile, whatever
    // disableAutoFocusOnMobile says; nothing reads the prop.
    it.fails('disableAutoFocusOnMobile={false} focuses the input on mobile too', () => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
      );
      render(<CometChatMessageComposer user={bob} disableAutoFocusOnMobile={false} />);
      expect(textbox()).toHaveFocus();
    });

    // Known issue: the composer has no AI button and no live reaction button, so hideAIButton,
    // hideLiveReaction and liveReactionIcon change nothing.
    it.fails('hideAIButton={false} adds the AI button', () => {
      const { unmount } = render(<CometChatMessageComposer user={bob} />);
      const withoutAI = screen.getAllByRole('button').length;
      unmount();
      render(<CometChatMessageComposer user={bob} hideAIButton={false} />);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(withoutAI);
    });

    it.fails('the live reaction button is shown unless hideLiveReaction', () => {
      const { unmount } = render(<CometChatMessageComposer user={bob} hideLiveReaction />);
      const withoutReaction = screen.getAllByRole('button').length;
      unmount();
      render(<CometChatMessageComposer user={bob} />);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(withoutReaction);
    });

    it.fails('liveReactionIcon is the icon of the live reaction button', () => {
      const { container } = render(
        <CometChatMessageComposer user={bob} liveReactionIcon="https://example.com/heart.svg" />
      );
      expect(container.querySelector('img[src="https://example.com/heart.svg"]')).not.toBeNull();
    });

    // Known issue: the tray never reads showAttachmentPreview; staged images always get a thumbnail.
    it.fails('showAttachmentPreview={false} stages files without preview thumbnails', () => {
      render(<CometChatMessageComposer user={bob} showAttachmentPreview={false} />);
      pickFiles('Attach Image', [new File(['png'], 'cat.png', { type: 'image/png' })]);
      expect(tray()?.querySelector('.cometchat-message-composer__tray-thumbnail')).toBeNull();
    });

    // Known issue: there is no bubble menu; nothing reads showBubbleMenuOnSelection.
    it.fails('showBubbleMenuOnSelection offers formatting next to selected text', () => {
      render(
        <CometChatMessageComposer
          user={bob}
          enableRichTextEditor
          hideRichTextFormattingOptions
          showBubbleMenuOnSelection
        />
      );
      const editor = textbox();
      editor.textContent = 'make this bold';
      const range = document.createRange();
      range.setStart(editor.firstChild as Text, 5);
      range.setEnd(editor.firstChild as Text, 9);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      fireEvent.mouseUp(editor);
      fireEvent(document, new Event('selectionchange'));
      expect(screen.queryByRole('button', { name: /bold/i })).not.toBeNull();
    });

    // Known issue: the @all suggestion reads `getLocalizedString('message_composer_mention_' + label)
    // || label`, but a missing key comes back as the key itself, so a custom label shows as
    // "@message_composer_mention_everyone". (The mention inserted does read "@everyone".)
    it.fails('mentionAllLabel is the label of the @all suggestion', async () => {
      render(<CometChatMessageComposer group={team} mentionAllLabel="everyone" />);
      type('hey @');
      const list = suggestionList();
      await within(list).findByRole('option', { name: /Dave/ });
      expect(within(list).getAllByRole('option')[0]).toHaveTextContent('@everyone');
    });

    // Known issue: only the single-send path calls onAttachmentAdded/onAttachmentRemoved; staging a
    // file in the tray (the default) or removing it from there calls neither.
    it.fails('onAttachmentAdded gets a file staged in the tray', () => {
      const onAttachmentAdded = vi.fn();
      render(<CometChatMessageComposer user={bob} onAttachmentAdded={onAttachmentAdded} />);
      const file = pdf();
      pickFiles('Attach File', [file]);
      expect(onAttachmentAdded).toHaveBeenCalledWith(file);
    });

    it.fails('onAttachmentRemoved gets a file removed from the tray', () => {
      const onAttachmentRemoved = vi.fn();
      render(<CometChatMessageComposer user={bob} onAttachmentRemoved={onAttachmentRemoved} />);
      const file = pdf();
      pickFiles('Attach File', [file]);
      fireEvent.click(within(stagedTray()).getByRole('button', { name: 'Remove attachment' }));
      expect(onAttachmentRemoved).toHaveBeenCalledWith(file);
    });
  });
});
