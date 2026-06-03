import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextFormatter } from './CometChatTextFormatter';
import type { CometChatMessageBubbleAlignment } from '../plugins/plugin.types';

/** Metadata for a detected mention. */
export interface CometChatMentionData {
  uid: string;
  name: string;
  startIndex: number;
  endIndex: number;
  type: 'self' | 'other' | 'channel';
}

/** Regex for SDK user mentions: `<@uid:{uid}>` */
const USER_MENTION_REGEX_SOURCE = '<@uid:(.*?)>';
/** Regex for SDK channel mentions: `<@all:{label}>` */
const CHANNEL_MENTION_REGEX_SOURCE = '<@all:(.*?)>';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formatter for @mentions in text.
 *
 * Handles two formats:
 * - Plain text `@username` patterns (for composer/live typing)
 * - SDK format `<@uid:xxx>` and `<@all:xxx>` patterns (for stored messages)
 *
 * Produces styled spans with BEM classes:
 * `cometchat-mentions`, `cometchat-mentions-you`, `cometchat-mentions-other`,
 * `cometchat-mentions-incoming`, `cometchat-mentions-outgoing`
 */
export class CometChatMentionsFormatter extends CometChatTextFormatter {
  readonly id = 'mentions-formatter';
  override priority = 20;

  private mentions: CometChatMentionData[] = [];
  private users = new Map<string, CometChat.User | CometChat.GroupMember>();
  private loggedInUser: CometChat.User | null = null;
  private messageBubbleAlignment: CometChatMessageBubbleAlignment | undefined;
  private allMentionLabel = 'all';

  setLoggedInUser(user: CometChat.User | null): void {
    this.loggedInUser = user;
  }

  setUsers(users: (CometChat.User | CometChat.GroupMember)[]): void {
    this.users.clear();
    for (const user of users) {
      this.users.set(user.getName().toLowerCase(), user);
    }
  }

  setMessageBubbleAlignment(alignment: CometChatMessageBubbleAlignment | undefined): void {
    this.messageBubbleAlignment = alignment;
  }

  getRegex(): RegExp {
    return /@(\w+)/g;
  }

  /** Check if text contains SDK format mentions. */
  hasSdkMentions(text: string): boolean {
    const userRegex = new RegExp(USER_MENTION_REGEX_SOURCE, 'g');
    const channelRegex = new RegExp(CHANNEL_MENTION_REGEX_SOURCE, 'g');
    return userRegex.test(text) || channelRegex.test(text);
  }

  /**
   * Format plain text @mentions by matching against the user list.
   */
  format(text: string): string {
    if (!text) {
      this.originalText = '';
      this.formattedText = '';
      this.mentions = [];
      this.metadata = { mentions: [] };
      return '';
    }

    this.originalText = text;
    this.mentions = [];

    const regex = this.getRegex();
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const username = match[1] ?? '';
      const matchStart = match.index;
      const matchEnd = matchStart + fullMatch.length;

      result += text.slice(lastIndex, matchStart);

      if (username.toLowerCase() === this.allMentionLabel.toLowerCase()) {
        this.mentions.push({
          uid: 'all',
          name: this.allMentionLabel,
          startIndex: matchStart,
          endIndex: matchEnd,
          type: 'channel',
        });
        const css = this.buildCssClasses('channel');
        result += `<span class="${css}" data-uid="all" data-mention-type="channel">@${escapeHtml(this.allMentionLabel)}</span>`;
      } else {
        const user = this.users.get(username.toLowerCase());
        if (user) {
          const uid = user.getUid();
          const displayName = user.getName();
          const mentionType = this.getMentionType(uid);
          this.mentions.push({
            uid,
            name: displayName,
            startIndex: matchStart,
            endIndex: matchEnd,
            type: mentionType,
          });
          const css = this.buildCssClasses(mentionType);
          result += `<span class="${css}" data-uid="${escapeHtml(uid)}" data-mention-type="${mentionType}">@${escapeHtml(displayName)}</span>`;
        } else {
          result += fullMatch;
        }
      }
      lastIndex = matchEnd;
    }

