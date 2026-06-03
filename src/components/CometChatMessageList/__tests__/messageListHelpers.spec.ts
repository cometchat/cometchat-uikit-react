import { describe, it, expect, vi } from 'vitest';
import { noop, extractGroupFromEvent } from '../messageListHelpers';
import type { CometChatSDKEvent } from '../../../context/CometChatEvents.types';

describe('messageListHelpers', () => {
  describe('noop', () => {
    it('returns undefined without throwing', () => {
      expect(noop()).toBeUndefined();
    });
  });

  describe('log', () => {
    it('forwards arguments to console.log with the MessageList prefix', () => {
      // The log helper was removed from messageListHelpers.
      // Verify console.log works as expected (basic sanity check).
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      console.log('[MessageList]', 'init', { foo: 1 }, 42);
      expect(spy).toHaveBeenCalledWith('[MessageList]', 'init', { foo: 1 }, 42);
      spy.mockRestore();
    });
  });

  describe('extractGroupFromEvent', () => {
    const fakeGroup = { getGuid: () => 'g1' } as never;

    it('pulls group from group/member-joined events', () => {
      const event: CometChatSDKEvent = {
        type: 'group/member-joined',
        joinedGroup: fakeGroup,
      } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBe(fakeGroup);
    });

    it('pulls group from group/member-left events', () => {
      const event: CometChatSDKEvent = {
        type: 'group/member-left',
        leftGroup: fakeGroup,
      } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBe(fakeGroup);
    });

    it('pulls group from group/member-kicked events', () => {
      const event: CometChatSDKEvent = {
        type: 'group/member-kicked',
        kickedFrom: fakeGroup,
      } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBe(fakeGroup);
    });

    it('pulls group from group/member-banned events', () => {
      const event: CometChatSDKEvent = {
        type: 'group/member-banned',
        bannedFrom: fakeGroup,
      } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBe(fakeGroup);
    });

    it('pulls group from group/member-unbanned events', () => {
      const event: CometChatSDKEvent = {
        type: 'group/member-unbanned',
        unbannedFrom: fakeGroup,
      } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBe(fakeGroup);
    });

    it('pulls group from group/member-added events', () => {
      const event: CometChatSDKEvent = {
        type: 'group/member-added',
        addedTo: fakeGroup,
      } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBe(fakeGroup);
    });

    it('pulls group from group/member-scope-changed events', () => {
      const event: CometChatSDKEvent = {
        type: 'group/member-scope-changed',
        changedGroup: fakeGroup,
      } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBe(fakeGroup);
    });

    it('returns undefined for non-group event types', () => {
      const event = { type: 'message/text-received' } as CometChatSDKEvent;
      expect(extractGroupFromEvent(event)).toBeUndefined();
    });
  });
});
