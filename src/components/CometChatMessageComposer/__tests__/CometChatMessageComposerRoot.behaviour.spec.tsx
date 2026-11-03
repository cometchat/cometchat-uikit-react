/**
 * Behaviour of CometChatMessageComposer.Root's own wiring, with the composer data hook,
 * the rich text editor hook and the mentions hook replaced by controllable fakes: how sends,
 * edits, Enter, emoji, links, mentions, edit seeding, custom formatters, drag & drop, paste,
 * voice recording and the validation toast are routed and rendered.
 */
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { mockCometChat } from '../../../testing/mock-sdk';
import type { useCometChatMessageComposer } from '../useCometChatMessageComposer';
import type {
  UseRichTextEditorOptions,
  UseRichTextEditorReturn,
} from '../../../utils/RichTextEditor/useRichTextEditor';
import type {
  UseCometChatMentionsOptions,
  UseCometChatMentionsReturn,
} from '../useCometChatMentions';
import type { CometChatMessageComposerAction } from '../CometChatMessageComposer.reducer';
import type {
  CometChatMessageComposerContextValue,
  TrayItem,
} from '../CometChatMessageComposer.types';

type HookOptions = Parameters<typeof useCometChatMessageComposer>[0];
type HookReturn = ReturnType<typeof useCometChatMessageComposer>;

interface RecorderProps {
  onClose: () => void;
  onSubmit: (blob: Blob) => void;
  onError: (error: Error) => void;
}

interface MentionsListProps {
  isOpen: boolean;
  usersRequestBuilder?: unknown;
  groupMembersRequestBuilder?: unknown;
}

const mocks = vi.hoisted(() => {
  const editorRef: { current: HTMLDivElement | null } = { current: null };
  return {
    editorRef,
    editorInstance: { refresh: vi.fn() },
    dispatch: null as ((action: CometChatMessageComposerAction) => void) | null,
    ctx: null as CometChatMessageComposerContextValue | null,
    rteOptions: null as UseRichTextEditorOptions | null,
    mentionsOptions: null as UseCometChatMentionsOptions | null,
    mentionsListProps: null as MentionsListProps | null,
    recorderProps: null as RecorderProps | null,
    mentionsOpen: false,
    savedSelection: null as Range | null,
    currentLink: null as string | null,
    currentLinkText: null as string | null,
    hook: {
      sendMessage: vi.fn<HookReturn['sendMessage']>(),
      sendBatch: vi.fn<HookReturn['sendBatch']>(),
      editMessage: vi.fn<HookReturn['editMessage']>(),
      sendMediaMessage: vi.fn<HookReturn['sendMediaMessage']>(),
      insertEmoji: vi.fn<HookReturn['insertEmoji']>(),
      startUpload: vi.fn<HookReturn['mediaUploadManager']['startUpload']>(),
    },
    rte: {
      clear: vi.fn(() => {
        if (editorRef.current) editorRef.current.innerHTML = '';
      }),
      insertPlainText: vi.fn((text: string) => {
        editorRef.current?.append(text);
      }),
      focus: vi.fn<(position?: 'start' | 'end') => void>(),
      saveSelection: vi.fn<() => Range | null>(),
      restoreSelection: vi.fn<(range: Range | null) => void>(),
      setLink: vi.fn<(url: string | null, text?: string) => void>(),
      insertMention: vi.fn<(id: string, label: string, chars: number, isSelf?: boolean) => void>(),
    },
    mentions: {
      handleMentionStart: vi.fn<(query: string) => void>(),
      handleMentionEnd: vi.fn(),
      handleKeyDown: vi.fn<(e: KeyboardEvent) => boolean>(),
      seedMentionedUsers: vi.fn<(users: { uid: string; name: string }[]) => void>(),
      clearMentionedUsers: vi.fn(),
    },
    inlineSend: vi.fn(),
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));
vi.mock('../useCometChatMessageComposer', () => ({ useCometChatMessageComposer: useFakeComposer }));
vi.mock('../../../utils/RichTextEditor/useRichTextEditor', () => ({
  useRichTextEditor: useFakeRichText,
}));
vi.mock('../useCometChatMentions', () => ({ useCometChatMentions: useFakeMentions }));

vi.mock('../CometChatMessageComposerAttachmentButton', () => ({
  CometChatMessageComposerAttachmentButton: () => null,
}));
vi.mock('../CometChatMessageComposerStickerButton', () => ({
  CometChatMessageComposerStickerButton: () => null,
}));
vi.mock('../CometChatMessageComposerEditPreview', () => ({
  CometChatMessageComposerEditPreview: () => <div data-testid="edit-preview" />,
}));
vi.mock('../CometChatMessageComposerReplyPreview', () => ({
  CometChatMessageComposerReplyPreview: () => null,
}));
vi.mock('../CometChatMessageComposerTray', () => ({ CometChatMessageComposerTray: () => null }));
vi.mock('../CometChatMessageComposerEmojiButton', () => ({
  CometChatMessageComposerEmojiButton: () => <EmojiButtonStub />,
}));
vi.mock('../CometChatMessageComposerVoiceButton', () => ({
  CometChatMessageComposerVoiceButton: () => <VoiceButtonStub />,
}));
vi.mock('../CometChatMessageComposerMentionsList', () => ({
  CometChatMessageComposerMentionsList: (props: MentionsListProps) => {
    mocks.mentionsListProps = props;
    return <div data-testid="mentions-list" />;
  },
}));
vi.mock('../../base/CometChatFormattingToolbar/CometChatFormattingToolbar', () => ({
  CometChatFormattingToolbar: ({ onLink }: { onLink: () => void }) => (
    <button type="button" aria-label="Insert link" onClick={onLink} />
  ),
}));
vi.mock('../../base/CometChatLinkDialog/CometChatLinkDialog', () => ({
  CometChatLinkDialog: (props: {
    mode: 'add' | 'edit';
    initialText: string;
    initialUrl: string;
    selectedText: string;
    onSave: (value: { text: string; url: string }) => void;
    onCancel: () => void;
  }) => (
    <div
      role="dialog"
      aria-label={`link dialog (${props.mode})`}
      data-initial-text={props.initialText}
      data-initial-url={props.initialUrl}
      data-selected-text={props.selectedText}
    >
      <button
        type="button"
        onClick={() => {
          props.onSave({ text: 'Docs', url: 'https://example.com' });
        }}
      >
        Save link
      </button>
      <button type="button" onClick={props.onCancel}>
        Cancel link
      </button>
    </div>
  ),
}));
vi.mock('../../base/CometChatLinkPopover/CometChatLinkPopover', () => ({
  CometChatLinkPopover: (props: {
    url: string;
    text: string;
    position: { top: number; left: number };
    onEdit: (value: { url: string; text: string }) => void;
    onRemove: () => void;
    onClose: () => void;
  }) => (
    <div data-testid="link-popover" data-top={props.position.top} data-left={props.position.left}>
      {props.url}
      <button
        type="button"
        onClick={() => {
          props.onEdit({ url: props.url, text: props.text });
        }}
      >
        Edit link
      </button>
      <button type="button" onClick={props.onRemove}>
        Remove link
      </button>
      <button type="button" onClick={props.onClose}>
        Close popover
      </button>
    </div>
  ),
}));
vi.mock('../../base/CometChatMediaRecorder/CometChatMediaRecorder', () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    CometChatMediaRecorder: {
      Root: (props: RecorderProps & { children: React.ReactNode }) => {
        mocks.recorderProps = props;
        return <div data-testid="recorder">{props.children}</div>;
      },
      Controls: () => null,
      Timer: () => null,
      ErrorView: () => null,
      RecordingView: Pass,
      PreviewView: Pass,
    },
  };
});
vi.mock('../../base/CometChatMediaRecorder/CometChatMediaRecorder.context', () => ({
  useCometChatMediaRecorderContext: () => ({ inlineSend: mocks.inlineSend }),
}));

