/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Unit tests for CometChatSearchMessagesManager.
 *
 * Tests SDK call orchestration for message search.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

import { CometChatSearchMessagesManager } from '../CometChatSearchMessagesManager';

// Mock the MessagesRequestBuilder and MessagesRequest
const mockFetchPrevious = vi.fn();
const mockBuild = vi.fn().mockReturnValue({ fetchPrevious: mockFetchPrevious });
const mockSetLimit = vi.fn().mockReturnThis();
const mockSetSearchKeyword = vi.fn().mockReturnThis();
const mockSetUID = vi.fn().mockReturnThis();
const mockSetGUID = vi.fn().mockReturnThis();
const mockHideDeletedMessages = vi.fn().mockReturnThis();
const mockSetAttachmentTypes = vi.fn().mockReturnThis();
const mockHasLinks = vi.fn().mockReturnThis();

beforeEach(() => {
  vi.clearAllMocks();

  mockCometChat.MessagesRequestBuilder = vi.fn().mockImplementation(() => ({
    setLimit: mockSetLimit,
    setSearchKeyword: mockSetSearchKeyword,
    setUID: mockSetUID,
    setGUID: mockSetGUID,
    hideDeletedMessages: mockHideDeletedMessages,
    setAttachmentTypes: mockSetAttachmentTypes,
    hasLinks: mockHasLinks,
    build: mockBuild,
  }));

  mockCometChat.AttachmentType = {
    IMAGE: 'image',
    VIDEO: 'video',
    FILE: 'file',
    AUDIO: 'audio',
  };
});

describe('CometChatSearchMessagesManager', () => {
  describe('search', () => {
    it('builds a request and fetches results', async () => {
      const mockMessages = [
        { getId: () => 1, getType: () => 'text' },
        { getId: () => 2, getType: () => 'text' },
      ];
      mockFetchPrevious.mockResolvedValueOnce(mockMessages);

      const manager = new CometChatSearchMessagesManager();
      const result = await manager.search('hello', [], undefined, undefined);

      expect(mockCometChat.MessagesRequestBuilder).toHaveBeenCalled();
      expect(mockFetchPrevious).toHaveBeenCalledOnce();
      expect(result.results).toHaveLength(2);
    });

    it('reverses the results from fetchPrevious', async () => {
      const mockMessages = [
        { getId: () => 1, text: 'first' },
        { getId: () => 2, text: 'second' },
        { getId: () => 3, text: 'third' },
      ];
      mockFetchPrevious.mockResolvedValueOnce(mockMessages);

      const manager = new CometChatSearchMessagesManager();
      const result = await manager.search('hello', []);

      // Results should be reversed (fetchPrevious returns newest first)
      expect(result.results[0].text).toBe('third');
      expect(result.results[1].text).toBe('second');
      expect(result.results[2].text).toBe('first');
    });

    it('sets hasMore to true when results length equals limit', async () => {
      const mockMessages = Array.from({ length: 30 }, (_, i) => ({ getId: () => i }));
      mockFetchPrevious.mockResolvedValueOnce(mockMessages);

      const manager = new CometChatSearchMessagesManager();
      const result = await manager.search('hello', []);

      expect(result.hasMore).toBe(true);
    });

    it('sets hasMore to false when results length is less than limit', async () => {
      const mockMessages = [{ getId: () => 1 }];
      mockFetchPrevious.mockResolvedValueOnce(mockMessages);

      const manager = new CometChatSearchMessagesManager();
      const result = await manager.search('hello', []);

      expect(result.hasMore).toBe(false);
    });

    it('sets search keyword on the builder', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('test query', []);

      expect(mockSetSearchKeyword).toHaveBeenCalledWith('test query');
    });

    it('sets UID on the builder when uid is provided', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('hello', [], 'user-123');

      expect(mockSetUID).toHaveBeenCalledWith('user-123');
    });

    it('sets GUID on the builder when guid is provided', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('hello', [], undefined, 'group-456');

      expect(mockSetGUID).toHaveBeenCalledWith('group-456');
    });

    it('uses limit of 3 when alwaysShowSeeMore is true', async () => {
      const mockMessages = Array.from({ length: 3 }, (_, i) => ({ getId: () => i }));
      mockFetchPrevious.mockResolvedValueOnce(mockMessages);

      const manager = new CometChatSearchMessagesManager();
      const result = await manager.search('hello', [], undefined, undefined, true);

      expect(result.hasMore).toBe(true);
    });

    it('sets attachment type for photos filter', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('', ['photos']);

      expect(mockSetAttachmentTypes).toHaveBeenCalledWith(['image']);
    });

    it('sets attachment type for videos filter', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('', ['videos']);

      expect(mockSetAttachmentTypes).toHaveBeenCalledWith(['video']);
    });

    it('sets attachment type for files filter', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('', ['files']);

      expect(mockSetAttachmentTypes).toHaveBeenCalledWith(['file']);
    });

    it('sets attachment type for audio filter', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('', ['audio']);

      expect(mockSetAttachmentTypes).toHaveBeenCalledWith(['audio']);
    });

    it('sets hasLinks for links filter', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('', ['links']);

      expect(mockHasLinks).toHaveBeenCalledWith(true);
    });

    it('hides deleted messages', async () => {
      mockFetchPrevious.mockResolvedValueOnce([]);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('hello', []);

      expect(mockHideDeletedMessages).toHaveBeenCalledWith(true);
    });
  });

  describe('loadMore', () => {
    it('fetches the next page of results', async () => {
      const firstPage = Array.from({ length: 30 }, (_, i) => ({ getId: () => i }));
      const secondPage = [{ getId: () => 31 }, { getId: () => 32 }];
      mockFetchPrevious.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('hello', []);
      const result = await manager.loadMore();

      expect(mockFetchPrevious).toHaveBeenCalledTimes(2);
      expect(result.results).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty results when no search request exists', async () => {
      const manager = new CometChatSearchMessagesManager();
      const result = await manager.loadMore();

      expect(result.results).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('prevents concurrent loadMore calls', async () => {
      const firstPage = Array.from({ length: 30 }, (_, i) => ({ getId: () => i }));
      mockFetchPrevious
        .mockResolvedValueOnce(firstPage)
        .mockImplementationOnce(
          () => new Promise(resolve => setTimeout(() => resolve([{ getId: () => 31 }]), 100))
        );

      const manager = new CometChatSearchMessagesManager();
      await manager.search('hello', []);

      // Start two loadMore calls simultaneously
      const [result1, result2] = await Promise.all([manager.loadMore(), manager.loadMore()]);

      // Second call should return empty (isLoadingMore guard)
      expect(result2.results).toEqual([]);
      expect(result2.hasMore).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears the search request state', async () => {
      const mockMessages = Array.from({ length: 30 }, (_, i) => ({ getId: () => i }));
      mockFetchPrevious.mockResolvedValueOnce(mockMessages);

      const manager = new CometChatSearchMessagesManager();
      await manager.search('hello', []);
      manager.reset();

      // After reset, loadMore should return empty
      const result = await manager.loadMore();
      expect(result.results).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });
});
