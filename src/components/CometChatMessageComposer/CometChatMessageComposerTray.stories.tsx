import { useRef, useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatMessageComposerTray } from './CometChatMessageComposerTray';
import { CometChatMessageComposerInput } from './CometChatMessageComposerInput';
import { CometChatMessageComposerSendButton } from './CometChatMessageComposerSendButton';
import { CometChatMessageComposerEmojiButton } from './CometChatMessageComposerEmojiButton';
import { CometChatMessageComposerAttachmentButton } from './CometChatMessageComposerAttachmentButton';
import { CometChatMessageComposerContext } from './CometChatMessageComposer.context';
import type {
  CometChatMessageComposerContextValue,
  CometChatMessageComposerLayout,
  TrayItem,
  TrayItemKind,
  TrayItemStatus,
  TrayState,
} from './CometChatMessageComposer.types';
import { CometChatFormattingToolbar } from '../base/CometChatFormattingToolbar/CometChatFormattingToolbar';
import type { CometChatRichTextFormatState } from '../../utils/RichTextEditor/RichTextEditor.types';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
// Real (tiny) media, served same-origin by Storybook so the tray can decode a
// poster from the video (no cross-origin canvas taint) and the fullscreen viewer
// / audio card can actually play it. Swap these files to change the previews.
import sampleVideo from './__story-assets__/sample-video.mp4';
import sampleAudio from './__story-assets__/sample-audio.mp3';

/**
 * These stories render the multi-attachment staging tray **inside a real composer
 * shell** (attachment button + input + emoji + send), so the tray is shown in the
 * same chrome users actually see. The composer normally derives its tray from the
 * live upload manager, which can't be driven in Storybook — so instead we supply a
 * mock context and hand-pick each tile's state (`success` / `uploading` / `failed`
 * / `rejected`). The tray, input, and buttons themselves are the real components.
 *
 * Rendering notes:
 *  - Images use picsum URLs, so success image tiles (and the fullscreen viewer on
 *    click) look real when the network is available.
 *  - Video/audio point at small real sample files under `__story-assets__`, served
 *    same-origin by Storybook — so the video poster/duration decode, the fullscreen
 *    viewer plays, and the audio card is playable. Swap those files to taste.
 */

