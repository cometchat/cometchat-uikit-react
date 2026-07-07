import { describe, it, expect, beforeEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleWebsocketMessage,
  getStreamState,
  startStreamingMessage,
  stopStreamingMessage,
} from '../CometChatAIStreamingService';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

const { streamMessageTypes } = CometChatUIKitConstants;
const CHAT = 'u-stream-card';

interface CardEventFields {
  cardId: string;
  executionText?: string;
  card?: unknown;
}

function cardEvent(type: string, fields: CardEventFields): CometChat.AIAssistantBaseEvent {
  return {
    getType: () => type,
    getMessageId: () => 'run-1',
    getCardId: () => fields.cardId,
    getExecutionText: () => fields.executionText ?? '',
    getCard: () => fields.card,
  } as unknown as CometChat.AIAssistantBaseEvent;
}

/** Card events carry no typing delay, so the queue drains synchronously; flush a tick to be safe. */
async function dispatch(event: CometChat.AIAssistantBaseEvent): Promise<void> {
  handleWebsocketMessage(event, CHAT);
  await Promise.resolve();
}

describe('CometChatAIStreamingService — card lifecycle', () => {
  beforeEach(() => {
    stopStreamingMessage(CHAT);
    startStreamingMessage(CHAT, 'run-1');
  });

  it('card_start adds a loader entry (card = null) with executionText', async () => {
    await dispatch(
      cardEvent(streamMessageTypes.card_start, { cardId: 'c1', executionText: 'Building…' })
    );
    const { streamCards } = getStreamState(CHAT);
    expect(streamCards).toHaveLength(1);
    expect(streamCards[0]).toMatchObject({ cardId: 'c1', card: null, executionText: 'Building…' });
  });

  it('card replaces the loader in place, correlated by cardId', async () => {
    await dispatch(cardEvent(streamMessageTypes.card_start, { cardId: 'c1', executionText: 'X' }));
    await dispatch(cardEvent(streamMessageTypes.card, { cardId: 'c1', card: { version: '1.0' } }));
    const { streamCards } = getStreamState(CHAT);
    expect(streamCards).toHaveLength(1);
    expect(streamCards[0]?.card).toEqual({ version: '1.0' });
  });

  it('card_end is a no-op (entry unchanged)', async () => {
    await dispatch(cardEvent(streamMessageTypes.card_start, { cardId: 'c1' }));
    await dispatch(cardEvent(streamMessageTypes.card, { cardId: 'c1', card: { v: 1 } }));
    const before = getStreamState(CHAT).streamCards;
    await dispatch(cardEvent(streamMessageTypes.card_end, { cardId: 'c1' }));
    expect(getStreamState(CHAT).streamCards).toEqual(before);
  });

  it('supports multiple cards in a run, in arrival order', async () => {
    await dispatch(cardEvent(streamMessageTypes.card_start, { cardId: 'c1' }));
    await dispatch(cardEvent(streamMessageTypes.card_start, { cardId: 'c2' }));
    await dispatch(cardEvent(streamMessageTypes.card, { cardId: 'c2', card: { id: 2 } }));
    await dispatch(cardEvent(streamMessageTypes.card, { cardId: 'c1', card: { id: 1 } }));
    const ids = getStreamState(CHAT).streamCards.map(c => c.cardId);
    expect(ids).toEqual(['c1', 'c2']);
    expect(getStreamState(CHAT).streamCards.find(c => c.cardId === 'c1')?.card).toEqual({ id: 1 });
  });

  it('a card event without a prior start still creates an entry', async () => {
    await dispatch(cardEvent(streamMessageTypes.card, { cardId: 'solo', card: { ok: true } }));
    const { streamCards } = getStreamState(CHAT);
    expect(streamCards).toHaveLength(1);
    expect(streamCards[0]).toMatchObject({ cardId: 'solo', card: { ok: true } });
  });
});
