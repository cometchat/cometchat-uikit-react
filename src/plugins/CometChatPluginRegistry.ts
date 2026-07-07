import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePlugin } from './plugin.types';
import type { CometChatTextFormatter } from '../formatters/CometChatTextFormatter';

/**
 * Immutable registry of message plugins.
 *
 * `.register()` returns a new instance — safe for React context.
 * `findPlugin()` resolves deleted messages to the DeletePlugin first,
 * then matches by message type + category.
 */
export class CometChatPluginRegistry {
  private readonly plugins: readonly CometChatMessagePlugin[];

  constructor(plugins: CometChatMessagePlugin[] = []) {
    this.plugins = Object.freeze([...plugins]);
  }

  /** Return a new registry with the plugin added. */
  register(plugin: CometChatMessagePlugin): CometChatPluginRegistry {
    return new CometChatPluginRegistry([...this.plugins, plugin]);
  }

  /**
   * Find the plugin that handles a given message.
   *
   * Resolution order:
   * 1. If the message is deleted (getDeletedAt() !== null), return the DeletePlugin.
   * 2. Otherwise, find the first plugin whose messageCategories includes the message's
   *    category AND whose messageTypes includes the message's type — OR whose messageTypes
   *    is empty, which acts as a category-only render wildcard. Note: an empty messageTypes
   *    contributes nothing to the request builder (getAllMessageTypes), so a plugin that
   *    needs its messages fetched must declare its type explicitly. Strict type+category
   *    matching is unchanged for every plugin that declares a non-empty messageTypes.
   * 3. If no plugin matches, return undefined.
   */
  findPlugin(message: CometChat.BaseMessage): CometChatMessagePlugin | undefined {
    if (message.getDeletedAt()) {
      return this.plugins.find(p => p.id === 'delete');
    }
    const type = message.getType();
    const category = message.getCategory();
    return this.plugins.find(
      p =>
        p.messageCategories.includes(category) &&
        (p.messageTypes.length === 0 || p.messageTypes.includes(type))
    );
  }

  /** Get all registered plugins. */
  getAll(): readonly CometChatMessagePlugin[] {
    return this.plugins;
  }

  /** Get all message types across all plugins (for SDK request builders). */
  getAllMessageTypes(): string[] {
    return [...new Set(this.plugins.flatMap(p => p.messageTypes))];
  }

  /** Get all message categories across all plugins (for SDK request builders). */
  getAllMessageCategories(): string[] {
    return [...new Set(this.plugins.flatMap(p => p.messageCategories))];
  }

  /**
   * Get a plain-text preview for the conversation list subtitle.
   *
   * Finds the plugin that handles the message and delegates to its
   * `getLastMessagePreview()` method. Returns undefined if no plugin
   * matches or the matched plugin doesn't implement the method.
   */
  getLastMessagePreview(
    message: CometChat.BaseMessage,
    loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string | undefined {
    const plugin = this.findPlugin(message);
    if (!plugin?.getLastMessagePreview) return undefined;
    return plugin.getLastMessagePreview(message, loggedInUser, t);
  }

  /**
   * Get text formatters from the text plugin (or the first plugin that provides them).
   * Used by media plugins for caption rendering and by conversations/search for subtitles.
   */
  getTextFormatters(): CometChatTextFormatter[] {
    for (const plugin of this.plugins) {
      if (plugin.getTextFormatters) {
        const formatters = plugin.getTextFormatters();
        if (formatters.length > 0) return formatters;
      }
    }
    return [];
  }
}
