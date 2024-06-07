import { AvatarStyle, DateStyle, LabelStyle, ListItemStyle, LoaderStyle, ReceiptStyle } from "@cometchat/uikit-elements";
import { CometChatTheme, MessageBubbleAlignment, MessageListAlignment } from "@cometchat/uikit-resources";
import { BaseStyle, ListStyle, MessageListStyle, ReactionInfoConfiguration, ReactionInfoStyle, ReactionListStyle, ReactionsStyle } from "@cometchat/uikit-shared";
import { CSSProperties } from "react";
/**
 * Generates the style object for the new unread-messages view, visible when the user is not at the bottom and receives a new message
 *
 * @returns {CSSProperties}
 */
export declare const newMessageIndicatorStyle: () => CSSProperties;
/**
 * Generates the style object for the custom header view, visible on the top of the message list
 *
 * @returns {CSSProperties}
 */
export declare const headerStyle: () => CSSProperties;
/**
 * Returns the style object for the custom footer view, visible on the bottom of the message list. By default, smart replies are visible  for the message received.
 *
 * @returns {CSSProperties}
 */
export declare const footerStyle: () => CSSProperties;
/**
 * Provides the style object for the CometChatList wrapper which renders a list of messages

 *
 * @returns {CSSProperties}
 */
export declare const listWrapperStyle: () => CSSProperties;
/**
 * Generates the style object for the MessageList wrapper which renders the CometChatList component
 *
 * @param {(MessageListStyle | undefined)} messageListStyle
 * @param {CometChatTheme} theme
 * @returns {CSSProperties}
 */
export declare const wrapperStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => CSSProperties;
/**
 * Style object for the threadView in the CometChatMessageBubble which shows the message count of a specific thread visible below the CometChatMessageBubble in a particular user/group.
 *
 * @param {CometChat.BaseMessage} message
 * @param {CometChatTheme} theme
 * @param {(CometChat.User | null)} loggedInUser
 * @param {MessageListStyle} [messageListStyle={}]
 * @param {MessageBubbleAlignment} [alignment]
 * @returns {CSSProperties}
 */
export declare const messageThreadViewStyle: (message: CometChat.BaseMessage, theme: CometChatTheme, loggedInUser: CometChat.User | null, messageListStyle: MessageListStyle | undefined, alignment?: MessageBubbleAlignment) => CSSProperties;
/**
 * Style object for the new message indicator text visible upon receiving a new message while the screen is not at the last message of the chat.
 *
 * @param {CometChatTheme} theme
 * @returns {CSSProperties}
 */
export declare const newMessageTextStyleStyle: (theme: CometChatTheme) => CSSProperties;
/**
 * Default style object for CometChatMessageBubble component which renders all types of supported message types.
 *
 * @param {CometChat.BaseMessage} message
 * @param {CometChatTheme} theme
 * @param {(MessageListAlignment | undefined)} alignment
 * @param {(CometChat.User | null)} loggedInUser
 * @returns {BaseStyle}
 */
export declare const messageBubbleStyle: (message: CometChat.BaseMessage, theme: CometChatTheme, alignment: MessageListAlignment | undefined, loggedInUser: CometChat.User | null) => BaseStyle;
/**
 * Default style object for receipt status of the message if it's read  sent or  delivered.
 *
 * @param {CometChatTheme} theme
 * @param {CometChat.BaseMessage} message
 * @returns {ReceiptStyle}
 */
export declare const messageReceiptStyle: (theme: CometChatTheme, message: CometChat.BaseMessage) => ReceiptStyle;
/**
 * Default style object for statusInfo view which renders the time when the message was sent and receipt status
of the message if it's read or delivered.
 *
 * @param {boolean} isValid
 * @param {CometChatTheme} theme
 * @param {CometChat.BaseMessage} message
 * @param {MessageBubbleAlignment} alignment
 * @returns {CSSProperties}
 */
export declare const getStatusInfoViewStyle: (isValid: boolean, theme: CometChatTheme, message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) => CSSProperties;
/**
 * Style object for footerView wrapper which is visible at the bottom of the CometChatMessageBubble component.
It is a placeholder which accepts a custom view. By default, message Reactions are visible at the bottom for the message
received in a particular User/Group Chat.
 *
 * @param {MessageBubbleAlignment} alignment
 * @returns {CSSProperties}
 */
export declare const bubbleFooterViewWrapperStyle: (alignment: MessageBubbleAlignment) => CSSProperties;
/**
 * Style object for time in headerView of CometChatMessageBubble which shows the time when the message was sent
in the particular user/group chat

 *
 * @param {(MessageListStyle | undefined)} messageListStyle
 * @param {CometChatTheme} theme
 * @returns {DateStyle}
 */
export declare const messageBubbleHeaderDateStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => DateStyle;
/**
 * Style object for title in headerView of CometChatMessageBubble which shows the name
of the sender of the message in the particular user/group chat
 *
 * @param {CometChatTheme} theme
 * @returns {LabelStyle}
 */
export declare const bubbleHeaderTitleStyle: (theme: CometChatTheme, messageListStyle?: MessageListStyle) => LabelStyle;
/**
 * Generates the style object for the CometChatDate component, visible between the messages in CometChatMessageList as a separator for same-date messages.
 *
 * @param {(DateStyle | undefined)} dateSeparatorStyle
 * @param {CometChatTheme} theme
 * @returns {DateStyle}
 */
