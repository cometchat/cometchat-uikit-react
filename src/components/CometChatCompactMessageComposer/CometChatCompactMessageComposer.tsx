import React, {
  JSX,
  LegacyRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  useCometChatErrorHandler,
  useRefSync,
} from "../../CometChatCustomHooks";
import { ChatConfigurator } from "../../utils/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatUserMemberWrapper } from "../CometChatUserMemberWrapper/CometChatUserMemberWrapper";
import { useCometChatMessageComposer } from "../CometChatMessageComposer/useCometChatMessageComposer";
import MicIcon from "../../assets/mic.svg";
import MicIconFill from "../../assets/mic_fill.svg";
import PauseCircleIcon from "../../assets/pause_circle.svg";
import PlusIcon from "../../assets/add_circle.svg";
import PlusIconFill from "../../assets/add_circle_fill.svg";
import SendIconFill from "../../assets/send_fill.svg";
import SmileysIcon from "../../assets/mood.svg";
import SmileysIconFill from "../../assets/mood_fill.svg";
import { createPortal, flushSync } from "react-dom";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { CometChatUIKitUtility } from "../../CometChatUIKit/CometChatUIKitUtility";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatMentionsFormatter } from "../../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatUrlsFormatter } from "../../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { CometChatMarkdownFormatter } from "../../formatters/CometChatFormatters/CometChatMarkdownFormatter/CometChatMarkdownFormatter";
import { CometChatActionsView, CometChatMessageComposerAction } from "../../modals";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { EnterKeyBehavior, MentionsTargetElement, MessageStatus, Placement, PreviewMessageMode, UserMemberListType } from "../../Enums/Enums";
import { getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import { CometChatPopover } from "../BaseComponents/CometChatPopover/CometChatPopover";
import { CometChatMediaRecorder } from "../BaseComponents/CometChatMediaRecorder/CometChatMediaRecorder";
import { CometChatEditPreview } from "../BaseComponents/CometChatEditPreview/CometChatEditPreview";
import { CometChatActionSheet } from "../BaseComponents/CometChatActionSheet/CometChatActionSheet";
import { CometChatEmojiKeyboard } from "../BaseComponents/CometChatEmojiKeyboard/CometChatEmojiKeyboard";
import { ComposerId } from '../../utils/MessagesDataSource';
import { maskComposerEntities, restoreComposerEntities, isSafari, processFileForAudio, isMobileDevice, shouldShowCustomMimeTypes, sanitizeHtmlStringToFragment } from '../../utils/util';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatSoundManager } from "../../resources/CometChatSoundManager/CometChatSoundManager";
import { useCometChatFrameContext } from "../../context/CometChatFrameContext";
import { CometChatMessagePreview } from "../BaseComponents/CometChatMessagePreview/CometChatMessagePreview";
import { CometChatFormattingToolbar } from "../CometChatFormattingToolbar/CometChatFormattingToolbar";
import { CometChatLinkDialog } from "../CometChatLinkDialog/CometChatLinkDialog";
import { CometChatLinkPopover } from "../CometChatLinkPopover/CometChatLinkPopover";
import { useRichTextComposer } from "../useRichTextComposer/useRichTextComposer";
import { emojiToShortcode } from '../../utils/EmojiShortcodeUtils';

export type ContentToDisplay =
  | "attachments"
  | "emojiKeyboard"
  | "voiceRecording"
  | "ai"
  | "none";


type MediaMessageFileType =
  | typeof CometChatUIKitConstants.MessageTypes.image
  | typeof CometChatUIKitConstants.MessageTypes.video
  | typeof CometChatUIKitConstants.MessageTypes.audio
  | typeof CometChatUIKitConstants.MessageTypes.file;
export type ActionOnClickType = (() => void) | null;

interface MessageComposerProps {
  /**
   * The initial text pre-filled in the message input when the component mounts.
   * @defaultValue ""
   */
  initialComposerText?: string;

  /**
   * Disables the typing indicator for the current message composer.
   * @defaultValue `false`
   */
  disableTypingEvents?: boolean;

  /**
   * Disables the mentions functionality in the message composer.
   * @defaultValue `false`
   */
  disableMentions?: boolean;

  /**
   * Hides the image attachment option in the message composer.
   * @defaultValue `false`
   */
  hideImageAttachmentOption?: boolean;

  /**
   * Hides the video attachment option in the message composer.
   * @defaultValue `false`
   */
  hideVideoAttachmentOption?: boolean;

  /**
   * Hides the audio attachment option in the message composer.
   * @defaultValue `false`
   */
  hideAudioAttachmentOption?: boolean;

  /**
   * Hides the file attachment option in the message composer.
   * @defaultValue `false`
   */
  hideFileAttachmentOption?: boolean;

  /**
   * Hides the polls option in the message composer.
   * @defaultValue `false`
   */
  hidePollsOption?: boolean;

  /**
   * Hides the collaborative document option in the message composer.
   * @defaultValue `false`
   */
  hideCollaborativeDocumentOption?: boolean;

  /**
   * Hides the collaborative whiteboard option in the message composer.
   * @defaultValue `false`
   */
  hideCollaborativeWhiteboardOption?: boolean;

  /**
   * Hides the attachment button in the message composer.
   * @defaultValue `false`
   */
  hideAttachmentButton?: boolean;

  /**
   * Hides the voice recording button in the message composer.
   * @defaultValue `false`
   */
  hideVoiceRecordingButton?: boolean;

  /**
   * Hides the emoji keyboard button in the message composer.
   * @defaultValue `false`
   */
  hideEmojiKeyboardButton?: boolean;

  /**
   * Hides the stickers button in the message composer.
   * @defaultValue `false`
   */
  hideStickersButton?: boolean;

  /**
   * Hides the send button in the message composer.
   * @defaultValue `false`
   */
  hideSendButton?: boolean;

  /**
   * The user to send messages to. This prop specifies the recipient of the message.
   */
  user?: CometChat.User;

  /**
   * The group to send messages to.
   * @remarks This prop is used if the `user` prop is not provided.
   */
  group?: CometChat.Group;

  /**
   * The ID of the parent message. This is used for threading or replying to a specific message.
   */
  parentMessageId?: number;

  /**
   * Options for default attachments, including various attachment types available in the composer.
   */
  attachmentOptions?: CometChatMessageComposerAction[];

  /**
   * Array of text formatters to apply to the message text for customization and styling.
   */
  textFormatters?: Array<CometChatTextFormatter>;

  /**
   * Determines the behavior of the Enter key in the composer (e.g., send message or add a new line).
   * @default EnterKeyBehavior.SendMessage
   */
  enterKeyBehavior?: EnterKeyBehavior;

  /**
   * Disables sound for incoming messages.
   * @defaultValue `false`
   */
  disableSoundForMessage?: boolean;

  /**
   * Custom audio sound for incoming messages.
   */
  customSoundForMessage?: string;

  /**
   * Callback function triggered when the message input text changes.
   * @param text - The current text value of the message input.
   * @returns void
   */
  onTextChange?: (text: string) => void;

  /**
   * Callback function triggered when the message composer encounters an error.
   * @param error - An instance of `CometChat.CometChatException` representing the error.
   * @returns void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Callback function triggered when the send button is clicked.
   * @param message - The message that was sent.
   * @param previewMessageMode - Optionally, specify if the message is in preview mode.
   */
  onSendButtonClick?: (
    message: CometChat.BaseMessage,
    previewMessageMode?: PreviewMessageMode
  ) => void;

  /**
   * A custom view for the send button to customize its appearance or behavior.
   */
  sendButtonView?: JSX.Element;

  /**
   * A custom view for an auxiliary button, which can be used alongside the send button.
   */
  auxiliaryButtonView?: JSX.Element;

  /**
   * A custom header section displayed at the top of the message composer.
   */
  headerView?: JSX.Element;

  /**
   * Controls the visibility of the scrollbar in the list.
   * @defaultValue `false`
   */
  showScrollbar?: boolean;

  /**
   * The placeholder text to display in the message input field when it is empty.
   * @defaultValue ""
   */
  placeholderText?: string;

  /**
   * Boolean to show or hide "@all" mention functionality in group chats.
   * @defaultValue `false`
   */
  disableMentionAll?: boolean;

  /**
   * The mentionAll label for the app used to render "@all" mentions
   * @defaultValue "all"
   */
  mentionAllLabel?: string;

  /**
   * Custom request builder for mentions user list.
   * @defaultValue `undefined` - Uses default internal request builder.
   */
  mentionsUsersRequestBuilder?: CometChat.UsersRequestBuilder;

  /**
   * Custom request builder for mentions group members list.
   * @defaultValue `undefined` - Uses default internal request builder
   */
  mentionsGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  /**
   * Enables rich text editing capabilities in the message composer.
   * @defaultValue `true`
   */
  enableRichTextEditor?: boolean;

  /**
   * Show floating toolbar when text is selected.
   * NOTE: Ignored on mobile devices - falls back to fixed toolbar.
   * @defaultValue false
   */
  showToolbarOnSelection?: boolean;

  /**
   * Hides the rich text formatting options (e.g., bold, italic, lists, links)
   * in the message composer.
   * @defaultValue false
   */
  hideRichTextFormattingOptions?: boolean;

}

/**
 * Represents the state of the message composer.
 */
type State = {
  text: string;
  addToMsgInputText: string;
  textMessageToEdit: CometChat.TextMessage | null;
  messageToReply: CometChat.BaseMessage | null;
  contentToDisplay: ContentToDisplay;
  loggedInUser: CometChat.User | null;
  showPoll: boolean;
  showMentionsCountWarning: boolean;
  showValidationError: boolean;
};

/**
 * Represents the possible actions that can be dispatched to update the state.
 */
export type Action =
  | { type: "setText"; text: State["text"] }
  | { type: "setAddToMsgInputText"; addToMsgInputText: State["addToMsgInputText"] }
  | { type: "setTextMessageToEdit"; textMessageToEdit: State["textMessageToEdit"] }
  | { type: "setMessageToReply"; messageToReply: State["messageToReply"] }
  | { type: "setContentToDisplay"; contentToDisplay: ContentToDisplay }
  | { type: "setLoggedInUser"; loggedInUser: CometChat.User }
  | { type: "setShowPoll"; showPoll: boolean }
  | { type: "setShowMentionsCountWarning"; showMentionsCountWarning: boolean }
  | { type: "setShowValidationError"; showValidationError: boolean };

const USER_GROUP_NOT_PROVIDED_ERROR_STR =
  "No user or group object provided. Should at least provide one.";
const END_TYPING_AFTER_START_IN_MS = 500;

/**
 * Reducer function to handle state changes for various actions in the message composer.
 */
function stateReducer(state: State, action: Action) {
  let newState = state;
  const { type } = action;
  switch (type) {
    case "setText":
      newState = { ...state, text: action.text };
      break;
    case "setAddToMsgInputText":
      newState = { ...state, addToMsgInputText: action.addToMsgInputText };
      break;
    case "setTextMessageToEdit":
      newState = { ...state, textMessageToEdit: action.textMessageToEdit };
      break;
    case "setMessageToReply":
      newState = { ...state, messageToReply: action.messageToReply };
      break;
    case "setContentToDisplay":
      newState = { ...state, contentToDisplay: action.contentToDisplay };
      break;
    case "setLoggedInUser":
      newState = { ...state, loggedInUser: action.loggedInUser };
      break;
    case "setShowPoll":
      newState = { ...state, showPoll: action.showPoll };
      break;
    case "setShowMentionsCountWarning":
      newState = { ...state, showMentionsCountWarning: action.showMentionsCountWarning };
      break;
    case "setShowValidationError":
      newState = { ...state, showValidationError: action.showValidationError };
      break;
    default: {
      throw new Error("Unknown action");
    }
  }
  return newState;
}

/**
 * Wraps URLs in an HTML string with <a> anchor elements.
 * Walks text nodes in the parsed HTML and replaces URL matches with styled anchors.
 * Skips text already inside <a>, <code>, or <pre> elements.
 */
function wrapUrlsInHtml(html: string): string {
  // Match URLs: requires either domain.tld format OR host:port format
  const urlRegex = /((https?:\/\/)([\w\-\.]+\.[\w\-\.]+|[\w\-]+:\d+)(\/[\S]*)?)/gi;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    // Skip text inside <a>, <code>, or <pre>
    let skip = false;
    let parent: Node | null = node.parentNode;
    while (parent && parent !== tempDiv) {
      if (parent.nodeType === Node.ELEMENT_NODE) {
        const tag = (parent as Element).tagName.toLowerCase();
        if (tag === 'a' || tag === 'code' || tag === 'pre') {
          skip = true;
          break;
        }
      }
      parent = parent.parentNode;
    }
    if (!skip) textNodes.push(node);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    urlRegex.lastIndex = 0;
    if (!urlRegex.test(text)) continue;

    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    urlRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[1];
      if (match.index > lastIdx) {
        frag.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
      }
      const anchor = document.createElement('a');
      let href = url;
      if (/^www\./i.test(url)) {
        href = 'https://' + url;
      }
      anchor.href = href;
      anchor.textContent = url;
      anchor.setAttribute('contentEditable', 'false');
      anchor.style.color = 'var(--cometchat-link-button)';
      anchor.style.cursor = 'pointer';
      frag.appendChild(anchor);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.substring(lastIdx)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return tempDiv.innerHTML;
}

/**
 * Processes pasted HTML in chunks to avoid blocking the main thread on large pastes.
 * Applies the same sanitization logic as the synchronous cleaner but yields via
 * setTimeout(0) between chunks of CHUNK_SIZE nodes, then calls pasteHtmlAtCaret
 * and dispatches an input event once all nodes have been processed.
 */
function processChunkedPaste(
  tempDiv: HTMLElement,
  inputEl: HTMLElement,
  pasteHtmlAtCaret: (html: string) => void
): void {
  const CHUNK_SIZE = 500;
  const doc = tempDiv.ownerDocument;

  const allowedTags = new Set([
    'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del',
    'ol', 'ul', 'li', 'a', 'blockquote', 'pre', 'code',
    'br', 'span', 'p', 'div', 'sub', 'sup'
  ]);

  const stack: Node[] = [tempDiv];

  /**
   * Convert style-based formatting to semantic HTML tags before stripping styles.
   * Many apps (Slack, Google Docs, etc.) use inline styles instead of <b>/<i> tags.
   */
  function convertStylesToTags(element: HTMLElement): void {
    const style = element.style;
    const tag = element.tagName.toLowerCase();
    const parent = element.parentNode;
    if (!parent) return;

    // font-weight: bold/700+ → <b>
    const fw = style.fontWeight;
    if (fw === 'bold' || fw === 'bolder' || (parseInt(fw) >= 700)) {
      const b = doc.createElement('b');
      while (element.firstChild) b.appendChild(element.firstChild);
      parent.replaceChild(b, element);
      // Copy remaining children processing to the new <b> element
      // Re-check the <b> for other styles (italic etc.)
      convertStylesToTags(b);
      return;
    }

    // font-style: italic → <i>
    if (style.fontStyle === 'italic') {
      const i = doc.createElement('i');
      while (element.firstChild) i.appendChild(element.firstChild);
      parent.replaceChild(i, element);
      convertStylesToTags(i);
      return;
    }

    // text-decoration containing underline → <u>
    const td = style.textDecoration || style.textDecorationLine || '';
    if (td.includes('underline')) {
      const u = doc.createElement('u');
      while (element.firstChild) u.appendChild(element.firstChild);
      parent.replaceChild(u, element);
      convertStylesToTags(u);
      return;
    }

    // text-decoration containing line-through → <s>
    if (td.includes('line-through')) {
      const s = doc.createElement('s');
      while (element.firstChild) s.appendChild(element.firstChild);
      parent.replaceChild(s, element);
      convertStylesToTags(s);
      return;
    }
  }

  // Pre-pass: convert style-based formatting to semantic tags
  const allElements = Array.from(tempDiv.querySelectorAll('*')) as HTMLElement[];
  for (const el of allElements) {
    if (el.style && el.style.length > 0) {
      convertStylesToTags(el);
    }
  }

  function processChunk() {
    let processed = 0;
    while (stack.length > 0 && processed < CHUNK_SIZE) {
      const parent = stack.pop()!;
      const children = Array.from(parent.childNodes);
      for (const child of children) {
        if (child instanceof HTMLElement) {
          processed++;

          const tag = child.tagName.toLowerCase();

          // Remove non-allowed tags but keep their children
          if (!allowedTags.has(tag)) {
            while (child.firstChild) {
              parent.insertBefore(child.firstChild, child);
            }
            parent.removeChild(child);
            continue;
          }

          // Strip style attribute
          child.removeAttribute('style');

          // Flatten mention spans to plain text so pasted mentions
          // appear as display names (e.g. "@all") instead of live mention elements.
          // This prevents raw tokens like <@all:all> from appearing when the
          // composer later processes the HTML through text formatters.
          if (tag === 'span') {
            const isMentionSpan = child.hasAttribute('data-cometchat-mention') ||
              child.className.includes('cometchat-mentions');
            if (isMentionSpan) {
              const plainText = doc.createTextNode(child.textContent || '');
              parent.replaceChild(plainText, child);
              continue;
            }
            child.removeAttribute('class');
          } else {
            child.removeAttribute('class');
          }

          // Strip id attribute
          child.removeAttribute('id');

          // Push children onto stack for further cleaning
          stack.push(child);
        }
      }
    }

    if (stack.length > 0) {
      setTimeout(processChunk, 0);
    } else {
      // All nodes cleaned — unwrap top-level <p>/<div> wrappers
      const topChildren = Array.from(tempDiv.childNodes);
      let isFirstBlock = true;
      for (const child of topChildren) {
        if (child instanceof HTMLElement) {
          const tag = child.tagName.toLowerCase();
          if (tag === 'p' || tag === 'div') {
            if (!isFirstBlock) {
              tempDiv.insertBefore(doc.createElement('br'), child);
            }
            isFirstBlock = false;
            while (child.firstChild) {
              tempDiv.insertBefore(child.firstChild, child);
            }
            tempDiv.removeChild(child);
          }
        }
      }

      pasteHtmlAtCaret(tempDiv.innerHTML);
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      // Scroll to bottom so the caret remains visible after pasting long content
      inputEl.scrollTop = inputEl.scrollHeight;
    }
  }

  processChunk();
}

/**
 * CometChatCompactMessageComposer - A single-line horizontal layout variant of the message composer.
 * All UI elements (attachment button, text input, emoji button, voice recording button, stickers button, 
 * and send button) are arranged horizontally in one line.
 */
