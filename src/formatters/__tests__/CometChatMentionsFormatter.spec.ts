import { describe, it, expect, beforeEach } from 'vitest';
import { CometChatMentionsFormatter } from '../CometChatMentionsFormatter';

describe('CometChatMentionsFormatter', () => {
  let formatter: CometChatMentionsFormatter;

  beforeEach(() => {
    formatter = new CometChatMentionsFormatter();
  });

  it('has id "mentions-formatter"', () => {
    expect(formatter.id).toBe('mentions-formatter');
  });

  it('has priority 20', () => {
    expect(formatter.priority).toBe(20);
  });

  it('format returns empty string for empty input', () => {
    expect(formatter.format('')).toBe('');
    expect(formatter.format(null as unknown as string)).toBe('');
  });

  it('format returns original text when no @mentions found', () => {
    expect(formatter.format('hello world')).toBe('hello world');
  });

  it('format wraps @mentions in styled spans when user matches', () => {
    const mockUser = { getUid: () => 'john123', getName: () => 'John' } as CometChat.User;
    formatter.setUsers([mockUser]);
    const result = formatter.format('Hello @John!');
    expect(result).toContain('cometchat-mentions');
    expect(result).toContain('@John');
    expect(result).toContain('data-uid="john123"');
  });

  it('format leaves unmatched @mentions as plain text', () => {
    const result = formatter.format('Hello @unknown');
    expect(result).toBe('Hello @unknown');
  });

  it('hasSdkMentions detects <@uid:xxx> format', () => {
    expect(formatter.hasSdkMentions('Hello <@uid:user123>')).toBe(true);
    expect(formatter.hasSdkMentions('Hello world')).toBe(false);
  });

  it('hasSdkMentions detects <@all:xxx> format', () => {
    expect(formatter.hasSdkMentions('Hello <@all:everyone>')).toBe(true);
  });

  it('formatSdkMentions handles <@uid:xxx> format', () => {
    const mockUser = { getUid: () => 'user123', getName: () => 'Alice' } as CometChat.User;
    const result = formatter.formatSdkMentions('Hello <@uid:user123>', [mockUser]);
    expect(result).toContain('@Alice');
    expect(result).toContain('cometchat-mentions');
    expect(result).toContain('data-uid="user123"');
  });

  it('formatSdkMentions handles <@all:xxx> format', () => {
    const result = formatter.formatSdkMentions('Hello <@all:everyone>', []);
    expect(result).toContain('@everyone');
    expect(result).toContain('cometchat-mentions-you');
    expect(result).toContain('data-mention-type="channel"');
  });

  it('self-mentions get cometchat-mentions-you class', () => {
    const loggedInUser = { getUid: () => 'me123', getName: () => 'Me' } as CometChat.User;
    formatter.setLoggedInUser(loggedInUser);
    const result = formatter.formatSdkMentions('Hello <@uid:me123>', [loggedInUser]);
    expect(result).toContain('cometchat-mentions-you');
  });

  it('other mentions get cometchat-mentions-other class', () => {
    const loggedInUser = { getUid: () => 'me123', getName: () => 'Me' } as CometChat.User;
    const otherUser = { getUid: () => 'other456', getName: () => 'Other' } as CometChat.User;
    formatter.setLoggedInUser(loggedInUser);
    const result = formatter.formatSdkMentions('Hello <@uid:other456>', [otherUser]);
    expect(result).toContain('cometchat-mentions-other');
  });

  it('applies incoming direction class when alignment is left', () => {
    formatter.setMessageBubbleAlignment('left');
    const mockUser = { getUid: () => 'user1', getName: () => 'User' } as CometChat.User;
    const result = formatter.formatSdkMentions('<@uid:user1>', [mockUser]);
    expect(result).toContain('cometchat-mentions-incoming');
  });

  it('applies outgoing direction class when alignment is right', () => {
    formatter.setMessageBubbleAlignment('right');
    const mockUser = { getUid: () => 'user1', getName: () => 'User' } as CometChat.User;
    const result = formatter.formatSdkMentions('<@uid:user1>', [mockUser]);
    expect(result).toContain('cometchat-mentions-outgoing');
  });

  it('escapes HTML in user names', () => {
    const mockUser = {
      getUid: () => 'xss',
      getName: () => '<script>alert(1)</script>',
    } as CometChat.User;
    const result = formatter.formatSdkMentions('<@uid:xss>', [mockUser]);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('formatSdkMentions removes empty uid mentions', () => {
    const result = formatter.formatSdkMentions('Hello <@uid:>', []);
    expect(result).toBe('Hello ');
  });

  it('getMentions returns detected mentions', () => {
    const mockUser = { getUid: () => 'u1', getName: () => 'User1' } as CometChat.User;
    formatter.formatSdkMentions('<@uid:u1>', [mockUser]);
    const mentions = formatter.getMentions();
    expect(mentions).toHaveLength(1);
    expect(mentions[0]?.uid).toBe('u1');
    expect(mentions[0]?.name).toBe('User1');
  });

  it('reset clears mentions', () => {
    const mockUser = { getUid: () => 'u1', getName: () => 'User1' } as CometChat.User;
    formatter.formatSdkMentions('<@uid:u1>', [mockUser]);
    expect(formatter.getMentions()).toHaveLength(1);
    formatter.reset();
    expect(formatter.getMentions()).toHaveLength(0);
  });
});

// Type import for test mocks
import type { CometChat } from '@cometchat/chat-sdk-javascript';
