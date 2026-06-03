/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { CometChatUIKitCalls } from '../../CometChatUIKit/CometChatCalls';

/**
 * CometChatCallLogsManager — SDK manager for fetching call logs.
 *
 * Uses `CometChatUIKitCalls.CallLogRequestBuilder` from the Calls SDK.
 * No React imports — pure SDK orchestration.
 */
export class CometChatCallLogsManager {
  private request: any;

  private constructor() {
    // Use static factory method createWithAuthToken
    this.request = null;
  }

  /**
   * Create a manager with a logged-in user's auth token.
   */
  static createWithAuthToken(authToken: string, builder?: any): CometChatCallLogsManager {
    const manager = new CometChatCallLogsManager();
    if (builder) {
      manager.request = builder.build();
    } else {
      manager.request = new CometChatUIKitCalls.CallLogRequestBuilder()
        .setLimit(30)
        .setCallCategory('call')
        .setAuthToken(authToken)
        .build();
    }
    return manager;
  }

  /** Fetch the next page of call logs. Returns an empty array when exhausted. */
  async fetchNext(): Promise<any[]> {
    const calls = await this.request.fetchNext();
    return calls ?? [];
  }
}
