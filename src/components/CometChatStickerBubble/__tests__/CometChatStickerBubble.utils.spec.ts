import { describe, it, expect } from 'vitest';
import { extractStickerUrl, extractStickerName } from '../CometChatStickerBubble.utils';

function mockMsg(metadata: unknown, customData?: unknown) {
  return {
    getMetadata: () => metadata,
    getCustomData: () => customData ?? {},
  } as never;
}

describe('extractStickerUrl', () => {
  it('extracts from metadata.data.sticker_url (priority 1)', () => {
    expect(extractStickerUrl(mockMsg({ data: { sticker_url: 'url1' } }))).toBe('url1');
  });

  it('extracts from metadata.sticker_url (priority 2)', () => {
    expect(extractStickerUrl(mockMsg({ sticker_url: 'url2' }))).toBe('url2');
  });

  it('extracts from customData.sticker_url (priority 3)', () => {
    expect(extractStickerUrl(mockMsg({}, { sticker_url: 'url3' }))).toBe('url3');
  });

  it('priority 1 wins over priority 2', () => {
    expect(extractStickerUrl(mockMsg({ data: { sticker_url: 'url1' }, sticker_url: 'url2' }))).toBe(
      'url1'
    );
  });

  it('returns empty string for null message', () => {
    expect(extractStickerUrl(null)).toBe('');
  });

  it('returns empty string when no URL found', () => {
    expect(extractStickerUrl(mockMsg({}, {}))).toBe('');
  });
});

describe('extractStickerName', () => {
  it('extracts name from customData', () => {
    expect(extractStickerName(mockMsg({}, { sticker_name: 'Cool' }))).toBe('Cool');
  });

  it('returns default for missing name', () => {
    expect(extractStickerName(mockMsg({}, {}))).toBe('Sticker');
  });

  it('returns default for null message', () => {
    expect(extractStickerName(null)).toBe('Sticker');
  });
});