    result += text.slice(lastIndex);
    this.formattedText = result;
    this.metadata = { mentions: this.mentions };
    return this.formattedText;
  }

  /**
   * Format SDK-format mentions: `<@uid:xxx>` and `<@all:xxx>`.
   * Uses the mentionedUsers array to resolve display names.
   */
  formatSdkMentions(
    text: string,
    mentionedUsers: (CometChat.User | CometChat.GroupMember)[] = []
  ): string {
    this.originalText = text;
    this.mentions = [];

    const userMap = new Map<string, CometChat.User | CometChat.GroupMember>();
    for (const user of mentionedUsers) {
      userMap.set(user.getUid(), user);
    }

    // Split by code segments — mentions inside code render as plain text (v6 behavior)
    const codeSegmentRegex = /(<pre><code>[\s\S]*?<\/code><\/pre>|<code>[\s\S]*?<\/code>)/g;
    const segments = text.split(codeSegmentRegex);

    const result = segments
      .map(segment => {
        if (segment.startsWith('<code>') || segment.startsWith('<pre><code>')) {
          // Inside code: replace mention tokens with plain @name text (no styling)
          let plain = segment.replace(
            new RegExp(CHANNEL_MENTION_REGEX_SOURCE, 'g'),
            (_match, label: string) => {
              return `@${escapeHtml(label || this.allMentionLabel)}`;
            }
          );
          plain = plain.replace(
            new RegExp(USER_MENTION_REGEX_SOURCE, 'g'),
            (_match, uid: string) => {
              const user = userMap.get(uid);
              const displayName = user ? user.getName() : uid;
              return `@${escapeHtml(displayName)}`;
            }
          );
          return plain;
        }

        // Outside code: apply full styled mention spans
        let seg = segment;

        // Channel mentions first
        const channelRegex = new RegExp(CHANNEL_MENTION_REGEX_SOURCE, 'g');
        seg = seg.replace(channelRegex, (fullMatch, label: string, offset: number) => {
          const displayLabel = label || this.allMentionLabel;
          this.mentions.push({
            uid: 'all',
            name: displayLabel,
            startIndex: offset,
            endIndex: offset + fullMatch.length,
            type: 'channel',
          });
          const css = this.buildCssClasses('channel');
          return `<span class="${css}" data-uid="all" data-mention-type="channel" contenteditable="false">@${escapeHtml(displayLabel)}</span>`;
        });

        // User mentions
        const userRegex = new RegExp(USER_MENTION_REGEX_SOURCE, 'g');
        seg = seg.replace(userRegex, (fullMatch, uid: string, offset: number) => {
          if (!uid || uid.trim() === '') return '';
          const user = userMap.get(uid);
          const displayName = user ? user.getName() : uid;
          if (!displayName || displayName.trim() === '') return '';

          const mentionType = this.getMentionType(uid);
          this.mentions.push({
            uid,
            name: displayName,
            startIndex: offset,
            endIndex: offset + fullMatch.length,
            type: mentionType,
          });
          const css = this.buildCssClasses(mentionType);
          return `<span class="${css}" data-uid="${escapeHtml(uid)}" data-mention-type="${mentionType}" contenteditable="false">@${escapeHtml(displayName)}</span>`;
        });

        return seg;
      })
      .join('');

    this.formattedText = result;
    this.metadata = { mentions: this.mentions };
    return this.formattedText;
  }

  getMentions(): CometChatMentionData[] {
    return [...this.mentions];
  }

  override reset(): void {
    super.reset();
    this.mentions = [];
  }

  private getMentionType(uid: string): 'self' | 'other' {
    if (this.loggedInUser?.getUid() === uid) {
      return 'self';
    }
    return 'other';
  }

  private buildCssClasses(mentionType: 'self' | 'other' | 'channel'): string {
    const classes: string[] = ['cometchat-mentions'];
    if (mentionType === 'self' || mentionType === 'channel') {
      classes.push('cometchat-mentions-you');
    } else {
      classes.push('cometchat-mentions-other');
    }
    if (this.messageBubbleAlignment === 'left') {
      classes.push('cometchat-mentions-incoming');
    } else if (this.messageBubbleAlignment === 'right') {
      classes.push('cometchat-mentions-outgoing');
    }
    return classes.join(' ');
  }
}
