import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getBatchId,
  getAudioType,
  isVoiceNote,
  stampBatchMetadata,
} from '../CometChatMetadataUtils';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

/**
 * Minimal mock media message exposing the getters/setters the metadata helpers
 * read and write. Mirrors the SDK MediaMessage shape (metadata + caption + type)
 * without being a real SDK instance.
 */
function mockMediaMessage(
  overrides: {
    type?: string;
    metadata?: Record<string, unknown> | null;
    caption?: string;
    withMetadataGetter?: boolean;
  } = {}
) {
  const type = overrides.type ?? 'image';
  let metadata: Record<string, unknown> | null =
    overrides.metadata === undefined ? {} : overrides.metadata;
  let caption = overrides.caption ?? '';

  const message: Record<string, unknown> = {
    getType: () => type,
    getCaption: () => caption,
    setCaption: (text: string) => {
      caption = text;
    },
    setMetadata: (next: Record<string, unknown>) => {
      metadata = next;
    },
  };

  // Some legacy/edge messages may not expose getMetadata at all.
  if (overrides.withMetadataGetter !== false) {
    message.getMetadata = () => metadata;
  }

  return message as unknown as CometChat.MediaMessage;
}

const BATCH_KEY = CometChatUIKitConstants.MetadataKeys.batchId;
const AUDIO_KEY = CometChatUIKitConstants.MetadataKeys.audioType;
const VOICE_NOTE = CometChatUIKitConstants.AudioType.voiceNote;

describe('getBatchId', () => {
  it('reads batchId from metadata', () => {
    const message = mockMediaMessage({ metadata: { [BATCH_KEY]: 'batch-123' } });
    expect(getBatchId(message)).toBe('batch-123');
  });

  it('returns undefined when metadata has no batchId', () => {
    const message = mockMediaMessage({ metadata: { fileName: 'a.png' } });
    expect(getBatchId(message)).toBeUndefined();
  });

  it('returns undefined when metadata is empty', () => {
    expect(getBatchId(mockMediaMessage({ metadata: {} }))).toBeUndefined();
  });

  it('returns undefined when metadata is null', () => {
    expect(getBatchId(mockMediaMessage({ metadata: null }))).toBeUndefined();
  });

  it('returns undefined for a null message', () => {
    expect(getBatchId(null)).toBeUndefined();
  });

  it('returns undefined for an undefined message', () => {
    expect(getBatchId(undefined)).toBeUndefined();
  });

  it('returns undefined when getMetadata is not a function', () => {
    const message = mockMediaMessage({ withMetadataGetter: false });
    expect(getBatchId(message)).toBeUndefined();
  });

  it('returns undefined when batchId is not a string', () => {
    const message = mockMediaMessage({ metadata: { [BATCH_KEY]: 42 } });
    expect(getBatchId(message)).toBeUndefined();
  });
});

describe('getAudioType', () => {
  it('reads audioType from metadata', () => {
    const message = mockMediaMessage({ type: 'audio', metadata: { [AUDIO_KEY]: VOICE_NOTE } });
    expect(getAudioType(message)).toBe(VOICE_NOTE);
  });

  it('returns undefined when audioType is absent', () => {
    const message = mockMediaMessage({ type: 'audio', metadata: {} });
    expect(getAudioType(message)).toBeUndefined();
  });

  it('returns undefined for a null message', () => {
    expect(getAudioType(null)).toBeUndefined();
  });
});

describe('isVoiceNote', () => {
  it('is true only when audioType is explicitly the voice-note tag', () => {
    const message = mockMediaMessage({ type: 'audio', metadata: { [AUDIO_KEY]: VOICE_NOTE } });
    expect(isVoiceNote(message)).toBe(true);
  });

  it('is false for an audio message with no audioType (absence => normal audio bubble)', () => {
    const message = mockMediaMessage({ type: 'audio', metadata: {} });
    expect(isVoiceNote(message)).toBe(false);
  });

  it('is false for an attached audio file with a non-voicenote audioType', () => {
    const message = mockMediaMessage({ type: 'audio', metadata: { [AUDIO_KEY]: 'audiofile' } });
    expect(isVoiceNote(message)).toBe(false);
  });

  it('is false for a non-audio message with no audioType', () => {
    const message = mockMediaMessage({ type: 'image', metadata: {} });
    expect(isVoiceNote(message)).toBe(false);
  });

  it('is false for a null message', () => {
    expect(isVoiceNote(null)).toBe(false);
  });
});

describe('stampBatchMetadata', () => {
  it('sets the batchId in metadata', () => {
    const message = mockMediaMessage({ metadata: {} });
    stampBatchMetadata(message, { batchId: 'batch-1' });
    expect((message.getMetadata() as Record<string, unknown>)[BATCH_KEY]).toBe('batch-1');
  });

  it('preserves existing metadata keys', () => {
    const message = mockMediaMessage({
      metadata: {
        file: 'file-obj',
        fileName: 'photo.png',
        fileType: 'image/png',
        fileSize: 2048,
        richText: '<p>hi</p>',
      },
    });

    stampBatchMetadata(message, { batchId: 'batch-9' });

    const result = message.getMetadata() as Record<string, unknown>;
    expect(result).toMatchObject({
      file: 'file-obj',
      fileName: 'photo.png',
      fileType: 'image/png',
      fileSize: 2048,
      richText: '<p>hi</p>',
      [BATCH_KEY]: 'batch-9',
    });
  });

  it('sets audioType when provided', () => {
    const message = mockMediaMessage({ type: 'audio', metadata: {} });
    stampBatchMetadata(message, { batchId: 'batch-2', audioType: VOICE_NOTE });
    expect((message.getMetadata() as Record<string, unknown>)[AUDIO_KEY]).toBe(VOICE_NOTE);
  });

  it('does not set audioType when omitted', () => {
    const message = mockMediaMessage({ metadata: {} });
    stampBatchMetadata(message, { batchId: 'batch-3' });
    expect(AUDIO_KEY in (message.getMetadata() as Record<string, unknown>)).toBe(false);
  });

  it('sets caption via setCaption when provided', () => {
    const message = mockMediaMessage({ metadata: {} });
    stampBatchMetadata(message, { batchId: 'batch-4', caption: 'look at this' });
    expect(message.getCaption()).toBe('look at this');
  });

  it('does not overwrite caption when omitted', () => {
    const message = mockMediaMessage({ metadata: {}, caption: 'original' });
    stampBatchMetadata(message, { batchId: 'batch-5' });
    expect(message.getCaption()).toBe('original');
  });

  it('treats null existing metadata as empty and still stamps batchId', () => {
    const message = mockMediaMessage({ metadata: null });
    stampBatchMetadata(message, { batchId: 'batch-6' });
    expect((message.getMetadata() as Record<string, unknown>)[BATCH_KEY]).toBe('batch-6');
  });
});
