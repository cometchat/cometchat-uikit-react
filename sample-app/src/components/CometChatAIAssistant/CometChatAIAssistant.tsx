/**
 * CometChatAIAssistant
 *
 * Dedicated page for the AI assistant chat experience.
 * Mirrors Angular's CometChatAIAssistantDemoComponent exactly:
 *
 * 1. Gets the logged-in user from CometChat SDK
 * 2. Attaches the AI assistant WebSocket listener
 * 3. Forwards all AI stream events to CometChatAIStreamingService
 * 4. Renders CometChatAIAssistantChat with the logged-in user
 *
 * The `user` prop on CometChatAIAssistantChat is the logged-in user —
 * the SDK routes messages to the AI agent automatically based on your
 * dashboard configuration (AI → Agent Builder).
 */

import { useEffect, useId, useState, lazy, Suspense } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleWebsocketMessage,
} from '@cometchat/chat-uikit-react/plugins/ai';

// Lazy-load — Tier 4, only loaded when this page is shown
const LazyCometChatAIAssistantChat = lazy(() =>
  import('@cometchat/chat-uikit-react').then(m => ({
    default: m.CometChatAIAssistantChat,
  }))
);
interface CometChatAIAssistantProps {
  onBack?: () => void;
}

export const CometChatAIAssistant = ({ onBack }: CometChatAIAssistantProps) => {
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const listenerId = `ai-assistant-demo-${useId()}`;

  // Step 1 — get the logged-in user (same as Angular's CometChatUIKit.getLoggedInUser())
  useEffect(() => {
    CometChat.getLoggedinUser().then(user => {
      if (user) setLoggedInUser(user);
    });
  }, []);

  // Step 2 — attach the AI assistant WebSocket listener and forward events
  // to CometChatAIStreamingService (same as Angular's _attachAIListener)
  useEffect(() => {
    if (!loggedInUser) return;

    CometChat.addAIAssistantListener(
      listenerId,
      new CometChat.AIAssistantListener({
        onAIAssistantEventReceived: (event: CometChat.AIAssistantBaseEvent) => {
          handleWebsocketMessage(event, loggedInUser.getUid());
        },
      })
    );

    return () => {
      CometChat.removeAIAssistantListener(listenerId);
    };
  }, [loggedInUser, listenerId]);

  if (!loggedInUser) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        color: 'var(--cometchat-text-color-secondary)',
        font: 'var(--cometchat-font-body-regular)',
      }}>
        Loading...
      </div>
    );
  }

  // Step 3 — render CometChatAIAssistantChat with the logged-in user
  // (same as Angular's template: [user]="activeUser()!")
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
      }}>
        Loading...
      </div>
    }>
      <LazyCometChatAIAssistantChat
        user={loggedInUser}
        streamingSpeed={30}
        showBackButton={!!onBack}
        onBackButtonClicked={onBack}
      />
    </Suspense>
  );
};
