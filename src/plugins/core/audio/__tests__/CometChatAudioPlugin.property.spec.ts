/**
 * Property-based tests for audio routing by audioType.
 *
 * Feature: multi-attachments, Property 9: Audio routing by audioType
 * Validates: Requirements 7.1, 7.2, 7.3
 *
 * For any audio message:
 * - audioType === "voice_note" (the explicit tag) → VoiceNoteBubble (waveform)
 * - audioType absent OR any other value → AudiosBubble (row-based)
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isVoiceNote } from '../../../../utils/CometChatMetadataUtils';
import { CometChatUIKitConstants } from '../../../../constants/CometChatUIKitConstants';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const VOICE_NOTE = CometChatUIKitConstants.AudioType.voiceNote;

function buildAudioMessage(metadata: Record<string, unknown>): CometChat.BaseMessage {
  return {
    getId: () => 1,
    getType: () => 'audio',
    getCategory: () => 'message',
    getSender: () => ({ getName: () => 'User', getAvatar: () => '' }),
    getSentAt: () => 0,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => 'muid-1',
    getCaption: () => '',
    getData: () => ({}),
    getAttachments: () => [],
    getMentionedUsers: () => [],
    getMetadata: () => metadata,
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

describe('Feature: multi-attachments, Property 9: Audio routing by audioType', () => {
  it('the explicit voice-note tag always routes to VoiceNoteBubble', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Add random extra metadata keys
          extra: fc.string(),
        }),
        extra => {
          const msg = buildAudioMessage({ audioType: VOICE_NOTE, ...extra });
          expect(isVoiceNote(msg)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('absent audioType on audio message routes to AudiosBubble (absence !== voice note)', () => {
    fc.assert(
      fc.property(
        fc.record({
          someOtherKey: fc.string(),
        }),
        otherMeta => {
          const msg = buildAudioMessage(otherMeta);
          expect(isVoiceNote(msg)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('any value other than the voice-note tag routes to AudiosBubble', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s !== VOICE_NOTE),
        audioType => {
          const msg = buildAudioMessage({ audioType });
          expect(isVoiceNote(msg)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('null metadata on audio message routes to AudiosBubble', () => {
    const msg = {
      getMetadata: () => null,
      getType: () => 'audio',
    } as unknown as CometChat.BaseMessage;
    expect(isVoiceNote(msg)).toBe(false);
  });

  it('undefined metadata on audio message routes to AudiosBubble', () => {
    const msg = {
      getMetadata: () => undefined,
      getType: () => 'audio',
    } as unknown as CometChat.BaseMessage;
    expect(isVoiceNote(msg)).toBe(false);
  });

  it('for any string audioType: voice-note tag → true, else → false (universal)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(VOICE_NOTE),
          fc.string({ minLength: 1 }).filter(s => s !== VOICE_NOTE)
        ),
        audioType => {
          const msg = buildAudioMessage({ audioType });
          const result = isVoiceNote(msg);
          if (audioType === VOICE_NOTE) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