export function CometChatCompactMessageComposer(props: MessageComposerProps) {
  const {
    user,
    group,
    parentMessageId = null,
    initialComposerText: initialText = "",
    placeholderText = getLocalizedString('message_composer_placeholder'),
    enterKeyBehavior = EnterKeyBehavior.SendMessage,
    disableTypingEvents = false,
    disableMentions = false,
    disableMentionAll = false,
    hideImageAttachmentOption = false,
    hideVideoAttachmentOption = false,
    hideAudioAttachmentOption = false,
    hideFileAttachmentOption = false,
    hidePollsOption = false,
    hideCollaborativeDocumentOption = false,
    hideCollaborativeWhiteboardOption = false,
    hideAttachmentButton = false,
    hideVoiceRecordingButton = false,
    hideEmojiKeyboardButton = false,
    hideStickersButton = false,
    hideSendButton = false,
    attachmentOptions,
    textFormatters = [],
    disableSoundForMessage = false,
    customSoundForMessage,
    onTextChange,
    onError,
    onSendButtonClick,
    sendButtonView,
    auxiliaryButtonView,
    headerView = null,
    showScrollbar = false,
    mentionAllLabel = "all",
    mentionsUsersRequestBuilder,
    mentionsGroupMembersRequestBuilder,
    enableRichTextEditor = true,
    showToolbarOnSelection = false,
    hideRichTextFormattingOptions = false,
  } = props;

  /**
   * Initialize state with the reducer, passing initial values for the text input and editor state.
   */
  const [state, dispatch] = useReducer(stateReducer, {
    text: initialText,
    addToMsgInputText: initialText,
    textMessageToEdit: null,
    messageToReply: null,
    contentToDisplay: "none",
    loggedInUser: null,
    showPoll: false,
    showMentionsCountWarning: false,
    showValidationError: false,
  });

  /**
   * Refs for handling various elements and their functionalities.
   */
  const textInputRef = useRef<HTMLDivElement | null>(null);
  const wasInsideInlineCodeRef = useRef<boolean>(false);
  const onTextInputChangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaFilePickerRef = useRef<HTMLInputElement | null>(null);
  const uniqueIdRef = useRef<string | null>("");
  const aiBtnRef = useRef<{
    openPopover: () => void;
    closePopover: () => void;
  }>(null);
  const attachmentsBtnRef = useRef<{
    openPopover: () => void;
    closePopover: () => void;
  }>(null);
  const emojiBtnRef = useRef<{
    openPopover: () => void;
    closePopover: () => void;
  }>(null);


  /**
   * Sync props with refs for keeping track of previous values.
   */
  const actionIdToActionOnClick = useRef(new Map<string, ActionOnClickType>());
  const endTypingTimeoutId = useRef<number | null>(null);
  const createPollViewRef = useRef(null);
  const errorHandler = useCometChatErrorHandler(onError);
  const userPropRef = useRefSync(user);
  const groupPropRef = useRefSync(group);
  const parentMessageIdPropRef = useRefSync(parentMessageId);
  const messageToReplyRef = useRefSync(state.messageToReply);
  const onSendButtonClickPropRef = useRefSync(onSendButtonClick);
  const [smartRepliesView, setSmartRepliesView] = React.useState<React.ReactNode | null>(null);
  const [textFormatterArray, setTextFormatters] = useState(textFormatters);

  // Enable real-time URL detection only for the compact composer
  useEffect(() => {
    if (textFormatterArray) {
      for (const formatter of textFormatterArray) {
        if (formatter instanceof CometChatUrlsFormatter) {
          (formatter as CometChatUrlsFormatter).setEnableRealtimeDetection(true);
        }
      }
    }
  }, [textFormatterArray]);

  // Ensure contentEditable div is truly empty on initial render so the
  // CSS :empty:before placeholder pseudo-selector activates.
  // Browsers may insert default <br> nodes into empty contentEditable elements.
  useEffect(() => {
    const el = textInputRef.current;
    if (el && el.textContent?.trim() === '' && el.childNodes.length > 0) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }
  }, []);

  const [mentionsSearchTerm, setMentionsSearchTerm] = useState("");
  const mentionsSearchTermTemp = React.useRef<string>("");
  const lastEmptySearchTerm = React.useRef("");
  const sel = React.useRef<Selection | undefined>(undefined);
  const range = React.useRef<Range | undefined>(undefined);
  const [showListForMentions, setShowListForMentions] = useState(false);
  const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const micPermissionStatusRef = useRef<PermissionStatus | null>(null);

  // Inline recording bar state and refs
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [isBlobReady, setIsBlobReady] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const playbackTimerRef = useRef<number | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const waveformStreamRef = useRef<MediaStream | null>(null);
  const waveformSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  // Stores the recorded audio blob for playback when recording is paused/stopped
  const recordedBlobRef = useRef<Blob | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const inlineMediaStreamRef = useRef<MediaStream | null>(null);
  // Stores bar heights (0–1 normalized) captured when recording is paused, for playback progress rendering
  const frozenBarHeightsRef = useRef<number[]>([]);
  // Rolling history buffer of amplitude samples for the scrolling waveform visualizer
  const waveformHistoryRef = useRef<number[]>([]);
  // Total recording duration in seconds at the moment recording was paused
  const recordingDurationRef = useRef<number>(0);

  const mentionsTextFormatterInstanceRef = useRef<CometChatMentionsFormatter>(
    ChatConfigurator.getDataSource().getMentionsTextFormatter({})
  );
  const [mentionsSearchCount, setMentionsSearchCount] = useState(0);

  const [userMemberListType, setUserMemberListType] = useState<
    UserMemberListType | undefined
  >();
  const [usersRequestBuilder, setUsersRequestBuilder] = useState<
    CometChat.UsersRequestBuilder | undefined
  >(undefined);
  const [groupMembersRequestBuilder, setGroupMembersRequestBuilder] = useState<
    CometChat.GroupMembersRequestBuilder | undefined
  >(undefined);
  const userMemberWrapperRef = useRef<any>(null);
  const currentSelectionForRegex = useRef<Selection | null>(null);
  const currentSelectionForRegexRange = useRef<Range | null>(null);

  // Cloned range snapshot for paste-link-on-selection (immune to browser selection mutations).
  const pasteSelectionRange = useRef<Range | null>(null);

  const mentionsFormatterInstanceId = "composer_" + Date.now();
  const disableSoundForMessagePropRef = useRefSync(disableSoundForMessage);
  const customSoundForMessagePropRef = useRefSync(customSoundForMessage);
  const IframeContext = useCometChatFrameContext();

  const getCurrentWindow = () => {
    return IframeContext?.iframeWindow || window;
  };

  const getCurrentDocument = () => {
    return IframeContext?.iframeDocument || document;
  };

  // --- Rich text formatting (shared hook) ---
  const {
    isFixedToolbarVisible,
    isFloatingToolbarVisible,
    setIsFloatingToolbarVisible,
    floatingToolbarPosition,
    activeFormats,
    setActiveFormats,
    showLinkInput,
    showLinkPopover,
    linkPopoverData,
    isLinkEditMode,
    linkEditData,
    linkDialogSelectedText,
    richTextFormatter,
    handleLinkClick,
    handleLinkSubmit,
    handleLinkCancel,
    handleInputClick,
    handleLinkPopoverEdit,
    handleLinkPopoverRemove,
    handleLinkPopoverClose,
    handleFormatApplied,
    handleFormattingKeyDown,
    saveMarkdownUndoState,
    handleMarkdownUndo,
  } = useRichTextComposer({
    enableRichTextEditor,
    hideRichTextFormattingOptions,
    showToolbarOnSelection,
    getCurrentDocument,
    getCurrentWindow,
    getCurrentInput,
    composerContainerClass: 'cometchat-compact-message-composer',
    errorHandler,
    setTextFormatters,
  });

  /**
   * Processes a file by reading its binary content and creating a new File object.
   */
  function processFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result !== null) {
            resolve(new File([reader.result], file.name, file));
          }
        };
        reader.onerror = () => {
          reject(
            new Error(`Converting the file named "${file.name}" to binary failed`)
          );
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        errorHandler(error, "processFile");
      }
    });
  }

  /**
   * isPartOfCurrentChatForUIEvent: To check if the message belongs for this list and is not part of thread
   */
  const isPartOfCurrentChatForUIEvent: (message: CometChat.BaseMessage) => boolean | undefined = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        const receiverId = message?.getReceiverId();
        const receiverType = message?.getReceiverType();
        if (parentMessageIdPropRef.current) {
          if (message.getParentMessageId() === parentMessageIdPropRef.current) {
            return true;
          }
        } else {
          if (message.getParentMessageId()) {
            return false;
          }

          if (userPropRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.user && receiverId === userPropRef.current.getUid()) {
              return true;
            }
          } else if (groupPropRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.group && receiverId === groupPropRef.current.getGuid()) {
              return true;
            }
          }
          return false;
        }
      } catch (error) {
        errorHandler(error, "isPartOfCurrentChatForUIEvent");
      }
    },
    []
  );

  /**
   * Manages playing audio
   */
  const playAudioIfSoundNotDisabled = useCallback((): void => {
    const disableSoundForMessage = disableSoundForMessagePropRef.current;
    if (!disableSoundForMessage) {
      CometChatSoundManager.play(
        CometChatSoundManager.Sound.outgoingMessage!,
        customSoundForMessagePropRef.current
      );
    }
  }, [customSoundForMessagePropRef, disableSoundForMessagePropRef]);

  /**
   * Creates receiver details object
   * @throws `Error` if `user` or 'group' both props are missing
   */
  const getReceiverDetails = useCallback((): {
    receiverId: string;
    receiverType: string;
    isBlocked?: boolean;
  } => {
    try {
      const user = userPropRef.current;
      const group = groupPropRef.current;
      if (user) {
        const isBlocked = user.getBlockedByMe() || user.getHasBlockedMe();
        return {
          receiverId: user?.getUid(),
          receiverType: CometChatUIKitConstants.MessageReceiverType.user,
          isBlocked: isBlocked
        };
      }
      if (group) {
        return {
          receiverId: group?.getGuid(),
          receiverType: CometChatUIKitConstants.MessageReceiverType.group,
        };
      }
      throw new Error(USER_GROUP_NOT_PROVIDED_ERROR_STR);
    } catch (error) {
      errorHandler(error, "getReceiverDetails");
      throw new Error(USER_GROUP_NOT_PROVIDED_ERROR_STR);
    }
  }, [groupPropRef, userPropRef, errorHandler]);

  /**
   * Creates a `CometChat.TypingIndicator` instance
   */
  const getTypingNotification = useCallback((): CometChat.TypingIndicator | undefined => {
    try {
      const { receiverId, receiverType, isBlocked } = getReceiverDetails();
      if (isBlocked) {
        return undefined;
      }
      return new CometChat.TypingIndicator(receiverId, receiverType);
    } catch (error) {
      errorHandler(error, "getTypingNotification");
    }
  }, [getReceiverDetails, errorHandler]);

  /**
   * Calls `startTyping` SDK function after creating a `CometChat.TypingIndicator` instance
   */
  const startTyping = useCallback((): void => {
    try {
      const typingNotification = getTypingNotification();
      if (!typingNotification) {
        return;
      }
      CometChat.startTyping(typingNotification);
    } catch (error) {
      errorHandler(error, "startTyping");
    }
  }, [getTypingNotification, errorHandler]);

  /**
   * Calls `endTyping` SDK function after creating a `CometChat.TypingIndicator` instance
   */
  const endTyping = useCallback((): void => {
    try {
      CometChat.endTyping(getTypingNotification());
      endTypingTimeoutId.current = null;
    } catch (error) {
      errorHandler(error, "endTyping");
    }
  }, [getTypingNotification, errorHandler]);

  /**
   * Handles emitting typing events
   */
  const handleTyping = useCallback((): void => {
    try {
      if (disableTypingEvents) {
        return;
      }
      if (endTypingTimeoutId.current !== null) {
        getCurrentWindow()?.clearTimeout(endTypingTimeoutId.current);
        endTypingTimeoutId.current = null;
      } else {
        startTyping();
      }
      endTypingTimeoutId.current = getCurrentWindow()?.setTimeout(
        () => endTyping(),
        END_TYPING_AFTER_START_IN_MS
      );
    } catch (error) {
      errorHandler(error, "handleTyping");
    }
  }, [startTyping, endTyping, disableTypingEvents, errorHandler]);

  /**
   * Creates a composerId object
   */
  function getComposerId(): ComposerId {
    try {
      const user = userPropRef.current;
      if (user) {
        return { user: user.getUid(), group: null, parentMessageId };
      }

      const group = groupPropRef.current;
      if (group) {
        return { user: null, group: group.getGuid(), parentMessageId };
      }

      return { user: null, group: null, parentMessageId };
    } catch (error) {
      errorHandler(error, "getComposerId");
      return { user: null, group: null, parentMessageId: null };
    }
  }

  /**
   * Sets the `setAddToMsgInputText` state
   * This is a workaround for an issue faced when setting the cometchat-message-input's text state
   */
  const mySetAddToMsgInputText = useCallback(
    function (text: string): void {
      try {
        dispatch({ type: "setAddToMsgInputText", addToMsgInputText: "" });
        setTimeout(() => {
          dispatch({ type: "setAddToMsgInputText", addToMsgInputText: text });
        }, 0);
      } catch (error) {
        errorHandler(error, "setAddToMsgInputText");
      }
    },
    [dispatch, errorHandler]
  );

  /**
   * Handles SDK errors
   */
  const handleSDKError = useCallback(
    (
      error: unknown,
      message: CometChat.TextMessage | CometChat.MediaMessage,
      wasEditMethodCall: boolean
    ): void => {
      try {
        message.setMetadata({ error });
        if (wasEditMethodCall) {
          CometChatMessageEvents.ccMessageEdited.next({
            message,
            status: MessageStatus.error,
          });
        } else {
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.error,
          });
        }
      } catch (error) {
        errorHandler(error, "handleSDKError");
      }
    },
    [errorHandler]
  );

  /**
   * Creates a `CometChat.TextMessage` instance
   */
  const getTextMessage = useCallback(
    (text: string) => {
      try {
        const { receiverId, receiverType } = getReceiverDetails();
        const textMessage = new CometChat.TextMessage(
          receiverId,
          text,
          receiverType
        );
        textMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        textMessage.setMuid(CometChatUIKitUtility.ID());
        const parentMsgId = parentMessageIdPropRef.current;
        if (parentMsgId !== null) {
          textMessage.setParentMessageId(parentMsgId);
        }
        return textMessage;
      } catch (error) {
        errorHandler(error, "getTextMessage");
        throw error;
      }
    },
    [getReceiverDetails, parentMessageIdPropRef, errorHandler]
  );

  /**
   * Calls `sendMessage` SDK function
   */
  const sendTextMessage = useCallback(
    async <T extends CometChat.TextMessage>(
      textMessage: T
    ): Promise<T | undefined> => {
      try {
        let msg = textMessage;
        for (let i = 0; i < textFormatterArray.length; i++) {
          msg = textFormatterArray[i].formatMessageForSending(msg) as T;
        }
        if (onTextChange) {
          onTextChange("");
        }
        const sentTextMessage = await CometChat.sendMessage(msg);
        mentionsTextFormatterInstanceRef.current.resetCometChatUserGroupMembers();
        mentionsTextFormatterInstanceRef.current.reset();
        return sentTextMessage as T;
      } catch (error) {
        errorHandler(error, "sendTextMessage");
        handleSDKError(error, textMessage, false);
      }
    },
    [handleSDKError, textFormatterArray, onTextChange, errorHandler]
  );

  /**
   * Handles sending text message
   */
  const handleTextMessageSend = useCallback(
    async (text: string): Promise<void> => {
      try {
        const textMessage = getTextMessage(text);
        let mentionedUsers =
          mentionsTextFormatterInstanceRef.current.getCometChatUserGroupMembers();
        if (mentionedUsers) {
          let userObj = [];
          for (let i = 0; i < mentionedUsers.length; i++) {
            userObj.push(
              new CometChat.User({
                uid: mentionedUsers[i].getUid(),
                name: mentionedUsers[i].getName(),
              })
            );
          }
          if (messageToReplyRef.current) {
            textMessage.setQuotedMessage(messageToReplyRef.current);
            textMessage.setQuotedMessageId(messageToReplyRef.current.getId());
          }
          dispatch({
            type: "setMessageToReply",
            messageToReply: null,
          });

          textMessage.setMentionedUsers(userObj);
          mentionedUsers = [];
        }
        CometChatMessageEvents.ccMessageSent.next({ message: textMessage, status: MessageStatus.inprogress });

        const sentTextMessage = await sendTextMessage(textMessage);
        if (sentTextMessage) {
          CometChatMessageEvents.ccMessageSent.next({
            message: sentTextMessage,
            status: MessageStatus.success,
          });
          CometChatMessageEvents.ccReplyToMessage.next({ message: sentTextMessage, status: MessageStatus.success });
          playAudioIfSoundNotDisabled();
        }
      } catch (error) {
        errorHandler(error, "handleTextMessageSend");
      }
    },
    [getTextMessage, sendTextMessage, errorHandler, playAudioIfSoundNotDisabled]
  );

  /**
   * Creates a `CometChat.TextMessage` instance with the `id` of the instance set to `textMessageId`
   */
  const getEditedTextMessage = useCallback(
    (newText: string, textMessageId: number) => {
      try {
        const { receiverId, receiverType } = getReceiverDetails();
        const newTextMessage = new CometChat.TextMessage(
          receiverId,
          newText,
          receiverType
        );
        newTextMessage.setId(textMessageId);
        return newTextMessage;
      } catch (error) {
        errorHandler(error, "getEditedTextMessage");
        throw error;
      }
    },
    [getReceiverDetails, errorHandler]
  );

  /**
   * Calls `editMessage` SDK function
   */
  const sendEditedTextMessage = useCallback(
    async <T extends CometChat.TextMessage>(
      editedTextMessage: T
    ): Promise<T | undefined> => {
      try {
        let msg = editedTextMessage;
        for (let i = 0; i < textFormatterArray.length; i++) {
          msg = textFormatterArray[i].formatMessageForSending(msg) as T;
        }
        const editedMessage = await CometChat.editMessage(msg);
        mentionsTextFormatterInstanceRef.current.resetCometChatUserGroupMembers();
        return editedMessage as T;
      } catch (error) {
        errorHandler(error, "sendEditedTextMessage");
        handleSDKError(error, editedTextMessage, true);
      }
    },
    [handleSDKError, textFormatterArray, errorHandler]
  );

  /**
   * Handles sending edited messages
   */
  const handleEditTextMessageSend = useCallback(
    async (
      newText: string,
      textMessage: CometChat.TextMessage
    ): Promise<void> => {
      try {
        if (onSendButtonClickPropRef.current) {
          onSendButtonClickPropRef.current(getEditedTextMessage(newText, textMessage.getId()), PreviewMessageMode.edit);
          mySetAddToMsgInputText("");
        } else {
          const editedMessage = await sendEditedTextMessage(
            getEditedTextMessage(newText, textMessage.getId())
          );
          mySetAddToMsgInputText("");
          if (editedMessage) {
            CometChatMessageEvents.ccMessageEdited.next({
              message: editedMessage,
              status: MessageStatus.success,
            });
          }
        }
      } catch (error) {
        errorHandler(error, "handleEditTextMessageSend");
      }
    },
    [sendEditedTextMessage, getEditedTextMessage, errorHandler, mySetAddToMsgInputText, onSendButtonClickPropRef]
  );

  /**
   * Creates a `CometChat.MediaMessage` instance
   */
  const getMediaMessage = useCallback(
    async (
      file: File,
      fileType: MediaMessageFileType
    ): Promise<CometChat.MediaMessage> => {
      try {
        const processedFile = fileType == CometChatUIKitConstants.MessageTypes.audio 
          ? await processFileForAudio(file) 
          : await processFile(file);
        const { receiverId, receiverType } = getReceiverDetails();
        const mediaMessage = new CometChat.MediaMessage(
          receiverId,
          processedFile,
          fileType,
          receiverType
        );
        mediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        mediaMessage.setMuid(CometChatUIKitUtility.ID());
        mediaMessage.setMetadata({ file: processedFile });
        const parentMsgId = parentMessageIdPropRef.current;
        if (parentMsgId !== null) {
          mediaMessage.setParentMessageId(parentMsgId);
        }
        if (messageToReplyRef.current) {
          mediaMessage.setQuotedMessage(messageToReplyRef.current);
          mediaMessage.setQuotedMessageId(messageToReplyRef.current.getId());
        }
        dispatch({
          type: "setMessageToReply",
          messageToReply: null,
        });

        return mediaMessage;
      } catch (error) {
        errorHandler(error, "getMediaMessage");
        throw error;
      }
    },
    [getReceiverDetails, parentMessageIdPropRef, errorHandler]
  );

  /**
   * Calls `sendMediaMessage` SDK function
   */
  const sendMediaMessage = useCallback(
    async <T extends CometChat.MediaMessage>(
      mediaMessage: T
    ): Promise<T | undefined> => {
      try {
        const sentMediaMessage = await CometChat.sendMediaMessage(mediaMessage);
        CometChatMessageEvents.ccReplyToMessage.next({ message: mediaMessage, status: MessageStatus.success });
        return sentMediaMessage as T;
      } catch (error) {
        handleSDKError(error, mediaMessage, false);
        errorHandler(error, "sendMediaMessage");
      }
    },
    [handleSDKError, errorHandler]
  );

  /**
   * Handles sending media message
   */
  const handleMediaMessageSend = useCallback(
    async (file: File, fileType: MediaMessageFileType): Promise<void> => {
      try {
        const mediaMessage = await getMediaMessage(file, fileType);
        CometChatMessageEvents.ccMessageSent.next({
          message: mediaMessage,
          status: MessageStatus.inprogress,
        });

        const sentMediaMessage = await sendMediaMessage(mediaMessage);
        if (sentMediaMessage) {
          CometChatMessageEvents.ccMessageSent.next({
            message: sentMediaMessage,
            status: MessageStatus.success,
          });
          playAudioIfSoundNotDisabled();
        }
      } catch (error) {
        errorHandler(error, "handleMediaMessageSend");
      }
    },
    [playAudioIfSoundNotDisabled, getMediaMessage, sendMediaMessage, errorHandler]
  );

  /**
   * @returns A string in the format `audio-recording-yyyyMMddHHmmss`
   */
  function audioRecordingSimpleDateFormat() {
    try {
      const now = new Date();
      const string = "audio-recording-yyyyMMddHHmmss";
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const date = now.getDate().toString().padStart(2, "0");
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      return string
        .replace("yyyyMMdd", `${year}${month}${date}`)
        .replace("HHmmss", `${hours}${minutes}${seconds}`);
    } catch (error) {
      errorHandler(error, "audioRecordingSimpleDateFormat");
    }
  }

  /**
   * Formats recording time in M:SS format
   * @param seconds - elapsed seconds
   * @returns formatted string like "0:00", "1:05", "59:59"
   */
  function formatRecordingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Empties the content of the message composer input field and sets focus back to it
   */
  const emptyInputField = useCallback(() => {
    try {
      let contentEditable: any = getCurrentInput();
      contentEditable.innerHTML = "";
      // Strip any residual child nodes (e.g., browser-inserted <br>)
      // so the CSS :empty:before pseudo-selector activates for placeholder
      while (contentEditable.firstChild) {
        contentEditable.removeChild(contentEditable.firstChild);
      }
      if (richTextFormatter) {
        richTextFormatter.clearFormattingModes();
        richTextFormatter.resetFontContext(contentEditable);
      }
      contentEditable?.focus();
      // Browser may re-insert <br> after focus(); clean up again
      while (contentEditable.firstChild) {
        contentEditable.removeChild(contentEditable.firstChild);
      }
    } catch (error) {
      errorHandler(error, "emptyInputField");
    }
  }, [errorHandler, richTextFormatter]);

  /**
   * Handles sending a new text message or an edited message
   * The function closes the emojiKeyboard if it is visible before sending or editing a message
   */
  const handleSendButtonClick = useCallback(
    async (textToDispatch: string): Promise<void> => {
      try {
        // Swap the placeholders parked by maskComposerEntities back for the real characters.
        // This is the last step before the text becomes a CometChat.TextMessage, so every
        // formatter that re-parses the string as HTML has already run.
        let text = restoreComposerEntities(textToDispatch);
        // NOTE: the formatter chain is deliberately NOT applied here. Both callers
        // (onSendclick, and onTextInputEnter via the Enter key handler) already ran it on the
        // text they pass in. Running it twice re-parsed already-converted plain text as HTML
        // and silently dropped most of the message.
        if (
          (text = text.trim()).length === 0 ||
          text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim().length === 0 ||
          (state.textMessageToEdit !== null &&
            state.textMessageToEdit.getText() === text)
        ) {
          return;
        }
        if (state.contentToDisplay === "emojiKeyboard") {
          dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
        }
        if (state.contentToDisplay === "voiceRecording") {
          dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
        }
        dispatch({ type: "setText", text: "" });
        emptyInputField();
        setActiveFormats([]);
        richTextFormatter?.clearPendingFormats();
        let onSendButtonClick:
          | ((message: CometChat.BaseMessage, previewMessageMode?: PreviewMessageMode) => void)
          | undefined;
        if (state.textMessageToEdit !== null) {
          dispatch({ type: "setTextMessageToEdit", textMessageToEdit: null });
          await handleEditTextMessageSend(text, state.textMessageToEdit);
        } else if ((onSendButtonClick = onSendButtonClickPropRef.current)) {
          await Promise.all([onSendButtonClick(getTextMessage(text), PreviewMessageMode.none)]);
        } else {
          await handleTextMessageSend(text);
        }
      } catch (error) {
        errorHandler(error, "handleSendButtonClick");
      }
    },
    [
      state.textMessageToEdit,
      state.contentToDisplay,
      dispatch,
      handleEditTextMessageSend,
      handleTextMessageSend,
      errorHandler,
      getTextMessage,
      onSendButtonClickPropRef,
      userPropRef,
      textFormatterArray,
      emptyInputField,
      setActiveFormats
    ]
  );

  /**
   * Creates a unique UUID for the input element
   */
  const createUniqueUUID = useMemo(() => {
    const parentMsgId = parentMessageIdPropRef.current ? parentMessageIdPropRef.current + "_" : "";
    const uid = user?.getUid() ? user.getUid() + "_" : "";
    const guid = group?.getGuid() ? group.getGuid() + "_" : "";
    const uuid = uid + guid + parentMsgId + CometChatUIKitUtility.ID();
    const currentId = uid + guid + parentMsgId;
    if (!uniqueIdRef.current || !uniqueIdRef.current.includes(currentId)) {
      uniqueIdRef.current = "cometchat-compact-message-composer__input-" + uuid;
    }
    return uniqueIdRef.current;
  }, [user, group, parentMessageIdPropRef]);

  /**
   * Gets the current input element
   */
  function getCurrentInput() {
    if (!uniqueIdRef.current) {
      return null;
    }
    return getCurrentDocument()?.querySelector(`.${uniqueIdRef.current}`);
  }

  /**
   * Checks if the provided selection is a descendant of the message composer input element
   */
  function isDescendant(sel: Selection): boolean {
    if (sel.rangeCount > 0) {
      let range = sel.getRangeAt(0);
      let elm = getCurrentInput();
      let parentElm = range.commonAncestorContainer.parentNode;
      if (parentElm?.nodeName === "SPAN") {
        return false;
      }

      if (
        elm?.contains(range.startContainer) &&
        elm?.contains(range.endContainer)
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Sets the current selection and updates caret position and range for text formatting tools
   */
  function setSelection(selection: Selection | null) {
    try {
      if (selection && selection.rangeCount) {
        if (isDescendant(selection)) {
          sel.current = selection;
          range.current = sel.current.getRangeAt(0);
          currentSelectionForRegex.current = sel.current;
          if (sel.current.getRangeAt && sel.current.rangeCount) {
            range.current = sel.current.getRangeAt(0);
            currentSelectionForRegexRange.current = sel.current.getRangeAt(0);

            if (textFormatterArray && textFormatterArray.length) {
              for (let i = 0; i < textFormatterArray.length; i++) {
                textFormatterArray[i].setCaretPositionAndRange(
                  currentSelectionForRegex.current!,
                  currentSelectionForRegexRange.current!
                );
              }
              onKeyUp(new Event("mention_keyup_event"));
            }
          }
        }
      }
    } catch (error) {
      errorHandler(error, "setSelection");
    }
  }

  /**
   * Updates the current selection from the document
   */
  const updateSelection = useCallback(() => {
    const selection = getCurrentDocument()?.getSelection();
    if (selection && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      const inputElement = getCurrentInput();
      if (inputElement && inputElement.contains(currentRange.startContainer)) {
        sel.current = selection;
        range.current = currentRange;
        currentSelectionForRegex.current = selection;
        currentSelectionForRegexRange.current = currentRange;
      }
    }
  }, []);

  /**
   * Checks the availability of the 'plaintext-only' content editable option in the browser.
   * When rich text editor is enabled, returns true to allow HTML formatting.
   */
  const checkPlainTextAvailability = (disabled?: boolean): any => {
    try {
      // When rich text editor is enabled, use regular contentEditable to preserve HTML formatting
      if (enableRichTextEditor) {
        return true;
      }
      
      const temp = getCurrentDocument()?.createElement('div');
      // Type cast to 'any' to bypass the type check
      temp.contentEditable = 'plaintext-only';
      const value = temp.contentEditable === 'plaintext-only';

      if (!disabled && value) {
        return 'plaintext-only';
      } else {
        return false;
      }
    } catch (error) {
      errorHandler(error, "checkPlainTextAvailability");
      return !disabled;
    }
  };

  /**
   * Function to handle the text input change event
   */
  function onTextInputChange(e: any, text?: string) {
    try {
      const newText = text ?? e?.target?.innerText;
      if (typeof newText === "string") {
        // --- Immediate path: runs synchronously on every event ---

        const _inputEl = getCurrentInput() as HTMLElement;
        if (_inputEl) {
          const _codeEl = _inputEl.querySelector('pre.cometchat-rich-text-code-block code');
          if (_codeEl && _codeEl.textContent) {
            const _text = _codeEl.textContent;
            const _visibleText = _text.replace(/\u200B/g, '');
            if (_visibleText.length > 0 && _text !== _visibleText) {
              const _doc = getCurrentDocument()!;
              const _sel = _doc.getSelection();
              let _cursorOffset = 0;
              if (_sel && _sel.rangeCount > 0) {
                const _range = _sel.getRangeAt(0);
                const _walker = _doc.createTreeWalker(_codeEl, NodeFilter.SHOW_TEXT);
                let _node: Node | null = _walker.nextNode();
                while (_node) {
                  if (_node === _range.startContainer) {
                    const _beforeCursor = (_node.textContent || '').substring(0, _range.startOffset);
                    _cursorOffset += _beforeCursor.replace(/\u200B/g, '').length;
                    break;
                  }
                  _cursorOffset += (_node.textContent || '').replace(/\u200B/g, '').length;
                  _node = _walker.nextNode();
                }
              }
              _codeEl.textContent = _visibleText;
              if (_sel && _codeEl.firstChild) {
                const _newRange = _doc.createRange();
                const _offset = Math.min(_cursorOffset, _visibleText.length);
                _newRange.setStart(_codeEl.firstChild, _offset);
                _newRange.collapse(true);
                _sel.removeAllRanges();
                _sel.addRange(_newRange);
              }
            }
          }

          const _sel2 = getCurrentDocument()?.getSelection();
          if (_sel2 && _sel2.rangeCount > 0) {
            const _range2 = _sel2.getRangeAt(0);
            const _node2 = _range2.startContainer;
            const _offset2 = _range2.startOffset;
            const _newRange2 = getCurrentDocument()!.createRange();
            _newRange2.setStart(_node2, _offset2);
            _newRange2.collapse(true);
            _sel2.removeAllRanges();
            _sel2.addRange(_newRange2);
          }
        }

        handleTyping();
        dispatch({ type: "setText", text: newText });
        mySetAddToMsgInputText("");
        if (onTextChange !== undefined) onTextChange(newText);
      }

      // --- Deferred path: debounced 150ms to avoid blocking on long content ---
      if (onTextInputChangeDebounceRef.current) {
        clearTimeout(onTextInputChangeDebounceRef.current);
      }
      onTextInputChangeDebounceRef.current = setTimeout(() => {
        onTextInputChangeDebounceRef.current = null;
        try {
          if (richTextFormatter && e) {
            const inputType = (e as InputEvent)?.inputType || (e?.nativeEvent as InputEvent)?.inputType || '';
            if (!inputType.startsWith('format')) {
              richTextFormatter.clearPendingFormats();
            }

            const element = getCurrentInput() as HTMLElement;
            if (element) {
              // If the input is effectively empty after deletion, clear everything
              // (mirrors the onKeyDown empty check but runs after DOM mutation)
              // But preserve empty block-level formatting elements (lists, blockquotes, code blocks)
              // so that clicking a toolbar button doesn't immediately get wiped out.
              const visibleText = (element.textContent || '').replace(/\u200B/g, '').trim();
              const hasBlockFormatting = element.querySelector('ol, ul, blockquote, pre');
              if (!visibleText && !hasBlockFormatting) {
                emptyInputField();
                setActiveFormats([]);
                richTextFormatter.clearPendingFormats();
                return;
              }

              // Preserve inline code formatting when typing over selected code text
              richTextFormatter.handleInlineCodePreservation(element, wasInsideInlineCodeRef.current);
              wasInsideInlineCodeRef.current = false;

              const textContent = element.textContent || '';

              // Skip markdown shortcuts for very long content (>5000 chars) to stay responsive
              if (textContent.length <= 5000) {
                if (richTextFormatter.handleMarkdownShortcuts(element, saveMarkdownUndoState)) {
                  const formats = richTextFormatter.getActiveFormats(element);
                  setActiveFormats(formats);
                  return;
                }
              }

              // Update active formats for toolbar state
              const formats = richTextFormatter.getActiveFormats(element);
              setActiveFormats(formats);

              if (element.querySelector('ol')) {
                richTextFormatter.fixOrderedListContinuation(element);
              }
            }
          }
        } catch (deferredError) {
          errorHandler(deferredError, "onTextInputChange (deferred)");
        }
      }, 150);
    } catch (error) {
      errorHandler(error, "onTextInputChange");
    }
  }

  /**
   * Callback for handling the Enter key press in the text input
   */
  const onTextInputEnter = useCallback(
    (text: string) => {
      setShowListForMentions(false);
      if ((text === state.text) && state.textMessageToEdit) {
        CometChatMessageEvents.ccMessageEdited.next({ message: state.textMessageToEdit, status: MessageStatus.cancelled });
        return;
      }
      if (typeof text === "string") handleSendButtonClick(text);
      // Empty the text in the message composer
      dispatch({ type: "setText", text: "" });
      mySetAddToMsgInputText("");
    }, [state.textMessageToEdit, setShowListForMentions, handleSendButtonClick, mySetAddToMsgInputText]
  );

  /**
   * Handles key down events for the message composer input
   */
  const onKeyDown = useCallback(
    (event: any) => {
      var contenteditable = getCurrentInput();

      // Track inline code state before key modifies the DOM
      if (contenteditable && richTextFormatter) {
        wasInsideInlineCodeRef.current = !!richTextFormatter.isInsideCodeInline(contenteditable as HTMLElement);
      }
      
      // Handle rich text formatting keyboard shortcuts via shared hook
      if (contenteditable && handleFormattingKeyDown(event, contenteditable as Element)) {
        return;
      }
      
      if (event.keyCode === 13 && !event.shiftKey) {
        if (enterKeyBehavior == EnterKeyBehavior.NewLine) {
          return;
        }
        event.preventDefault();
        if (enterKeyBehavior == EnterKeyBehavior.None) {
          return;
        }
        // Strip zero-width spaces alongside normal whitespace when checking for content
        const visibleTextOnEnter = (contenteditable?.textContent || '').replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();
        if (visibleTextOnEnter || contenteditable?.querySelector('u')?.textContent) {
          // Strip any leftover font-reset spans before extracting HTML
          contenteditable?.querySelectorAll('span').forEach((span: HTMLSpanElement) => {
            if (span.style.fontFamily && span.style.fontSize === '1em' && span.textContent === '\u200B') {
              span.remove();
            }
          });
          let rawHtml = contenteditable?.innerHTML?.trim() === "<br>" ? undefined : contenteditable?.innerHTML.replace(/(<br>\s*)+$/, '');
          if (contenteditable?.innerHTML?.trim() === "<br>") {
            contenteditable.innerHTML = "";
          }
          if (rawHtml && richTextFormatter) {
            rawHtml = richTextFormatter.trimRichTextWhitespace(rawHtml);
          }
          let textToDispatch = rawHtml ? maskComposerEntities(rawHtml) : undefined;
          if (textFormatterArray && textFormatterArray.length) {
            for (let i = 0; i < textFormatterArray.length; i++) {
              textToDispatch =
                textFormatterArray[i].getOriginalText(textToDispatch);
            }
          }
          if (textToDispatch) {
            onTextInputEnter(textToDispatch);
          }
        }
        return;
      }
      if (textFormatterArray && textFormatterArray.length) {
        for (let i = 0; i < textFormatterArray.length; i++) {
          if (contenteditable) {
            textFormatterArray[i].setInputElementReference(contenteditable as HTMLElement);
          }
          textFormatterArray[i].setCaretPositionAndRange(
            currentSelectionForRegex.current!,
            currentSelectionForRegexRange.current!
          );
          textFormatterArray[i].onKeyDown(event);
        }
      }
    }, [textFormatterArray, user, group, state.textMessageToEdit, enterKeyBehavior, onTextInputEnter, handleFormattingKeyDown]
  );

  /**
   * On Every KeyUp Event, pass the event to registered text formatters
   */
  const onKeyUp = useCallback(
    (event: any) => {
      const keyUpCheck = event.keyCode === 13 && !event.shiftKey;
      if (keyUpCheck ||
        (keyUpCheck && enterKeyBehavior == EnterKeyBehavior.None)) {
        event.preventDefault();
        return;
      }

      // Add this check to prevent infinite loops
      if (!event.isTrusted) {
        return;
      }

      if (isSafari()) {
        updateSelection();
      }

      const element = getCurrentInput() as HTMLElement;

      if (event.keyCode === 8 || event.keyCode === 46) {
        const visibleText = (element.textContent || '').replace(/\u200B/g, '').trim();
        if (!visibleText) {
          emptyInputField();
          setActiveFormats([]);
          richTextFormatter?.clearPendingFormats();
        } else if (richTextFormatter) {
          const formats = richTextFormatter.getActiveFormats(element);
          setActiveFormats(formats);
        }
      }

      if (textFormatterArray && textFormatterArray.length) {
        for (let i = 0; i < textFormatterArray.length; i++) {
          if (element) {
            textFormatterArray[i].setInputElementReference(element);
          }
          textFormatterArray[i].setCaretPositionAndRange(
            currentSelectionForRegex.current!,
            currentSelectionForRegexRange.current!
          );

          // Add try-catch and prevent event propagation
          try {
            textFormatterArray[i].onKeyUp(event);
          } catch (error) {
            console.error('Error in text formatter onKeyUp:', error);
          }
        }
      }
    }, [textFormatterArray, user, group, enterKeyBehavior, updateSelection, emptyInputField, setActiveFormats, richTextFormatter]
  );

  /**
   * Paste-link-on-selection: wraps selected text in a hyperlink when a URL is pasted.
   */
  useEffect(() => {
    if (!enableRichTextEditor) return;

    const inputEl = textInputRef.current as HTMLElement | null;
    if (!inputEl) return;
    const doc = getCurrentDocument();
    if (!doc) return;

    // Keep a cloned snapshot of the selection updated on every change
    const trackSelection = () => {
      const s = getCurrentWindow().getSelection();
      if (s && s.rangeCount > 0) {
        const r = s.getRangeAt(0);
        if (inputEl.contains(r.startContainer)) {
          pasteSelectionRange.current = r.cloneRange();
        }
      }
    };

    // Sync the browser's current selection into sel.current / range.current so
    // pasteHtmlAtCaret can insert at the correct caret position.
    // Must be called before any pasteHtmlAtCaret invocation inside handlePaste.
    const syncSelectionRefs = () => {
      const win = getCurrentWindow();
      const s = win?.getSelection();
      if (s && s.rangeCount > 0) {
        const r = s.getRangeAt(0);
        if (inputEl.contains(r.startContainer)) {
          sel.current = s;
          range.current = r;
        }
      }
    };

    /**
     * Insert HTML at a saved range, then move the cursor after the inserted content.
     * This is a self-contained insertion that does NOT rely on sel.current / range.current
     * being valid at the time of the call (important for async processChunkedPaste).
     */
    const insertHtmlAtRange = (html: string, savedRange: Range) => {
      try {
        savedRange.deleteContents();
        const el = doc.createElement('div');
        el.innerHTML = html;
        const frag = doc.createDocumentFragment();
        let lastNode: Node | null = null;
        while (el.firstChild) {
          const node = el.firstChild;
          lastNode = frag.appendChild(el.removeChild(node));
        }

        const sc = savedRange.startContainer;
        const so = savedRange.startOffset;
        if (sc === inputEl || (sc instanceof HTMLElement && sc.getAttribute('contenteditable') === 'true')) {
          const childAtOffset = sc.childNodes[so];
          if (childAtOffset instanceof HTMLElement && (childAtOffset.tagName === 'OL' || childAtOffset.tagName === 'UL')) {
            let targetLi = childAtOffset.querySelector('li');
            if (!targetLi) {
              targetLi = doc.createElement('li');
              targetLi.style.display = 'list-item';
              childAtOffset.prepend(targetLi);
            }
            if (targetLi.childNodes.length === 1 && targetLi.firstChild instanceof HTMLBRElement) {
              targetLi.removeChild(targetLi.firstChild);
            }
            const firstExisting = targetLi.firstChild;
            targetLi.insertBefore(frag, firstExisting);
            lastNode = targetLi.lastChild;

            if (lastNode) {
              const newRange = doc.createRange();
              newRange.setStartAfter(lastNode);
              newRange.collapse(true);
              const win = getCurrentWindow();
              const selObj = win?.getSelection();
              if (selObj) {
                selObj.removeAllRanges();
                selObj.addRange(newRange);
                sel.current = selObj;
                range.current = newRange;
              }
            }
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.scrollTop = inputEl.scrollHeight;
            return;
          }
        }

        savedRange.insertNode(frag);

        const fixOrphansInList = (list: Element) => {
          const children = Array.from(list.childNodes);
          let prevLi: HTMLLIElement | null = null;
          let beforeFirstLi: Node[] = [];
          let seenLi = false;

          for (const child of children) {
            const isLi = child instanceof HTMLElement && child.tagName === 'LI';
            if (isLi) {
              prevLi = child as HTMLLIElement;
              seenLi = true;
            } else {
              if (!seenLi) {
                beforeFirstLi.push(child);
              } else if (prevLi) {
                prevLi.appendChild(child);
              }
            }
          }

          if (beforeFirstLi.length > 0) {
            let targetLi = list.querySelector('li');
            if (!targetLi) {
              targetLi = doc.createElement('li');
              targetLi.style.display = 'list-item';
              list.prepend(targetLi);
            }
            if (targetLi.childNodes.length === 1 && targetLi.firstChild instanceof HTMLBRElement) {
              targetLi.removeChild(targetLi.firstChild);
            }
            const firstExisting = targetLi.firstChild;
            for (const orphan of beforeFirstLi) {
              targetLi.insertBefore(orphan, firstExisting);
            }
            lastNode = targetLi.lastChild;
          }
        };

        const listParent = savedRange.startContainer instanceof HTMLElement
          ? (savedRange.startContainer.closest?.('ol, ul') || (savedRange.startContainer.tagName === 'OL' || savedRange.startContainer.tagName === 'UL' ? savedRange.startContainer : null))
          : savedRange.startContainer.parentElement?.closest?.('ol, ul') ?? null;
        if (!listParent) {
          inputEl.querySelectorAll('ol, ul').forEach((list) => fixOrphansInList(list));
        } else {
          fixOrphansInList(listParent);
        }

        if (lastNode) {
          const newRange = doc.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          const win = getCurrentWindow();
          const selObj = win?.getSelection();
          if (selObj) {
            selObj.removeAllRanges();
            selObj.addRange(newRange);
            sel.current = selObj;
            range.current = newRange;
          }
        }
        // Trigger input event so React state updates
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        // Scroll to bottom so the caret remains visible after pasting long content
        inputEl.scrollTop = inputEl.scrollHeight;
      } catch (e) {
        // Fallback to pasteHtmlAtCaret if direct insertion fails
        syncSelectionRefs();
        pasteHtmlAtCaret(html);
      }
    };

    const handlePaste = (event: ClipboardEvent) => {
      const clipboardText = event.clipboardData?.getData('text/plain')?.trim();
      if (!clipboardText) return;

      // Only intercept if clipboard contains a URL
      const urlPattern = /^(https?:\/\/)/i;
      const isUrl = urlPattern.test(clipboardText);
      if (!isUrl) {
        // Capture the current range NOW (synchronously, before any async work)
        const win = getCurrentWindow();
        const currentSel = win?.getSelection();
        const savedRange = (currentSel && currentSel.rangeCount > 0 && inputEl.contains(currentSel.getRangeAt(0).startContainer))
          ? currentSel.getRangeAt(0).cloneRange()
          : null;

        // Handle HTML paste for formatted content
        let clipboardHtml = event.clipboardData?.getData('text/html');
        if (clipboardHtml) {
          // When pasting inside a list item, merge pasted list items into the
          // existing list instead of nesting sub-lists (a. b. c. instead of 1. 2. 3.)
          let insideList = false;
          if (savedRange) {
            let node: Node | null = savedRange.startContainer;
            while (node && node !== inputEl) {
              if (node instanceof HTMLElement && (node.tagName === 'LI' || node.tagName === 'OL' || node.tagName === 'UL')) {
                insideList = true;
                break;
              }
              node = node.parentNode;
            }
            if (insideList) {
              // Check if clipboard HTML contains list elements to merge
              const tmpClipDiv = doc.createElement('div');
              tmpClipDiv.innerHTML = clipboardHtml;
              const clipList = tmpClipDiv.querySelector('ol, ul');
              if (clipList) {
                // Find the current <li> and parent <ol>/<ul>
                let currentLi: HTMLElement | null = null;
                let parentList: HTMLElement | null = null;
                let nd: Node | null = savedRange.startContainer;
                while (nd && nd !== inputEl) {
                  if (nd instanceof HTMLElement && nd.tagName === 'LI' && !currentLi) currentLi = nd;
                  if (nd instanceof HTMLElement && (nd.tagName === 'OL' || nd.tagName === 'UL') && !parentList) parentList = nd;
                  nd = nd.parentNode;
                }

                if (currentLi && parentList) {
                  event.preventDefault();
                  event.stopImmediatePropagation();

                  if (currentLi.childNodes.length === 1 && currentLi.firstChild instanceof HTMLBRElement) {
                    currentLi.removeChild(currentLi.firstChild);
                  }

                  const pastedItems = Array.from(clipList.querySelectorAll('li'));
                  let lastInsertedLi: HTMLElement = currentLi;

                  if (pastedItems.length > 0) {
                    const firstContent = pastedItems[0].innerHTML;
                    if (!currentLi.textContent?.replace(/\u200B/g, '').trim()) {
                      currentLi.innerHTML = firstContent;
                    } else {
                      currentLi.innerHTML += firstContent;
                    }
                    lastInsertedLi = currentLi;

                    let insertAfter: HTMLElement = currentLi;
                    for (let idx = 1; idx < pastedItems.length; idx++) {
                      const newLi = doc.createElement('li');
                      newLi.style.display = 'list-item';
                      newLi.innerHTML = pastedItems[idx].innerHTML;
                      insertAfter.after(newLi);
                      insertAfter = newLi;
                      lastInsertedLi = newLi;
                    }
                  }

                  const newRange = doc.createRange();
                  newRange.selectNodeContents(lastInsertedLi);
                  newRange.collapse(false);
                  const winObj = getCurrentWindow();
                  const selObj = winObj?.getSelection();
                  if (selObj) {
                    selObj.removeAllRanges();
                    selObj.addRange(newRange);
                    sel.current = selObj;
                    range.current = newRange;
                  }

                  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                  inputEl.scrollTop = inputEl.scrollHeight;
                  return;
                }
              }

              // Fallback: strip list tags if merge wasn't possible
              clipboardHtml = clipboardHtml
                .replace(/<\/li>\s*<li[^>]*>/gi, '<br>')
                .replace(/<\/?(?:ol|ul|li)[^>]*>/gi, '');
            }
          }

          // Check if the HTML actually contains real formatting tags.
          const formattingTagPattern = /<\s*\/?\s*(b|strong|i|em|u|s|strike|del|ol|ul|li|a|blockquote|pre|code|h[1-6]|table|tr|td|th|sub|sup)\b/i;
          const hasRealFormatting = formattingTagPattern.test(clipboardHtml);

          if (!hasRealFormatting && enableRichTextEditor) {
            // HTML is just wrapper tags around plain text — use markdown conversion
            event.preventDefault();
            event.stopImmediatePropagation();

            if (savedRange) { sel.current = currentSel!; range.current = savedRange; }

            const mdFormatter = new CometChatMarkdownFormatter();
            const normalizedText = clipboardText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            let convertedHtml = mdFormatter.getFormattedText(normalizedText);

            if (insideList && convertedHtml !== normalizedText) {
              const tmpContainer = doc.createElement('div');
              tmpContainer.innerHTML = convertedHtml;
              const pastedList = tmpContainer.querySelector('ol, ul');
              if (pastedList) {
                // Find the current <li> and parent <ol>/<ul> from the saved range
                let currentLi: HTMLElement | null = null;
                let parentList: HTMLElement | null = null;
                let n: Node | null = savedRange ? savedRange.startContainer : null;
                while (n && n !== inputEl) {
                  if (n instanceof HTMLElement && n.tagName === 'LI' && !currentLi) {
                    currentLi = n;
                  }
                  if (n instanceof HTMLElement && (n.tagName === 'OL' || n.tagName === 'UL') && !parentList) {
                    parentList = n;
                  }
                  n = n.parentNode;
                }

                if (currentLi && parentList) {
                  event.preventDefault();
                  event.stopImmediatePropagation();

                  // Remove the empty <br> placeholder from the current <li> if present
                  if (currentLi.childNodes.length === 1 && currentLi.firstChild instanceof HTMLBRElement) {
                    currentLi.removeChild(currentLi.firstChild);
                  }

                  const pastedItems = Array.from(pastedList.querySelectorAll('li'));
                  let lastInsertedLi: HTMLElement = currentLi;

                  if (pastedItems.length > 0) {
                    // Put the first item's content into the current <li>
                    const firstItemContent = pastedItems[0].innerHTML;
                    if (!currentLi.textContent?.replace(/\u200B/g, '').trim()) {
                      // Current <li> is empty — replace its content
                      currentLi.innerHTML = firstItemContent;
                    } else {
                      // Current <li> has content — append to it
                      currentLi.innerHTML += firstItemContent;
                    }
                    lastInsertedLi = currentLi;

                    // Insert remaining items as new <li> elements after the current one
                    let insertAfter: HTMLElement = currentLi;
                    for (let idx = 1; idx < pastedItems.length; idx++) {
                      const newLi = doc.createElement('li');
                      newLi.style.display = 'list-item';
                      newLi.innerHTML = pastedItems[idx].innerHTML;
                      insertAfter.after(newLi);
                      insertAfter = newLi;
                      lastInsertedLi = newLi;
                    }
                  }

                  // Position cursor at end of last inserted <li>
                  const newRange = doc.createRange();
                  newRange.selectNodeContents(lastInsertedLi);
                  newRange.collapse(false);
                  const winObj = getCurrentWindow();
                  const selObj = winObj?.getSelection();
                  if (selObj) {
                    selObj.removeAllRanges();
                    selObj.addRange(newRange);
                    sel.current = selObj;
                    range.current = newRange;
                  }

                  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                  inputEl.scrollTop = inputEl.scrollHeight;
                  return;
                }
              }

              // Fallback: strip list tags if we couldn't merge into existing list
              convertedHtml = convertedHtml
                .replace(/<\/li>\s*<li[^>]*>/gi, '<br>')
                .replace(/<\/?(?:ol|ul|li)[^>]*>/gi, '');
            }

            if (convertedHtml !== normalizedText) {
              const tempDiv = doc.createElement('div');
              tempDiv.innerHTML = convertedHtml;
              if (savedRange) {
                const insertFn = (html: string) => insertHtmlAtRange(wrapUrlsInHtml(html), savedRange.cloneRange());
                processChunkedPaste(tempDiv, inputEl, insertFn);
              } else {
                syncSelectionRefs();
                processChunkedPaste(tempDiv, inputEl, (html: string) => pasteHtmlAtCaret(wrapUrlsInHtml(html)));
              }
            } else {
              const safeHtml = wrapUrlsInHtml(normalizedText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>'));
              if (savedRange) {
                insertHtmlAtRange(safeHtml, savedRange);
              } else {
                syncSelectionRefs();
                pasteHtmlAtCaret(safeHtml);
              }
            }
            return;
          }

          event.preventDefault();
          event.stopImmediatePropagation();

          // Sync sel/range refs for pasteHtmlAtCaret fallback
          if (savedRange) { sel.current = currentSel!; range.current = savedRange; }

          // Windows clipboard HTML contains a large metadata preamble (SourceURL,
          // StartFragment/EndFragment markers, Office namespace declarations, etc.).
          // Strip it to get only the actual content fragment.
          let htmlToProcess = clipboardHtml;

          // Extract just the fragment between StartFragment/EndFragment markers if present
          const fragmentStart = htmlToProcess.indexOf('<!--StartFragment-->');
          const fragmentEnd = htmlToProcess.indexOf('<!--EndFragment-->');
          if (fragmentStart !== -1 && fragmentEnd !== -1) {
            htmlToProcess = htmlToProcess.substring(
              fragmentStart + '<!--StartFragment-->'.length,
              fragmentEnd
            );
          }

          // Strip styles/classes from clipboard HTML to keep only formatting structure
          const tempDiv = doc.createElement('div');
          // Normalize Windows CRLF and standalone CR to LF before sanitization
          tempDiv.innerHTML = htmlToProcess.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

          if (savedRange) {
            const insertFn = (html: string) => insertHtmlAtRange(wrapUrlsInHtml(html), savedRange.cloneRange());
            processChunkedPaste(tempDiv, inputEl, insertFn);
          } else {
            processChunkedPaste(tempDiv, inputEl, (html: string) => pasteHtmlAtCaret(wrapUrlsInHtml(html)));
          }
          return;
        }

        // No HTML in clipboard — plain text paste. Convert markdown syntax to HTML
        if (enableRichTextEditor && clipboardText) {
          event.preventDefault();
          event.stopImmediatePropagation();

          const mdFormatter = new CometChatMarkdownFormatter();
          const normalizedText = clipboardText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const convertedHtml = mdFormatter.getFormattedText(normalizedText);

          if (convertedHtml !== normalizedText) {
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = convertedHtml;
            if (savedRange) {
              const insertFn = (html: string) => insertHtmlAtRange(wrapUrlsInHtml(html), savedRange.cloneRange());
              processChunkedPaste(tempDiv, inputEl, insertFn);
            } else {
              syncSelectionRefs();
              processChunkedPaste(tempDiv, inputEl, (html: string) => pasteHtmlAtCaret(wrapUrlsInHtml(html)));
            }
          } else {
            const safeHtml = wrapUrlsInHtml(normalizedText
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n/g, '<br>'));
            if (savedRange) {
              insertHtmlAtRange(safeHtml, savedRange);
            } else {
              syncSelectionRefs();
              pasteHtmlAtCaret(safeHtml);
            }
          }
        }
        return;
      }

      // Use the CLONED snapshot — immune to browser selection collapse
      const snapshot = pasteSelectionRange.current;
      if (!snapshot || snapshot.collapsed) {
        // No selection — if it's a URL, paste it as a clickable link
        if (isUrl && clipboardText) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const wrappedHtml = wrapUrlsInHtml(clipboardText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;'));
          syncSelectionRefs();
          pasteHtmlAtCaret(wrappedHtml);
        }
        return;
      }
      if (!inputEl.contains(snapshot.startContainer)) {
        return;
      }

      // Prevent the default paste (which would replace text with the URL)
      event.preventDefault();
      event.stopImmediatePropagation();

      // Restore the selection from our snapshot
      const selObj = getCurrentWindow().getSelection();
      if (!selObj) {
        return;
      }
      selObj.removeAllRanges();
      selObj.addRange(snapshot);

      // Check if selection is inside an existing link
      let node: Node | null = snapshot.startContainer;
      let existingLink: HTMLAnchorElement | null = null;
      while (node && node !== inputEl) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
          existingLink = node as HTMLAnchorElement;
          break;
        }
        node = node.parentNode;
      }

      if (existingLink) {
        // Fix for link paste replacement bug: update href directly
        existingLink.href = clipboardText;
        existingLink.setAttribute('contentEditable', 'false');
        existingLink.style.color = 'var(--cometchat-link-button)';
        existingLink.style.cursor = 'pointer';
        
        // Move cursor after the link
        const newRange = doc.createRange();
        newRange.setStartAfter(existingLink);
        newRange.collapse(true);
        selObj.removeAllRanges();
        selObj.addRange(newRange);

        // Sync the live refs
        sel.current = selObj;
        range.current = newRange;
        pasteSelectionRange.current = newRange.cloneRange();
      } else {
        // No existing link: create new anchor
        const selectedText = snapshot.toString();
        const anchor = doc.createElement('a');
        anchor.href = clipboardText;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = selectedText;
        anchor.setAttribute('contentEditable', 'false');
        anchor.style.color = 'var(--cometchat-link-button)';
        anchor.style.cursor = 'pointer';
        snapshot.deleteContents();
        snapshot.insertNode(anchor);

        // Move cursor after the link
        const newRange = doc.createRange();
        newRange.setStartAfter(anchor);
        newRange.collapse(true);
        selObj.removeAllRanges();
        selObj.addRange(newRange);

        // Sync the live refs so the rest of the composer stays in sync
        sel.current = selObj;
        range.current = newRange;
        pasteSelectionRange.current = newRange.cloneRange();
      }

      // Dispatch input event so React picks up the DOM change
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    };

    doc.addEventListener('selectionchange', trackSelection);
    inputEl.addEventListener('paste', handlePaste, true);
    return () => {
      doc.removeEventListener('selectionchange', trackSelection);
      inputEl.removeEventListener('paste', handlePaste, true);
    };
  }, [enableRichTextEditor, richTextFormatter]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Prevent the browser from auto-converting "1. " into an ordered list
   * inside contenteditable. Intercepts the beforeinput event and cancels
   * insertOrderedList / insertUnorderedList input types.
   */
  useEffect(() => {
    const inputEl = textInputRef.current as HTMLElement | null;
    if (!inputEl) return;

    const blockAutoList = (e: InputEvent) => {
      if (e.inputType === 'insertOrderedList' || e.inputType === 'insertUnorderedList') {
        e.preventDefault();
      }
    };

    inputEl.addEventListener('beforeinput', blockAutoList as EventListener);
    return () => {
      inputEl.removeEventListener('beforeinput', blockAutoList as EventListener);
    };
  }, []);

  /**
   * Callback to handle the send button click event
   */
  const onSendclick = useCallback(() => {
    try {
      var contenteditable = getCurrentInput();
      const visibleText = (contenteditable?.textContent || '').replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();
      if (visibleText || contenteditable?.querySelector('u')?.textContent) {
        // Strip any leftover font-reset spans before extracting HTML
        contenteditable?.querySelectorAll('span').forEach((span: HTMLSpanElement) => {
          if (span.style.fontFamily && span.style.fontSize === '1em' && span.textContent === '\u200B') {
            span.remove();
          }
        });
        let rawHtml = contenteditable?.innerHTML?.trim() === "<br>" ? undefined : contenteditable?.innerHTML.replace(/(<br>\s*)+$/, '');
        if (contenteditable?.innerHTML?.trim() === "<br>") {
          contenteditable.innerHTML = "";
        }
        if (rawHtml && richTextFormatter) {
          rawHtml = richTextFormatter.trimRichTextWhitespace(rawHtml);
        }
        let textToDispatch = rawHtml ? maskComposerEntities(rawHtml) : undefined;
        if (textFormatterArray && textFormatterArray.length) {
          for (let i = 0; i < textFormatterArray.length; i++) {
            textToDispatch =
              textFormatterArray[i].getOriginalText(textToDispatch);
          }
        }
        if (textToDispatch) {
          handleSendButtonClick(textToDispatch);
        }
      }
    } catch (error) {
      errorHandler(error, "onSendclick");
    }
  }, [state.text, handleSendButtonClick, textFormatterArray, errorHandler, enableRichTextEditor, hideRichTextFormattingOptions]);

  /**
   * Inserts HTML content at the current caret position in the message composer input
   */
  const pasteHtmlAtCaret = useCallback(
    (html: string) => {
      try {
        if (sel.current && range.current) {
          range.current.deleteContents();
          let el = document?.createElement("div");
          el.innerHTML = html;
          let frag = document?.createDocumentFragment(),
            node,
            lastNode;
          while ((node = el.firstChild)) {
            if (node instanceof HTMLElement) {
              if (textFormatterArray && textFormatterArray.length) {
                for (let i = 0; i < textFormatterArray.length; i++) {
                  node = textFormatterArray[i].registerEventListeners(
                    node,
                    node.classList
                  );
                }
              }
              lastNode = frag.appendChild(el.removeChild(node));
            } else if (node instanceof Text) {
              lastNode = frag.appendChild(el.removeChild(node));
            }
          }
          const sc = range.current.startContainer;
          const so = range.current.startOffset;
          const ceInput = getCurrentInput() as HTMLElement;
          if (ceInput && (sc === ceInput || (sc instanceof HTMLElement && sc.getAttribute('contenteditable') === 'true'))) {
            const childAtOffset = sc.childNodes[so];
            if (childAtOffset instanceof HTMLElement && (childAtOffset.tagName === 'OL' || childAtOffset.tagName === 'UL')) {
              let targetLi = childAtOffset.querySelector('li');
              if (!targetLi) {
                targetLi = document.createElement('li');
                targetLi.style.display = 'list-item';
                childAtOffset.prepend(targetLi);
              }
              if (targetLi.childNodes.length === 1 && targetLi.firstChild instanceof HTMLBRElement) {
                targetLi.removeChild(targetLi.firstChild);
              }
              const firstExisting = targetLi.firstChild;
              targetLi.insertBefore(frag, firstExisting);
              lastNode = targetLi.lastChild;

              if (lastNode) {
                range.current = range.current.cloneRange();
                range.current.setStartAfter(lastNode);
                range.current.collapse(true);
                sel.current.removeAllRanges();
                sel.current.addRange(range.current);
                let textToDispatch = ceInput.innerHTML?.trim() === "<br>" ? undefined : ceInput.innerHTML!;
                if (ceInput.innerHTML?.trim() === "<br>") {
                  ceInput.innerHTML = "";
                }
                if (textFormatterArray && textFormatterArray.length) {
                  for (let i = 0; i < textFormatterArray.length; i++) {
                    textToDispatch = textFormatterArray[i].getOriginalText(textToDispatch);
                  }
                }
                mySetAddToMsgInputText(textToDispatch!);
              }
              if (ceInput) {
                ceInput.scrollTop = ceInput.scrollHeight;
              }
              return;
            }
          }

          range.current.insertNode(frag);

          const contentEditable = getCurrentInput() as HTMLElement;
          if (contentEditable) {
            contentEditable.querySelectorAll('ol, ul').forEach((list) => {
              const children = Array.from(list.childNodes);
              let lastLi: HTMLLIElement | null = null;
              let beforeFirstLi: Node[] = [];
              let seenLi = false;

              for (const child of children) {
                const isLi = child instanceof HTMLElement && child.tagName === 'LI';
                if (isLi) {
                  lastLi = child as HTMLLIElement;
                  seenLi = true;
                } else {
                  if (!seenLi) {
                    beforeFirstLi.push(child);
                  } else if (lastLi) {
                    lastLi.appendChild(child);
                  }
                }
              }

              if (beforeFirstLi.length > 0) {
                let targetLi = list.querySelector('li');
                if (!targetLi) {
                  targetLi = document.createElement('li');
                  targetLi.style.display = 'list-item';
                  list.prepend(targetLi);
                }
                if (targetLi.childNodes.length === 1 && targetLi.firstChild instanceof HTMLBRElement) {
                  targetLi.removeChild(targetLi.firstChild);
                }
                const firstExisting = targetLi.firstChild;
                for (const orphan of beforeFirstLi) {
                  targetLi.insertBefore(orphan, firstExisting);
                }
                lastNode = targetLi.lastChild;
              }
            });
          }

          if (lastNode) {
            range.current = range.current.cloneRange();
            range.current.setStartAfter(lastNode);
            range.current.collapse(true);
            sel.current.removeAllRanges();
            sel.current.addRange(range.current);
            let textToDispatch = contentEditable?.innerHTML?.trim() === "<br>" ? undefined : contentEditable?.innerHTML!;
            if (contentEditable?.innerHTML?.trim() === "<br>") {
              contentEditable.innerHTML = "";
            }
            if (textFormatterArray && textFormatterArray.length) {
              for (let i = 0; i < textFormatterArray.length; i++) {
                textToDispatch =
                  textFormatterArray[i].getOriginalText(textToDispatch);
              }
            }
            mySetAddToMsgInputText(textToDispatch!);
          }
          // Scroll to bottom so the caret remains visible after pasting long content
          if (contentEditable) {
            contentEditable.scrollTop = contentEditable.scrollHeight;
          }
        } else if (sel.current && sel.current.type != "Control") {
          (sel as any).current.createRange().pasteHTML(html);
        } else {
          const contentEditable: any = getCurrentInput();
          contentEditable.textContent = state.addToMsgInputText;
        }
      } catch (error) {
        errorHandler(error, "pasteHtmlAtCaret");
      }
    }, [state.addToMsgInputText, state.text, textFormatterArray, mySetAddToMsgInputText, errorHandler]
  );

  /**
   * Function to handle emoji click events
   */
  const onEmojiClicked = (emoji: string) => {
    try {
      dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
      emojiBtnRef.current?.closePopover();
      if (typeof emoji === "string") {
        // Disable active inline formatting before inserting the emoji so it
        // doesn't inherit bold/italic/underline/strikethrough, then re-enable
        // the formats after insertion so subsequent typing is still formatted.
        const contentEditable = getCurrentInput() as HTMLElement | null;
        const doc = getCurrentDocument();
        const activeCommands: string[] = [];
        if (contentEditable && doc && richTextFormatter) {
          const cmdMap: Record<string, string> = { bold: 'bold', italic: 'italic', underline: 'underline', strikethrough: 'strikeThrough' };
          const active = richTextFormatter.getActiveFormats(contentEditable);
          for (const fmt of active) {
            if (cmdMap[fmt]) {
              activeCommands.push(cmdMap[fmt]);
              // Toggle OFF before emoji insertion
              try { doc.execCommand(cmdMap[fmt], false, ''); } catch (_) { /* ignore */ }
            }
          }
        }

        // Restore the saved selection so isInsideCode* checks work correctly.
        // Clicking the emoji keyboard shifts focus away from the contenteditable,
        // which clears the browser selection. Restoring range.current here ensures
        // getSelection() inside isInsideCodeBlock/isInsideCodeInline returns the
        // cursor position that was active before the emoji keyboard was opened.
        if (contentEditable && range.current) {
          contentEditable.focus();
          const docSel = getCurrentDocument()?.getSelection();
          if (docSel) {
            docSel.removeAllRanges();
            docSel.addRange(range.current);
          }
        }

        // If cursor is inside a code context, insert shortcode text instead of unicode emoji
        const isInCode = richTextFormatter && contentEditable &&
          (richTextFormatter.isInsideCodeInline(contentEditable) !== null ||
           richTextFormatter.isInsideCodeBlock(contentEditable) !== null);
        const emojiToInsert = isInCode ? emojiToShortcode(emoji) : emoji;
        pasteHtmlAtCaret(emojiToInsert);

        // Re-enable the formats that were active before the emoji
        if (doc && activeCommands.length > 0) {
          for (const cmd of activeCommands) {
            try { doc.execCommand(cmd, false, ''); } catch (_) { /* ignore */ }
          }
        }
      }
      dispatch({ type: "setText", text: emoji });
    } catch (error) {
      errorHandler(error, "onEmojiClicked");
    }
  };

  /**
   * Handles mouse down event to update selection
   */
  const handleMouseDown = useCallback(() => {
    getCurrentDocument()?.addEventListener("mouseup", handleMouseUp);
  }, []);

  /**
   * Handles mouse up event to set selection
   */
  const handleMouseUp = useCallback(() => {
    setSelection(getCurrentDocument()?.getSelection() || null);
    getCurrentDocument()?.removeEventListener("mouseup", handleMouseUp);
  }, [textFormatterArray]);

  /**
   * Called when clicking a user from the mentions list.
   * Add the user to mentions text formatter instance and then call rerender to style the mention
   * within message input.
   */
  const defaultMentionsItemClickHandler = (
    user: CometChat.User | CometChat.GroupMember | null
  ) => {
    try {
      if (user) {
        let cometChatUsers = [user];
        mentionsTextFormatterInstanceRef.current.setCometChatUserGroupMembers(
          cometChatUsers
        );
        reRenderMentionsWithEntity(user);
      } else if (mentionAllLabel) {
        const cometChatChannels = [mentionAllLabel];
        mentionsTextFormatterInstanceRef.current.setCometChatMentionedChannels(
          cometChatChannels
        );
        reRenderMentionsWithEntity(mentionAllLabel);
      } else return;

      setShowListForMentions(false);
      setMentionsSearchCount(1);
      setMentionsSearchTerm("");
    } catch (error) {
      errorHandler(error, "defaultMentionsItemClickHandler");
    }
  };

  /**
   * Callback to handle resetting mentions search term when there is no valid mention found.
   */
  const defaultOnEmptyForMentions = useCallback(() => {
    lastEmptySearchTerm.current = mentionsSearchTermTemp.current;
    setShowListForMentions(false);
    setMentionsSearchTerm("");
    mentionsSearchTermTemp.current = "";
  }, [setShowListForMentions, setMentionsSearchTerm]);

  /**
   * Callback to search mentions based on the search term input by the user.
   */
  const searchMentions = useCallback(
    (searchTerm: any) => {
      try {
        // Suppress mentions when typing inside a code block
        if (richTextFormatter) {
          const inputEl = getCurrentInput() as HTMLElement;
          if (inputEl && richTextFormatter.isInsideCodeBlock(inputEl)) {
            setShowListForMentions(false);
            return;
          }
        }

        if (!searchTerm || !searchTerm.length) {
          setMentionsSearchTerm("");
          mentionsSearchTermTemp.current = "";
          setShowListForMentions(false);
          setMentionsSearchCount(1);
          return;
        }
        let currentSearchTerm = searchTerm.split("@")[1].toLowerCase()
          ? searchTerm.split("@")[1].toLowerCase()
          : undefined;

        if (
          (!currentSearchTerm ||
            !(
              lastEmptySearchTerm.current &&
              currentSearchTerm.startsWith(
                lastEmptySearchTerm.current.toLowerCase()
              )
            )) &&
          currentSearchTerm !== mentionsSearchTerm
        ) {
          setMentionsSearchTerm(currentSearchTerm);
          mentionsSearchTermTemp.current = currentSearchTerm;
          setShowListForMentions(true);
          lastEmptySearchTerm.current = "";
          setMentionsSearchCount(mentionsSearchCount + 1);
        }
      } catch (error) {
        errorHandler(error, "searchMentions");
      }
    },
    [setMentionsSearchTerm, setShowListForMentions, setMentionsSearchCount, mentionsSearchTerm, mentionsSearchCount, richTextFormatter, getCurrentInput]
  );

  /**
   * Callback to re-render mentions and apply text formatting inside the message composer input field.
   */
  const reRenderMentionsWithEntity = useCallback((entity: CometChat.User | CometChat.GroupMember | string) => {
    try {
      const contentEditable: any = getCurrentInput();
      if (textFormatterArray && textFormatterArray.length) {
        for (let i = 0; i < textFormatterArray.length; i++) {
          if (contentEditable) {
            textFormatterArray[i].setInputElementReference(contentEditable);
          }
        }
      }

      if (
        currentSelectionForRegex &&
        textFormatterArray &&
        textFormatterArray.length
      ) {
        if (textFormatterArray && textFormatterArray.length) {
          for (let i = 0; i < textFormatterArray.length; i++) {
            textFormatterArray[i].setCaretPositionAndRange(
              currentSelectionForRegex.current!,
              currentSelectionForRegexRange.current!
            );
            textFormatterArray[i].getFormattedTextForEntity(entity);
          }
        }

        let textToDispatch = contentEditable?.innerHTML?.trim() === "<br>" ? undefined : contentEditable?.innerHTML;
        if (contentEditable?.innerHTML?.trim() === "<br>") {
          contentEditable.innerHTML = "";
        }
        if (textToDispatch) {
          if (textFormatterArray && textFormatterArray.length) {
            for (let i = 0; i < textFormatterArray.length; i++) {
              textToDispatch =
                textFormatterArray[i].getOriginalText(textToDispatch);
            }
          }
        }
        onTextInputChange(undefined, textToDispatch);
      }
    } catch (error) {
      errorHandler(error, "reRenderMentionsWithEntity");
    }
  }, [textFormatterArray]);

  /**
   * Handles sending recorded voice message
   */
  const handleSendVoiceMessage = useCallback(
    async (blob: Blob): Promise<void> => {
      dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
      try {
        // Discard empty recordings silently (Requirement 6.5)
        if (!blob || blob.size === 0) {
          return;
        }
        const audioFile = new File(
          [blob],
          `${audioRecordingSimpleDateFormat()}.webm`,
          { type: blob.type }
        );
        handleMediaMessageSend(
          audioFile,
          CometChatUIKitConstants.MessageTypes.audio
        );
      } catch (error) {
        errorHandler(error, "handleSendVoiceMessage");
      }
    },
    [handleMediaMessageSend, errorHandler]
  );

  /**
   * Wrapper around `handleMediaMessageSend`
   */
  const handleMediaMessageSendWrapper = useCallback(async (): Promise<void> => {
    try {
      const mediaFilePickerElement = mediaFilePickerRef.current;
      if (
        !mediaFilePickerElement?.files?.length ||
        userPropRef.current?.getBlockedByMe()
      ) {
        return;
      }

      const file = mediaFilePickerElement.files[0];
      const acceptAttr = mediaFilePickerElement.accept;
      let expectedFileType = !acceptAttr || acceptAttr === "*/*" ? "file" : acceptAttr.split("/")[0];
      const actualFileType = expectedFileType === "file" ? "file" : file.type.split('/')[0];
      if (expectedFileType !== "file" && expectedFileType !== actualFileType) {
        dispatch({ type: "setShowValidationError", showValidationError: true });
        mediaFilePickerElement.value = "";
        return;
      }

      const onSendButtonClick = onSendButtonClickPropRef.current;
      if (onSendButtonClick) {
        try {
          await Promise.all([
            onSendButtonClick(await getMediaMessage(file, actualFileType), PreviewMessageMode.none),
          ]);
        } catch (error) {
          errorHandler(error, "onSendButtonClick");
        }
      } else {
        await handleMediaMessageSend(file, actualFileType);
      }

      mediaFilePickerElement.value = "";
    } catch (error) {
      errorHandler(error, "handleMediaMessageSendWrapper");
    }
  }, [
    handleMediaMessageSend,
    errorHandler,
    getMediaMessage,
    onSendButtonClickPropRef,
    userPropRef,
  ]);

  /**
   * Sets the active popover for UI events
   */
  function setActivePopover(id: string) {
    CometChatUIEvents.ccActivePopover.next(uniqueIdRef.current || id);
  }

  /**
   * Function to handle the secondary button (attachment) click event
   */
  const onSecondaryBtnClick = useCallback(() => {
    try {
      switch (state.contentToDisplay) {
        case "attachments":
          dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
          break;
        case "emojiKeyboard":
          emojiBtnRef.current?.closePopover();
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "attachments",
          });
          break;
        case "voiceRecording":
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "attachments",
          });
          break;
        case "ai":
          aiBtnRef.current?.closePopover();
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "attachments",
          });
          break;
        case "none":
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "attachments",
          });
          break;
        default: {
          const x: never = state.contentToDisplay;
        }
      }
      setActivePopover(state.contentToDisplay);
    } catch (error) {
      errorHandler(error, "onSecondaryBtnClick");
    }
  }, [state.contentToDisplay, aiBtnRef, emojiBtnRef]);

  /**
   * Function to handle the emoji button click event
   */
  function onEmojiButtonClick() {
    try {
      switch (state.contentToDisplay) {
        case "attachments":
          attachmentsBtnRef.current?.closePopover();
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "emojiKeyboard",
          });
          break;
        case "voiceRecording":
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "emojiKeyboard",
          });
          break;
        case "emojiKeyboard":
          dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
          break;
        case "ai":
          aiBtnRef.current?.closePopover();
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "emojiKeyboard",
          });
          break;
        case "none":
          dispatch({
            type: "setContentToDisplay",
            contentToDisplay: "emojiKeyboard",
          });
          break;
        default: {
          const x: never = state.contentToDisplay;
        }
      }
      setActivePopover(state.contentToDisplay);
    } catch (error) {
      errorHandler(error, "onEmojiButtonClick");
    }
  }

  /**
   * Function to handle voice recording button click event
   */
  function onVoiceRecordingBtnClick() {
    try {
      // Hard-denied — show our dialog immediately, no need to attempt getUserMedia
      if (micPermissionDenied) {
        setShowMicPermissionDialog(true);
        return;
      }

      // Toggle off if already recording
      if (state.contentToDisplay === "voiceRecording") {
        dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
        return;
      }

      // Close any open popovers
      if (state.contentToDisplay === "attachments") attachmentsBtnRef.current?.closePopover();
      else if (state.contentToDisplay === "emojiKeyboard") emojiBtnRef.current?.closePopover();
      else if (state.contentToDisplay === "ai") aiBtnRef.current?.closePopover();

      // Broadcast to other composer instances so they close their active content
      // (e.g., thread composer stops recording when main composer starts)
      setActivePopover("voiceRecording");

      // Permission state is 'prompt' — request mic access first.
      // Only enter recording mode after the user grants permission.
      // This prevents the recording bar from appearing while the browser popup is open.
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Permission granted — store the stream so initWaveform can reuse it,
          // then switch to recording mode which triggers the waveform useEffect.
          inlineMediaStreamRef.current = stream;
          dispatch({ type: "setContentToDisplay", contentToDisplay: "voiceRecording" });
        })
        .catch((err) => {
          // User denied — mark as denied and show our dialog
          setMicPermissionDenied(true);
          setShowMicPermissionDialog(true);
        });
    } catch (error) {
      errorHandler(error, "onVoiceRecordingBtnClick");
    }
  }

  /**
   * Handles the close event for the edit preview
   */
  function onEditPreviewClose() {
    if (state.textMessageToEdit) {
      CometChatMessageEvents.ccMessageEdited.next({
        message: state.textMessageToEdit,
        status: MessageStatus.cancelled
      });
    }
    onPreviewCloseClick();
  }

  /**
   * Handles the close event for the reply preview
   */
  function onReplyPreviewClose() {
    if (state.messageToReply) {
      CometChatMessageEvents.ccReplyToMessage.next({
        message: state.messageToReply,
        status: MessageStatus.cancelled
      });
    }
    dispatch({
      type: "setMessageToReply",
      messageToReply: null,
    });
  }

  /**
   * Closes the reply preview
   */
  function closeReplyPreview() {
    messageToReplyRef.current = null;
    dispatch({
      type: "setMessageToReply",
      messageToReply: null,
    });
  }

  /**
   * Handles the close event for the preview
   */
  function onPreviewCloseClick() {
    dispatch({ type: "setTextMessageToEdit", textMessageToEdit: null });
    dispatch({ type: "setText", text: "" });
    emptyInputField();
    mySetAddToMsgInputText("");
  }

  /**
   * Displays attachments based on the selected action
   */
  function showAttachments(action: CometChatActionsView | CometChatMessageComposerAction) {
    try {
      const actionOnClick = actionIdToActionOnClick.current.get(
        `${action.id}`
      );
      if (typeof actionOnClick === "function") {
        actionOnClick();
      } else {
        let acceptMap: Record<string, string> = {
          [CometChatUIKitConstants.MessageTypes.image]: "image/*",
          [CometChatUIKitConstants.MessageTypes.video]: "video/*",
          [CometChatUIKitConstants.MessageTypes.audio]: "audio/*",
          [CometChatUIKitConstants.MessageTypes.file]: "*/*"
        };
        if (shouldShowCustomMimeTypes()) {
          acceptMap[CometChatUIKitConstants.MessageTypes.image] = CometChatUIKitConstants.mimeTypes.image;
          acceptMap[CometChatUIKitConstants.MessageTypes.video] = CometChatUIKitConstants.mimeTypes.video;
          acceptMap[CometChatUIKitConstants.MessageTypes.audio] = CometChatUIKitConstants.mimeTypes.audio;
        }

        const acceptValue = acceptMap[action.id] ?? "*/*";
        mediaFilePickerRef.current!.accept = acceptValue;
        mediaFilePickerRef.current!.click();
      }
      dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
      attachmentsBtnRef.current?.closePopover();
    } catch (error) {
      errorHandler(error, "showAttachments");
    }
  }

  /**
   * @returns Should the component show the send button view
   */
  function shouldShowSendButton(): boolean {
    let text = getCurrentInput()?.textContent;
    const visibleText = (text || '').replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();
    return (
      (!visibleText) ||
      (state.textMessageToEdit !== null &&
        state.textMessageToEdit.getText() === state.text)
    );
  }

  /**
   * @returns Should the attachment button be hidden
   */
  function shouldShowAttachmentButton() {
    return hideAttachmentButton || state.contentToDisplay === "voiceRecording" || (ChatConfigurator.getDataSource().getAttachmentOptions(
      getComposerId(),
      { hideAudioAttachmentOption, hideCollaborativeDocumentOption, hideCollaborativeWhiteboardOption, hideFileAttachmentOption, hideImageAttachmentOption, hideVideoAttachmentOption, hidePollsOption }
    ).length === 0) || (attachmentOptions && attachmentOptions?.length == 0);
  }

  /**
   * Returns a modal for creating a poll if the state indicates that 
   * the poll creation view should be shown. Returns null if the view 
   * is not currently active.
   */
  function getCreatePollModal(): JSX.Element | null {
    if (state.showPoll && createPollViewRef?.current) {
      return createPollViewRef.current;
    }
    return null;
  }

  /**
   * Creates the action sheet view for attachments
   * Requirements: 4.1, 4.2
   */
  function getActionsheetView() {
    try {
      const defaultSecondaryBtn = (
        <CometChatButton
          hoverText={getLocalizedString("message_composer_attach_icon_hover")}
          onClick={onSecondaryBtnClick}
          iconURL={
            state.contentToDisplay === "attachments"
              ? PlusIconFill
              : PlusIcon
          }
        />
      );
      
      let actions: CometChatMessageComposerAction[];
      if (attachmentOptions && attachmentOptions.length == 0) {
        return;
      }
      if (
        attachmentOptions &&
        (user !== undefined || group !== undefined)
      ) {
        actions = attachmentOptions;
      } else {
        actions = ChatConfigurator.getDataSource().getAttachmentOptions(
          getComposerId(),
          { hideAudioAttachmentOption, hideCollaborativeDocumentOption, hideCollaborativeWhiteboardOption, hideFileAttachmentOption, hideImageAttachmentOption, hideVideoAttachmentOption, hidePollsOption, messageToReplyRef, closeReplyPreview }
        );
      }
      for (let i = 0; i < actions.length; i++) {
        const curAction = actions[i];
        const { id } = curAction;
        if (typeof id === "string") {
          let overrideOnClick = curAction.onClick;
          if (id === "extension_poll") {
            overrideOnClick = () => {
              (curAction as any).onClick([user, group]);
            };
          }
          actionIdToActionOnClick.current.set(
            id,
            overrideOnClick ? overrideOnClick : null
          );
        }
      }
      const defaultSecondaryContent = (
        <CometChatActionSheet
          actions={actions}
          onActionItemClick={(action: CometChatMessageComposerAction | CometChatActionsView) => {
            showAttachments(action);
            if (state.textMessageToEdit) {
              onEditPreviewClose();
            }
          }}
        />
      );
      return (
        <div
          className={`cometchat-compact-message-composer__secondary-button-view-attachment-button ${state.contentToDisplay === "attachments" ? "cometchat-compact-message-composer__secondary-button-view-attachment-button-active" : ""} cometchat-compact-message-composer__secondary-button-view-attachment-button-${actions?.length}`}
        >
          <CometChatPopover
            useParentHeight={false}
            useParentContainer={true}
            onOutsideClick={() => {
              dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
            }}
            placement={Placement.top}
            closeOnOutsideClick={true}
            ref={attachmentsBtnRef}
            content={defaultSecondaryContent}
          >
            {defaultSecondaryBtn}
          </CometChatPopover>
        </div>
      );
    } catch (error) {
      errorHandler(error, "getActionsheetView");
    }
  }

  /**
   * Creates the emoji keyboard view
   * Requirements: 6.1, 6.2
   */
  function getEmojiKeyboardView() {
    const defaultAuxiliaryBtn = (
      <CometChatButton
        onClick={onEmojiButtonClick}
        hoverText={getLocalizedString("message_composer_emoji_icon_hover")}
        iconURL={
          state.contentToDisplay === "emojiKeyboard"
            ? SmileysIconFill
            : SmileysIcon
        }
      />
    );
    const defaultAuxiliaryContent = (
      <CometChatEmojiKeyboard
        onEmojiClick={onEmojiClicked}
      />
    );
    return (
      <div
        className={`cometchat-compact-message-composer__emoji-keyboard-button ${state.contentToDisplay === "emojiKeyboard" ? "cometchat-compact-message-composer__emoji-keyboard-button-active" : ""}`}
      >
        <CometChatPopover
          useParentHeight={false}
          useParentContainer={true}
          ref={emojiBtnRef}
          closeOnOutsideClick={true}
          onOutsideClick={() => {
            dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
          }}
          placement={Placement.top}
          content={defaultAuxiliaryContent}
        >
          {defaultAuxiliaryBtn}
        </CometChatPopover>
      </div>
    );
  }

  /**
   * Handles deleting/discarding the current recording
   */
  function handleDeleteRecording() {
    try {
      setIsRecordingPaused(false);
      setIsPlayingBack(false);
      setRecordingSeconds(0);
      setPlaybackSeconds(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      // Stop the inline MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        // Detach onstop so it doesn't set blob after delete
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
      // Stop playback
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      recordedBlobRef.current = null;
      audioChunksRef.current = [];
      frozenBarHeightsRef.current = [];
      waveformHistoryRef.current = [];
      recordingDurationRef.current = 0;
      setIsBlobReady(false);
      cleanupWaveform();
      // Stop the mic stream (full cleanup)
      if (inlineMediaStreamRef.current) {
        inlineMediaStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        inlineMediaStreamRef.current = null;
      }
      dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
    } catch (error) {
      errorHandler(error, "handleDeleteRecording");
    }
  }

  /**
   * Handles toggling pause/resume on the recording.
   * On pause: stops MediaRecorder, builds blob from accumulated chunks immediately + via onstop fallback.
   * On resume: starts a new recording segment, resumes waveform.
   */
  function handleTogglePause() {
    try {
      if (!isRecordingPaused) {
        // --- PAUSE: stop recorder to get the blob ---
        setIsRecordingPaused(true);
        recordingDurationRef.current = recordingSeconds;
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        // Stop waveform animation (bars freeze)
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        const mr = mediaRecorderRef.current as MediaRecorder | null;
        if (mr && mr.state !== 'inactive') {
          // Request any pending data before stopping
          try { mr.requestData(); } catch (_) { /* ignore */ }

          // Build blob immediately from chunks accumulated so far (via 250ms timeslice).
          // This ensures the blob is available the instant the play button renders,
          // without waiting for the async onstop callback.
          if (audioChunksRef.current.length > 0) {
            const immediateBlob = new Blob(audioChunksRef.current, {
              type: audioChunksRef.current[0]?.type || 'audio/webm',
            });
            recordedBlobRef.current = immediateBlob;
            setIsBlobReady(true);
          }

          // Override onstop so it updates the blob with any final data chunk
          // that arrives between requestData() and stop() completing.
          mr.onstop = () => {
            if (audioChunksRef.current.length > 0) {
              const finalBlob = new Blob(audioChunksRef.current, {
                type: audioChunksRef.current[0]?.type || 'audio/webm',
              });
              recordedBlobRef.current = finalBlob;
              setIsBlobReady(true);
            }
          };
          mr.stop();
        } else {
          // MediaRecorder already inactive — build blob from whatever chunks exist
          if (audioChunksRef.current.length > 0 && !recordedBlobRef.current) {
            recordedBlobRef.current = new Blob(audioChunksRef.current, {
              type: audioChunksRef.current[0]?.type || 'audio/webm',
            });
            setIsBlobReady(true);
          }
        }
      } else {
        // --- RESUME: start a new recording segment, timer continues from where it left off ---
        setIsRecordingPaused(false);
        setIsPlayingBack(false);
        // Stop any playback and reset playback timer
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          audioPlayerRef.current = null;
        }
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        setPlaybackSeconds(0);
        // Clear old chunks so the new segment is clean
        audioChunksRef.current = [];
        recordedBlobRef.current = null;
        frozenBarHeightsRef.current = [];
        waveformHistoryRef.current = [];
        recordingDurationRef.current = 0;
        setIsBlobReady(false);
        // Resume the timer from where it left off (don't reset recordingSeconds)
        if (!recordingTimerRef.current) {
          recordingTimerRef.current = window.setInterval(() => {
            setRecordingSeconds(prev => prev + 1);
          }, 1000);
        }
        // Re-init the MediaRecorder on the existing stream
        const stream = inlineMediaStreamRef.current;
        if (stream && stream.active) {
          startInlineMediaRecorder(stream);
          // Re-init waveform audio context and analyser for live visualization
          const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx && !analyserRef.current) {
            try {
              const audioCtx = new AudioCtx() as AudioContext;
              audioCtx.resume();
              audioContextRef.current = audioCtx;
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              analyserRef.current = analyser;
              const source = audioCtx.createMediaStreamSource(stream);
              waveformSourceRef.current = source;
              source.connect(analyser);
            } catch (_) { /* ignore */ }
          }
          // Resume waveform animation
          if (analyserRef.current && animationFrameRef.current === null) {
            drawWaveform();
          }
        }
      }
    } catch (error) {
      errorHandler(error, "handleTogglePause");
    }
  }

  /**
   * Toggles playback of the recorded audio blob when recording is paused.
   * On play: creates Audio element from blob, starts playback timer.
   * On pause: pauses audio, freezes playback timer.
   * Builds blob from chunks as fallback if ref is somehow null.
   */
  function handleTogglePlayback() {
    try {
      if (isPlayingBack) {
        // Pause playback — freeze the playback timer
        audioPlayerRef.current?.pause();
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        setIsPlayingBack(false);
        return;
      }

      // Ensure we have a blob — build from chunks if ref is null
      let blob = recordedBlobRef.current;
      if (!blob && audioChunksRef.current.length > 0) {
        blob = new Blob(audioChunksRef.current, {
          type: audioChunksRef.current[0]?.type || 'audio/webm',
        });
        recordedBlobRef.current = blob;
        setIsBlobReady(true);
      }

      if (!blob) {
        // No audio data at all — nothing to play
        return;
      }

      // Stop any existing playback
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      setPlaybackSeconds(0);

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlayingBack(false);
        setPlaybackSeconds(0);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        audioPlayerRef.current = null;
      };
      audioPlayerRef.current = audio;

      // Set playing state BEFORE calling play() so UI updates immediately
      setIsPlayingBack(true);

      // Start playback timer from 0
      playbackTimerRef.current = window.setInterval(() => {
        setPlaybackSeconds(prev => prev + 1);
      }, 1000);

      audio.play().catch((err) => {
        console.warn("Voice playback failed:", err);
        // Playback failed — revert UI state
        setIsPlayingBack(false);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        setPlaybackSeconds(0);
      });
    } catch (error) {
      errorHandler(error, "handleTogglePlayback");
    }
  }

  /**
   * Handles sending the recorded voice message via the main send button.
   * IMPORTANT: cleanupWaveform must happen AFTER the blob is captured,
   * because it stops the shared mic stream which kills the MediaRecorder.
   */
  function handleSendRecording() {
    try {
      setIsRecordingPaused(false);
      setIsPlayingBack(false);
      setRecordingSeconds(0);
      setPlaybackSeconds(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      // Stop playback
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }

      const sendBlob = (blob: Blob) => {
        // Clean up AFTER we have the blob
        cleanupWaveform();
        recordedBlobRef.current = null;
        audioChunksRef.current = [];
        frozenBarHeightsRef.current = [];
        waveformHistoryRef.current = [];
        recordingDurationRef.current = 0;
        setIsBlobReady(false);
        // Stop the inline stream
        if (inlineMediaStreamRef.current) {
          inlineMediaStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          inlineMediaStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
        handleSendVoiceMessage(blob);
      };

      if (recordedBlobRef.current) {
        // Already have a blob (recording was paused/stopped)
        sendBlob(recordedBlobRef.current);
      } else {
        // Recording is still active — stop MediaRecorder first, THEN cleanup
        const mr = mediaRecorderRef.current as MediaRecorder | null;
        if (mr && mr.state !== 'inactive') {
          mr.onstop = () => {
            if (audioChunksRef.current.length > 0) {
              const blob = new Blob(audioChunksRef.current, {
                type: audioChunksRef.current[0]?.type || 'audio/webm',
              });
              sendBlob(blob);
            } else {
              // No audio data captured — just clean up
              cleanupWaveform();
              if (inlineMediaStreamRef.current) {
                inlineMediaStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
                inlineMediaStreamRef.current = null;
              }
              mediaRecorderRef.current = null;
              dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
            }
          };
          mr.stop();
        } else {
          cleanupWaveform();
          dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
        }
      }
    } catch (error) {
      errorHandler(error, "handleSendRecording");
    }
  }

  /**
   * Starts the inline MediaRecorder on the given stream.
   * Accumulates chunks into audioChunksRef and builds blob on stop.
   * Only sets recordedBlobRef if chunks contain actual data.
   * Uses timeslice of 250ms to ensure frequent data capture.
   */
  function startInlineMediaRecorder(stream: MediaStream) {
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      if (audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, {
          type: audioChunksRef.current[0]?.type || 'audio/webm',
        });
        recordedBlobRef.current = blob;
        setIsBlobReady(true);
      }
    };
    mr.onerror = () => { /* ignore */ };
    // Use 250ms timeslice so chunks are captured frequently,
    // ensuring blob is available immediately when stop() is called
    mr.start(250);
    mediaRecorderRef.current = mr;
  }

  /**
   * Starts the recording timer (called when CometChatMediaRecorder starts recording)
   */
  function startRecordingTimer() {
    setRecordingSeconds(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  }

  /**
   * Effect to pause/resume the recording timer based on isRecordingPaused
   */
  useEffect(() => {
    if (state.contentToDisplay !== "voiceRecording") return;

    if (isRecordingPaused) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    } else {
      // Resume timer if we're recording and not paused
      if (!recordingTimerRef.current) {
        recordingTimerRef.current = window.setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      }
    }
  }, [isRecordingPaused, state.contentToDisplay]);

  /**
   * Cleanup recording timer when recording stops
   */
  useEffect(() => {
    if (state.contentToDisplay !== "voiceRecording") {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
      setIsRecordingPaused(false);
      setIsBlobReady(false);
    }
  }, [state.contentToDisplay]);

  /**
   * Draws static placeholder bars on the waveform canvas.
   * Used as fallback when Web Audio API is unavailable.
   */
  function drawStaticPlaceholderBars() {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (canvas.parentElement?.offsetWidth ?? 120);
    const height = rect.height > 0 ? rect.height : 32;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const barWidth = 2;
    const barGap = 2;
    const barCount = Math.max(20, Math.floor(width / (barWidth + barGap)));
    const barColor = getComputedStyle(canvas).getPropertyValue("--cometchat-primary-color").trim() || "#6852D6";

    ctx.clearRect(0, 0, width, height);

    // Capture heights for playback progress rendering
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const barHeight = 4 + Math.random() * (height * 0.4);
      heights.push(barHeight / height);
      const x = i * (barWidth + barGap);
      const y = (height - barHeight) / 2;
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 100);
      ctx.fill();
    }
    frozenBarHeightsRef.current = heights;
  }

  /**
   * Redraws the frozen waveform bars with a playback progress indicator.
   * Bars to the left of the playhead are purple (primary color), bars to the right are grey.
   */
  function drawPlaybackProgress(progressRatio: number) {
    const canvas = waveformCanvasRef.current;
    if (!canvas || frozenBarHeightsRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (canvas.parentElement?.offsetWidth ?? 120);
    const height = rect.height > 0 ? rect.height : 32;
    // Only resize if needed to avoid blurry redraws
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    const barCount = frozenBarHeightsRef.current.length;
    const barWidth = 2;
    const barGap = 2;
    const primaryColor = getComputedStyle(canvas).getPropertyValue("--cometchat-primary-color").trim() || "#6852D6";
    const greyColor = getComputedStyle(canvas).getPropertyValue("--cometchat-icon-color-secondary").trim() || "#A1A1A1";

    // How many bars should be purple (played)
    const playedBars = Math.round(progressRatio * barCount);

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < barCount; i++) {
      const normalizedHeight = frozenBarHeightsRef.current[i];
      const barHeight = Math.max(3, normalizedHeight * height);
      const x = i * (barWidth + barGap);
      const y = (height - barHeight) / 2;
      ctx.fillStyle = i < playedBars ? primaryColor : greyColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 100);
      ctx.fill();
    }
  }

  /**
   * Draws animated waveform bars on the canvas using a rolling history buffer.
   * New amplitude samples are appended to the right and the buffer shifts left,
   * keeping the full canvas filled with live bars (scrolling waveform).
   * Requirements: 4.1, 4.3
   */
  function drawWaveform() {
    const canvas = waveformCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (canvas.parentElement?.offsetWidth ?? 120);
    const height = rect.height > 0 ? rect.height : 32;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const barWidth = 2;
    const barGap = 2;
    const barCount = Math.max(20, Math.floor(width / (barWidth + barGap)));
    const barColor = getComputedStyle(canvas).getPropertyValue("--cometchat-primary-color").trim() || "#6852D6";
    const minBarHeight = 3;

    // Pre-fill history with minimum-height bars so the canvas is full from frame 1
    if (waveformHistoryRef.current.length === 0) {
      waveformHistoryRef.current = new Array(barCount).fill(minBarHeight / height);
    }

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      // Compute a single RMS amplitude sample from the lower half of frequency bins
      // (voice energy lives in low-to-mid frequencies)
      const voiceBins = Math.floor(bufferLength / 2);
      let sum = 0;
      for (let i = 0; i < voiceBins; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / voiceBins);
      const normalizedAmplitude = minBarHeight / height + (rms / 255) * (1 - minBarHeight / height);

      // Shift history left and append the new sample on the right
      const history = waveformHistoryRef.current;
      if (history.length >= barCount) {
        history.shift();
      }
      history.push(normalizedAmplitude);

      // Draw all bars from the history buffer
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = barColor;

      for (let i = 0; i < history.length; i++) {
        const barHeight = Math.max(minBarHeight, history[i] * height);
        const x = i * (barWidth + barGap);
        const y = (height - barHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 100);
        ctx.fill();
      }

      // Freeze the current frame so pausing captures the correct bar heights
      frozenBarHeightsRef.current = [...history];

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  }

  /**
   * Cleans up waveform audio resources (analyser, audio context, animation frame).
   * Does NOT stop the mic stream — that's managed separately by the recording lifecycle.
   */
  function cleanupWaveform() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (waveformSourceRef.current) {
      try { waveformSourceRef.current.disconnect(); } catch (_) { /* ignore */ }
      waveformSourceRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch (_) { /* ignore */ }
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) { /* ignore */ }
      audioContextRef.current = null;
    }
    // Note: waveformStreamRef shares the same stream as inlineMediaStreamRef.
    // We only null the ref here; actual track stopping is done when recording ends.
    waveformStreamRef.current = null;
  }

  /**
   * Initialize Web Audio API waveform and inline MediaRecorder when recording starts.
   * Feature-detects AudioContext; falls back to static placeholder bars if unavailable.
   */
  useEffect(() => {
    if (state.contentToDisplay !== "voiceRecording") {
      cleanupWaveform();
      // Also stop the mic stream when leaving recording mode
      if (inlineMediaStreamRef.current) {
        inlineMediaStreamRef.current.getTracks().forEach(track => track.stop());
        inlineMediaStreamRef.current = null;
      }
      return;
    }

    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      // Web Audio API unavailable — show static placeholder bars
      const timerId = setTimeout(() => drawStaticPlaceholderBars(), 150);
      return () => clearTimeout(timerId);
    }

    // Draw placeholder bars immediately while waiting for mic permission
    const placeholderTimerId = setTimeout(() => drawStaticPlaceholderBars(), 200);

    let cancelled = false;

    const initWaveform = async () => {
      try {
        // Reuse the stream pre-granted in onVoiceRecordingBtnClick if available,
        // otherwise request mic access (e.g. when permission was already granted).
        let stream = inlineMediaStreamRef.current;
        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        inlineMediaStreamRef.current = stream;
        waveformStreamRef.current = stream;

        // Start the inline MediaRecorder
        audioChunksRef.current = [];
        recordedBlobRef.current = null;
        frozenBarHeightsRef.current = [];
        waveformHistoryRef.current = [];
        recordingDurationRef.current = 0;
        startInlineMediaRecorder(stream);

        // Start the recording timer
        startRecordingTimer();

        const audioCtx = new AudioCtx() as AudioContext;
        await audioCtx.resume();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        waveformSourceRef.current = source;
        source.connect(analyser);

        drawWaveform();
      } catch (err: any) {
        if (!cancelled) {
          if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
            // User just denied the browser permission prompt — mark as denied so
            // subsequent mic button clicks show our dialog immediately.
            setMicPermissionDenied(true);
            // Show our no-mic dialog
            setShowMicPermissionDialog(true);
            // Stop the recording timer
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            // Stop the media recorder if it somehow started
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.onstop = null;
              mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current = null;
            // Stop the mic stream
            if (inlineMediaStreamRef.current) {
              inlineMediaStreamRef.current.getTracks().forEach(track => track.stop());
              inlineMediaStreamRef.current = null;
            }
            // Close the recording bar
            dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
          } else {
            // Other errors — fall back to static placeholder bars
            drawStaticPlaceholderBars();
          }
        }
      }
    };

    // Small delay to let the component initialize first
    const timerId = setTimeout(() => initWaveform(), 200);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      clearTimeout(placeholderTimerId);
      cleanupWaveform();
    };
  }, [state.contentToDisplay]);

  /**
   * Handle pause/resume of waveform animation.
   * When paused, cancel the animation frame so bars freeze in place.
   * When resumed, restart the animation loop.
   */
  useEffect(() => {
    if (state.contentToDisplay !== "voiceRecording") return;

    if (isRecordingPaused) {
      // Cancel animation frame — bars freeze in their current position
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    // Resume is handled inside handleTogglePause after re-init of MediaRecorder
  }, [isRecordingPaused, state.contentToDisplay]);

  /**
   * Redraws the frozen waveform with playback progress whenever playbackSeconds changes.
   * Only active when recording is paused and playback is in progress.
   */
  useEffect(() => {
    if (!isRecordingPaused) return;
    const duration = recordingDurationRef.current;
    const ratio = duration > 0 ? Math.min(playbackSeconds / duration, 1) : 0;
    drawPlaybackProgress(ratio);
  }, [playbackSeconds, isRecordingPaused]);

  /**
   * When playback stops (isPlayingBack goes false), reset bars to all-grey (fully unplayed).
   */
  useEffect(() => {
    if (!isRecordingPaused) return;
    if (!isPlayingBack) {
      drawPlaybackProgress(0);
    }
  }, [isPlayingBack, isRecordingPaused]);

  /**
   * Creates the inline recording bar UI.
   * Three states:
   *  1. Recording active: red dot + waveform + timer + pause button
   *  2. Paused (blob ready): play button + waveform (frozen) + timer + resume button
   *  3. Paused + playing back: pause-playback button + waveform (frozen) + timer + resume button
   */
  function getInlineRecordingBar(): JSX.Element | null {
    if (state.contentToDisplay !== "voiceRecording") return null;

    return (
      <div
        className="cometchat-compact-message-composer__recording-bar"
        role="region"
        aria-label="Voice recording"
      >
        {/* Delete button */}
        <button
          className="cometchat-compact-message-composer__recording-bar-delete"
          aria-label="Delete recording"
          onClick={handleDeleteRecording}
        >
          <div className="cometchat-compact-message-composer__recording-bar-delete-icon" />
        </button>

        {/* Left indicator: pulsing red dot while recording, play/pause for playback when paused */}
        {isRecordingPaused ? (
          <button
            className="cometchat-compact-message-composer__recording-bar-playback"
            aria-label={isPlayingBack ? "Pause playback" : "Play recording"}
            onClick={handleTogglePlayback}
          >
            <div className={isPlayingBack
              ? "cometchat-compact-message-composer__recording-bar-playback-icon cometchat-compact-message-composer__recording-bar-playback-icon--pause"
              : "cometchat-compact-message-composer__recording-bar-playback-icon"
            } />
          </button>
        ) : (
          <div className="cometchat-compact-message-composer__recording-bar-indicator" />
        )}

        {/* Waveform visualization */}
        <div className="cometchat-compact-message-composer__recording-bar-waveform">
          <canvas ref={waveformCanvasRef} />
        </div>

        {/* Timer — shows playback progress when playing, recording duration otherwise */}
        <div
          className="cometchat-compact-message-composer__recording-bar-timer"
          aria-live="polite"
        >
          {isPlayingBack ? formatRecordingTime(playbackSeconds) : formatRecordingTime(recordingSeconds)}
        </div>

        {/* Right button: pause-circle icon while recording, grey mic icon when paused */}
        {isRecordingPaused ? (
          <button
            className="cometchat-compact-message-composer__recording-bar-pause"
            aria-label="Resume recording"
            onClick={handleTogglePause}
          >
            <div className="cometchat-compact-message-composer__recording-bar-mic-icon" />
          </button>
        ) : (
          <button
            className="cometchat-compact-message-composer__recording-bar-pause"
            aria-label="Pause recording"
            onClick={handleTogglePause}
          >
            <div
              className="cometchat-compact-message-composer__recording-bar-pause-circle-icon"
            />
          </button>
        )}

        {/* Send button — rendered inside the recording bar on mobile so it stays visible
            when the __right section is hidden by the mobile recording CSS rule */}
        {!hideSendButton && isMobileDevice() && (
          <div
            className="cometchat-compact-message-composer__send-button cometchat-compact-message-composer__send-button-active"
            onClick={handleSendRecording}
            role="button"
            aria-label="Send voice message"
            style={{ cursor: "pointer" }}
          >
            <CometChatButton
              iconURL={SendIconFill}
              hoverText={getLocalizedString("message_composer_send_message_icon_hover")}
            />
          </div>
        )}
      </div>
    );
  }

  /**
   * Creates the voice recording view
   * Requirements: 5.1, 5.2
   */
  function getVoiceRecordingView(): JSX.Element | null {
    const isTyping = state.text.trim().length > 0;

    return (
      <div className={`cometchat-compact-message-composer__voice-recording-button ${state.contentToDisplay === "voiceRecording" ? "cometchat-compact-message-composer__voice-recording-button-active" : ""} ${isTyping ? "cometchat-compact-message-composer__voice-recording-button--hidden" : ""}`}>
        <CometChatButton
          onClick={onVoiceRecordingBtnClick}
          hoverText={getLocalizedString("message_composer_voice_notes_icon_hover")}
          iconURL={
            state.contentToDisplay === "voiceRecording"
              ? MicIconFill
              : MicIcon
          }
        />
      </div>
    );
  }

  /**
   * Creates the send button
   * Requirements: 3.1
   */
  function getSendButton(): JSX.Element {
    if (sendButtonView) {
      return <div onClick={onSendclick}>
        {sendButtonView}
      </div>;
    }
    return (
      <div
        className={`cometchat-compact-message-composer__send-button ${shouldShowSendButton() ? "" : "cometchat-compact-message-composer__send-button-active"}`}
      >
        <CometChatButton
          onClick={onSendclick}
          iconURL={SendIconFill}
          hoverText={getLocalizedString("message_composer_send_message_icon_hover")}
        />
      </div>
    );
  }

  /**
   * Creates the preview view for text messages being edited
   * Requirements: 8.1, 8.2
   */
  function getTextMessageEditPreview(): JSX.Element | null {
    const checkForMentions = (message: CometChat.TextMessage) => {
      const userRegex = /<@uid:(.*?)>/g;
      const channelRegex = /<@all:(.*?)>/g;
      let messageText = message.getText();
      let messageTextTmp = messageText;
      let userMatch = userRegex.exec(messageText);
      let channelMatch = channelRegex.exec(messageText);
      let cometChatUsersGroupMembers = [];
      let cometChatMentionedChannels = [];
      let mentionedUsers = message.getMentionedUsers();
      while (userMatch !== null) {
        let user;
        for (let i = 0; i < mentionedUsers.length; i++) {
          if (userMatch[1] === mentionedUsers[i].getUid()) {
            user = mentionedUsers[i];
          }
        }
        if (user) {
          messageTextTmp = messageTextTmp.replace(
            userMatch[0],
            "@" + user.getName()
          );
          cometChatUsersGroupMembers.push(user);
        }
        userMatch = userRegex.exec(messageText);
      }
      while (channelMatch !== null) {
        messageTextTmp = messageTextTmp.replace(
          channelMatch[0],
          "@" +
            (getLocalizedString(`message_composer_mention_${channelMatch[1]}`) ||
              channelMatch[1])
        );
        cometChatMentionedChannels.push(channelMatch[1]);
        channelMatch = channelRegex.exec(messageText);
      }
      mentionsTextFormatterInstanceRef.current.setCometChatUserGroupMembers(
        cometChatUsersGroupMembers
      );
      mentionsTextFormatterInstanceRef.current.setCometChatMentionedChannels(
        cometChatMentionedChannels
      );
      mentionsTextFormatterInstanceRef.current.setLoggedInUser(
        CometChatUIKitLoginListener.getLoggedInUser()!
      );
      return messageTextTmp;
    };

    if (state.textMessageToEdit === null) {
      return null;
    }
    const messageToBeEdited = state.textMessageToEdit;
    // Keep checkForMentions to set up mentionsTextFormatterInstanceRef for the input field
    checkForMentions(messageToBeEdited);

    // Use the same formatting pipeline as createTextWrapper in MessagesDataSource.getMessagePreviewSubtitle
    const messageText = messageToBeEdited.getText();
    const finalTextFormatters = ChatConfigurator.getDataSource().getAllTextFormatters({});
    const markdownText = CometChatUIKitUtility.convertSupportedHtmlToMarkdown(messageText);
    let formattedText: string | void = CometChatUIKitUtility.sanitizeText(markdownText);
    finalTextFormatters.forEach((formatter) => {
      formatter.setMessage(messageToBeEdited);
    });
    for (let i = 0; i < finalTextFormatters.length; i++) {
      formattedText = finalTextFormatters[i].getFormattedText(formattedText as string, {
        mentionsTargetElement: MentionsTargetElement.textbubble,
      });
    }

    return (
      <CometChatEditPreview
        onClose={onEditPreviewClose}
        previewSubtitle={(formattedText as string) || ""}
      />
    );
  }

  /**
   * Creates the preview view for reply messages
   * Requirements: 9.1
   */
  function getReplyMessagePreview(): JSX.Element | null {
    if (state.messageToReply === null) {
      return null;
    }
    return (
      <CometChatMessagePreview
        onClose={onReplyPreviewClose}
        message={state.messageToReply}
        hideCloseButton={false}
        previewTitle={ChatConfigurator.getDataSource().getMessagePreviewTitle(state.messageToReply)}
        previewSubtitle={ChatConfigurator.getDataSource().getMessagePreviewSubtitle(state.messageToReply)}
      />
    );
  }

  /**
   * Creates the header view for the message composer
   * Requirements: 8.1, 9.1
   */
  function getHeaderView(): JSX.Element {
    if (state.showValidationError) {
      setTimeout(() => {
        dispatch({ type: "setShowValidationError", showValidationError: false });
      }, 5000);
    }

    let errorText = state.showMentionsCountWarning ? getLocalizedString("message_composer_mention_limit_warning") : getLocalizedString("message_composer_wrong_file_type");
    return (
      <div className='cometchat-compact-message-composer__header'>
        {state.showMentionsCountWarning || state.showValidationError ? (
          <div className='cometchat-compact-message-composer__header-error-state'>
            <div className='cometchat-compact-message-composer__header-error-state-icon-wrapper'>
              <div className='cometchat-compact-message-composer__header-error-state-icon'></div>
            </div>
            <span className='cometchat-compact-message-composer__header-error-state-text'>{errorText}</span>
          </div>
        ) : null}
        {headerView ?? (getTextMessageEditPreview() || getReplyMessagePreview())}
      </div>
    );
  }

  /**
   * Creates the file picker component for selecting media files
   */
  function getMediaFilePicker(): JSX.Element {
    return (
      <input
        style={{
          display: "none"
        }}
        ref={mediaFilePickerRef}
        type='file'
        onChange={handleMediaMessageSendWrapper}
      />
    );
  }

  /**
   * Creates the auxiliary view for additional buttons
   */
  function getAuxiliaryView(): JSX.Element | undefined {
    return auxiliaryButtonView ? (
      <div className="cometchat-compact-message-composer__auxilary-button-view">
        {auxiliaryButtonView}
      </div>
    ) : undefined;
  }

  /**
   * Creates the fixed formatting toolbar that appears when the toggle button is clicked.
   * Only shown when enableRichTextEditor is true and hideRichTextFormattingOptions is false.
   */
  function getFixedFormattingToolbar(): JSX.Element | null {
    // Don't show if rich text editor is disabled, formatting options are hidden, or toolbar is not visible
    if (!enableRichTextEditor || hideRichTextFormattingOptions || !isFixedToolbarVisible || !richTextFormatter) {
      return null;
    }

    return (
      <div className="cometchat-compact-message-composer__formatting-toolbar">
        <CometChatFormattingToolbar
          textInputRef={textInputRef as React.RefObject<HTMLDivElement>}
          richTextFormatter={richTextFormatter}
          isFloating={false}
          activeFormats={activeFormats}
          onLinkClick={handleLinkClick}
          onFormatApplied={handleFormatApplied}
        />
      </div>
    );
  }

  /**
   * Creates the floating formatting toolbar that appears when text is selected.
   * Only shown when showToolbarOnSelection is true and not on mobile devices.
   */
  function getFloatingFormattingToolbar(): JSX.Element | null {
    // Don't show if rich text editor is disabled,
    // showToolbarOnSelection is false, on mobile, fixed toolbar is visible, or toolbar is not visible
    if (!enableRichTextEditor || !showToolbarOnSelection || 
        isMobileDevice() || isFixedToolbarVisible || !isFloatingToolbarVisible || !floatingToolbarPosition || !richTextFormatter) {
      return null;
    }

    return (
      <CometChatFormattingToolbar
        textInputRef={textInputRef as React.RefObject<HTMLDivElement>}
        richTextFormatter={richTextFormatter}
        isFloating={true}
        position={floatingToolbarPosition}
        activeFormats={activeFormats}
        onVisibilityChange={(visible) => setIsFloatingToolbarVisible(visible)}
        onLinkClick={handleLinkClick}
        onFormatApplied={handleFormatApplied}
      />
    );
  }

  // Effect to monitor microphone permission state on mount
  useEffect(() => {
    if (!navigator?.permissions) return;
    let cancelled = false;
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
      if (cancelled) return;
      micPermissionStatusRef.current = status;
      setMicPermissionDenied(status.state === 'denied');
      status.onchange = () => {
        if (!cancelled) {
          setMicPermissionDenied(status.state === 'denied');
          // If permission was just granted, hide the dialog
          if (status.state === 'granted') {
            setShowMicPermissionDialog(false);
          }
        }
      };
    }).catch(() => { /* Permissions API not supported — handled at getUserMedia time */ });
    return () => {
      cancelled = true;
      if (micPermissionStatusRef.current) {
        micPermissionStatusRef.current.onchange = null;
      }
    };
  }, []);

  // Effect to handle active popover subscription
  useEffect(() => {
    try {
      var activePopoverSub = CometChatUIEvents.ccActivePopover.subscribe((id: string) => {
        // Close our content if another composer instance activated a popover.
        // Use our unique ID to distinguish: if the broadcast ID matches our own,
        // it's our own activation — ignore it. Otherwise, close everything.
        if (id !== uniqueIdRef.current) {
          dispatch({ type: "setContentToDisplay", contentToDisplay: "none" });
          aiBtnRef.current?.closePopover();
          attachmentsBtnRef.current?.closePopover();
          emojiBtnRef.current?.closePopover();
        }
      });
      return () => {
        activePopoverSub.unsubscribe();
      };
    } catch (error) {
      errorHandler(error, "ccActivePopover");
    }
  }, [state.contentToDisplay]);

  // Effect to handle mentions list visibility
  useEffect(() => {
    const matchesMentionAll = !(mentionsSearchTerm && mentionsSearchTerm.trim().length > 0 && !mentionAllLabel.toLowerCase().startsWith(mentionsSearchTerm.trim().toLowerCase()));

    if (disableMentions && (userMemberListType === UserMemberListType.users || !matchesMentionAll)) {
      setShowListForMentions(false);
    }
  }, [mentionsSearchTerm, disableMentions, userMemberListType, mentionAllLabel]);

  // Track whether caret is inside inline code for preservation on type-over
  useEffect(() => {
    if (!enableRichTextEditor || !richTextFormatter) return;

    const handleSelectionChangeForInlineCode = () => {
      const inputElement = getCurrentInput() as HTMLElement;
      if (inputElement) {
        wasInsideInlineCodeRef.current = !!richTextFormatter.isInsideCodeInline(inputElement);
      }
    };

    const doc = getCurrentDocument();
    doc?.addEventListener('selectionchange', handleSelectionChangeForInlineCode);
    return () => {
      doc?.removeEventListener('selectionchange', handleSelectionChangeForInlineCode);
    };
  }, [enableRichTextEditor, richTextFormatter]);

  /**
   * Renders sanitized HTML content at the current caret position
   */
  const renderSanitizedHtml = useCallback(
    (html: string) => {
      try {
        if (sel.current && range.current) {
          range.current.deleteContents();
          const frag = sanitizeHtmlStringToFragment(html, textFormatterArray);
          range.current.insertNode(frag);

          const contentEditable = getCurrentInput();
          const lastNode = contentEditable?.lastChild || null;
          if (lastNode) {
            range.current = range.current.cloneRange();
            range.current.setStartAfter(lastNode);
            range.current.collapse(true);
            sel.current.removeAllRanges();
            sel.current.addRange(range.current);
          }

          if (contentEditable?.innerHTML?.trim() === "<br>") {
            contentEditable.innerHTML = "";
          }
          let textToDispatch =
            contentEditable?.innerHTML?.trim() === "<br>"
              ? undefined
              : contentEditable?.innerHTML!;

          if (textFormatterArray && textFormatterArray.length) {
            for (let i = 0; i < textFormatterArray.length; i++) {
              textToDispatch = textFormatterArray[i].getOriginalText(textToDispatch);
            }
          }
          mySetAddToMsgInputText(textToDispatch!);

        } else if (sel.current && sel.current.type != "Control") {
          (sel as any).current.createRange().pasteHTML(html);
        } else {
          const contentEditable: any = getCurrentInput();
          contentEditable.textContent = state.addToMsgInputText;
        }
      } catch (error) {
        errorHandler(error, "renderSanitizedHtml");
      }
    },
    [state.addToMsgInputText, state.text, textFormatterArray]
  );

  // Hook to manage state and effects related to message composition
  useCometChatMessageComposer({
    currentSelectionForRegex,
    currentSelectionForRegexRange,
    setSelection,
    dispatch,
    textInputRef,
    mySetAddToMsgInputText,
    errorHandler,
    createPollViewRef,
    textFormatters,
    textFormatterArray,
    mentionsTextFormatterInstanceRef,
    setTextFormatters,
    CometChatUIKitLoginListener,
    group,
    user,
    userPropRef,
    groupPropRef,
    setShowListForMentions,
    searchMentions,
    mentionsFormatterInstanceId,
    setUsersRequestBuilder,
    setGroupMembersRequestBuilder,
    setUserMemberListType,
    getComposerId,
    pasteHtmlAtCaret,
    renderSanitizedHtml,
    parentMessageIdPropRef,
    emptyInputField,
    text: state.text,
    propsText: props.initialComposerText,
    getCurrentInput,
    isPartOfCurrentChatForUIEvent,
    textMessageToEdit: state.textMessageToEdit,
    getCurrentWindow,
    getCurrentDocument,
    onTextChange,
    messageToReplyRef,
    mentionsUsersRequestBuilder,
    mentionsGroupMembersRequestBuilder
  });

  // Main rendering of the message composer component
  return (
    <>
      {/* Poll Modal */}
      {getCreatePollModal()}
      
      {/* Link Dialog */}
      {showLinkInput && (
        <CometChatLinkDialog
          onSubmit={handleLinkSubmit}
          onCancel={handleLinkCancel}
          showTextInput={true}
          isEditMode={isLinkEditMode}
          initialUrl={linkEditData?.url || ''}
          initialText={isLinkEditMode ? (linkEditData?.text || '') : linkDialogSelectedText}
          focusLinkField={isLinkEditMode || !!linkDialogSelectedText}
        />
      )}
      
      <div className="cometchat" style={{ height: "fit-content", width: "100%", position: "relative" }}>
        {/* Microphone permission denied dialog (rendered via portal to persist independently of popover) */}
        {showMicPermissionDialog && createPortal(
          <div className="cometchat cometchat-media-recorder__permission-overlay">
            <div className="cometchat-media-recorder__permission-dialog">
              <div className="cometchat-media-recorder__permission-dialog-icon-wrapper">
                <div className="cometchat-media-recorder__permission-dialog-icon" />
              </div>
              <div className="cometchat-media-recorder__permission-dialog-title">
                {getLocalizedString("media_recorder_error_title") || "Microphone Access Needed"}
              </div>
              <div className="cometchat-media-recorder__permission-dialog-subtitle">
                {getLocalizedString("media_recorder_error_subtitle") || "Microphone access is blocked. Click the lock/info icon in your browser's address bar, enable Microphone, then try again."}
              </div>
              <button
                className="cometchat-media-recorder__permission-dialog-button"
                onClick={() => {
                  if (!micPermissionDenied) {
                    // Permission is in 'prompt' state — trigger the browser's native mic prompt
                    navigator.mediaDevices?.getUserMedia({ audio: true })
                      .then(stream => {
                        stream.getTracks().forEach(t => t.stop());
                        setShowMicPermissionDialog(false);
                      })
                      .catch(() => setShowMicPermissionDialog(false));
                  } else {
                    setShowMicPermissionDialog(false);
                  }
                }}
              >
                {getLocalizedString("media_recorder_permission_dismiss") || "Understood"}
              </button>
            </div>
          </div>,
          document.body
        )}
        {/* Floating formatting toolbar */}
        {getFloatingFormattingToolbar()}
        
        {showListForMentions && (!disableMentionAll || !disableMentions) && (
          <div
            className='cometchat-compact-message-composer__mentions-list'
            ref={userMemberWrapperRef}>
            <CometChatUserMemberWrapper
              userMemberListType={userMemberListType}
              onItemClick={defaultMentionsItemClickHandler}
              usersRequestBuilder={usersRequestBuilder}
              searchKeyword={mentionsSearchTerm}
              onEmpty={defaultOnEmptyForMentions}
              group={group}
              groupMemberRequestBuilder={groupMembersRequestBuilder}
              onError={defaultOnEmptyForMentions}
              showScrollbar={showScrollbar}
              disableMentionAll={disableMentionAll}
              disableMentions={disableMentions}
              mentionAllLabel={mentionAllLabel}
            />
          </div>
        )}
        <div
          key={getComposerId()?.group || getComposerId()?.user}
          className={`cometchat-compact-message-composer ${!showScrollbar ? 'cometchat-compact-message-composer-hide-scrollbar' : ''}`}
        >
          {getMediaFilePicker()}
          {state.showValidationError || state.showMentionsCountWarning || headerView || getTextMessageEditPreview() || getReplyMessagePreview() ? getHeaderView() : null}
          
          {/* Fixed formatting toolbar */}
          {getFixedFormattingToolbar()}
          
          {/* Main single-line row */}
          <div className={`cometchat-compact-message-composer__row${state.contentToDisplay === "voiceRecording" ? " cometchat-compact-message-composer__row--recording" : ""}`}>
            {/* Left section - Attachment button + Rich text toggle */}
            <div className="cometchat-compact-message-composer__left cometchat-compact-message-composer__buttons">
              {shouldShowAttachmentButton() ? null : getActionsheetView()}
            </div>
            
            {/* Center section - Text input / Inline recording bar */}
            <div className="cometchat-compact-message-composer__center">
              <div
                onKeyUp={onKeyUp}
                onKeyDown={onKeyDown}
                contentEditable={checkPlainTextAvailability(false)}
                onMouseDown={handleMouseDown}
                onInput={onTextInputChange}
                onClick={handleInputClick}
                className={`cometchat-compact-message-composer__input ${parentMessageIdPropRef.current ? "cometchat-compact-message-composer__input-thread" : ""} ${isMobileDevice() ? "cometchat-compact-message-composer__input-mobile" : ""} ${activeFormats.includes('codeBlock') ? "cometchat-compact-message-composer__input--code-block" : ""} ${state.contentToDisplay === "voiceRecording" ? "cometchat-compact-message-composer__input--hidden" : ""} ${createUniqueUUID}`}
                data-placeholder={placeholderText}
                ref={textInputRef as LegacyRef<HTMLDivElement>}
              />
              {getInlineRecordingBar()}
            </div>
            
            {/* Right section - Action buttons */}
            <div className="cometchat-compact-message-composer__right cometchat-compact-message-composer__buttons">
              {hideEmojiKeyboardButton || isMobileDevice() || state.contentToDisplay === "voiceRecording" ? null : getEmojiKeyboardView()}
              {hideStickersButton ? null : (
                <div style={{ display: state.contentToDisplay === "voiceRecording" ? "none" : undefined }}>
                  {ChatConfigurator.getDataSource().getStickerButton(
                    getComposerId(),
                    user,
                    group,
                    messageToReplyRef.current,
                    closeReplyPreview
                  )}
                </div>
              )}
              {hideVoiceRecordingButton || state.contentToDisplay === "voiceRecording" ? null : getVoiceRecordingView()}
              {getAuxiliaryView()}
              {hideSendButton ? null : state.contentToDisplay === "voiceRecording" ? (
                /* On mobile the send button is rendered inside the recording bar (center section)
                   because the right section is hidden. Skip rendering it here on mobile. */
                isMobileDevice() ? null : (
                  <div
                    className="cometchat-compact-message-composer__send-button cometchat-compact-message-composer__send-button-active"
                    onClick={handleSendRecording}
                    role="button"
                    aria-label="Send voice message"
                    style={{ cursor: "pointer" }}
                  >
                    <CometChatButton
                      iconURL={SendIconFill}
                      hoverText={getLocalizedString("message_composer_send_message_icon_hover")}
                    />
                  </div>
                )
              ) : getSendButton()}
            </div>
          </div>
        </div>
        {/* Link Popover - positioned relative to composer */}
        {showLinkPopover && linkPopoverData && (
          <CometChatLinkPopover
            linkText={linkPopoverData.linkText}
            linkUrl={linkPopoverData.linkUrl}
            position={linkPopoverData.position}
            onEdit={handleLinkPopoverEdit}
            onRemove={handleLinkPopoverRemove}
            onClose={handleLinkPopoverClose}
          />
        )}
      </div>
    </>
  );
}


