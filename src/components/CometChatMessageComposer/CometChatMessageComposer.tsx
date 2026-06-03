import React from 'react';
import { CometChatMessageComposerRoot } from './CometChatMessageComposerRoot';
import { CometChatMessageComposerInput } from './CometChatMessageComposerInput';
import { CometChatMessageComposerSendButton } from './CometChatMessageComposerSendButton';
import { CometChatMessageComposerAttachmentButton } from './CometChatMessageComposerAttachmentButton';
import { CometChatMessageComposerEmojiButton } from './CometChatMessageComposerEmojiButton';
import { CometChatMessageComposerVoiceButton } from './CometChatMessageComposerVoiceButton';
import { CometChatMessageComposerEditPreview } from './CometChatMessageComposerEditPreview';
import { CometChatMessageComposerReplyPreview } from './CometChatMessageComposerReplyPreview';
import { CometChatMessageComposerAuxiliaryButtons } from './CometChatMessageComposerAuxiliaryButtons';
import { CometChatMessageComposerAIButton } from './CometChatMessageComposerAIButton';
import { CometChatMessageComposerHeader } from './CometChatMessageComposerHeader';
import { CometChatMessageComposerFooter } from './CometChatMessageComposerFooter';
import type { CometChatMessageComposerRootProps } from './CometChatMessageComposer.types';

// ---------------------------------------------------------------------------
// Flat API Component
// ---------------------------------------------------------------------------

/**
 * CometChatMessageComposer — flat convenience component.
 *
 * Renders the full default composer layout in one line.
 * All props are passed directly to Root; sub-components read them from context.
 *
 * ```tsx
 * <CometChatMessageComposer user={user} />
 * <CometChatMessageComposer group={group} parentMessageId={threadId} />
 * <CometChatMessageComposer
 *   user={user}
 *   enableRichTextEditor
 *   disableMentions
 *   onSendButtonClick={(msg) => console.log(msg)}
 * />
 * ```
 *
 * For full compound composition control, use the sub-components:
 *
 * ```tsx
 * <CometChatMessageComposer.Root user={user} layout="multiline">
 *   <CometChatMessageComposer.EditPreview />
 *   <CometChatMessageComposer.ReplyPreview />
 *   <CometChatMessageComposer.Input />
 *   <CometChatMessageComposer.AttachmentButton />
 *   <CometChatMessageComposer.EmojiButton />
 *   <CometChatMessageComposer.VoiceButton />
 *   <CometChatMessageComposer.SendButton />
 * </CometChatMessageComposer.Root>
 * ```
 */
const CometChatMessageComposerComponent: React.FC<CometChatMessageComposerRootProps> = props => {
  // No children — let Root render its own default layout
  return <CometChatMessageComposerRoot {...props} />;
};

CometChatMessageComposerComponent.displayName = 'CometChatMessageComposer';

// ---------------------------------------------------------------------------
// Namespace Export (callable + sub-components)
// ---------------------------------------------------------------------------

/**
 * CometChatMessageComposer — compound component namespace with flat API.
 *
 * - `<CometChatMessageComposer ... />` — flat API (renders default layout)
 * - `<CometChatMessageComposer.Root>...</CometChatMessageComposer.Root>` — compound composition
 */
export const CometChatMessageComposer = Object.assign(CometChatMessageComposerComponent, {
  Root: CometChatMessageComposerRoot,
  Input: CometChatMessageComposerInput,
  SendButton: CometChatMessageComposerSendButton,
  AttachmentButton: CometChatMessageComposerAttachmentButton,
  EmojiButton: CometChatMessageComposerEmojiButton,
  VoiceButton: CometChatMessageComposerVoiceButton,
  EditPreview: CometChatMessageComposerEditPreview,
  ReplyPreview: CometChatMessageComposerReplyPreview,
  AuxiliaryButtons: CometChatMessageComposerAuxiliaryButtons,
  AIButton: CometChatMessageComposerAIButton,
  Header: CometChatMessageComposerHeader,
  Footer: CometChatMessageComposerFooter,
});