import { initialComposerState, composerReducer } from '../CometChatMessageComposer.reducer';
import { useCometChatMessageComposerContext } from '../CometChatMessageComposer.context';
import { DEFAULT_FORMAT_STATE } from '../../../utils/RichTextEditor/RichTextEditor.types';
import { createMentionElement } from '../../../utils/RichTextEditor/mentions';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { CometChatMessageComposerRoot } from '../CometChatMessageComposerRoot';

// --- Fakes ------------------------------------------------------------------

function useFakeComposer(options: HookOptions): HookReturn {
  const [state, dispatch] = useReducer(composerReducer, {
    ...initialComposerState,
    text: options.initialText ?? '',
  });
  const inputRef = useRef<HTMLDivElement>(null);
  mocks.dispatch = dispatch;

  useEffect(() => {
    if (options.messageToEdit !== undefined) {
      dispatch({ type: 'SET_EDIT_MESSAGE', message: options.messageToEdit });
    }
  }, [options.messageToEdit]);
  useEffect(() => {
    if (options.text !== undefined) dispatch({ type: 'SET_TEXT', text: options.text });
  }, [options.text]);

  const setText = useCallback((text: string) => {
    dispatch({ type: 'SET_TEXT', text });
  }, []);
  const setContentToDisplay = useCallback<HookReturn['setContentToDisplay']>(content => {
    dispatch({ type: 'SET_CONTENT_TO_DISPLAY', content });
  }, []);
  const setRecording = useCallback((isRecording: boolean) => {
    dispatch({ type: 'SET_RECORDING', isRecording });
  }, []);
  const setDragging = useCallback((isDragging: boolean) => {
    dispatch({ type: 'SET_DRAGGING', isDragging });
  }, []);
  const dismissValidationError = useCallback(() => {
    dispatch({ type: 'SET_VALIDATION_ERROR', show: false });
  }, []);
  const setEditDirty = useCallback((isDirty: boolean) => {
    dispatch({ type: 'SET_EDIT_DIRTY', isDirty });
  }, []);

  const edit = state.textMessageToEdit;
  const originalText = edit ? editableText(edit) : '';
  const trayHasItems = state.tray.items.length > 0;
  const canSend = trayHasItems
    ? state.tray.items.every(i => i.status === 'success')
    : state.text.length > 0 && (!edit || state.text !== originalText || state.isEditDirty);

  return {
    state,
    dispatch,
    canSend,
    isInEditMode: edit !== null,
    isInReplyMode: state.messageToReply !== null,
    showVoiceButton: state.text.length === 0 && !trayHasItems,
    mediaUploadManager: {
      startUpload: mocks.hook.startUpload,
      removeItem: vi.fn(),
      retryItem: vi.fn(),
      clear: vi.fn(),
      sendable: canSend,
      maxAttachmentCount: 5,
      getActiveRequest: () => null,
    },
    setText,
    sendMessage: mocks.hook.sendMessage,
    sendMediaMessage: mocks.hook.sendMediaMessage,
    sendBatch: mocks.hook.sendBatch,
    playOutgoingSound: vi.fn(),
    editMessage: mocks.hook.editMessage,
    insertEmoji: mocks.hook.insertEmoji,
    setContentToDisplay,
    closePreview: vi.fn(),
    setRecording,
    setDragging,
    dismissValidationError,
    setEditDirty,
    startTyping: vi.fn(),
    endTyping: vi.fn(),
    inputRef,
    onMentionSelected: options.onMentionSelected,
  };
}

function useFakeRichText(options: UseRichTextEditorOptions): UseRichTextEditorReturn {
  mocks.rteOptions = options;
  const noop = () => undefined;
  return {
    editorRef: mocks.editorRef,
    formatState: DEFAULT_FORMAT_STATE,
    editor: options.enabled
      ? (mocks.editorInstance as unknown as UseRichTextEditorReturn['editor'])
      : null,
    toggleBold: noop,
    toggleItalic: noop,
    toggleUnderline: noop,
    toggleStrikethrough: noop,
    toggleInlineCode: noop,
    toggleCodeBlock: noop,
    toggleBlockquote: noop,
    toggleOrderedList: noop,
    toggleBulletList: noop,
    setLink: mocks.rte.setLink,
    getCurrentLink: () => mocks.currentLink,
    getCurrentLinkText: () => mocks.currentLinkText,
    getSelectedText: () => '',
    undo: noop,
    redo: noop,
    insertText: noop,
    insertPlainText: mocks.rte.insertPlainText,
    insertMention: mocks.rte.insertMention,
    getHTML: () => '',
    getText: () => '',
    getTextWithMentionFormat: () => '',
    clear: mocks.rte.clear,
    focus: mocks.rte.focus,
    isEmpty: () => true,
    saveSelection: mocks.rte.saveSelection,
    restoreSelection: mocks.rte.restoreSelection,
  };
}

function useFakeMentions(options: UseCometChatMentionsOptions): UseCometChatMentionsReturn {
  mocks.mentionsOptions = options;
  return {
    isOpen: mocks.mentionsOpen,
    searchKeyword: '',
    handleMentionStart: mocks.mentions.handleMentionStart,
    handleMentionEnd: mocks.mentions.handleMentionEnd,
    handleItemClick: () => undefined,
    handleEmpty: () => undefined,
    handleKeyDown: mocks.mentions.handleKeyDown,
    getMentionedUsers: () => [],
    clearMentionedUsers: mocks.mentions.clearMentionedUsers,
    seedMentionedUsers: mocks.mentions.seedMentionedUsers,
  };
}

function CaptureContext() {
  mocks.ctx = useCometChatMessageComposerContext();
  return null;
}

function EmojiButtonStub() {
  const ctx = useCometChatMessageComposerContext();
  mocks.ctx = ctx;
  return (
    <button
      type="button"
      aria-label="Emoji"
      aria-expanded={ctx.contentToDisplay === 'emojiKeyboard'}
      onClick={() => {
        ctx.setContentToDisplay('emojiKeyboard');
      }}
    />
  );
}

function VoiceButtonStub() {
  const { setRecording } = useCometChatMessageComposerContext();
  return (
    <button
      type="button"
      aria-label="Record voice"
      onClick={() => {
        setRecording(true);
      }}
    />
  );
}

// --- Helpers ----------------------------------------------------------------

interface EditableOptions {
  id?: number;
  text?: string;
  caption?: string;
  mentioned?: CometChat.User[];
  metadata?: Record<string, unknown>;
  mentionsThrow?: boolean;
  metadataThrows?: boolean;
}

function editableText(message: CometChat.TextMessage | CometChat.MediaMessage): string {
  return message.getType() === 'text' && 'getText' in message
    ? message.getText()
    : (message as CometChat.MediaMessage).getCaption() || '';
}

function textMessage(o: EditableOptions): CometChat.TextMessage {
  return {
    getId: () => o.id ?? 1,
    getType: () => 'text',
    getText: () => o.text ?? '',
    getMentionedUsers: () => {
      if (o.mentionsThrow) throw new Error('no mention metadata');
      return o.mentioned ?? [];
    },
    getMetadata: () => {
      if (o.metadataThrows) throw new Error('unreadable metadata');
      return o.metadata ?? {};
    },
  } as unknown as CometChat.TextMessage;
}

function mediaMessage(o: EditableOptions): CometChat.MediaMessage {
  return {
    getId: () => o.id ?? 2,
    getType: () => 'image',
    getCaption: () => o.caption ?? '',
    getMentionedUsers: () => o.mentioned ?? [],
    getMetadata: () => o.metadata ?? {},
  } as unknown as CometChat.MediaMessage;
}

const makeUser = (uid: string, name: string) =>
  ({ getUid: () => uid, getName: () => name, getAvatar: () => '' }) as unknown as CometChat.User;

const RECEIVER = makeUser('cometchat-uid-2', 'Andrew');
const OTHER_RECEIVER = makeUser('cometchat-uid-3', 'Bella');
const MEMBER = makeUser('member5', 'Member 5');
const GROUP = {
  getGuid: () => 'group-1',
  getName: () => 'Team',
  getIcon: () => '',
} as unknown as CometChat.Group;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

