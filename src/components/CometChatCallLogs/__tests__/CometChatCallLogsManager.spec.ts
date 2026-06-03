import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatCallLogsManager } from '../CometChatCallLogsManager';

const mockBuild = vi.fn();
const mockFetchNext = vi.fn();

vi.mock('../../../CometChatUIKit/CometChatCalls', () => ({
  CometChatUIKitCalls: {
    CallLogRequestBuilder: vi.fn().mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setCallCategory: vi.fn().mockReturnThis(),
      setAuthToken: vi.fn().mockReturnThis(),
      build: mockBuild.mockReturnValue({
        fetchNext: mockFetchNext,
      }),
    })),
  },
}));

describe('CometChatCallLogsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNext.mockResolvedValue([]);
  });

  // ─── createWithAuthToken ────────────────────────────────────────────

  describe('createWithAuthToken', () => {
    it('creates a manager instance with default builder', () => {
      const manager = CometChatCallLogsManager.createWithAuthToken('auth-token-123');
      expect(manager).toBeInstanceOf(CometChatCallLogsManager);
    });

    it('uses the default builder with limit 30 and category "call"', async () => {
      const { CometChatUIKitCalls } = await import('../../../CometChatUIKit/CometChatCalls');

      CometChatCallLogsManager.createWithAuthToken('auth-token-123');

      const builderInstance = vi.mocked(CometChatUIKitCalls.CallLogRequestBuilder).mock.results[0]
        ?.value;
      expect(builderInstance.setLimit).toHaveBeenCalledWith(30);
      expect(builderInstance.setCallCategory).toHaveBeenCalledWith('call');
      expect(builderInstance.setAuthToken).toHaveBeenCalledWith('auth-token-123');
      expect(builderInstance.build).toHaveBeenCalled();
    });

    it('uses a custom builder when provided', () => {
      const customBuilder = {
        build: vi.fn().mockReturnValue({ fetchNext: mockFetchNext }),
      };

      const manager = CometChatCallLogsManager.createWithAuthToken('auth-token-123', customBuilder);

      expect(manager).toBeInstanceOf(CometChatCallLogsManager);
      expect(customBuilder.build).toHaveBeenCalled();
    });
  });

  // ─── fetchNext ──────────────────────────────────────────────────────

  describe('fetchNext', () => {
    it('calls fetchNext on the built request', async () => {
      const mockCalls = [{ id: 1 }, { id: 2 }];
      mockFetchNext.mockResolvedValue(mockCalls);

      const manager = CometChatCallLogsManager.createWithAuthToken('auth-token-123');
      const result = await manager.fetchNext();

      expect(mockFetchNext).toHaveBeenCalled();
      expect(result).toEqual(mockCalls);
    });

    it('returns an empty array when fetchNext returns null', async () => {
      mockFetchNext.mockResolvedValue(null);

      const manager = CometChatCallLogsManager.createWithAuthToken('auth-token-123');
      const result = await manager.fetchNext();

      expect(result).toEqual([]);
    });

    it('returns an empty array when fetchNext returns undefined', async () => {
      mockFetchNext.mockResolvedValue(undefined);

      const manager = CometChatCallLogsManager.createWithAuthToken('auth-token-123');
      const result = await manager.fetchNext();

      expect(result).toEqual([]);
    });

    it('propagates errors from the SDK', async () => {
      mockFetchNext.mockRejectedValue(new Error('SDK error'));

      const manager = CometChatCallLogsManager.createWithAuthToken('auth-token-123');

      await expect(manager.fetchNext()).rejects.toThrow('SDK error');
    });

    it('can be called multiple times for pagination', async () => {
      mockFetchNext
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }])
        .mockResolvedValueOnce([]);

      const manager = CometChatCallLogsManager.createWithAuthToken('auth-token-123');

      const page1 = await manager.fetchNext();
      expect(page1).toHaveLength(2);

      const page2 = await manager.fetchNext();
      expect(page2).toHaveLength(1);

      const page3 = await manager.fetchNext();
      expect(page3).toHaveLength(0);

      expect(mockFetchNext).toHaveBeenCalledTimes(3);
    });
  });
});
