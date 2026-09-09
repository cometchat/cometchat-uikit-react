import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

// The constants module (imported transitively via pinSaveUtils) runs a static initializer that
// dereferences several SDK enum objects. Provide those parent objects so it doesn't throw — empty
// is fine, since it only reads members off them (missing → undefined, as this spec had pre-merge).
// The thread-subscription calls this spec actually drives are the real overrides below.
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    MessageCategory: {},
    ModerationStatus: {},
    MESSAGE_TYPE: {},
    ACTION_TYPE: {},
    GROUP_MEMBER_SCOPE: {},
    GROUP_TYPE: {},
    USER_STATUS: {},
    AI_ASSISTANT_EVENTS: {},
    CALL_MODE: {},
    CALL_STATUS: {},
    GoalType: {},
    // Message classes for the `instanceof` moderation check in the pin/save "Organize" options
    // (a plain mock message isn't an instance of these, so the check returns false without throwing).
    TextMessage: class {
      readonly __mock = true;
    },
    MediaMessage: class {
      readonly __mock = true;
    },
    subscribeToThread: (id: number) => mockSubscribe(id) as unknown,
    unsubscribeFromThread: (id: number) => mockUnsubscribe(id) as unknown,
  },
}));

vi.mock('../../../../formatters/CometChatMarkdownFormatter', () => ({
  CometChatMarkdownFormatter: vi.fn().mockImplementation(() => ({
    format: (text: string) => text,
  })),
}));

vi.mock('../../../../utils/CometChatTranslationUtils', () => ({
  translateMessage: vi.fn(),
}));

import {
  getMediaMessageOptions,
  getTextMessageOptions,
  MESSAGE_OPTION_IDS,
} from '../CometChatMessageOptions';
import { resetThreadSubscriptionGuards } from '../../../../utils/CometChatThreadSubscription';
import {
  buildUser,
  buildGroup,
  buildTextMessage,
  buildMediaMessage,
} from '../../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePluginContext, CometChatMessageOption } from '../../../plugin.types';

const ME = 'me-1';
const PARENT_ID = 500;

function context(
  overrides: Partial<CometChatMessagePluginContext> = {}
): CometChatMessagePluginContext {
  return {
    loggedInUser: buildUser({ uid: ME, name: 'Me' }) as unknown as CometChat.User,
    group: buildGroup({ guid: 'group-1' }) as unknown as CometChat.Group,
    alignment: 'right',
    theme: 'light',
    ...overrides,
  };
}

function groupTextMessage(over: Record<string, unknown> = {}) {
  return buildTextMessage({
    id: PARENT_ID,
    sender: buildUser({ uid: ME }),
    receiverType: 'group',
    receiverId: 'group-1',
    ...over,
  }) as unknown as CometChat.BaseMessage;
}

function find(options: CometChatMessageOption[]): CometChatMessageOption | undefined {
  return options.find(o => o.id === MESSAGE_OPTION_IDS.threadSubscription);
}

beforeEach(() => {
  vi.clearAllMocks();
  resetThreadSubscriptionGuards();
  mockSubscribe.mockResolvedValue('ok');
  mockUnsubscribe.mockResolvedValue('ok');
});

describe('threadSubscription option — presence', () => {
  it('is offered on a text message', () => {
    expect(find(getTextMessageOptions(groupTextMessage(), context()))).toBeDefined();
  });

  it('is offered on a media message', () => {
    const media = buildMediaMessage({
      id: PARENT_ID,
      receiverType: 'group',
      receiverId: 'group-1',
    }) as unknown as CometChat.BaseMessage;
    expect(find(getMediaMessageOptions(media, context()))).toBeDefined();
  });

  it('sits directly after "Reply in Thread"', () => {
    const options = getTextMessageOptions(groupTextMessage(), context());
    const ids = options.map(o => o.id);
    expect(ids.indexOf(MESSAGE_OPTION_IDS.threadSubscription)).toBe(
      ids.indexOf(MESSAGE_OPTION_IDS.replyInThread) + 1
    );
  });

  it('is offered on a message with no replies — the point is future replies', () => {
    const options = getTextMessageOptions(groupTextMessage({ replyCount: 0 }), context());
    expect(find(options)).toBeDefined();
  });

  it('is offered in a 1:1 chat too', () => {
    const dm = buildTextMessage({
      id: PARENT_ID,
      receiverType: 'user',
      receiverId: 'user-2',
    }) as unknown as CometChat.BaseMessage;
    const options = getTextMessageOptions(dm, context({ group: undefined }));
    expect(find(options)).toBeDefined();
  });

  it('is hidden by hideThreadSubscriptionOption', () => {
    const options = getTextMessageOptions(
      groupTextMessage(),
      context({ hideThreadSubscriptionOption: true })
    );
    expect(find(options)).toBeUndefined();
  });

  it('stays available on a reply, unlike "Reply in Thread"', () => {
    const reply = groupTextMessage({ id: 501, parentMessageId: PARENT_ID });
    const ids = getTextMessageOptions(reply, context()).map(o => o.id);
    expect(ids).toContain(MESSAGE_OPTION_IDS.threadSubscription);
    expect(ids).not.toContain(MESSAGE_OPTION_IDS.replyInThread);
  });
});