const meta: Meta = {
  title: 'Components/Messages/CometChat Message Composer/Tray',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-attachment staging tray rendered inside the composer. Each story ' +
          'pins the tray to a single upload state across all four media types ' +
          '(image, video, audio, file), plus mixed, multiline, and rich-text variants.',
      },
    },
  },
  decorators: [
    Story => (
      <div style={{ width: 640, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

// --- Helpers ---------------------------------------------------------------

const noop = (): void => {
  /* story no-op */
};

/** A neutral, all-inactive format state so the rich-text toolbar renders cleanly. */
const EMPTY_FORMAT_STATE: CometChatRichTextFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  blockquote: false,
  codeBlock: false,
  orderedList: false,
  bulletList: false,
  link: false,
};

/** Create a mock File object with a given name and type. */
function mockFile(name: string, type: string, sizeKB = 64): File {
  const content = new Array(sizeKB * 1024).fill('x').join('');
  return new File([content], name, { type });
}

const DEFAULTS: Record<TrayItemKind, { name: string; mime: string }> = {
  image: { name: 'photo.jpg', mime: 'image/jpeg' },
  video: { name: 'clip.mp4', mime: 'video/mp4' },
  audio: { name: 'recording.mp3', mime: 'audio/mpeg' },
  file: { name: 'document.pdf', mime: 'application/pdf' },
};

/** Build a rejection error object carrying the code (and message) the tray reads. */
function sizeExceededError(): unknown {
  // The tray parses the MB limit out of this message ("...of <bytes> bytes.").
  return {
    code: CometChatUIKitConstants.MediaUploadErrorCodes.FILE_SIZE_EXCEEDED,
    message: 'The file exceeds the maximum allowed size of 104857600 bytes.',
  };
}
function typeNotSupportedError(): unknown {
  return { code: CometChatUIKitConstants.MediaUploadErrorCodes.PERMISSION_DENIED };
}

/** Create a single tray item, defaulting name/mime/preview by kind. */
function makeTrayItem(
  fileId: string,
  kind: TrayItemKind,
  overrides: Partial<TrayItem> & { fileName?: string } = {}
): TrayItem {
  const { fileName, ...rest } = overrides;
  const def = DEFAULTS[kind];
  const name = fileName ?? def.name;
  return {
    fileId,
    kind,
    file: mockFile(name, def.mime),
    status: 'success',
    percent: 100,
    // Preview source per kind: images use picsum; video/audio point at the real
    // same-origin sample media so the poster decodes and the viewer/player works.
    // (File kind needs no preview — it renders a file-type icon card.)
    previewUrl:
      kind === 'image'
        ? `https://picsum.photos/seed/${fileId}/240/240`
        : kind === 'video'
          ? sampleVideo
          : kind === 'audio'
            ? sampleAudio
            : undefined,
    ...rest,
  };
}

/**
 * One tile per media type, all pinned to the same status. Rejected tiles get a
 * realistic error so their hover tooltip (size limit / unsupported type) shows.
 */
function mediaSet(
  status: TrayItemStatus,
  percentByKind?: Partial<Record<TrayItemKind, number>>
): TrayItem[] {
  const errorFor = (kind: TrayItemKind): unknown => {
    if (status !== 'rejected') return undefined;
    // Mix the two rejection reasons so both tooltip variants are demonstrated.
    return kind === 'image' || kind === 'file' ? sizeExceededError() : typeNotSupportedError();
  };
  return (['image', 'video', 'audio', 'file'] as TrayItemKind[]).map(kind =>
    makeTrayItem(`${status}-${kind}`, kind, {
      status,
      percent:
        status === 'uploading' ? (percentByKind?.[kind] ?? 50) : status === 'success' ? 100 : 0,
      ...(errorFor(kind) !== undefined ? { error: errorFor(kind) } : {}),
    })
  );
}

interface ContextOpts {
  layout: CometChatMessageComposerLayout;
  text: string;
  setText: (text: string) => void;
  inputRef: { current: HTMLDivElement | null };
  richTextEditorRef: { current: HTMLDivElement | null };
}

/** Build a full mock composer context around the given tray items. */
function buildContext(items: TrayItem[], opts: ContextOpts): CometChatMessageComposerContextValue {
  const { layout, text, setText, inputRef, richTextEditorRef } = opts;
  const tray: TrayState = { batchId: 'story-batch', items };
  const allSuccess = items.length > 0 && items.every(i => i.status === 'success');

  return {
    // State
    text,
    textMessageToEdit: null,
    messageToReply: null,
    contentToDisplay: 'none',
    sendState: 'idle',
    isRecording: false,
    isDraggingOver: false,
    error: null,
    showValidationError: false,
    validationErrorText: null,
    // Derived
    canSend: allSuccess,
    isInEditMode: false,
    isInReplyMode: false,
    showVoiceButton: false,
    layout,
    // Tray
    tray,
    stageAttachments: noop,
    removeAttachment: (fileId: string) => {
      console.log('[Story] removeAttachment:', fileId);
    },
    retryAttachment: (fileId: string) => {
      console.log('[Story] retryAttachment:', fileId);
    },
    clearAttachments: noop,
    attachmentsSendable: allSuccess,
    maxAttachmentCount: 10,
    // Actions
    setText,
    sendMessage: async () => {},
    sendMediaMessage: async () => {},
    editMessage: async () => {},
    insertEmoji: noop,
    setContentToDisplay: noop,
    closePreview: noop,
    setRecording: noop,
    setDragging: noop,
    dismissValidationError: noop,
    startTyping: noop,
    endTyping: noop,
    onMentionQueryChange: noop,
    onMentionEnd: noop,
    // Refs — from useRef in the shell (NOT React.createRef, which seals `current`;
    // the Input effect does `Object.defineProperty` on it → "Cannot redefine
    // property: current"). The real Root passes useRef objects for the same reason.
    inputRef,
    richTextEditorRef,
    // Config
    placeholder: 'Type a message...',
    enterKeyBehavior: 'send',
    maxInputHeight: 120,
    // Always the functional plain-text input: a real rich-text editor is created by
    // Root (which we bypass), so we can't drive one here. The rich-text story still
    // renders the real toolbar above this input for the rich-text look.
    enableRichTextEditor: false,
    hideRichTextFormattingOptions: false,
    showBubbleMenuOnSelection: false,
    disableMentions: true,
    disableMentionAll: true,
    mentionAllLabel: 'all',
    showAttachmentPreview: true,
    enableMultipleAttachments: true,
    hideAttachmentButton: false,
    hideEmojiKeyboardButton: false,
    hideVoiceRecordingButton: true,
    hideStickersButton: true,
    hideAIButton: true,
    hideLiveReaction: true,
    hideSendButton: false,
    hideError: false,
    disableAutoFocusOnMobile: true,
  } as unknown as CometChatMessageComposerContextValue;
}

/**
 * ComposerShell — reproduces the composer's default layout (toolbar, tray, input
 * row) around the mock context, so the tray appears in real composer chrome.
 */
function ComposerShell({
  items,
  layout = 'compact',
  showToolbar = false,
}: {
  items: TrayItem[];
  layout?: CometChatMessageComposerLayout;
  showToolbar?: boolean;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLDivElement>(null);
  const richTextEditorRef = useRef<HTMLDivElement>(null);
  const ctx = buildContext(items, { layout, text, setText, inputRef, richTextEditorRef });

  return (
    <div className="cometchat">
      <div className={`cometchat-message-composer cometchat-message-composer--${layout}`}>
        <CometChatMessageComposerContext.Provider value={ctx}>
          {showToolbar && (
            <CometChatFormattingToolbar
              formatState={EMPTY_FORMAT_STATE}
              onBold={noop}
              onItalic={noop}
              onUnderline={noop}
              onStrikethrough={noop}
              onInlineCode={noop}
              onCodeBlock={noop}
              onBlockquote={noop}
              onOrderedList={noop}
              onBulletList={noop}
              onLink={noop}
            />
          )}
          <CometChatMessageComposerTray />
          <div className="cometchat-message-composer__body">
            {layout === 'compact' && (
              <div className="cometchat-message-composer__attachment-button-wrapper">
                <CometChatMessageComposerAttachmentButton />
              </div>
            )}
            <div className="cometchat-message-composer__input-area cometchat-message-composer__input-area--hide-scrollbar">
              <CometChatMessageComposerInput />
            </div>
            <div className="cometchat-message-composer__actions">
              {layout === 'multiline' && (
                <div className="cometchat-message-composer__attachment-button-wrapper">
                  <CometChatMessageComposerAttachmentButton />
                </div>
              )}
              <div className="cometchat-message-composer__emoji-button-wrapper">
                <CometChatMessageComposerEmojiButton />
              </div>
              <div className="cometchat-message-composer__send-button-wrapper">
                <CometChatMessageComposerSendButton />
              </div>
            </div>
          </div>
        </CometChatMessageComposerContext.Provider>
      </div>
    </div>
  );
}

// --- Stories: one per upload state, all four media types --------------------

/** Success — every media type uploaded; image tiles open the fullscreen viewer. */
export const Success = () => <ComposerShell items={mediaSet('success')} />;

/** Uploading — each media type mid-flight, progress rings at varied percentages. */
export const Uploading = () => (
  <ComposerShell items={mediaSet('uploading', { image: 30, video: 55, audio: 75, file: 15 })} />
);

/** Failed — retryable failures; each tile offers a retry affordance. */
export const Failed = () => <ComposerShell items={mediaSet('failed')} />;

/**
 * Rejected — non-retryable errors with hover tooltips. Image/file show the
 * size-limit tooltip; video/audio show "file type not supported".
 */
export const Rejected = () => <ComposerShell items={mediaSet('rejected')} />;

/** Mixed — one tile in each state at once (the most realistic in-progress view). */
export const MixedStates = () => (
  <ComposerShell
    items={[
      makeTrayItem('mix-image', 'image', { status: 'success', fileName: 'beach-sunset.jpg' }),
      makeTrayItem('mix-video', 'video', {
        status: 'uploading',
        percent: 55,
        fileName: 'demo-clip.mp4',
      }),
      makeTrayItem('mix-audio', 'audio', {
        status: 'failed',
        percent: 0,
        fileName: 'voice-note.mp3',
      }),
      makeTrayItem('mix-file', 'file', {
        status: 'rejected',
        percent: 0,
        fileName: 'blocked.exe',
        error: typeNotSupportedError(),
      }),
    ]}
  />
);

// --- Layout / editor variants (success state only) --------------------------

/** Multiline composer — success tray above the expanded, vertical layout. */
export const MultilineComposer = () => (
  <ComposerShell items={mediaSet('success')} layout="multiline" />
);
MultilineComposer.storyName = 'Multiline Composer (success)';

/** Rich-text composer — success tray above a compact composer with the toolbar. */
export const RichTextComposer = () => <ComposerShell items={mediaSet('success')} showToolbar />;
RichTextComposer.storyName = 'Rich Text Composer (success)';
