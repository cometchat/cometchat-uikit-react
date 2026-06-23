import type { CometChatMessagePlugin } from '../plugin.types';
import { CometChatTextPlugin } from './text/CometChatTextPlugin';
import { CometChatImagePlugin } from './image/CometChatImagePlugin';
import { CometChatVideoPlugin } from './video/CometChatVideoPlugin';
import { CometChatFilePlugin } from './file/CometChatFilePlugin';
import { CometChatAudioPlugin } from './audio/CometChatAudioPlugin';
import { CometChatGroupActionPlugin } from './group-action/CometChatGroupActionPlugin';
import { CometChatCallActionPlugin } from './call-action/CometChatCallActionPlugin';
import { CometChatMeetingPlugin } from './call-action/CometChatMeetingPlugin';
import { CometChatDeletePlugin } from './delete/CometChatDeletePlugin';
import { CometChatPollsPlugin } from '../polls/CometChatPollsPlugin';
import { CometChatStickersPlugin } from '../stickers/CometChatStickersPlugin';
import { CometChatCollaborativeDocumentPlugin } from '../collaborative-document/CometChatCollaborativeDocumentPlugin';
import { CometChatCollaborativeWhiteboardPlugin } from '../collaborative-whiteboard/CometChatCollaborativeWhiteboardPlugin';
import { CometChatAIPlugin } from '../ai/CometChatAIPlugin';

/**
 * Default core plugins. Consumers can extend by spreading this array
 * and adding additional plugins:
 *
 * ```tsx
 * <CometChatProvider plugins={[...defaultPlugins, MyCustomPlugin]}>
 * ```
 *
 * Order matters for type+category matching — first match wins.
 * DeletePlugin is last because it's matched by the registry's deleted-message
 * fast path (getDeletedAt() check), not by type+category.
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
  CometChatAIPlugin,
  // Extension plugins
  CometChatPollsPlugin,
  CometChatStickersPlugin,
  CometChatCollaborativeDocumentPlugin,
  CometChatCollaborativeWhiteboardPlugin,
  // DeletePlugin must be last — matched by getDeletedAt() fast path
  CometChatDeletePlugin,
];
