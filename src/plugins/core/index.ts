import type { CometChatMessagePlugin } from '../plugin.types';
import { CometChatTextPlugin } from './text/CometChatTextPlugin';
import { CometChatImagePlugin } from './image/CometChatImagePlugin';
import { CometChatVideoPlugin } from './video/CometChatVideoPlugin';
import { CometChatFilePlugin } from './file/CometChatFilePlugin';
import { CometChatAudioPlugin } from './audio/CometChatAudioPlugin';
import { CometChatGroupActionPlugin } from './group-action/CometChatGroupActionPlugin';
import { CometChatCallActionPlugin } from './call-action/CometChatCallActionPlugin';
import { CometChatMeetingPlugin } from './call-action/CometChatMeetingPlugin';
import { CometChatCardBubblePlugin } from './card/CometChatCardBubblePlugin';
import { CometChatDeletePlugin } from './delete/CometChatDeletePlugin';
import { CometChatPollsPlugin } from '../polls/CometChatPollsPlugin';
import { CometChatStickersPlugin } from '../stickers/CometChatStickersPlugin';
import { CometChatCollaborativeDocumentPlugin } from '../collaborative-document/CometChatCollaborativeDocumentPlugin';
import { CometChatCollaborativeWhiteboardPlugin } from '../collaborative-whiteboard/CometChatCollaborativeWhiteboardPlugin';
import { CometChatAIPlugin } from '../ai/CometChatAIPlugin';

/**
 * Default core plugins.
 *
 * The media plugins (image, video, audio, file) render the batch-aware plural
 * bubbles (ImagesBubble, VideosBubble, AudiosBubble/VoiceNoteBubble, FilesBubble).
 * Order matters for type+category matching — first match wins.
 */
export const defaultPlugins: CometChatMessagePlugin[] = [
  CometChatTextPlugin,
  CometChatImagePlugin,
  CometChatVideoPlugin,
  CometChatFilePlugin,
  CometChatAudioPlugin,
  CometChatGroupActionPlugin,
  CometChatCallActionPlugin,
  CometChatMeetingPlugin,
  // Developer card messages (category-only wildcard plugin)
  CometChatCardBubblePlugin,
  CometChatAIPlugin,
  // Extension plugins
  CometChatPollsPlugin,
  CometChatStickersPlugin,
  CometChatCollaborativeDocumentPlugin,
  CometChatCollaborativeWhiteboardPlugin,
  // DeletePlugin must be last — matched by getDeletedAt() fast path
  CometChatDeletePlugin,
];