export declare const dateSeperatorStyle: (dateSeparatorStyle: DateStyle | undefined, theme: CometChatTheme) => DateStyle;
/**
 * Provides the default style object for the CometChatMessageList component if the required styles are not provided by the parent component.
 *
 * @param {CometChatTheme} theme
 * @returns {MessageListStyle}
 */
export declare const tempMessageListStyle: (theme: CometChatTheme) => MessageListStyle;
/**
 * Generates the style object for the loading view visible in the center of the CometChatMessageList component until the messages for a specific User/Group are fetched.
 *
 * @param {(MessageListStyle | undefined)} messageListStyle
 * @param {CometChatTheme} theme
 * @returns {LoaderStyle}
 */
export declare const loadingViewStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => LoaderStyle;
/**
 * Generates the style object for the error view visible in the center of the CometChatMessageList component when there is an issue fetching the messages of a specific User/Group.
 *
 * @param {(MessageListStyle | undefined)} messageListStyle
 * @param {CometChatTheme} theme
 * @returns {LabelStyle}
 */
export declare const errorViewStyle: (messageListStyle: MessageListStyle | undefined, theme: CometChatTheme) => LabelStyle;
/**
 * Generates the style object for the CometChatAvatar component, which includes both styling received from the parent component and default styling required in the CometChatAvatar component.
 *
 * @param {(AvatarStyle | undefined)} avatarStyle
 * @param {CometChatTheme} theme
 * @returns {AvatarStyle}
 */
export declare const messageAvatarStyle: (avatarStyle: AvatarStyle | undefined, theme: CometChatTheme) => AvatarStyle;
/**
 * Returns the default style object for CometChatDate wrapper, visible in the center between the messages in CometChatMessageList as a separator for same-day messages.
 *
 * @returns {CSSProperties}
 */
export declare const dateSeperatorWrapperStyle: () => CSSProperties;
/**
 * Provides the default style object for the CometChatAvatar visible in the leadingView of CometChatMessageBubble, showing the sender's avatar.
 *
 * @type {AvatarStyle}
 */
export declare const defaultAvatarStyle: AvatarStyle;
/**
 * Returns the default style object for CometChatMessageList if the style is not received from the parent.
 *
 * @type {MessageListStyle}
 */
export declare const defaultMessageListStyle: MessageListStyle;
/**
 * Provides the default style object for the CometChatMessageBubble wrapper div.
 *
 * @param {MessageBubbleAlignment} alignment
 * @returns {CSSProperties}
 */
export declare const bubbleStyle: (alignment: MessageBubbleAlignment) => CSSProperties;
/**
 * Supplies the default style object for the CometChatMessageBubble container.
 *
 * @type {CSSProperties}
 */
export declare const defaultMessageListBubbleStyle: CSSProperties;
/**
 * Returns the default style for the CometChatList component, which renders a list of messages for a specific user/group.
 *
 * @returns {ListStyle}
 */
export declare const getListStyle: () => ListStyle;
/**
 * Provides the default style for the CometChatAvatar component, which renders an Avatar about the reactor in the Reactions list.
 *
 * @param {CometChatTheme} theme
 * @returns {AvatarStyle}
 */
export declare const getReactionListAvatarStyle: (theme: CometChatTheme) => AvatarStyle;
/**
 * Generates the default style for the CometChatListItem component, which renders details about the reaction in the list.
 *
 * @param {CometChatTheme} theme
 * @returns {ListItemStyle}
 */
export declare const getReactionListItemStyle: (theme: CometChatTheme) => ListItemStyle;
/**
 * Provides the default style for the CometChatReactionList component, which shows a list of reactions on a specific reaction along with the reactor's details.
 *
 * @param {CometChatTheme} theme
 * @returns {ReactionListStyle}
 */
export declare const getReactionListStyle: (theme: CometChatTheme) => ReactionListStyle;
/**
 * Default styling for CometChatReactionInfo component. If the configuration styling is not passed.
 *
 * @param {CometChatTheme} theme
 * @param {ReactionInfoConfiguration} config
 * @returns {ReactionInfoStyle}
 */
export declare const getReactionInfoStyle: (theme: CometChatTheme, config: ReactionInfoConfiguration) => ReactionInfoStyle;
/**
 * Default styleing for CometChatReactions component wrapper.
 *
 * @param {MessageBubbleAlignment} alignment
 * @returns {CSSProperties}
 */
export declare const getReactionViewStyle: (alignment: MessageBubbleAlignment) => CSSProperties;
/**
 * Returns the default style for the statusInfoView  wrapper in CometChatMessageBubble.
 *
 * @returns {CSSProperties}
 */
export declare const getStatusInfoStyle: () => CSSProperties;
/**
 * Generates the default style for the CometChatReactions component wrapper, which shows a list of reactions on a specific message, visible in the footer view of the message bubble.
 *
 * @param {ReactionsStyle} [reactionsStyle]
 * @param {CometChatTheme} theme
 * @returns {ReactionsStyle}
 */
export declare const getReactionsStyle: (reactionsStyle: ReactionsStyle | undefined, theme: CometChatTheme) => ReactionsStyle;