function dispatch(action: CometChatMessageComposerAction): void {
  const fn = mocks.dispatch;
  if (!fn) throw new Error('composer is not mounted');
  act(() => {
    fn(action);
  });
}

function ctx(): CometChatMessageComposerContextValue {
  if (!mocks.ctx) throw new Error('composer context was not captured');
  return mocks.ctx;
}

function rte(): UseRichTextEditorOptions {
  if (!mocks.rteOptions) throw new Error('rich text editor was not initialised');
  return mocks.rteOptions;
}

function mentionsOptions(): UseCometChatMentionsOptions {
  if (!mocks.mentionsOptions) throw new Error('mentions hook was not initialised');
  return mocks.mentionsOptions;
}

function getEditor(): HTMLDivElement {
  const el = mocks.editorRef.current;
  if (!el) throw new Error('rich text editor element is not mounted');
  return el;
}

function getRoot(container: HTMLElement): HTMLElement {
  const root = container.querySelector<HTMLElement>('.cometchat-message-composer');
  if (!root) throw new Error('composer root not rendered');
  return root;
}

/** Simulates the editor reporting a content change, as the real editor does on input. */
function editorTypes(html: string, plainText: string): void {
  getEditor().innerHTML = html;
  const onUpdate = rte().onUpdate;
  if (!onUpdate) throw new Error('editor has no onUpdate');
  act(() => {
    onUpdate(html, plainText);
  });
}

function pressEnterInEditor(): void {
  const onEnter = rte().onEnterPress;
  if (!onEnter) throw new Error('Enter is not wired to send');
  act(() => {
    onEnter();
  });
}

/** Type `value` into the plain contentEditable and put the caret at its end. */
function typeInto(input: HTMLElement, value: string): void {
  input.focus();
  input.textContent = value;
  const textNode = input.firstChild;
  if (!textNode) throw new Error('expected a text node');
  placeCaret(textNode, value.length);
  fireEvent.input(input);
}

function placeCaret(node: Node, offset: number): Range {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return range;
}

let nextFileId = 0;
function trayItem(status: TrayItem['status']): TrayItem {
  nextFileId += 1;
  return {
    fileId: `f${String(nextFileId)}`,
    file: new File(['x'], 'photo.png', { type: 'image/png' }),
    kind: 'image',
    status,
    percent: status === 'success' ? 100 : 40,
  };
}

const sendButton = () => screen.getByRole('button', { name: /^send$/i });
const saveButton = () => screen.getByRole('button', { name: /^save$/i });

// --- Formatters (module-level: `textFormatters` is an effect dependency) -----

class TagFormatter extends CometChatTextFormatter {
  readonly id: string;
  constructor(id: string, priority: number) {
    super();
    this.id = id;
    this.priority = priority;
  }
  override getOriginalText(inputText?: string): string {
    return `${inputText ?? ''}|orig:${this.id}`;
  }
  override getFormattedText(inputText?: string): string {
    return `${inputText ?? ''}|fmt:${this.id}`;
  }
}

class BrokenFormatter extends CometChatTextFormatter {
  readonly id = 'broken';
  override getOriginalText(): string {
    throw new Error('broken formatter');
  }
  override getFormattedText(): string {
    throw new Error('broken formatter');
  }
}

const PASTE_FORMATTERS = [
  new TagFormatter('b', 20),
  new BrokenFormatter(),
  new TagFormatter('a', 10),
];

class TrackingFormatter extends CometChatTextFormatter {
  readonly id = 'tracking';
}
const TRACKING_FORMATTER = new TrackingFormatter();
const TRACKING_FORMATTERS = [TRACKING_FORMATTER];

/** Renders stored `{red}…{/red}` tokens as a span, like a colour formatter. */
class RedFormatter extends CometChatTextFormatter {
  readonly id = 'red';
  override getFormattedText(inputText?: string): string {
    return (inputText ?? '').replace(/\{red\}(.*?)\{\/red\}/g, '<span class="red">$1</span>');
  }
}

const formatTextSeen = vi.fn<(html: string | undefined) => void>();
/** Imperative formatter that re-wraps live input (overrides formatText). */
class LiveFormatter extends CometChatTextFormatter {
  readonly id = 'live';
  override formatText(): void {
    formatTextSeen(this.inputElementReference?.innerHTML);
  }
}

/** A formatter relying on the base formatText, which would flatten the editor if called. */
class PlainDisplayFormatter extends CometChatTextFormatter {
  readonly id = 'plain-display';
}

const SEED_FORMATTERS = [new RedFormatter(), new LiveFormatter(), new PlainDisplayFormatter()];
const BROKEN_FORMATTERS = [new BrokenFormatter()];

// --- Tests --------------------------------------------------------------------

