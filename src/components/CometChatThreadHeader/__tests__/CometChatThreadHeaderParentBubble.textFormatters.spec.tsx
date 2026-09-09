import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThreadHeaderParentBubble } from '../CometChatThreadHeaderParentBubble';
import { CometChatThreadHeaderContext } from '../CometChatThreadHeader.context';
import type { CometChatThreadHeaderContextValue } from '../CometChatThreadHeader.types';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import type { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { buildUser, buildTextMessage } from '../../../testing/mock-builders';

// Capture the context object the plugin's renderBubble receives, to assert the
// parent bubble forwards textFormatters the same way the message list does.
const capturedContexts: Record<string, unknown>[] = [];

const fakeRegistry = {
  findPlugin: () => ({
    renderBubble: (_message: CometChat.BaseMessage, context: Record<string, unknown>) => {
      capturedContexts.push(context);
      return null;
    },
  }),
} as unknown as CometChatPluginRegistry;

class NoopFormatter extends CometChatTextFormatter {
  readonly id = 'test-noop';
}

function renderParentBubble(textFormatters?: CometChatTextFormatter[]) {
  const parentMessage = buildTextMessage({
    sender: buildUser({ uid: 'other' }),
  }) as unknown as CometChat.BaseMessage;

  const ctx = {
    parentMessage,
    replyCount: 0,
    senderName: 'Other',
    ...(textFormatters !== undefined && { textFormatters }),
  } as CometChatThreadHeaderContextValue;

  return render(
    <CometChatPluginRegistryContext.Provider value={fakeRegistry}>
      <CometChatThreadHeaderContext.Provider value={ctx}>
        <CometChatThreadHeaderParentBubble />
      </CometChatThreadHeaderContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  capturedContexts.length = 0;
});

describe('CometChatThreadHeaderParentBubble — textFormatters', () => {
  it('forwards textFormatters into the plugin renderBubble context', () => {
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(
      buildUser({ uid: 'me' }) as unknown as CometChat.User
    );
    const fmt = new NoopFormatter();
    renderParentBubble([fmt]);

    expect(capturedContexts.length).toBeGreaterThan(0);
    expect(
      capturedContexts.some(
        c => Array.isArray(c.textFormatters) && (c.textFormatters as unknown[]).includes(fmt)
      )
    ).toBe(true);
  });

  it('omits textFormatters from the context when none are provided', () => {
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(
      buildUser({ uid: 'me' }) as unknown as CometChat.User
    );
    renderParentBubble();

    expect(capturedContexts.length).toBeGreaterThan(0);
    expect(capturedContexts.every(c => c.textFormatters === undefined)).toBe(true);
  });
});
