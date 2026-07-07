import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIPlugin } from '../CometChatAIPlugin';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';
import type { CometChatMessagePluginContext } from '../../plugin.types';

// Asset import — return a stub URL.
vi.mock('../../../assets/Copy.svg', () => ({ default: 'copy-icon.svg' }));

const GROUP = CometChatUIKitConstants.MessageReceiverType.group;
const USER = CometChatUIKitConstants.MessageReceiverType.user;
const ASSISTANT = CometChatUIKitConstants.MessageTypes.assistant;
const TOOL_ARGS = CometChatUIKitConstants.MessageTypes.toolArguments;

function makeContext(
  overrides: Partial<CometChatMessagePluginContext> = {}
): CometChatMessagePluginContext {
  return {
    loggedInUser: {} as CometChat.User,
    alignment: 'left',
    theme: 'light',
    getLocalizedString: (key: string) => key,
    ...overrides,
  } as CometChatMessagePluginContext;
}

function makeMessage({
  receiverType = GROUP,
  type = ASSISTANT,
  text = 'Hello there',
}: {
  receiverType?: string;
  type?: string;
  text?: string | undefined;
} = {}): CometChat.BaseMessage {
  return {
    getReceiverType: () => receiverType,
    getType: () => type,
    getAssistantMessageData: () => ({ getText: () => text }),
  } as unknown as CometChat.BaseMessage;
}

/** Pull the lazy bubble element out of the Suspense wrapper returned by renderBubble. */
function lazyChildOf(el: ReactElement): ReactElement {
  return (el.props as { children: ReactElement }).children;
}

describe('CometChatAIPlugin.getOptions', () => {
  it('returns a copy-only option for an assistant message in a group', () => {
    const options = CometChatAIPlugin.getOptions?.(makeMessage(), makeContext()) ?? [];
    expect(options).toHaveLength(1);
    expect(options[0].id).toBe(CometChatUIKitConstants.MessageOption.copyMessage);
  });

  it('returns no options for an assistant message in 1:1 (inline copy button is used)', () => {
    const options =
      CometChatAIPlugin.getOptions?.(makeMessage({ receiverType: USER }), makeContext()) ?? [];
    expect(options).toEqual([]);
  });

  it('returns no options for tool-call messages even in a group', () => {
    const options =
      CometChatAIPlugin.getOptions?.(makeMessage({ type: TOOL_ARGS }), makeContext()) ?? [];
    expect(options).toEqual([]);
  });

  it('copy option writes the assistant text to the clipboard and shows a toast', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const showToast = vi.fn();

    const [copy] =
      CometChatAIPlugin.getOptions?.(
        makeMessage({ text: 'copy this reply' }),
        makeContext({ showToast })
      ) ?? [];
    copy.onClick(makeMessage({ text: 'copy this reply' }));

    expect(writeText).toHaveBeenCalledWith('copy this reply');
    expect(showToast).toHaveBeenCalled();
  });
});

describe('CometChatAIPlugin.renderBubble', () => {
  it('renders the assistant bubble without an inline copy button prop (group)', () => {
    const el = CometChatAIPlugin.renderBubble(makeMessage(), makeContext()) as ReactElement;
    const child = lazyChildOf(el);
    expect(child.props).not.toHaveProperty('showCopyButton');
  });

  it('renders the assistant bubble without an inline copy button prop (1:1)', () => {
    const el = CometChatAIPlugin.renderBubble(
      makeMessage({ receiverType: USER }),
      makeContext()
    ) as ReactElement;
    const child = lazyChildOf(el);
    expect(child.props).not.toHaveProperty('showCopyButton');
  });
});

describe('CometChatAIPlugin.getLastMessagePreview', () => {
  const user = {} as CometChat.User;

  it('returns the assistant text (markdown stripped) for a group agent reply', () => {
    const preview = CometChatAIPlugin.getLastMessagePreview?.(
      makeMessage({ text: '**Bold** answer' }),
      user
    );
    expect(preview).toBe('Bold answer');
  });

  it('truncates long previews to 80 chars with an ellipsis', () => {
    const long = 'a'.repeat(200);
    const preview = CometChatAIPlugin.getLastMessagePreview?.(makeMessage({ text: long }), user);
    expect(preview).toBe(`${'a'.repeat(80)}…`);
  });

  it('builds the preview from message elements (text + card fallbackText)', () => {
    const withElements = {
      getReceiverType: () => GROUP,
      getType: () => ASSISTANT,
      getAssistantMessageData: () => ({ getText: () => 'should not be used' }),
      getElements: () => [
        { getType: () => 'text', getData: () => ({ text: 'Here is a card' }) },
        { getType: () => 'card', getData: () => ({ card: { fallbackText: 'Product XYZ' } }) },
      ],
    } as unknown as CometChat.BaseMessage;
    const preview = CometChatAIPlugin.getLastMessagePreview?.(withElements, user);
    expect(preview).toBe('Here is a card Product XYZ');
  });

  it('falls back to assistant data text when there are no elements', () => {
    const noElements = {
      getReceiverType: () => GROUP,
      getType: () => ASSISTANT,
      getAssistantMessageData: () => ({ getText: () => 'plain assistant text' }),
      getElements: () => [],
    } as unknown as CometChat.BaseMessage;
    const preview = CometChatAIPlugin.getLastMessagePreview?.(noElements, user);
    expect(preview).toBe('plain assistant text');
  });

  it('falls back to "AI message" when no text can be extracted', () => {
    const empty = {
      getReceiverType: () => GROUP,
      getType: () => ASSISTANT,
      getAssistantMessageData: () => ({ getText: () => undefined }),
    } as unknown as CometChat.BaseMessage;
    const preview = CometChatAIPlugin.getLastMessagePreview?.(empty, user);
    expect(preview).toBe('AI message');
  });
});
