import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageComposer as Composer } from '@cometchat/chat-uikit-react';

interface CometChatMessageComposerProps {
  user?: CometChat.User;
  group?: CometChat.Group;
}

/**
 * Wrapper around the real CometChatMessageComposer v7 component.
 * Uses compact layout with rich text editor enabled to match V6's CometChatCompactMessageComposer.
 */
export const CometChatMessageComposer = ({ user, group }: CometChatMessageComposerProps) => {
  return <Composer.Root user={user} group={group} layout="compact" enableRichTextEditor />;
};
