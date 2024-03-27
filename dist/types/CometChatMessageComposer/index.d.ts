import { AIOptionsStyle, CometChatTextFormatter, MessageComposerStyle, UserMemberWrapperConfiguration } from "@cometchat/uikit-shared";
import { ActionSheetStyle, MediaRecorderStyle } from "@cometchat/uikit-elements";
import { AuxiliaryButtonAlignment, CometChatMessageComposerAction } from "@cometchat/uikit-resources";
import React, { JSX } from "react";
type ComposerId = {
    parentMessageId: number | null;
    user: string | null;
    group: string | null;
};
export type ContentToDisplay = "attachments" | "emojiKeyboard" | "voiceRecording" | "ai" | "none";
export type ActionOnClickType = (() => void) | null;
interface IMessageComposerProps {
    /**
     * User to send messages to
     */
    user?: CometChat.User;
    /**
     * Group to send messages to
     *
     * @remarks
     * This prop is used if `user` prop is not provided
     */
    group?: CometChat.Group;
    /**
     * Text to fill the message input with
     *
     * @remarks
     * This prop is used only when this component mounts
     *
     * @defaultValue `""`
     */
    text?: string;
    /**
     * Function to call when the message input's text value changes
     */
    onTextChange?: (text: string) => void;
    /**
     * Text shown in the message input when it is empty
     */
    placeHolderText?: string;
    /**
     * Image URL for the send button
     *
     * @remarks
     * This prop is used if `sendButtonView` prop is not provided
     *
     * @defaultValue `SendIcon`
     */
    sendButtonIconURL?: string;
    /**
     * Custom send button view
     */
    sendButtonView?: (userOrGroup: CometChat.User | CometChat.Group, composerId: ComposerId) => JSX.Element;
    /**
     * Function to call whenever a new text message is sent
     */
    onSendButtonClick?: (message: CometChat.BaseMessage) => void;
    /**
     * Custom secondary button view
     */
    secondaryButtonView?: (userOrGroup: CometChat.User | CometChat.Group, composerId: ComposerId) => JSX.Element;
    /**
     * Image URL for the default secondary button
     *
     * @remarks
     * This prop is used if `secondaryButtonView` prop is not provided
     *
     * @defaultValue `./assets/plus.svg`
     */
    attachmentIconURL?: string;
    /**
     * Image URL for the emoji button
     *
     * @defaultValue `SmileysIcon`
     */
    emojiIconURL?: string;
    /**
     * Image URL for the AI button
     *
     * @defaultValue `AIIcon`
     */
    AIIconURL?: string;
    /**
     * Custom auxiliary button view
     */
    auxiliaryButtonView?: (userOrGroup: CometChat.User | CometChat.Group, composerId: ComposerId) => JSX.Element;
    /**
     * Alignment of the auxiliary button
     *
     * @defaultValue `AuxiliaryButtonAlignment.right`
     */
    auxiliaryButtonAlignment?: AuxiliaryButtonAlignment;
    /**
     * Options for the default secondary view
     */
    attachmentOptions?: (userOrGroup: CometChat.User | CometChat.Group, composerId: ComposerId) => CometChatMessageComposerAction[];
    /**
     * Hide layout button
     *
     * @defaultValue `false`
     */
    hideLayoutMode?: boolean;
    /**
     * Id of the parent message
     */
    parentMessageId?: number;
    /**
     * Image URL for the live reaction button
     *
     * @defaultValue `./assets/heart.svg`
     */
    LiveReactionIconURL?: string;
    /**
     * Hide live reaction button
     *
     * @defaultValue `false`
     */
    hideLiveReaction?: boolean;
    /**
     * Preview section at the top of the message input
     */
    headerView?: JSX.Element;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Disable sound for outgoing messages
     *
     * @defaulValue `false`
     */
    disableSoundForMessages?: boolean;
    /**
     * Custom audio sound for outgoing messages
     */
    customSoundForMessage?: string;
    /**
     * Disable sending typing events
     *
     * @defaultValue `false`
     */
    disableTypingEvents?: boolean;
    /**
     * Styles to apply to this component
     */
    messageComposerStyle?: MessageComposerStyle;
    /**
     * Styles to apply to action sheet component
     */
    actionSheetStyle?: ActionSheetStyle;
    /**
     * Styles to apply to AI action sheet component
     */
    AIOptionsStyle?: AIOptionsStyle;
    /**
     * Hide voice recording button
     */
    hideVoiceRecording?: boolean;
    /**
     * Styles to apply voice recording view
     */
    mediaRecorderStyle?: MediaRecorderStyle;
    /**
     * Icon for voice recording start
     */
    voiceRecordingStartIconURL?: string;
    /**
     * Icon for voice recording close
     */
    voiceRecordingCloseIconURL?: string;
    /**
     * Icon for voice recording stop
     */
    voiceRecordingStopIconURL?: string;
    /**
     * Icon for voice recording submit
     */
    voiceRecordingSubmitIconURL?: string;
    InfoSimpleIcon?: string;
    userMemberWrapperConfiguration?: UserMemberWrapperConfiguration;
    textFormatters?: Array<CometChatTextFormatter>;
    disableMentions?: boolean;
    mentionsWarningText?: string;
    mentionsWarningStyle?: React.CSSProperties;
}
type State = {
    text: string;
    addToMsgInputText: string;
    textMessageToEdit: CometChat.TextMessage | null;
    contentToDisplay: ContentToDisplay;
    loggedInUser: CometChat.User | null;
    showPoll: boolean;
    showMentionsCountWarning: boolean;
};
export type Action = {
    type: "setText";
    text: State["text"];
} | {
    type: "setAddToMsgInputText";
    addToMsgInputText: State["addToMsgInputText"];
} | {
    type: "setTextMessageToEdit";
    textMessageToEdit: State["textMessageToEdit"];
} | {
    type: "setContentToDisplay";
    contentToDisplay: ContentToDisplay;
} | {
    type: "setLoggedInUser";
    loggedInUser: CometChat.User;
} | {
    type: "setShowPoll";
    showPoll: boolean;
} | {
    type: "setShowMentionsCountWarning";
    showMentionsCountWarning: boolean;
};
/**
 * Renders a message composer to send messages to a user or group of a CometChat App
 */
export declare function CometChatMessageComposer(props: IMessageComposerProps): import("react/jsx-runtime").JSX.Element;
export {};
