import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { isVoiceNote } from '../../../utils/CometChatMetadataUtils';
import { buildUser } from '../../../testing/mock-builders';

// --- Message builders ---

function buildAudioMsg(metadata: Record<string, unknown> = {}): CometChat.BaseMessage {
  return {
    getId: () => 1,
    getType: () => 'audio',
    getCategory: () => 'message',
    getSender: () => buildUser({ name: 'User' }) as unknown as CometChat.User,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => 'muid-1',
    getCaption: () => '',
    getData: () => ({}),
    getAttachments: () => [
      { url: 'https://example.com/a.mp3', getUrl: () => 'https://example.com/a.mp3' },
    ],
    getMentionedUsers: () => [],
    getMetadata: () => metadata,
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

describe('Audio routing by audioType (Property 9)', () => {
  it('routes to VoiceNoteBubble when audioType === "voice_note"', () => {
    const msg = buildAudioMsg({ audioType: 'voice_note' });
    expect(isVoiceNote(msg)).toBe(true);
  });

  it('routes to AudiosBubble when audioType is absent (absence !== voice note)', () => {
    const msg = buildAudioMsg({});
    expect(isVoiceNote(msg)).toBe(false);
  });

  it('routes to AudiosBubble when audioType is "attachment"', () => {
    const msg = buildAudioMsg({ audioType: 'attachment' });
    expect(isVoiceNote(msg)).toBe(false);
  });

  it('routes to AudiosBubble when audioType is any non-voicenote string', () => {
    const msg = buildAudioMsg({ audioType: 'music' });
    expect(isVoiceNote(msg)).toBe(false);
  });

  it('routes to AudiosBubble when metadata is null', () => {
    const msg = {
      getMetadata: () => null,
      getType: () => 'audio',
    } as unknown as CometChat.BaseMessage;
    expect(isVoiceNote(msg)).toBe(false);
  });
});
