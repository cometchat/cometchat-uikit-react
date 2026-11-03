/**
 * Unit tests for formatCaptionForPreview: the conversation-list preview of a
 * media caption keeps inline formatting only, resolves mentions and flattens
 * line breaks.
 */
import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { formatCaptionForPreview } from '../formatCaptionForPreview';

const user = (uid: string, name: string) =>
  ({ getUid: () => uid, getName: () => name }) as unknown as CometChat.User;
const me = user('me', 'Me');
const message = (mentioned: CometChat.User[] = []) =>
  ({ getMentionedUsers: () => mentioned }) as unknown as CometChat.BaseMessage;

describe('formatCaptionForPreview', () => {
  it('returns an empty string for no caption', () => {
    expect(formatCaptionForPreview('', message(), me)).toBe('');
  });

  it('keeps bold and italic inline and joins lines', () => {
    expect(formatCaptionForPreview('**Trip**\n_photos_ ', message(), me)).toBe(
      '<b>Trip</b> <i>photos</i>'
    );
  });

  it('drops block-level markdown such as headings and lists', () => {
    const preview = formatCaptionForPreview('# Day one\n- beach\n- dinner', message(), me);
    expect(preview).not.toMatch(/<(h\d|ul|ol|li)\b/);
    expect(preview).toContain('beach');
    expect(preview).not.toContain('\n');
  });

  it('shows mentioned users by name', () => {
    const preview = formatCaptionForPreview(
      'with <@uid:ann> at the beach',
      message([user('ann', 'Ann')]),
      me
    );
    expect(preview).toContain('@Ann');
    expect(preview).not.toContain('<@uid:ann>');
  });
});