describe('CometChatMessageComposerRoot behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ctx = null;
    mocks.rteOptions = null;
    mocks.mentionsOptions = null;
    mocks.mentionsListProps = null;
    mocks.recorderProps = null;
    mocks.mentionsOpen = false;
    mocks.savedSelection = null;
    mocks.currentLink = null;
    mocks.currentLinkText = null;
    mocks.hook.sendMessage.mockResolvedValue(undefined);
    mocks.hook.sendBatch.mockResolvedValue(undefined);
    mocks.hook.editMessage.mockResolvedValue(undefined);
    mocks.hook.sendMediaMessage.mockResolvedValue(undefined);
    mocks.rte.saveSelection.mockImplementation(() => mocks.savedSelection);
    mocks.mentions.handleKeyDown.mockReturnValue(false);
    mockCometChat.isInitialized = vi.fn().mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.getSelection()?.removeAllRanges();
  });

  describe('attachment validation toast', () => {
    it('shows the count-exceeded message with the per-batch maximum', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      dispatch({ type: 'SET_VALIDATION_ERROR', show: true, text: 'attachment_count_exceeded' });

      expect(screen.getByRole('status')).toHaveTextContent(
        'You can attach up to 5 files at a time'
      );
    });

    it('shows text that is not a localization key as-is', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      dispatch({ type: 'SET_VALIDATION_ERROR', show: true, text: 'That file is too large' });

      expect(screen.getByRole('status')).toHaveTextContent('That file is too large');
    });

    it('renders nothing when the error carries no text', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      dispatch({ type: 'SET_VALIDATION_ERROR', show: true, text: null });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('is dismissed when the toast closes', () => {
      render(<CometChatMessageComposerRoot />, { wrapper });
      dispatch({ type: 'SET_VALIDATION_ERROR', show: true, text: 'attachment_count_exceeded' });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('is suppressed by hideError', () => {
      render(<CometChatMessageComposerRoot hideError />, { wrapper });
      dispatch({ type: 'SET_VALIDATION_ERROR', show: true, text: 'attachment_count_exceeded' });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('voice recording', () => {
    function startRecording(props: React.ComponentProps<typeof CometChatMessageComposerRoot> = {}) {
      const view = render(<CometChatMessageComposerRoot user={RECEIVER} {...props} />, {
        wrapper,
      });
      fireEvent.click(screen.getByRole('button', { name: 'Record voice' }));
      return view;
    }

    function recorder(): RecorderProps {
      if (!mocks.recorderProps) throw new Error('recorder is not open');
      return mocks.recorderProps;
    }

    it('opens the recorder with a send button that submits the recording', () => {
      const { container } = startRecording();

      expect(screen.getByTestId('recorder')).toBeInTheDocument();
      expect(getRoot(container)).toHaveClass('cometchat-message-composer--recording');

      fireEvent.click(
        within(screen.getByTestId('recorder')).getByRole('button', { name: 'Send Message' })
      );
      expect(mocks.inlineSend).toHaveBeenCalledOnce();
    });

    it('sends the recording as a voice note and closes the recorder', () => {
      startRecording();

      act(() => {
        recorder().onSubmit(new Blob(['a'], { type: 'audio/ogg' }));
      });

      expect(mocks.hook.sendMediaMessage).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'voice-recording.wav', type: 'audio/ogg' }),
        'audio',
        { isVoiceNote: true }
      );
      expect(screen.queryByTestId('recorder')).not.toBeInTheDocument();
    });

    it('falls back to audio/webm when the recorder blob has no type', () => {
      startRecording();

      act(() => {
        recorder().onSubmit(new Blob(['a']));
      });

      expect(mocks.hook.sendMediaMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'audio/webm' }),
        'audio',
        { isVoiceNote: true }
      );
    });

    it('closes without sending when the recorder is dismissed', () => {
      startRecording();

      act(() => {
        recorder().onClose();
      });

      expect(screen.queryByTestId('recorder')).not.toBeInTheDocument();
      expect(mocks.hook.sendMediaMessage).not.toHaveBeenCalled();
    });

    it('reports recorder errors through onError', () => {
      const onError = vi.fn();
      startRecording({ onError });
      const error = new Error('microphone blocked');

      act(() => {
        recorder().onError(error);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Enter in the rich text editor', () => {
    it('sends the editor HTML and clears the editor', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      editorTypes('<b>hi</b>', 'hi');

      pressEnterInEditor();

      expect(mocks.hook.sendMessage).toHaveBeenCalledWith(undefined, '<b>hi</b>');
      expect(getEditor()).toBeEmptyDOMElement();
    });

    it('sends staged attachments as a batch with the editor HTML as caption', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      dispatch({ type: 'TRAY_ADD', items: [trayItem('success')], batchId: 'b1' });
      editorTypes('<i>look</i>', 'look');

      pressEnterInEditor();

      expect(mocks.hook.sendBatch).toHaveBeenCalledWith(undefined, '<i>look</i>');
      expect(mocks.hook.sendMessage).not.toHaveBeenCalled();
      expect(getEditor()).toBeEmptyDOMElement();
    });

    it('does not send while a staged attachment is still uploading', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      dispatch({ type: 'TRAY_ADD', items: [trayItem('uploading')], batchId: 'b1' });
      editorTypes('caption', 'caption');

      pressEnterInEditor();

      expect(mocks.hook.sendBatch).not.toHaveBeenCalled();
      expect(mocks.hook.sendMessage).not.toHaveBeenCalled();
      expect(getEditor()).toHaveTextContent('caption');
    });

    it('saves an edit only once the message has changed', () => {
      const { rerender } = render(
        <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />,
        { wrapper }
      );
      rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          enableRichTextEditor
          messageToEdit={textMessage({ text: 'old' })}
        />
      );

      pressEnterInEditor();
      expect(mocks.hook.editMessage).not.toHaveBeenCalled();

      editorTypes('<b>new</b>', 'new');
      pressEnterInEditor();

      expect(mocks.hook.editMessage).toHaveBeenCalledWith('<b>new</b>');
      expect(mocks.hook.sendMessage).not.toHaveBeenCalled();
    });

    it('leaves Enter to the editor when enterKeyBehavior is not "send"', () => {
      render(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          enableRichTextEditor
          enterKeyBehavior="newline"
        />,
        { wrapper }
      );

      expect(rte().onEnterPress).toBeUndefined();
    });

    it('falls back to the composer text when no editor element is mounted', () => {
      const { rerender } = render(
        <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor initialText="hi">
          <CaptureContext />
        </CometChatMessageComposerRoot>,
        { wrapper }
      );

      pressEnterInEditor();
      expect(mocks.hook.sendMessage).toHaveBeenCalledWith();

      dispatch({ type: 'TRAY_ADD', items: [trayItem('success')], batchId: 'b1' });
      pressEnterInEditor();
      expect(mocks.hook.sendBatch).toHaveBeenCalledWith();

      dispatch({ type: 'TRAY_CLEAR' });
      rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          enableRichTextEditor
          initialText="hi"
          messageToEdit={textMessage({ text: 'old' })}
        >
          <CaptureContext />
        </CometChatMessageComposerRoot>
      );
      dispatch({ type: 'SET_TEXT', text: 'new' });
      pressEnterInEditor();
      expect(mocks.hook.editMessage).toHaveBeenCalledWith();
    });
  });

  describe('rich text editor updates', () => {
    it('treats an empty list or quote as content so the placeholder hides', () => {
      render(<CometChatMessageComposerRoot enableRichTextEditor />, { wrapper });
      expect(screen.getByText('Enter your message here')).toBeInTheDocument();

      editorTypes('<ul><li></li></ul>', '');
      expect(screen.queryByText('Enter your message here')).not.toBeInTheDocument();

      editorTypes('<p></p>', '');
      expect(screen.getByText('Enter your message here')).toBeInTheDocument();
    });

    it('enables Save for a formatting-only change while editing', () => {
      const { rerender } = render(
        <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />,
        { wrapper }
      );
      rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          enableRichTextEditor
          messageToEdit={textMessage({ text: 'same words' })}
        />
      );
      const seededHtml = getEditor().innerHTML;

      editorTypes(seededHtml, 'same words');
      expect(saveButton()).toBeDisabled();

      editorTypes('<b>same words</b>', 'same words');
      expect(saveButton()).toBeEnabled();
    });
  });

  describe('custom text formatters', () => {
    it('serializes pasted HTML through each formatter in order, skipping one that throws', () => {
      render(
        <CometChatMessageComposerRoot enableRichTextEditor textFormatters={PASTE_FORMATTERS} />,
        {
          wrapper,
        }
      );
      const pre = rte().preprocessPastedHtml;
      if (!pre) throw new Error('no paste preprocessor');

      expect(pre('<p>x</p>')).toBe('<p>x</p>|orig:b|orig:a');
    });

    it('re-renders pasted HTML through the formatters in priority order', () => {
      render(
        <CometChatMessageComposerRoot enableRichTextEditor textFormatters={PASTE_FORMATTERS} />,
        {
          wrapper,
        }
      );
      const post = rte().postprocessPastedHtml;
      if (!post) throw new Error('no paste postprocessor');

      expect(post('<p>x</p>')).toBe('<p>x</p>|fmt:a|fmt:b');
    });

    it('binds imperative formatters to the editor and lets them trigger a re-render', () => {
      const init = vi.spyOn(TRACKING_FORMATTER, 'initializeComposerTracking');
      render(
        <CometChatMessageComposerRoot enableRichTextEditor textFormatters={TRACKING_FORMATTERS} />,
        { wrapper }
      );

      expect(TRACKING_FORMATTER.inputElementReference).toBe(getEditor());
      expect(init).toHaveBeenCalledOnce();

      TRACKING_FORMATTER.reRender();
      expect(mocks.editorInstance.refresh).toHaveBeenCalledOnce();
    });

    it('forwards editor keystrokes to imperative formatters', () => {
      const onKeyUp = vi.spyOn(TRACKING_FORMATTER, 'onKeyUp');
      const onKeyDown = vi.spyOn(TRACKING_FORMATTER, 'onKeyDown');
      const { unmount } = render(
        <CometChatMessageComposerRoot enableRichTextEditor textFormatters={TRACKING_FORMATTERS} />,
        { wrapper }
      );
      const editor = getEditor();

      fireEvent.keyDown(editor, { key: '#' });
      fireEvent.keyUp(editor, { key: '#' });
      expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: '#' }));
      expect(onKeyUp).toHaveBeenCalledWith(expect.objectContaining({ key: '#' }));

      unmount();
      fireEvent.keyUp(editor, { key: 'a' });
      expect(onKeyUp).toHaveBeenCalledOnce();
    });
  });

  describe('rich text editor sync with programmatic text', () => {
    it('seeds the editor with initialText and puts the caret at the end', () => {
      render(<CometChatMessageComposerRoot enableRichTextEditor initialText="Hello" />, {
        wrapper,
      });

      expect(getEditor()).toHaveTextContent('Hello');
      expect(mocks.rte.focus).toHaveBeenCalledWith('end');
    });

    it('replaces the editor content when the controlled text changes, and clears it when emptied', () => {
      const { rerender } = render(
        <CometChatMessageComposerRoot enableRichTextEditor text="One" />,
        {
          wrapper,
        }
      );
      expect(getEditor()).toHaveTextContent('One');

      rerender(<CometChatMessageComposerRoot enableRichTextEditor text="Two" />);
      expect(getEditor().textContent).toBe('Two');

      rerender(<CometChatMessageComposerRoot enableRichTextEditor text="" />);
      expect(getEditor()).toBeEmptyDOMElement();
    });

    it('does not overwrite list or quote structure with plain text', () => {
      const { rerender } = render(<CometChatMessageComposerRoot enableRichTextEditor text="" />, {
        wrapper,
      });
      getEditor().innerHTML = '<ul><li>item</li></ul>';

      rerender(<CometChatMessageComposerRoot enableRichTextEditor text="item" />);

      expect(getEditor().innerHTML).toBe('<ul><li>item</li></ul>');
    });

    it('clears the editor and re-applies initialText when the conversation changes', () => {
      const { rerender } = render(
        <CometChatMessageComposerRoot enableRichTextEditor user={RECEIVER} initialText="Hi" />,
        { wrapper }
      );
      getEditor().innerHTML = 'draft for Andrew';

      rerender(
        <CometChatMessageComposerRoot enableRichTextEditor user={OTHER_RECEIVER} initialText="Hi" />
      );
      expect(getEditor().textContent).toBe('Hi');

      rerender(<CometChatMessageComposerRoot enableRichTextEditor group={GROUP} />);
      expect(getEditor()).toBeEmptyDOMElement();
    });
  });

  describe('editing in the rich text editor', () => {
    function renderEditing(
      message: CometChat.TextMessage | CometChat.MediaMessage,
      props: React.ComponentProps<typeof CometChatMessageComposerRoot> = {}
    ) {
      const view = render(
        <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor {...props} />,
        { wrapper }
      );
      view.rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          enableRichTextEditor
          {...props}
          messageToEdit={message}
        />
      );
      return view;
    }

    it('renders markdown and resolves mention tokens into mention chips', () => {
      renderEditing(
        textMessage({
          text: '**ship** it <@uid:member5> and <@all:everyone>',
          mentioned: [MEMBER],
        })
      );
      const editor = getEditor();

      expect(editor.querySelector('strong, b')).toHaveTextContent('ship');
      expect(editor.querySelector('[data-uid="member5"]')).toHaveTextContent('@Member 5');
      expect(editor.querySelector('[data-uid="all"]')).toHaveTextContent('@everyone');
      expect(editor.textContent).not.toContain('<@');
      expect(mocks.rte.focus).toHaveBeenCalledWith('end');
    });

    it('uses the stored rich text HTML when the message carries formatting metadata', () => {
      renderEditing(
        textMessage({
          text: 'plain fallback',
          metadata: {
            richText: { html: '<p><u>under</u> <@uid:member5></p>', hasFormatting: true },
          },
          mentioned: [MEMBER],
        })
      );
      const editor = getEditor();

      expect(editor.querySelector('u')).toHaveTextContent('under');
      expect(editor.querySelector('[data-uid="member5"]')).toHaveTextContent('@Member 5');
      expect(editor.textContent).not.toContain('plain fallback');
    });

    it('edits a media caption, matching plain "@name" and "@all" text to mentions', () => {
      renderEditing(mediaMessage({ caption: 'hey @Member 5 and @all', mentioned: [MEMBER] }));
      const editor = getEditor();

      expect(editor.querySelector('[data-uid="member5"]')).toHaveTextContent('@Member 5');
      expect(editor.querySelector('[data-uid="all"]')).toHaveTextContent('@all');
    });

    it('still seeds the text when the message has no readable mention metadata', () => {
      renderEditing(textMessage({ text: 'just words', mentionsThrow: true }));

      expect(getEditor()).toHaveTextContent('just words');
    });

    it('still seeds the text when metadata is unreadable or a formatter throws', () => {
      renderEditing(textMessage({ text: 'still here', metadataThrows: true }), {
        textFormatters: BROKEN_FORMATTERS,
      });

      expect(getEditor()).toHaveTextContent('still here');
    });

    it('renders stored custom-formatter markup and runs live formatters over the seeded content', () => {
      renderEditing(
        textMessage({ text: 'a {red}warm{/red} day <@uid:member5>', mentioned: [MEMBER] }),
        {
          textFormatters: SEED_FORMATTERS,
        }
      );
      const editor = getEditor();

      expect(editor.querySelector('span.red')).toHaveTextContent('warm');
      expect(formatTextSeen).toHaveBeenCalledWith(expect.stringContaining('class="red"'));
      // The base formatText (which flattens the editor) is not run for formatters that keep it.
      expect(editor.querySelector('[data-uid="member5"]')).not.toBeNull();
    });

    it('re-seeds when switching to another message and clears the editor on exit', () => {
      const view = renderEditing(textMessage({ id: 1, text: 'first' }));
      expect(getEditor()).toHaveTextContent('first');

      view.rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          enableRichTextEditor
          messageToEdit={textMessage({ id: 2, text: 'second' })}
        />
      );
      expect(getEditor()).toHaveTextContent('second');

      view.rerender(
        <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor messageToEdit={null} />
      );
      expect(getEditor()).toBeEmptyDOMElement();
    });

    // Known issue: resolveMentions interpolates a mentioned user's display name into innerHTML unescaped.
    it.fails('shows a mentioned user name with markup as text, not HTML', () => {
      const hostile = makeUser('evil', '<img src=x onerror="alert(1)">');
      renderEditing(textMessage({ text: 'hi <@uid:evil>', mentioned: [hostile] }));
      const editor = getEditor();

      expect(editor.querySelector('img')).toBeNull();
      expect(editor.querySelector('[data-uid="evil"]')).toHaveTextContent(
        '@<img src=x onerror="alert(1)">'
      );
    });
  });

  describe('mentions', () => {
    it('restores the caret saved at "@" before inserting a mention in the rich text editor', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      const atCaret = document.createRange();
      mocks.savedSelection = atCaret;
      const onMentionStart = rte().onMentionStart;
      if (!onMentionStart) throw new Error('mention detection is not wired');

      act(() => {
        onMentionStart('Mem');
      });
      expect(mocks.mentions.handleMentionStart).toHaveBeenCalledWith('Mem');

      act(() => {
        mentionsOptions().onInsertMention('member5', 'Member 5', 4, false);
      });
      expect(mocks.rte.restoreSelection).toHaveBeenCalledWith(atCaret);
      expect(mocks.rte.insertMention).toHaveBeenCalledWith('member5', 'Member 5', 4, false);

      act(() => {
        mentionsOptions().onInsertMention('member6', 'Member 6', 0);
      });
      expect(mocks.rte.restoreSelection).toHaveBeenCalledOnce();
    });

    it('closes suggestions and forgets the saved caret when the editor ends the mention', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      mocks.savedSelection = document.createRange();
      const { onMentionStart, onMentionEnd } = rte();
      if (!onMentionStart || !onMentionEnd) throw new Error('mention detection is not wired');

      act(() => {
        onMentionStart('M');
        onMentionEnd();
      });
      expect(mocks.mentions.handleMentionEnd).toHaveBeenCalledOnce();

      act(() => {
        mentionsOptions().onInsertMention('member5', 'Member 5', 0);
      });
      expect(mocks.rte.restoreSelection).not.toHaveBeenCalled();
    });

    it('hands editor keys to the suggestions (Escape closes them)', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      mocks.mentions.handleKeyDown.mockReturnValue(true);
      const onKeyDown = rte().onKeyDown;
      if (!onKeyDown) throw new Error('editor key handling is not wired');
      const escape = new KeyboardEvent('keydown', { key: 'Escape' });

      expect(onKeyDown(escape)).toBe(true);
      expect(mocks.mentions.handleKeyDown).toHaveBeenCalledWith(escape);
    });

    it('turns mention detection off when user mentions are disabled outside a group', () => {
      render(
        <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor disableMentions />,
        {
          wrapper,
        }
      );

      expect(rte().onMentionStart).toBeUndefined();
      expect(screen.queryByTestId('mentions-list')).not.toBeInTheDocument();
    });

    it('keeps @all suggestions in a group when only user mentions are disabled', () => {
      const { rerender } = render(
        <CometChatMessageComposerRoot group={GROUP} enableRichTextEditor disableMentions />,
        { wrapper }
      );
      expect(rte().onMentionStart).toBeDefined();
      expect(screen.getByTestId('mentions-list')).toBeInTheDocument();

      rerender(
        <CometChatMessageComposerRoot
          group={GROUP}
          enableRichTextEditor
          disableMentions
          disableMentionAll
        />
      );
      expect(screen.queryByTestId('mentions-list')).not.toBeInTheDocument();
    });

    it('searches mentions with the caller-supplied request builders', () => {
      const usersBuilder = {} as CometChat.UsersRequestBuilder;
      const membersBuilder = {} as CometChat.GroupMembersRequestBuilder;
      render(
        <CometChatMessageComposerRoot
          group={GROUP}
          mentionsUsersRequestBuilder={usersBuilder}
          mentionsGroupMembersRequestBuilder={membersBuilder}
        />,
        { wrapper }
      );

      expect(mentionsOptions()).toEqual(
        expect.objectContaining({
          usersRequestBuilder: usersBuilder,
          groupMembersRequestBuilder: membersBuilder,
        })
      );
      expect(mocks.mentionsListProps).toEqual(
        expect.objectContaining({
          usersRequestBuilder: usersBuilder,
          groupMembersRequestBuilder: membersBuilder,
        })
      );
    });

    describe('plain text input, caret lost', () => {
      function renderPlain() {
        render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
        return screen.getByRole('textbox');
      }

      it('replaces a trailing "@query" with the mention', () => {
        const input = renderPlain();
        input.textContent = 'hey @Mem';
        window.getSelection()?.removeAllRanges();

        act(() => {
          mentionsOptions().onInsertMention('member5', 'Member 5', 4);
        });

        expect(input.querySelector('[data-uid="member5"]')).toHaveTextContent('@Member 5');
        expect(input.textContent).toMatch(/^hey @Member 5\s$/);
        expect(sendButton()).toBeEnabled();
      });

      it('appends without deleting when the input does not end in the query', () => {
        const input = renderPlain();
        input.textContent = 'hello there';
        window.getSelection()?.removeAllRanges();

        act(() => {
          mentionsOptions().onInsertMention('member5', 'Member 5', 4);
        });

        expect(input.textContent).toMatch(/^hello there@Member 5\s?$/);
      });

      it('appends after an existing mention at the end of the input', () => {
        const input = renderPlain();
        input.replaceChildren(createMentionElement(document, 'member1', 'Member 1', false));
        window.getSelection()?.removeAllRanges();

        act(() => {
          mentionsOptions().onInsertMention('member5', 'Member 5', 4);
        });

        const uids = Array.from(input.querySelectorAll('[data-uid]')).map(n =>
          n.getAttribute('data-uid')
        );
        expect(uids).toEqual(['member1', 'member5']);
      });
    });

    describe('while editing', () => {
      it('remembers the edited message mentions and forgets them on exit', () => {
        const { rerender } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
        rerender(
          <CometChatMessageComposerRoot
            user={RECEIVER}
            messageToEdit={textMessage({ text: '<@uid:member5> hi', mentioned: [MEMBER] })}
          />
        );
        expect(mocks.mentions.seedMentionedUsers).toHaveBeenCalledWith([
          { uid: 'member5', name: 'Member 5' },
        ]);

        rerender(<CometChatMessageComposerRoot user={RECEIVER} messageToEdit={null} />);
        expect(mocks.mentions.clearMentionedUsers).toHaveBeenCalled();
      });

      it('rebuilds caption mentions as chips, using the @all label and the uid for unknown users', () => {
        const { rerender } = render(
          <CometChatMessageComposerRoot group={GROUP} mentionAllLabel="channel" />,
          { wrapper }
        );
        rerender(
          <CometChatMessageComposerRoot
            group={GROUP}
            mentionAllLabel="channel"
            messageToEdit={mediaMessage({ caption: '<@all:x> see <@uid:ghost> now' })}
          />
        );
        const input = screen.getByRole('textbox');

        expect(input.querySelector('[data-uid="all"]')).toHaveTextContent('@channel');
        expect(input.querySelector('[data-uid="ghost"]')).toHaveTextContent('@ghost');
        expect(input.textContent).toBe('@channel see @ghost now');
      });

      it('still rebuilds mention chips when the message has no readable mention metadata', () => {
        const { rerender } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
        rerender(
          <CometChatMessageComposerRoot
            user={RECEIVER}
            messageToEdit={textMessage({ text: 'ping <@uid:member5>', mentionsThrow: true })}
          />
        );

        expect(screen.getByRole('textbox').querySelector('[data-uid="member5"]')).toHaveTextContent(
          '@member5'
        );
        expect(mocks.mentions.seedMentionedUsers).not.toHaveBeenCalled();
      });
    });
  });

  describe('emoji insertion', () => {
    it('inserts at the caret in the plain input and closes the emoji keyboard', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const input = screen.getByRole('textbox');
      typeInto(input, 'helo');
      const textNode = input.firstChild;
      if (!textNode) throw new Error('expected a text node');
      placeCaret(textNode, 2);
      fireEvent.click(screen.getByRole('button', { name: 'Emoji' }));
      expect(screen.getByRole('button', { name: 'Emoji' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );

      act(() => {
        ctx().insertEmoji('😀');
      });

      expect(input.textContent).toBe('he😀lo');
      expect(screen.getByRole('button', { name: 'Emoji' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(document.activeElement).toBe(input);
    });

    it('appends to the plain input when the caret is elsewhere on the page', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const input = screen.getByRole('textbox');
      typeInto(input, 'hi');
      const outside = document.createElement('p');
      outside.textContent = 'elsewhere';
      document.body.appendChild(outside);
      const outsideText = outside.firstChild;
      if (!outsideText) throw new Error('expected a text node');
      placeCaret(outsideText, 3);

      act(() => {
        ctx().insertEmoji('😀');
      });

      expect(input.textContent).toBe('hi😀');
      expect(outside.textContent).toBe('elsewhere');
      expect(sendButton()).toBeEnabled();
      outside.remove();
    });

    // Known issue: handleInsertEmoji calls selection.getRangeAt(0) without checking rangeCount, which throws when nothing is selected.
    it.fails('appends to the plain input when the page has no selection at all', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const input = screen.getByRole('textbox');
      typeInto(input, 'hi');
      window.getSelection()?.removeAllRanges();

      act(() => {
        ctx().insertEmoji('😀');
      });

      expect(input.textContent).toBe('hi😀');
    });

    it('inserts as plain text in the rich text editor and enables sending', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      expect(sendButton()).toBeDisabled();

      act(() => {
        ctx().insertEmoji('🎉');
      });

      expect(mocks.rte.insertPlainText).toHaveBeenCalledWith('🎉');
      expect(getEditor()).toHaveTextContent('🎉');
      expect(sendButton()).toBeEnabled();
    });

    it('falls back to the composer text when no input is mounted', () => {
      render(
        <CometChatMessageComposerRoot user={RECEIVER}>
          <CaptureContext />
        </CometChatMessageComposerRoot>,
        { wrapper }
      );

      act(() => {
        ctx().insertEmoji('👍');
      });

      expect(mocks.hook.insertEmoji).toHaveBeenCalledWith('👍');
    });
  });

  describe('links in the rich text editor', () => {
    function renderEditorWithText(text: string): Text {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      const editor = getEditor();
      editor.textContent = text;
      const node = editor.firstChild;
      if (!(node instanceof Text)) throw new Error('expected a text node');
      return node;
    }

    it('prefills the dialog with the text selected in the editor and inserts the link there', () => {
      const node = renderEditorWithText('hello world');
      const selection = document.createRange();
      selection.setStart(node, 6);
      selection.setEnd(node, 11);
      mocks.savedSelection = selection;

      fireEvent.click(screen.getByRole('button', { name: 'Insert link' }));
      const dialog = screen.getByRole('dialog', { name: 'link dialog (add)' });
      expect(dialog).toHaveAttribute('data-selected-text', 'world');

      fireEvent.click(within(dialog).getByRole('button', { name: 'Save link' }));

      expect(mocks.rte.restoreSelection).toHaveBeenCalledWith(selection);
      expect(mocks.rte.setLink).toHaveBeenCalledWith('https://example.com', 'Docs');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('ignores a selection outside the composer and inserts at the end of the editor', () => {
      renderEditorWithText('hello');
      const outside = document.createElement('p');
      outside.textContent = 'message list text';
      document.body.appendChild(outside);
      const selection = document.createRange();
      selection.selectNodeContents(outside);
      mocks.savedSelection = selection;

      fireEvent.click(screen.getByRole('button', { name: 'Insert link' }));
      const dialog = screen.getByRole('dialog', { name: 'link dialog (add)' });
      expect(dialog).toHaveAttribute('data-selected-text', '');

      mocks.rte.focus.mockClear();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save link' }));

      expect(mocks.rte.restoreSelection).not.toHaveBeenCalled();
      expect(mocks.rte.focus).toHaveBeenCalledWith('end');
      expect(mocks.rte.setLink).toHaveBeenCalledWith('https://example.com', 'Docs');
      outside.remove();
    });

    it('opens the dialog in edit mode when the caret is on an existing link', () => {
      renderEditorWithText('see docs');
      mocks.currentLink = 'https://old.example.com';
      mocks.currentLinkText = 'docs';

      fireEvent.click(screen.getByRole('button', { name: 'Insert link' }));

      const dialog = screen.getByRole('dialog', { name: 'link dialog (edit)' });
      expect(dialog).toHaveAttribute('data-initial-url', 'https://old.example.com');
      expect(dialog).toHaveAttribute('data-initial-text', 'docs');
    });

    it('closes the dialog on cancel without touching the editor', () => {
      renderEditorWithText('hello');

      fireEvent.click(screen.getByRole('button', { name: 'Insert link' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel link' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mocks.rte.setLink).not.toHaveBeenCalled();
    });

    describe('link popover', () => {
      function clickLinkInEditor() {
        renderEditorWithText('see docs');
        const atLink = document.createRange();
        mocks.savedSelection = atLink;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
          DOMRect.fromRect({ x: 20, y: 200, width: 400, height: 100 })
        );
        const onLinkClick = rte().onLinkClick;
        if (!onLinkClick) throw new Error('link clicks are not wired');
        act(() => {
          onLinkClick('https://docs.example.com', 'docs', 100, 250);
        });
        return atLink;
      }

      it('opens above the clicked link', () => {
        clickLinkInEditor();

        const popover = screen.getByTestId('link-popover');
        expect(popover).toHaveTextContent('https://docs.example.com');
        // left: 100 - 20 + 16; bottom offset: 300 - 250 + 24
        expect(popover).toHaveAttribute('data-left', '96');
        expect(popover).toHaveAttribute('data-top', '74');
      });

      it('edits the link through the dialog at the clicked position', () => {
        const atLink = clickLinkInEditor();

        fireEvent.click(screen.getByRole('button', { name: 'Edit link' }));
        expect(screen.queryByTestId('link-popover')).not.toBeInTheDocument();
        const dialog = screen.getByRole('dialog', { name: 'link dialog (edit)' });
        expect(dialog).toHaveAttribute('data-initial-url', 'https://docs.example.com');
        expect(dialog).toHaveAttribute('data-initial-text', 'docs');

        fireEvent.click(within(dialog).getByRole('button', { name: 'Save link' }));
        expect(mocks.rte.restoreSelection).toHaveBeenCalledWith(atLink);
        expect(mocks.rte.setLink).toHaveBeenCalledWith('https://example.com', 'Docs');
      });

      it('removes the clicked link', () => {
        const atLink = clickLinkInEditor();

        fireEvent.click(screen.getByRole('button', { name: 'Remove link' }));

        expect(screen.queryByTestId('link-popover')).not.toBeInTheDocument();
        expect(mocks.rte.restoreSelection).toHaveBeenCalledWith(atLink);
        expect(mocks.rte.setLink).toHaveBeenCalledWith(null);
      });

      it('closes without changes', () => {
        clickLinkInEditor();

        fireEvent.click(screen.getByRole('button', { name: 'Close popover' }));

        expect(screen.queryByTestId('link-popover')).not.toBeInTheDocument();
        expect(mocks.rte.setLink).not.toHaveBeenCalled();
      });
    });
  });

  describe('send and save routing', () => {
    it('sends staged attachments with a caller-supplied caption', () => {
      render(
        <CometChatMessageComposerRoot user={RECEIVER}>
          <CaptureContext />
        </CometChatMessageComposerRoot>,
        { wrapper }
      );
      dispatch({ type: 'TRAY_ADD', items: [trayItem('success')], batchId: 'b1' });

      act(() => {
        void ctx().sendMessage('caption');
      });

      expect(mocks.hook.sendBatch).toHaveBeenCalledWith('caption');
    });

    it('sends a caller-supplied text when nothing is staged', () => {
      render(
        <CometChatMessageComposerRoot user={RECEIVER}>
          <CaptureContext />
        </CometChatMessageComposerRoot>,
        { wrapper }
      );

      act(() => {
        void ctx().sendMessage('quick reply');
      });

      expect(mocks.hook.sendMessage).toHaveBeenCalledWith('quick reply');
    });

    it('sends staged attachments with the rich text caption and clears the editor', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      dispatch({ type: 'TRAY_ADD', items: [trayItem('success')], batchId: 'b1' });
      editorTypes('<s>old</s>', 'old');

      fireEvent.click(sendButton());

      expect(mocks.hook.sendBatch).toHaveBeenCalledWith(undefined, '<s>old</s>');
      expect(getEditor()).toBeEmptyDOMElement();
    });

    it('sends the rich text HTML from the send button and clears the editor', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />, { wrapper });
      editorTypes('<b>bold</b>', 'bold');

      fireEvent.click(sendButton());

      expect(mocks.hook.sendMessage).toHaveBeenCalledWith(undefined, '<b>bold</b>');
      expect(getEditor()).toBeEmptyDOMElement();
    });

    it('sends a plain text caption with mention tokens for staged attachments', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      dispatch({ type: 'TRAY_ADD', items: [trayItem('success')], batchId: 'b1' });
      const input = screen.getByRole('textbox');
      input.replaceChildren(
        document.createTextNode('for '),
        createMentionElement(document, 'member5', 'Member 5', false)
      );
      fireEvent.input(input);

      fireEvent.click(sendButton());

      expect(mocks.hook.sendBatch).toHaveBeenCalledWith('for <@uid:member5>');
    });

    it('sends staged attachments with the plain composer text when it has no mentions', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      dispatch({ type: 'TRAY_ADD', items: [trayItem('success')], batchId: 'b1' });
      typeInto(screen.getByRole('textbox'), 'caption');

      fireEvent.click(sendButton());

      expect(mocks.hook.sendBatch).toHaveBeenCalledWith();
    });

    it('saves a rich text edit with the editor HTML', () => {
      const { rerender } = render(
        <CometChatMessageComposerRoot user={RECEIVER} enableRichTextEditor />,
        { wrapper }
      );
      rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          enableRichTextEditor
          messageToEdit={textMessage({ text: 'old' })}
        />
      );
      editorTypes('<i>new</i>', 'new');

      fireEvent.click(saveButton());

      expect(mocks.hook.editMessage).toHaveBeenCalledWith('<i>new</i>');
    });

    it('saves a plain text edit with its mentions as SDK tokens', () => {
      const { rerender } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          messageToEdit={textMessage({ text: '<@uid:member5> hi', mentioned: [MEMBER] })}
        />
      );

      fireEvent.click(saveButton());

      expect(mocks.hook.editMessage).toHaveBeenCalledWith(undefined, '<@uid:member5> hi');
    });

    it('saves a plain text edit without mentions from the composer text', () => {
      const { rerender } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      rerender(
        <CometChatMessageComposerRoot
          user={RECEIVER}
          messageToEdit={textMessage({ text: 'old' })}
        />
      );
      typeInto(screen.getByRole('textbox'), 'new');

      fireEvent.click(saveButton());

      expect(mocks.hook.editMessage).toHaveBeenCalledWith();
    });
  });

  describe('layout slots', () => {
    it('renders headerView in place of the edit and reply previews', () => {
      render(<CometChatMessageComposerRoot headerView={<div>Custom header</div>} />, { wrapper });

      expect(screen.getByText('Custom header')).toBeInTheDocument();
      expect(screen.queryByTestId('edit-preview')).not.toBeInTheDocument();
    });

    it('renders auxiliaryButtonView among the actions', () => {
      render(
        <CometChatMessageComposerRoot auxiliaryButtonView={<button type="button">Polls</button>} />,
        { wrapper }
      );

      expect(screen.getByRole('button', { name: 'Polls' })).toBeInTheDocument();
    });
  });

  describe('drag and drop', () => {
    const png = new File(['x'], 'photo.png', { type: 'image/png' });

    function fileDrag(files: File[] = [png]) {
      return { dataTransfer: { types: ['Files'], files, dropEffect: 'none' } };
    }

    it('shows the drop overlay while files are dragged over, across nested elements', () => {
      const { container } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const root = getRoot(container);
      const input = screen.getByRole('textbox');

      fireEvent.dragEnter(root, fileDrag());
      fireEvent.dragEnter(input, fileDrag());
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
      expect(root).toHaveClass('cometchat-message-composer--dragging');

      fireEvent.dragLeave(input, fileDrag());
      expect(screen.getByText('Drop files here')).toBeInTheDocument();

      fireEvent.dragLeave(root, fileDrag());
      expect(screen.queryByText('Drop files here')).not.toBeInTheDocument();
    });

    it('ignores drags that carry no files', () => {
      const { container } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const root = getRoot(container);
      const textDrag = { dataTransfer: { types: ['text/plain'], files: [], dropEffect: 'none' } };

      expect(fireEvent.dragEnter(root, textDrag)).toBe(true);
      expect(fireEvent.dragOver(root, textDrag)).toBe(true);
      expect(screen.queryByText('Drop files here')).not.toBeInTheDocument();
    });

    it('accepts a file drag over the composer as a copy', () => {
      const { container } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const init = fileDrag();

      expect(fireEvent.dragOver(getRoot(container), init)).toBe(false);
      expect(init.dataTransfer.dropEffect).toBe('copy');
    });

    it('stages dropped files and hides the overlay', () => {
      const { container } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const root = getRoot(container);
      const pdf = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });

      fireEvent.dragEnter(root, fileDrag());
      const notCancelled = fireEvent.drop(root, fileDrag([png, pdf]));

      expect(notCancelled).toBe(false);
      expect(mocks.hook.startUpload).toHaveBeenCalledWith([png, pdf]);
      expect(screen.queryByText('Drop files here')).not.toBeInTheDocument();
    });

    it.each([
      ['image/png', 'image'],
      ['video/mp4', 'video'],
      ['audio/mpeg', 'audio'],
      ['application/zip', 'file'],
      ['untyped', 'file'],
    ])(
      'sends a dropped %s file straight away as %s when multiple attachments are off',
      (label, kind) => {
        const mime = label === 'untyped' ? '' : label;
        const { container } = render(
          <CometChatMessageComposerRoot user={RECEIVER} enableMultipleAttachments={false} />,
          { wrapper }
        );
        const file = new File(['x'], 'dropped', { type: mime });
        const second = new File(['y'], 'second.png', { type: 'image/png' });

        fireEvent.drop(getRoot(container), fileDrag([file, second]));

        expect(mocks.hook.sendMediaMessage).toHaveBeenCalledOnce();
        expect(mocks.hook.sendMediaMessage).toHaveBeenCalledWith(file, kind);
        expect(mocks.hook.startUpload).not.toHaveBeenCalled();
      }
    );

    it('does nothing with drags when drag and drop is disabled, but still stops the browser opening a dropped file', () => {
      const { container } = render(
        <CometChatMessageComposerRoot user={RECEIVER} disableDragAndDrop />,
        { wrapper }
      );
      const root = getRoot(container);

      fireEvent.dragEnter(root, fileDrag());
      expect(screen.queryByText('Drop files here')).not.toBeInTheDocument();
      fireEvent.dragLeave(root, fileDrag());

      expect(fireEvent.drop(root, fileDrag())).toBe(false);
      expect(fireEvent.drop(root, fileDrag([]))).toBe(true);
      expect(mocks.hook.startUpload).not.toHaveBeenCalled();
      expect(mocks.hook.sendMediaMessage).not.toHaveBeenCalled();
    });

    it('does not accept dropped files while editing a message', () => {
      const { container, rerender } = render(<CometChatMessageComposerRoot user={RECEIVER} />, {
        wrapper,
      });
      rerender(
        <CometChatMessageComposerRoot user={RECEIVER} messageToEdit={textMessage({ text: 'x' })} />
      );
      const root = getRoot(container);

      fireEvent.dragEnter(root, fileDrag());
      expect(screen.queryByText('Drop files here')).not.toBeInTheDocument();

      expect(fireEvent.drop(root, fileDrag())).toBe(false);
      expect(mocks.hook.startUpload).not.toHaveBeenCalled();
    });

    // Known issue: handleComposerDrop calls preventDefault before checking for files, cancelling native text drops.
    it.fails('lets the browser drop dragged text into the input', () => {
      render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });
      const textDrop = { dataTransfer: { types: ['text/plain'], files: [], dropEffect: 'none' } };

      expect(fireEvent.drop(screen.getByRole('textbox'), textDrop)).toBe(true);
    });
  });

  describe('pasting files', () => {
    const png = new File(['x'], 'shot.png', { type: 'image/png' });

    function clipboard(files: File[], text = '') {
      return {
        clipboardData: {
          items: [
            ...(text ? [{ kind: 'string', getAsFile: () => null }] : []),
            ...files.map(file => ({ kind: 'file', getAsFile: () => file })),
          ],
          getData: () => text,
        },
      };
    }

    it('stages pasted files instead of pasting them as content', () => {
      const { container } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });

      expect(fireEvent.paste(getRoot(container), clipboard([png], 'shot.png'))).toBe(false);
      expect(mocks.hook.startUpload).toHaveBeenCalledWith([png]);
    });

    it('leaves a text-only paste to the input', () => {
      const { container } = render(<CometChatMessageComposerRoot user={RECEIVER} />, { wrapper });

      expect(fireEvent.paste(getRoot(container), clipboard([], 'hello'))).toBe(true);
      expect(mocks.hook.startUpload).not.toHaveBeenCalled();
    });

    it.each([
      ['video/quicktime', 'video'],
      ['image/gif', 'image'],
      ['audio/wav', 'audio'],
      ['text/csv', 'file'],
      ['untyped', 'file'],
    ])(
      'sends the first pasted %s file straight away as %s when multiple attachments are off',
      (label, kind) => {
        const { container } = render(
          <CometChatMessageComposerRoot user={RECEIVER} enableMultipleAttachments={false} />,
          { wrapper }
        );
        const clip = new File(['v'], 'clip', { type: label === 'untyped' ? '' : label });

        fireEvent.paste(getRoot(container), clipboard([clip, png]));

        expect(mocks.hook.sendMediaMessage).toHaveBeenCalledOnce();
        expect(mocks.hook.sendMediaMessage).toHaveBeenCalledWith(clip, kind);
      }
    );

    // Known issue: handleComposerPaste has no isInEditMode guard, unlike drop and the attachment button.
    it.fails('does not stage pasted files while editing a message', () => {
      const { container, rerender } = render(<CometChatMessageComposerRoot user={RECEIVER} />, {
        wrapper,
      });
      rerender(
        <CometChatMessageComposerRoot user={RECEIVER} messageToEdit={textMessage({ text: 'x' })} />
      );

      fireEvent.paste(getRoot(container), clipboard([png]));

      expect(mocks.hook.startUpload).not.toHaveBeenCalled();
    });
  });
});