describe('threadSubscription option — title and icon flip on state', () => {
  it('offers "Subscribe to thread" when the message is not followed', () => {
    const option = find(getTextMessageOptions(groupTextMessage(), context()));
    expect(option?.title).toBe('Subscribe to thread');
  });

  it('offers "Unsubscribe from thread" when the message is followed', () => {
    const option = find(
      getTextMessageOptions(groupTextMessage({ threadSubscribed: true }), context())
    );
    expect(option?.title).toBe('Unsubscribe from thread');
  });

  it('shows the un-followed title for a message that carries no flag', () => {
    const option = find(getTextMessageOptions(groupTextMessage(), context()));
    expect(option?.title).toBe('Subscribe to thread');
  });

  it('uses different icons for the two states', () => {
    const off = find(getTextMessageOptions(groupTextMessage(), context()))?.iconURL;
    const on = find(
      getTextMessageOptions(groupTextMessage({ threadSubscribed: true }), context())
    )?.iconURL;
    expect(off).toBeDefined();
    expect(on).not.toBe(off);
  });

  it('uses the localized strings when available', () => {
    const option = find(
      getTextMessageOptions(
        groupTextMessage(),
        context({ getLocalizedString: () => 'Benachrichtigen' })
      )
    );
    expect(option?.title).toBe('Benachrichtigen');
  });
});

describe('threadSubscription option — the reactive context overrides the message flag', () => {
  // Regression: the option used to read the SDK store directly, which lagged the
  // optimistic flip by one action. It now reads the list's reactive value first,
  // and only falls back to the message's own flag — so the label is never behind.
  it('shows the followed label while the message flag still says not-subscribed', () => {
    const option = find(
      getTextMessageOptions(
        groupTextMessage({ threadSubscribed: false }),
        context({ isThreadSubscribed: true })
      )
    );
    expect(option?.title).toBe('Unsubscribe from thread');
  });

  it('shows the un-followed label while the message flag still says subscribed', () => {
    const option = find(
      getTextMessageOptions(
        groupTextMessage({ threadSubscribed: true }),
        context({ isThreadSubscribed: false })
      )
    );
    expect(option?.title).toBe('Subscribe to thread');
  });

  it('acts on the value the user saw, not a fresh message read', async () => {
    // Optimistically followed, the message flag not yet updated: tapping again
    // must unsubscribe.
    const option = find(
      getTextMessageOptions(
        groupTextMessage({ threadSubscribed: false }),
        context({ isThreadSubscribed: true })
      )
    );
    option?.onClick(groupTextMessage());

    await vi.waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalledWith(PARENT_ID);
    });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('falls back to the message flag when the list does not supply the value', () => {
    const option = find(
      getTextMessageOptions(groupTextMessage({ threadSubscribed: true }), context())
    );
    expect(option?.title).toBe('Unsubscribe from thread');
  });
});

describe('threadSubscription option — click', () => {
  it('subscribes the message itself when it is a parent', async () => {
    const option = find(getTextMessageOptions(groupTextMessage(), context()));
    option?.onClick(groupTextMessage());
    await vi.waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(PARENT_ID);
    });
  });

  it('subscribes the PARENT when clicked on a reply', async () => {
    const reply = groupTextMessage({ id: 501, parentMessageId: PARENT_ID });
    const option = find(getTextMessageOptions(reply, context()));
    option?.onClick(reply);
    await vi.waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(PARENT_ID);
    });
    expect(mockSubscribe).not.toHaveBeenCalledWith(501);
  });

  it('unsubscribes when already following', async () => {
    const followed = groupTextMessage({ threadSubscribed: true });
    const option = find(getTextMessageOptions(followed, context()));
    option?.onClick(followed);
    await vi.waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalledWith(PARENT_ID);
    });
  });

  it('publishes the optimistic flip so the header bell agrees', async () => {
    const publish = vi.fn();
    const option = find(getTextMessageOptions(groupTextMessage(), context({ publish })));
    option?.onClick(groupTextMessage());
    await vi.waitFor(() => {
      expect(publish).toHaveBeenCalledWith({
        type: 'ui:thread/subscription-changed',
        parentMessageId: PARENT_ID,
        subscribed: true,
      });
    });
  });
});
