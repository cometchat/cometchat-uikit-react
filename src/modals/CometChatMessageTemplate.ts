import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatMessageOption } from "./CometChatMessageOption";
import { MessageBubbleAlignment } from "../Enums/Enums";
import { CalendarObject } from "../utils/CalendarObject";
import { CometChatTextFormatter } from "../formatters";
import { JSX } from 'react';
/**
 * CometChatMessageTemplate is a pre-defined structure for creating message views 
 * that can be used as a starting point or blueprint for creating message views, 
 * often known as message bubbles.
 * It is used in CometChatMessageInformation, CometChatMessageList components and extensions like Polls, Stickers.
 */
class CometChatMessageTemplate {
    /**
     * Type of the CometChat message.
     * @type {string}
     */
    type!: string;

    /**
     * Custom component to customize the content section for each message bubble.
     * By default, it displays the Text bubble, Image bubble, File bubble, Audio bubble, 
     * and Video bubble based on the type of the message.
     * @type {(message:CometChat.BaseMessage,alignment:MessageBubbleAlignment)=> Element | JSX.Element | null}
     */
    contentView: ((message: CometChat.BaseMessage, alignment: MessageBubbleAlignment,textFormatters?: CometChatTextFormatter[]) => Element | JSX.Element | null) | null = null;

    /**
     * Custom component to customize the complete message bubble.
     * By default, headerView, contentView and footerView collectively form a message bubble.
     * @type {(message:CometChat.BaseMessage,alignment:MessageBubbleAlignment)=> Element | JSX.Element | null}
     */
    bubbleView: ((message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) => Element | JSX.Element | null) | null = null;

    /**
     * Custom component to customize the header section for each message bubble.
     * By default, it displays the message sender's name.
     * @type {(message:CometChat.BaseMessage,alignment:MessageBubbleAlignment)=> Element | JSX.Element | null}
     */
    headerView: ((message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) => Element | JSX.Element | null) | null = null;

    /**
     * Custom component to customize the reply view section for each message bubble.
     * @type {(message:CometChat.BaseMessage,alignment:MessageBubbleAlignment)=> Element | JSX.Element | null}
     */
    replyView: ((message: CometChat.BaseMessage, alignment?: MessageBubbleAlignment, onReplyViewClicked?:(messageToReply: CometChat.BaseMessage) => void, textFormatters?: CometChatTextFormatter[]) => Element | JSX.Element | null) | null = null;

    /**
     * Custom component to customize the footer section for each message bubble.
     * By default, it displays the reactions.
     * @type {(message:CometChat.BaseMessage,alignment:MessageBubbleAlignment)=> Element | JSX.Element | null}
     */
    footerView: ((message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) => Element | JSX.Element | null) | null = null;

    /**
     * Custom component to customize the bottom view section for each message bubble.
     * @type {(message:CometChat.BaseMessage,alignment:MessageBubbleAlignment)=> Element | JSX.Element | null}
     */
    bottomView: ((message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) => Element | JSX.Element | null) | null = null;

    /**
     * Custom component to customize the status info section for each message bubble.
     * By default, it displays the receipt and the timestamp.
     * @type {(message:CometChat.BaseMessage,alignment:MessageBubbleAlignment)=> Element | JSX.Element | null}
     */
    statusInfoView: ((message: CometChat.BaseMessage, alignment: MessageBubbleAlignment, hideReceipts?: boolean, messageSentAtDateTimeFormat?:CalendarObject,showError?: boolean) => Element | JSX.Element | null) | null = null;

    /**
     * List of available actions that any user can perform on a message, like reacting, 
     * editing or deleting a message.
     * @type {(loggedInUser: CometChat.User, message: CometChat.BaseMessage) => CometChatMessageOption[]}
     */
    options!: (loggedInUser: CometChat.User, message: CometChat.BaseMessage, group?: CometChat.Group) => CometChatMessageOption[];

    /**
     * Category of the CometChat message.
     * @type {string}
     */
    category: string = "";

    /**
     * Creates an instance of CometChatMessageTemplate.
     * 
     * @param {Partial<CometChatMessageTemplate>} props - Properties to initialize the message template.
     */
    constructor(props: Partial<CometChatMessageTemplate>) {
        Object.assign(this, props);
    }
}

export { CometChatMessageTemplate };