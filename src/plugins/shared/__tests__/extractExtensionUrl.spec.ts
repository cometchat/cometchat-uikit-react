import { describe, it, expect } from 'vitest';
import { extractExtensionUrl } from '../extractExtensionUrl';

function mockMsg(metadata: unknown) {
  return { getMetadata: () => metadata } as any;
}

describe('extractExtensionUrl', () => {
  it('extracts URL from valid metadata path', () => {
    const msg = mockMsg({
      '@injected': { extensions: { document: { document_url: 'https://doc.example.com' } } },
    });
    expect(extractExtensionUrl(msg, 'document', 'document_url')).toBe('https://doc.example.com');
  });

  it('extracts whiteboard URL', () => {
    const msg = mockMsg({
      '@injected': { extensions: { whiteboard: { board_url: 'https://wb.example.com' } } },
    });
    expect(extractExtensionUrl(msg, 'whiteboard', 'board_url')).toBe('https://wb.example.com');
  });

  it('returns empty string for null message', () => {
    expect(extractExtensionUrl(null, 'document', 'document_url')).toBe('');
  });

  it('returns empty string for missing metadata', () => {
    expect(extractExtensionUrl(mockMsg(null), 'document', 'document_url')).toBe('');
  });

  it('returns empty string for missing @injected', () => {
    expect(extractExtensionUrl(mockMsg({}), 'document', 'document_url')).toBe('');
  });

  it('returns empty string for missing extensions', () => {
    expect(extractExtensionUrl(mockMsg({ '@injected': {} }), 'document', 'document_url')).toBe('');
  });

  it('returns empty string for missing extension key', () => {
    expect(
      extractExtensionUrl(mockMsg({ '@injected': { extensions: {} } }), 'document', 'document_url')
    ).toBe('');
  });

  it('returns empty string for missing URL key', () => {
    expect(
      extractExtensionUrl(
        mockMsg({ '@injected': { extensions: { document: {} } } }),
        'document',
        'document_url'
      )
    ).toBe('');
  });

  it('returns empty string for non-string URL', () => {
    expect(
      extractExtensionUrl(
        mockMsg({ '@injected': { extensions: { document: { document_url: 123 } } } }),
        'document',
        'document_url'
      )
    ).toBe('');
  });
});
