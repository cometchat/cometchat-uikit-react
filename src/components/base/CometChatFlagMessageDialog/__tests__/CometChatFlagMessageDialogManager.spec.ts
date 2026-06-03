import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock for vi.mock factory
const mockGetFlagReasons = vi.hoisted(() => vi.fn());

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getFlagReasons: mockGetFlagReasons,
  },
}));

// Import after mock is set up
import { getFlagReasons } from '../CometChatFlagMessageDialogManager';

describe('CometChatFlagMessageDialogManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls CometChat.getFlagReasons and returns the result', async () => {
    const mockReasons = [
      { id: 'r1', name: 'Spam' },
      { id: 'r2', name: 'Harassment' },
    ];
    mockGetFlagReasons.mockResolvedValue(mockReasons);

    const result = await getFlagReasons();

    expect(mockGetFlagReasons).toHaveBeenCalledOnce();
    expect(result).toEqual(mockReasons);
  });

  it('returns an empty array when SDK returns empty', async () => {
    mockGetFlagReasons.mockResolvedValue([]);

    const result = await getFlagReasons();

    expect(result).toEqual([]);
  });

  it('propagates errors from the SDK', async () => {
    const error = new Error('SDK error');
    mockGetFlagReasons.mockRejectedValue(error);

    await expect(getFlagReasons()).rejects.toThrow('SDK error');
  });

  it('returns the exact SDK response without transformation', async () => {
    const mockReasons = [
      { id: 'r1', name: 'Spam', description: 'Unwanted messages' },
      { id: 'r2', name: 'Harassment', description: 'Abusive behavior' },
      { id: 'r3', name: 'Other', description: 'Other reason' },
    ];
    mockGetFlagReasons.mockResolvedValue(mockReasons);

    const result = await getFlagReasons();

    expect(result).toBe(mockReasons); // Same reference — no transformation
  });
});
