/**
 * Unit tests for CometChatSearchFilterUtils — pure filter logic.
 *
 * No mocking needed. These are pure functions.
 */
import { describe, it, expect } from 'vitest';
import {
  isConversationFilter,
  isMessageFilter,
  getAvailableFilters,
  getVisibleFilters,
  toggleFilter,
  shouldRenderConversations,
  shouldRenderMessages,
  hasValidSearchCriteria,
  hasValidMessageSearchCriteria,
} from '../CometChatSearchFilterUtils';
import type { CometChatSearchFilter } from '../CometChatSearch.types';

describe('CometChatSearchFilterUtils', () => {
  describe('isConversationFilter', () => {
    it('returns true for conversation-type filters', () => {
      expect(isConversationFilter('conversations')).toBe(true);
      expect(isConversationFilter('unread')).toBe(true);
      expect(isConversationFilter('groups')).toBe(true);
    });

    it('returns false for message-type filters', () => {
      expect(isConversationFilter('photos')).toBe(false);
      expect(isConversationFilter('videos')).toBe(false);
      expect(isConversationFilter('files')).toBe(false);
      expect(isConversationFilter('audio')).toBe(false);
      expect(isConversationFilter('links')).toBe(false);
      expect(isConversationFilter('messages')).toBe(false);
    });
  });

  describe('isMessageFilter', () => {
    it('returns true for message-type filters', () => {
      expect(isMessageFilter('messages')).toBe(true);
      expect(isMessageFilter('photos')).toBe(true);
      expect(isMessageFilter('videos')).toBe(true);
      expect(isMessageFilter('files')).toBe(true);
      expect(isMessageFilter('audio')).toBe(true);
      expect(isMessageFilter('links')).toBe(true);
    });

    it('returns false for conversation-type filters', () => {
      expect(isMessageFilter('conversations')).toBe(false);
      expect(isMessageFilter('unread')).toBe(false);
      expect(isMessageFilter('groups')).toBe(false);
    });
  });

  describe('getAvailableFilters', () => {
    const allFilters: CometChatSearchFilter[] = [
      'audio',
      'files',
      'groups',
      'photos',
      'videos',
      'links',
      'unread',
      'messages',
      'conversations',
    ];

    it('returns all filters when searchIn is empty (both scopes)', () => {
      const result = getAvailableFilters([], allFilters);
      expect(result).toContain('audio');
      expect(result).toContain('groups');
      expect(result).toContain('unread');
      expect(result).toContain('messages');
    });

    it('returns only conversation filters when searchIn is ["conversations"]', () => {
      const result = getAvailableFilters(['conversations'], allFilters);
      expect(result).toContain('conversations');
      expect(result).toContain('unread');
      expect(result).toContain('groups');
      expect(result).not.toContain('photos');
      expect(result).not.toContain('videos');
      expect(result).not.toContain('messages');
    });

    it('returns only message filters when searchIn is ["messages"]', () => {
      const result = getAvailableFilters(['messages'], allFilters);
      expect(result).toContain('messages');
      expect(result).toContain('photos');
      expect(result).toContain('videos');
      expect(result).toContain('files');
      expect(result).toContain('audio');
      expect(result).toContain('links');
      expect(result).not.toContain('conversations');
      expect(result).not.toContain('unread');
      expect(result).not.toContain('groups');
    });

    it('filters out items not in the searchFilters list', () => {
      const result = getAvailableFilters([], ['photos', 'videos']);
      expect(result).toEqual(['photos', 'videos']);
    });

    it('returns empty array when no filters match the scope', () => {
      const result = getAvailableFilters(['conversations'], ['photos', 'videos']);
      expect(result).toEqual([]);
    });
  });

  describe('getVisibleFilters', () => {
    const available: CometChatSearchFilter[] = [
      'audio',
      'files',
      'groups',
      'photos',
      'videos',
      'links',
      'unread',
      'messages',
    ];

    it('returns all available filters when no active filters', () => {
      const result = getVisibleFilters(available, []);
      expect(result).toEqual(available);
    });

    it('hides conversation filters when uid is provided', () => {
      const result = getVisibleFilters(available, [], 'user-1');
      expect(result).not.toContain('groups');
      expect(result).not.toContain('unread');
      expect(result).toContain('photos');
    });

    it('hides conversation filters when guid is provided', () => {
      const result = getVisibleFilters(available, [], undefined, 'group-1');
      expect(result).not.toContain('groups');
      expect(result).not.toContain('unread');
      expect(result).toContain('photos');
    });

    it('shows only message filters when "messages" is active', () => {
      const result = getVisibleFilters(available, ['messages']);
      result.forEach(f => {
        expect(isMessageFilter(f)).toBe(true);
      });
    });

    it('shows messages + content filters when both are active', () => {
      const result = getVisibleFilters(available, ['messages', 'photos']);
      expect(result).toContain('messages');
      expect(result).toContain('photos');
      expect(result).not.toContain('videos');
    });

    it('shows only selected content filters when content filter is active without messages', () => {
      const result = getVisibleFilters(available, ['photos']);
      expect(result).toContain('photos');
      expect(result).not.toContain('videos');
      expect(result).not.toContain('messages');
    });

    it('shows all conversation filters when a conversation filter is active', () => {
      const result = getVisibleFilters(available, ['unread'], undefined, undefined, []);
      expect(result).toContain('groups');
      expect(result).toContain('unread');
      expect(result).not.toContain('photos');
    });
  });

  describe('toggleFilter', () => {
    it('adds a filter when not present', () => {
      const result = toggleFilter([], 'photos');
      expect(result).toEqual(['photos']);
    });

    it('removes a filter when already present', () => {
      const result = toggleFilter(['photos', 'videos'], 'photos');
      expect(result).toEqual(['videos']);
    });

    it('preserves other filters when toggling', () => {
      const result = toggleFilter(['photos', 'videos', 'audio'], 'videos');
      expect(result).toEqual(['photos', 'audio']);
    });

    it('returns empty array when removing the only filter', () => {
      const result = toggleFilter(['photos'], 'photos');
      expect(result).toEqual([]);
    });
  });

  describe('shouldRenderConversations', () => {
    it('returns true when searchText is present and no filters active (both scopes)', () => {
      expect(shouldRenderConversations('hello', [], [])).toBe(true);
    });

    it('returns false when scope is messages only', () => {
      expect(shouldRenderConversations('hello', [], ['messages'])).toBe(false);
    });

    it('returns false when uid is provided', () => {
      expect(shouldRenderConversations('hello', [], [], 'user-1')).toBe(false);
    });

    it('returns false when guid is provided', () => {
      expect(shouldRenderConversations('hello', [], [], undefined, 'group-1')).toBe(false);
    });

    it('returns true when a conversation filter is active', () => {
      expect(shouldRenderConversations('', ['unread'], [])).toBe(true);
    });

    it('returns false when only message filters are active', () => {
      expect(shouldRenderConversations('', ['photos'], [])).toBe(false);
    });

    it('returns false when searchText is empty and no filters', () => {
      expect(shouldRenderConversations('', [], [])).toBe(false);
    });
  });

  describe('shouldRenderMessages', () => {
    it('returns true when searchText is present and no filters active (both scopes)', () => {
      expect(shouldRenderMessages('hello', [], [])).toBe(true);
    });

    it('returns false when scope is conversations only', () => {
      expect(shouldRenderMessages('hello', [], ['conversations'])).toBe(false);
    });

    it('returns true when uid is provided (regardless of text)', () => {
      expect(shouldRenderMessages('', [], [], 'user-1')).toBe(true);
    });

    it('returns true when guid is provided (regardless of text)', () => {
      expect(shouldRenderMessages('', [], [], undefined, 'group-1')).toBe(true);
    });

    it('returns false when conversation filters are active', () => {
      expect(shouldRenderMessages('', ['unread'], [])).toBe(false);
    });

    it('returns false when searchText is empty and no filters and no uid/guid', () => {
      expect(shouldRenderMessages('', [], [])).toBe(false);
    });
  });

  describe('hasValidSearchCriteria', () => {
    it('returns true when keyword is non-empty', () => {
      expect(hasValidSearchCriteria('hello', [])).toBe(true);
    });

    it('returns true when all filters are conversation filters', () => {
      expect(hasValidSearchCriteria('', ['unread', 'groups'])).toBe(true);
    });

    it('returns false when keyword is empty and no filters', () => {
      expect(hasValidSearchCriteria('', [])).toBe(false);
    });

    it('returns false when keyword is whitespace only and no filters', () => {
      expect(hasValidSearchCriteria('   ', [])).toBe(false);
    });

    it('returns false when filters include non-conversation filters', () => {
      expect(hasValidSearchCriteria('', ['photos'])).toBe(false);
    });
  });

  describe('hasValidMessageSearchCriteria', () => {
    it('returns true when uid is provided', () => {
      expect(hasValidMessageSearchCriteria('', [], 'user-1')).toBe(true);
    });

    it('returns true when guid is provided', () => {
      expect(hasValidMessageSearchCriteria('', [], undefined, 'group-1')).toBe(true);
    });

    it('returns true when keyword is non-empty', () => {
      expect(hasValidMessageSearchCriteria('hello', [])).toBe(true);
    });

    it('returns true when message filters are active', () => {
      expect(hasValidMessageSearchCriteria('', ['photos'])).toBe(true);
    });

    it('returns false when keyword is empty, no uid/guid, and no filters', () => {
      expect(hasValidMessageSearchCriteria('', [])).toBe(false);
    });

    it('returns false when only conversation filters are active (no uid/guid/keyword)', () => {
      expect(hasValidMessageSearchCriteria('', ['unread'])).toBe(false);
    });
  });
});
