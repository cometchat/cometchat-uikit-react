import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatSearchFilter } from './CometChatSearch.types';

/**
 * CometChatSearchMessagesManager — SDK wrapper for message search.
 *
 * No React imports. No state. Pure SDK orchestration.
 */
export class CometChatSearchMessagesManager {
  private searchRequest: CometChat.MessagesRequest | null = null;
  private isLoadingMore = false;
  private limit = 30;

  /**
   * Build and execute a message search.
   * Returns the first page of results.
   */
  async search(
    keyword: string,
    filters: CometChatSearchFilter[],
    uid?: string,
    guid?: string,
    alwaysShowSeeMore = false,
    customBuilder?: CometChat.MessagesRequestBuilder
  ): Promise<{ results: CometChat.BaseMessage[]; hasMore: boolean }> {
    this.limit = alwaysShowSeeMore ? 3 : 30;
    this.searchRequest = this.buildRequest(keyword, filters, uid, guid, customBuilder, this.limit);

    const raw = await this.searchRequest.fetchPrevious();
    const results = raw.reverse();
    return {
      results,
      hasMore: raw.length >= this.limit,
    };
  }

  /**
   * Load the next page of results.
   */
  async loadMore(): Promise<{ results: CometChat.BaseMessage[]; hasMore: boolean }> {
    if (this.isLoadingMore || !this.searchRequest) {
      return { results: [], hasMore: false };
    }
    this.isLoadingMore = true;
    try {
      const raw = await this.searchRequest.fetchPrevious();
      return {
        results: raw.reverse(),
        hasMore: raw.length >= this.limit,
      };
    } finally {
      this.isLoadingMore = false;
    }
  }

  /** Reset the request state. */
  reset(): void {
    this.searchRequest = null;
    this.isLoadingMore = false;
    this.limit = 30;
  }

  // ── Private helpers ──

  private buildRequest(
    keyword: string,
    filters: CometChatSearchFilter[],
    uid?: string,
    guid?: string,
    customBuilder?: CometChat.MessagesRequestBuilder,
    limit = 30
  ): CometChat.MessagesRequest {
    let builder = customBuilder ?? new CometChat.MessagesRequestBuilder();

    builder.hideDeletedMessages(true);

    if (!customBuilder) {
      builder = builder.setLimit(limit);
    }

    if (keyword.trim() !== '') {
      builder = builder.setSearchKeyword(keyword);
    }
    if (uid) {
      builder = builder.setUID(uid);
    }
    if (guid) {
      builder = builder.setGUID(guid);
    }

    if (filters.length > 0) {
      if (filters.includes('links')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        builder = (builder as any).hasLinks(true);
      }

      const attachmentTypeMap: Partial<Record<CometChatSearchFilter, CometChat.AttachmentType>> = {
        photos: CometChat.AttachmentType.IMAGE,
        videos: CometChat.AttachmentType.VIDEO,
        files: CometChat.AttachmentType.FILE,
        audio: CometChat.AttachmentType.AUDIO,
      };

      for (const [filter, attachmentType] of Object.entries(attachmentTypeMap)) {
        if (filters.includes(filter as CometChatSearchFilter)) {
          builder = builder.setAttachmentTypes([attachmentType]);
          break;
        }
      }
    }

    return builder.build();
  }
}
