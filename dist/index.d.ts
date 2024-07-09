import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React$1 from 'react';
import React__default, { CSSProperties, JSX as JSX$1 } from 'react';
import { UserMemberListType, UserPresencePlacement, CometChatLocalize, FormMessage, CardMessage, CustomInteractiveMessage, SchedulerMessage, CometChatTheme, CometChatActionsIcon, CometChatActionsView, MessageBubbleAlignment, CometChatMessageTemplate, CometChatMessageComposerAction, CometChatDetailsTemplate, MentionsTargetElement, TabAlignment, CometChatTabItem, IconButtonAlignment, TitleAlignment, States, CallWorkflow, DatePatterns, CometChatOption, SelectionMode, PreviewMessageMode, AuxiliaryButtonAlignment, MessageListAlignment, TimestampAlignment, TabsVisibility } from '@cometchat/uikit-resources';
export * from '@cometchat/uikit-resources';
import { AvatarStyle, TextBubbleStyle, BaseStyle, ImageBubbleStyle, FileBubbleStyle, DocumentBubbleStyle, ConfirmDialogStyle, ListItemStyle, CallscreenStyle, BadgeStyle, ReceiptStyle, DateStyle, ChangeScopeStyle, ActionSheetStyle, MediaRecorderStyle, EmojiKeyboardStyle, BackdropStyle, CometChatEmojiKeyboard, CometChatIconButton, CometChatButton as CometChatButton$1, CometChatDate, CometChatLabel, CometChatLoader, CometChatAvatar, CometChatReceipt } from '@cometchat/uikit-elements';
export { ActionSheetStyle, AvatarStyle, BackdropStyle, BadgeStyle, ButtonGroupStyle, CallscreenStyle, CardStyle, ChangeScopeStyle, CheckboxStyle, CometChatActionItem, CometChatActionSheet, CometChatAvatar, CometChatBackdrop, CometChatBadge, CometChatButton, CometChatButtonGroup, CometChatCallscreenWrapper, CometChatCard, CometChatChangeScope, CometChatCheckbox, CometChatConfirmDialog, CometChatContextMenu, CometChatCreateGroup, CometChatDate, CometChatDivider, CometChatDocumentBubble, CometChatDraggable, CometChatDropdown, CometChatEmoji, CometChatEmojiKeyboard, CometChatFullScreenViewer, CometChatIcon, CometChatIconButton, CometChatInput, CometChatJoinGroup, CometChatLabel, CometChatListItem, CometChatLiveReaction, CometChatLoader, CometChatMediaRecorder, CometChatMenuList, CometChatMessageInput, CometChatModal, CometChatPopover, CometChatPreview, CometChatQuickView, CometChatRadioButton, CometChatReceipt, CometChatSearchInput, CometChatSingleSelect, CometChatStatusIndicator, CometChatTextInput, ConfirmDialogStyle, ContextMenuStyle, CreateGroupStyle, DateStyle, DocumentBubbleStyle, DropdownStyle, EmojiKeyboardStyle, Emojis, FileBubbleStyle, FullScreenViewerStyle, IconStyle, ImageBubbleStyle, InputStyle, JoinGroupStyle, LabelStyle, ListItemStyle, LoaderStyle, MediaRecorderStyle, MenuListStyle, MessageInputStyle, ModalStyle, PopoverStyle, PreviewStyle, QuickViewStyle, RadioButtonStyle, ReceiptStyle, SearchInputStyle, SingleSelectStyle, TextBubbleStyle, TextInputStyle, auxiliaryButtonAlignmentEnum, layoutType } from '@cometchat/uikit-elements';
import { UIKitSettings, CometChatSoundManager, ComposerId as ComposerId$1, FormBubbleStyle, SchedulerBubbleStyle, CardBubbleStyle, AIOptionsStyle, CometChatTextFormatter, CometChatMentionsFormatter, CometChatUrlsFormatter, BaseStyle as BaseStyle$1, ListStyle, OptionsStyle, ImageModerationStyle, LinkPreviewStyle, MessageTranslationStyle, PollsBubbleStyle, CreatePollStyle, SmartRepliesStyle, StickersStyle, CallButtonsStyle, IncomingCallStyle, CometChatUIKitCalls, OutgoingCallStyle, CallLogsStyle, OutgoingCallConfiguration, CallLogHistoryConfiguration, CallLogParticipantsConfiguration, CallLogRecordingsConfiguration, CallLogDetailsStyle, CallLogHistoryStyle, CallLogParticipantsStyle, CallLogRecordingsStyle, WithDetailsStyle, CallLogDetailsConfiguration, CallLogsConfiguration, AddMembersStyle, BannedMembersStyle, ConversationsStyle, WithMessagesStyle, MessagesConfiguration, ConversationsConfiguration, ContactsConfiguration, AddMembersConfiguration, BannedMembersConfiguration, GroupMembersConfiguration, TransferOwnershipConfiguration, DetailsStyle, GroupMembersStyle, GroupsStyle, GroupsConfiguration, CreateGroupConfiguration, JoinGroupConfiguration, MessageComposerStyle, UserMemberWrapperConfiguration, MessageHeaderStyle, MessageListStyle, MessageInformationConfiguration, ReactionsConfiguration, MessageHeaderConfiguration, MessageListConfiguration, MessageComposerConfiguration, ThreadedMessagesConfiguration, DetailsConfiguration, MessagesStyle, TransferOwnershipStyle, UsersStyle, UsersConfiguration, ContactsStyle, MessageInformationStyle, AIAssistBotConfiguration, AIConversationStarterConfiguration, AISmartRepliesConfiguration, AIConversationSummaryConfiguration, CometChatReactions } from '@cometchat/uikit-shared';
export * from '@cometchat/uikit-shared';
import { CometChat as CometChat$1 } from '@cometchat/chat-sdk-javascript';
import * as _lit_labs_react from '@lit-labs/react';

interface IMentionsProps {
    userMemberListType?: UserMemberListType;
    onItemClick?: (user: CometChat.User | CometChat.GroupMember) => void;
    listItemView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;
    avatarStyle?: AvatarStyle;
    statusIndicatorStyle?: CSSProperties;
    searchKeyword?: string;
    group?: CometChat.Group;
    subtitleView?: (item?: CometChat.User | CometChat.GroupMember) => JSX.Element;
    usersRequestBuilder?: CometChat.UsersRequestBuilder;
    disableUsersPresence?: boolean;
    userPresencePlacement?: UserPresencePlacement;
    hideSeparator?: boolean;
    loadingStateView?: JSX.Element;
    onEmpty?: () => void;
    groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    loadingIconUrl?: string;
    disableLoadingState?: boolean;
    onError?: () => void;
}
declare function CometChatUserMemberWrapper(props: IMentionsProps): react_jsx_runtime.JSX.Element;

declare abstract class AIExtensionDataSource {
    abstract addExtension(): void;
    abstract getExtensionId(): string;
    enable(): void;
}

declare abstract class ExtensionsDataSource {
    abstract addExtension(): void;
    abstract getExtensionId(): string;
    enable(): void;
}

declare class CometChatUIKit {
    static uiKitSettings: UIKitSettings | null;
    static SoundManager: typeof CometChatSoundManager;
    static Localize: typeof CometChatLocalize;
    static conversationUpdateSettings: CometChat.ConversationUpdateSettings;
    static init(uiKitSettings: UIKitSettings | null): Promise<Object> | undefined;
    static defaultExtensions: ExtensionsDataSource[];
    static defaultAIFeatures: AIExtensionDataSource[];
    static enableCalling(): void;
    private static initiateAfterLogin;
    static login(uid: string): Promise<CometChat.User>;
    static loginWithAuthToken(authToken: string): Promise<CometChat.User>;
    static getLoggedinUser(): Promise<CometChat.User | null>;
    static createUser(user: CometChat.User): Promise<CometChat.User>;
    static updateUser(user: CometChat.User): Promise<CometChat.User>;
    static logout(): Promise<Object>;
    static checkAuthSettings(): boolean;
    /**
     * Sends a form message and emits events based on the message status.
     * @param message - The form message to be sent.
     * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
     */
    static sendFormMessage(message: FormMessage, disableLocalEvents?: boolean): void;
    static sendCardMessage(message: CardMessage, disableLocalEvents?: boolean): void;
    static sendCustomInteractiveMessage(message: CustomInteractiveMessage, disableLocalEvents?: boolean): void;
    static sendCustomMessage(message: CometChat.CustomMessage): Promise<unknown>;
    static sendTextMessage(message: CometChat.TextMessage): Promise<unknown>;
    static sendMediaMessage(message: CometChat.MediaMessage): Promise<unknown>;
    static sendSchedulerMessage(message: SchedulerMessage, disableLocalEvents?: boolean): Promise<unknown>;
    static getDataSource(): DataSource;
}

declare abstract class DataSource {
    abstract getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    abstract getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    abstract getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    abstract getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    abstract getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    abstract getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignment): any;
    abstract getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, otherParams: any): any;
    abstract getImageMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    abstract getVideoMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    abstract getAudioMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    abstract getFileMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    abstract getFormMessageContentView(message: FormMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    abstract getSchedulerMessageContentView(message: SchedulerMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    abstract getCardMessageContentView(message: CardMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    abstract getTextMessageTemplate(theme: CometChatTheme, additionalConfigurations?: any): CometChatMessageTemplate;
    abstract getImageMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getVideoMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getAudioMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getFileMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getFormMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getSchedulerMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getCardMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getGroupActionTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    abstract getAllMessageTemplates(theme?: CometChatTheme, additionalConfigurations?: any): Array<CometChatMessageTemplate>;
    abstract getMessageTemplate(messageType: string, messageCategory: string, theme?: CometChatTheme): CometChatMessageTemplate | null;
    abstract getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    abstract getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    abstract getAttachmentOptions(theme: CometChatTheme, id: ComposerId$1): CometChatMessageComposerAction[];
    abstract getAllMessageTypes(): Array<string>;
    abstract getAllMessageCategories(): Array<string>;
    abstract getAuxiliaryOptions(id: Map<String, any>, theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group): any;
    abstract getId(): string;
    abstract getDeleteMessageBubble(messageObject: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle): any;
    abstract getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle): any;
    abstract getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, style?: TextBubbleStyle, additionalConfigurations?: any): any;
    abstract getVideoMessageBubble(videoUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, thumbnailUrl?: string, onClick?: Function, style?: BaseStyle): any;
    abstract getImageMessageBubble(imageUrl: string, placeholderImage: string, message: CometChat.MediaMessage, theme: CometChatTheme, onClick?: Function, style?: ImageBubbleStyle): any;
    abstract getAudioMessageBubble(audioUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: BaseStyle): any;
    abstract getFileMessageBubble(fileUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: FileBubbleStyle): any;
    abstract getFormMessageBubble(message: FormMessage, theme: CometChatTheme, style?: FormBubbleStyle, onSubmitClick?: Function): any;
    abstract getSchedulerMessageBubble(message: SchedulerMessage, theme: CometChatTheme, style?: SchedulerBubbleStyle, onSubmitClick?: Function): any;
    abstract getCardMessageBubble(message: CardMessage, theme: CometChatTheme, style?: CardBubbleStyle): any;
    abstract getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
    abstract getDefaultDetailsTemplate(loggedInUser: CometChat.User, user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme): CometChatDetailsTemplate[];
    abstract getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group): any;
    abstract getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: Map<String, any>, AIOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    abstract getAllTextFormatters(formatterParams: any): CometChatTextFormatter[];
    abstract getMentionsTextFormatter(params: any): CometChatMentionsFormatter;
    abstract getUrlTextFormatter(params: any): CometChatUrlsFormatter;
    abstract getMentionsFormattedText(message: CometChat.TextMessage, subtitle: string, additionalConfigurations?: any): string;
}

declare class ChatConfigurator {
    static dataSource: DataSource;
    static names: Array<string>;
    static init(initialSource?: DataSource): void;
    static enable(callback: (dataSource: DataSource) => DataSource): void;
    static getDataSource(): DataSource;
}

declare abstract class DataSourceDecorator implements DataSource {
    dataSource: DataSource;
    constructor(dataSource: DataSource);
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignment): any;
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, additionalConfigurations?: any): any;
    getImageMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getVideoMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getAudioMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getFileMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getFormMessageContentView(message: FormMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getSchedulerMessageContentView(message: SchedulerMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getCardMessageContentView(message: CardMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getTextMessageTemplate(theme: CometChatTheme, additionalConfigurations?: any): CometChatMessageTemplate;
    getImageMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getVideoMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getAudioMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getFileMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getGroupActionTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getFormMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getSchedulerMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getCardMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getAllMessageTemplates(theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getMessageTemplate(messageType: string, messageCategory: string, theme?: CometChatTheme | undefined): CometChatMessageTemplate | null;
    getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getAttachmentOptions(theme: CometChatTheme, id: ComposerId$1): CometChatMessageComposerAction[];
    getAllMessageTypes(): string[];
    getAllMessageCategories(): string[];
    getAuxiliaryOptions(id: Map<String, any>, theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group): any;
    getId(): string;
    getDeleteMessageBubble(messageObject: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle): any;
    getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle): any;
    getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, style?: TextBubbleStyle, additionalConfigurations?: any): any;
    getVideoMessageBubble(videoUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, thumbnailUrl?: string, onClick?: Function, style?: BaseStyle): any;
    getImageMessageBubble(imageUrl: string, placeholderImage: string, message: CometChat.MediaMessage, theme: CometChatTheme, onClick?: Function, style?: ImageBubbleStyle): any;
    getAudioMessageBubble(audioUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: BaseStyle): any;
    getFileMessageBubble(fileUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: FileBubbleStyle): any;
    getFormMessageBubble(message: FormMessage, theme: CometChatTheme, style?: FormBubbleStyle, onSubmitClick?: Function): any;
    getSchedulerMessageBubble(message: SchedulerMessage, theme: CometChatTheme, style?: SchedulerBubbleStyle, onSubmitClick?: Function): any;
    getCardMessageBubble(message: CardMessage, theme: CometChatTheme, style?: CardBubbleStyle): any;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
    getDefaultDetailsTemplate(loggedInUser: CometChat.User, user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme): CometChatDetailsTemplate[];
    getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group): any;
    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: Map<String, any>, AIOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    getAllTextFormatters(formatterParams: any): CometChatTextFormatter[];
    getMentionsTextFormatter(params?: any): CometChatMentionsFormatter;
    getUrlTextFormatter(params?: any): CometChatUrlsFormatter;
    getMentionsFormattedText(message: CometChat.TextMessage, subtitle: string, additionalConfigurations: any): string;
}

declare class MessagesDataSource implements DataSource {
    getEditOption(theme: CometChatTheme): CometChatActionsIcon;
    getDeleteOption(theme: CometChatTheme): CometChatActionsIcon;
    getReactionOption(theme: CometChatTheme): CometChatActionsView;
    getReplyInThreadOption(theme: CometChatTheme): CometChatActionsIcon;
    getSendMessagePrivatelyOption(theme: CometChatTheme): CometChatActionsIcon;
    getCopyOption(theme: CometChatTheme): CometChatActionsIcon;
    getMessageInfoOption(theme: CometChatTheme): CometChatActionsIcon;
    isSentByMe(loggedInUser: CometChat.User, message: CometChat.BaseMessage): boolean;
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getBottomView(_messageObject: CometChat.BaseMessage, _alignment: MessageBubbleAlignment): null;
    getTextMessageTemplate(theme: CometChatTheme, additionalConfigurations?: any): CometChatMessageTemplate;
    getAudioMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getVideoMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getImageMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getGroupActionTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getFileMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getFormMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getSchedulerMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getCardMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate;
    getAllMessageTemplates(theme?: CometChatTheme, additionalConfigurations?: any): Array<CometChatMessageTemplate>;
    getMessageTemplate(messageType: string, messageCategory: string, theme?: CometChatTheme, additionalConfigurations?: any): CometChatMessageTemplate | null;
    getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView>;
    getAllMessageTypes(): Array<string>;
    addList(): string;
    getAllMessageCategories(): Array<string>;
    getAuxiliaryOptions(id: Map<String, any>, theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group): any;
    getId(): string;
    getTextMessageContentView(message: CometChat.TextMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme, additionalConfigurations?: any): any;
    getAudioMessageContentView(message: CometChat.MediaMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getFileMessageContentView(message: CometChat.MediaMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getFormMessageContentView(message: FormMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getSchedulerMessageContentView(message: SchedulerMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getCardMessageContentView(message: CardMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getImageMessageContentView(message: CometChat.MediaMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getVideoMessageContentView(message: CometChat.MediaMessage, _alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    getActionMessage(message: any): string;
    getDeleteMessageBubble(message: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle): react_jsx_runtime.JSX.Element;
    getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle): react_jsx_runtime.JSX.Element;
    getTextMessageBubbleStyle(alignment: MessageBubbleAlignment, theme: CometChatTheme): {
        textFont: string;
        textColor: string;
    };
    getFormMessageBubbleStyle(theme: CometChatTheme): FormBubbleStyle;
    getSchedulerBubbleStyle: (theme: CometChatTheme) => SchedulerBubbleStyle;
    getCardMessageBubbleStyle(theme: CometChatTheme): CardBubbleStyle;
    getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, style?: TextBubbleStyle, additionalConfigurations?: any): any;
    getAudioMessageBubble(audioUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: BaseStyle): any;
    getFileMessageBubble(fileUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: FileBubbleStyle): any;
    getFormMessageBubble(message: FormMessage, theme: CometChatTheme, style?: any, onSubmitClick?: Function): any;
    getSchedulerMessageBubble(message: SchedulerMessage, theme: CometChatTheme, style?: any, onSubmitClick?: (timestamp: string, message: SchedulerMessage) => void): any;
    getSchedulerWrapperStyle(): {
        height: string;
        width: string;
        display: string;
    };
    getCardMessageBubble(message: CardMessage, theme: CometChatTheme, style?: CardBubbleStyle): any;
    getImageMessageBubble(imageUrl: string, placeholderImage: string, message: CometChat.MediaMessage, theme: CometChatTheme, onClick?: Function, style?: ImageBubbleStyle): react_jsx_runtime.JSX.Element;
    getVideoMessageBubble(videoUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, thumbnailUrl?: string, onClick?: Function, style?: BaseStyle): any;
    imageAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    videoAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    audioAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    fileAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    getAttachmentOptions(theme: CometChatTheme, id: ComposerId$1): Array<CometChatMessageComposerAction>;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
    getDefaultDetailsTemplate(loggedInUser: CometChat.User, user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme): CometChatDetailsTemplate[];
    getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group): any;
    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: Map<String, any>, AIOptionsStyle?: AIOptionsStyle): Array<CometChatMessageComposerAction | CometChatActionsView>;
    /**
     * Adds styled @ for every mention in the text by matching uid
     *
     * @param {CometChat.TextMessage} message
     * @param {string} subtitle
     * @returns {void}
     */
    getMentionsFormattedText(message: CometChat.TextMessage, subtitle: string, mentionsFormatterParams: {
        mentionsTargetElement: MentionsTargetElement;
        theme: CometChatTheme;
    }): string;
    getAllTextFormatters(formatterParams: any): CometChatTextFormatter[];
    getMentionsTextFormatter(params: any): CometChatMentionsFormatter;
    getUrlTextFormatter(params?: any): CometChatUrlsFormatter;
}

declare const CometChatThemeContext: React$1.Context<{
    theme: CometChatTheme;
}>;

/**
 * TabsStyle
 *
 * @property {string} height - The height of the component.
 * @property {string} width - The width of the component.
 * @property {string} border - The border of the component.
 * @property {string} borderRadius - The border radius of the component.
 * @property {string} background - The background color of the component.
 * @property {string} tabListHeight - The height of the tab list.
 * @property {string} tabListWidth - The width of the tab list.
 * @property {string} tabListBorder - The border of the tab list.
 * @property {string} tabListBorderRadius - The border radius of the tab list.
 * @property {string} tabListBackground - The background color of the tab list.
 * @property {string} tabListBoxShadow - The box shadow of the tab list.
 * @property {string} tabListPadding - The padding of the tab list.
 * @property {string} tabPaneWidth - The width of the tab pane.
 * @property {string} tabPaneHeight - The height of the tab pane.
 */
declare class TabsStyle extends BaseStyle$1 {
    tabListHeight?: string;
    tabListWidth?: string;
    tabListBorder?: string;
    tabListBorderRadius?: string;
    tabListBackground?: string;
    tabListBoxShadow?: string;
    tabListPadding?: string;
    tabPaneWidth?: string;
    tabPaneHeight?: string;
    constructor(props: Partial<TabsStyle>);
}

interface TabsProps {
    tabAlignment?: TabAlignment;
    tabsStyle?: TabsStyle;
    tabs: CometChatTabItem[];
    keepAlive?: boolean;
    tabIconAlignment?: IconButtonAlignment;
}
declare const CometChatTabs: {
    (props: TabsProps): react_jsx_runtime.JSX.Element;
    defaultProps: TabsProps;
};

interface IListProps<T> {
    /**
     * Title of the component
     *
     * @defaultValue `""`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Text to fill the search input with
     *
     * @defaultValue `""`
     */
    searchText?: string;
    /**
     * Function to call when the search input text changes
     *
     * @remarks
     * This function will only be called after 500ms of the search input text change
     */
    onSearch?: (searchStr: string) => void;
    /**
     * Image URL for the search icon to use in the search bar
     */
    searchIconURL?: string;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `"Search"`
     */
    searchPlaceholderText?: string;
    /**
     * List of objects to display
     */
    list: T[];
    /**
     * Custom list item view to be rendered for each object in the `list` prop
     */
    listItem: (item: T, itemIndex: number) => JSX$1.Element;
    /**
     * Function to call when the scrollbar is at the top-most position of the scrollable list
     */
    onScrolledToBottom?: () => Promise<any>;
    /**
     * Function to call when the scrollbar is at the bottom-most position of the scrollable list
     */
    onScrolledToTop?: () => Promise<any>;
    /**
     * Function to call when the scrollbar is not at the bottom-most position of the scrollable list
     */
    scrolledUpCallback?: (boolean?: boolean) => void;
    /**
     * Show alphabetical header
     *
     * @defaultValue `true`
     */
    showSectionHeader?: boolean;
    /**
     * Property on each object in the `list` prop
     *
     * @remarks
     * This property will be used to extract the section header character from each object in the `list` prop
     */
    sectionHeaderKey?: keyof T;
    /**
     * Property on each object in the `list` prop
     *
     * @remarks
     * This property will be used to extract the key value from each object in the `list` prop. The extracted key value is set as a `key` of a React element
     */
    listItemKey?: keyof T;
    /**
     * Fetch state of the component
     */
    state: States;
    /**
     * Custom view for the loading state of the component
     */
    loadingView?: JSX$1.Element;
    /**
     * Image URL for the default loading view
     */
    loadingIconURL?: string;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX$1.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `"ERROR"`
     */
    errorStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX$1.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `"EMPTY"`
     */
    emptyStateText?: string;
    /**
     * Set the scrollbar to the bottom-most position of the scrollable list
     *
     * @remarks
     * If the scrollbar of the scrollable list is set to the bottom-most position of the scrollable list because of this `prop`, the component won't call the `onScrolledToBottom` prop
     */
    scrollToBottom?: boolean;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Styles to apply to this component
     */
    listStyle?: ListStyle;
    theme?: CometChatTheme;
}
declare function List<T>(props: IListProps<T>): JSX$1.Element;
/**
 * Renders a scrollable list
 */
declare const CometChatList: typeof List;

declare class CollaborativeDocumentConfiguration {
    private style;
    private iconURL;
    private optionIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: DocumentBubbleStyle;
        iconURL?: string;
        optionIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getDocumentBubbleStyle(): DocumentBubbleStyle;
    getIconURL(): string;
    getOptionIconURL(): string;
    getOptionStyle(): OptionsStyle;
}

declare class CollaborativeDocumentExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: CollaborativeDocumentConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class CollaborativeDocumentExtensionDecorator extends DataSourceDecorator {
    configuration?: CollaborativeDocumentConfiguration;
    newDataSource: DataSource;
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: CollaborativeDocumentConfiguration);
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(_theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getDocumentTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getDocumentContentView(documentMessage: CometChat.CustomMessage, _theme: CometChatTheme): react_jsx_runtime.JSX.Element;
    launchCollaborativeDocument(documentURL: string): void;
    getDocumentURL(message: CometChat.CustomMessage): any;
    getAttachmentOptions(theme: CometChatTheme, id: any): CometChatMessageComposerAction[];
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
}

declare class CollaborativeWhiteboardConfiguration {
    private style;
    private iconURL;
    private optionIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: DocumentBubbleStyle;
        iconURL?: string;
        optionIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getWhiteboardBubbleStyle(): DocumentBubbleStyle;
    getIconURL(): string;
    getOptionIconURL(): string;
    getOptionStyle(): OptionsStyle;
}

declare class CollaborativeWhiteboardExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: CollaborativeWhiteboardConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class CollaborativeWhiteBoardExtensionDecorator extends DataSourceDecorator {
    configuration?: CollaborativeWhiteboardConfiguration;
    newDataSource: DataSource;
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: CollaborativeWhiteboardConfiguration);
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getWhiteBoardTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getWhiteboardContentView(whiteboardMessage: CometChat.CustomMessage, _theme: CometChatTheme): react_jsx_runtime.JSX.Element;
    launchCollaborativeWhiteboardDocument(whiteboardURL: string): void;
    getWhiteboardDocument(message: CometChat.CustomMessage): any;
    getAttachmentOptions(theme: CometChatTheme, id: any): CometChatMessageComposerAction[];
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
}

declare class ImageModerationConfiguration {
    private style;
    private confirmDialogStyle;
    private backDropStyle;
    constructor(configuration: {
        style?: ImageModerationStyle;
        confirmDialogStyle?: ConfirmDialogStyle;
        backDropStyle?: BaseStyle$1;
    });
    getImageModerationStyle(): ImageModerationStyle;
    getConfirmDialogSyle(): ConfirmDialogStyle;
    getBackDropStyle(): BaseStyle$1;
}

declare class ImageModerationExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: ImageModerationConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class ImageModerationExtensionDecorator extends DataSourceDecorator {
    configuration?: ImageModerationConfiguration;
    newDataSource: DataSource;
    private theme;
    loggedInUser: CometChat.User;
    constructor(dataSource: DataSource, configuration?: ImageModerationConfiguration);
    getId(): string;
    getImageMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): any;
    showDialog(_event: any): void;
    getConfirmationModal(_event: any): react_jsx_runtime.JSX.Element;
    onConfirmClicked(_event: any): void;
    onCancelClicked(): void;
    getImageModerationStyle(_theme: CometChatTheme): {
        filterColor: string | undefined;
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        warningTextColor: string | undefined;
        warningTextFont: string;
    };
}

declare class LinkPreviewConfiguration {
    private style;
    constructor(configuration: {
        style?: LinkPreviewStyle;
    });
    getLinkPreviewStyle(): LinkPreviewStyle;
}

declare class LinkPreviewExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: LinkPreviewConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class LinkPreviewExtensionDecorator extends DataSourceDecorator {
    configuration?: LinkPreviewConfiguration;
    newDataSource: DataSource;
    constructor(dataSource: DataSource, configuration?: LinkPreviewConfiguration);
    getId(): string;
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, additionalConfigurations?: any): any;
    getLinkPreviewWrapperStyle(): {
        height: string;
        width: string;
    };
    openLink(event: any): void;
    getLinkPreviewStyle(_theme: CometChatTheme): LinkPreviewStyle;
    getTextMessageStyle(_alignment: MessageBubbleAlignment, _theme: CometChatTheme): {
        textFont: string;
        textColor: string;
    };
    getLinkPreview(message: CometChat.TextMessage): any;
    getLinkPreviewDetails(linkPreviewObject: any, key: string): string;
}

declare class MessageTranslationConfiguration {
    private style;
    private optionIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: MessageTranslationStyle;
        optionIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getMessageTranslationStyle(): MessageTranslationStyle;
    getOptionIconURL(): string;
    getOptionStyle(): OptionsStyle;
}

declare class MessageTranslationExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: MessageTranslationConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class MessageTranslationExtensionDecorator extends DataSourceDecorator {
    configuration?: MessageTranslationConfiguration;
    newDataSource: DataSource;
    constructor(dataSource: DataSource, configuration?: MessageTranslationConfiguration);
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): (CometChatActionsIcon | CometChatActionsView)[];
    getTranslationStyle: (_alignment: MessageBubbleAlignment, _theme: CometChatTheme) => MessageTranslationStyle;
    getTextMessageStyle(_alignment: MessageBubbleAlignment, _theme: CometChatTheme): {
        textFont: string;
        textColor: string;
    };
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, additionalConfigurations?: any): any;
    checkIfOptionExist(template: (CometChatActionsIcon | CometChatActionsView)[], id: string): boolean;
    getId(): string;
}

declare class PollsConfiguration {
    private style;
    private createPollStyle;
    private createPollIconURL;
    private deleteIconURL;
    private closeIconURL;
    private optionIconURL;
    private addAnswerIconURL;
    private optionStyle;
    constructor(configuration: {
        style?: PollsBubbleStyle;
        createPollStyle?: CreatePollStyle;
        createPollIconURL?: string;
        deleteIconURL?: string;
        closeIconURL?: string;
        optionIconURL?: string;
        addAnswerIconURL?: string;
        optionStyle?: OptionsStyle;
    });
    getPollsBubbleStyle(): PollsBubbleStyle;
    getCreatePollStyle(): CreatePollStyle;
    getCreatePollIconURL(): string;
    getDeleteIconURL(): string;
    getCloseIconURL(): string;
    getOptionIconURL(): string;
    getAddAnswerIconURL(): string;
    getOptionStyle(): OptionsStyle;
}

declare class PollsExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: PollsConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class PollsExtensionDecorator extends DataSourceDecorator {
    theme: CometChatTheme;
    private loggedInUser;
    configuration?: PollsConfiguration;
    newDataSource: DataSource;
    constructor(dataSource: DataSource, configuration?: PollsConfiguration);
    getLoggedInUser(): Promise<void>;
    getId(): string;
    getAllMessageTypes(): string[];
    getAllMessageCategories(): string[];
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageTemplates(_theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getPollsTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getPollsContentView(message: CometChat.CustomMessage, _theme: CometChatTheme): react_jsx_runtime.JSX.Element;
    getPollBubbleData(message: CometChat.CustomMessage, key?: string): any;
    getAttachmentOptions(theme: CometChatTheme, id: any): CometChatMessageComposerAction[];
    onPollsButtonClicked(theme: CometChatTheme, ...args: any[]): void;
    getPollView(user: CometChat.User, group: CometChat.Group, createPollStyle: CreatePollStyle): react_jsx_runtime.JSX.Element;
    triggerCloseEvent(): void;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
}

declare class SmartRepliesConfiguration {
    private style;
    constructor(configuration: {
        style?: SmartRepliesStyle;
    });
    getSmartRepliesStyle(): SmartRepliesStyle;
}

declare class SmartReplyExtension extends ExtensionsDataSource {
    private configuration?;
    private theme?;
    constructor(configuration?: SmartRepliesConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class SmartReplyExtensionDecorator extends DataSourceDecorator {
    configuration?: SmartRepliesConfiguration;
    theme?: CometChatTheme;
    private LISTENER_ID;
    private activeUser;
    private activeGroup;
    currentMessage: CometChat.BaseMessage | null;
    loggedInUser: CometChat.User | null;
    constructor(dataSource: DataSource, configuration?: SmartRepliesConfiguration, theme?: CometChatTheme);
    private addMessageListener;
    getReplies(message: CometChat.TextMessage): any[] | null;
    getSmartReplyStyle(): {
        replyTextFont: string;
        replyTextColor: string | undefined;
        replyBackground: string;
        boxShadow: string;
        closeIconTint: string | undefined;
        background: string;
        width: string;
        height: string;
        border: string;
        display: string;
        justifyContent: string;
    };
    sendSmartReply(_event: any): void;
    closeSmartReply(): void;
    getSmartReplyButtonStyle(): React__default.CSSProperties;
    getSmartReplyView(message: CometChat.TextMessage): react_jsx_runtime.JSX.Element | null;
    getId(): string;
}

declare class StickersConfiguration {
    private style;
    private stickerIconURL;
    private closeIconURL;
    constructor(configuration: {
        style?: StickersStyle;
        stickerIconURL?: string;
        closeIconURL?: string;
    });
    getStickersStyle(): StickersStyle;
    getStickerIconURL(): string;
    getCloseIconURL(): string;
}

declare class StickersExtension extends ExtensionsDataSource {
    private configuration?;
    constructor(configuration?: StickersConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class StickersExtensionDecorator extends DataSourceDecorator {
    configuration?: StickersConfiguration;
    newDataSource: DataSource;
    showStickerKeyboard: boolean;
    theme: CometChatTheme;
    private id;
    private user;
    private group;
    constructor(dataSource: DataSource, configuration?: StickersConfiguration);
    getDataSource(): DataSource;
    getAllMessageTemplates(theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getAuxiliaryOptions(id: Map<String, any>, theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group): any;
    getStickerAuxiliaryButton(id: Map<String, any>, theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group): react_jsx_runtime.JSX.Element;
    sendSticker(event: any): void;
    getSticker(message: CometChat.CustomMessage): any;
    getStickerMessageContentView(stickerMessage: CometChat.CustomMessage, _theme: CometChatTheme): react_jsx_runtime.JSX.Element;
    getStickerTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getAllMessageCategories(): string[];
    getAllMessageTypes(): string[];
    getId(): string;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
}

declare class TextModeratorExtension extends ExtensionsDataSource {
    addExtension(): void;
    getExtensionId(): string;
    enable(): void;
}

declare class TextModeratorExtensionDecorator extends DataSourceDecorator {
    getId(): string;
    getModeratedtext(message: CometChat.TextMessage): string;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, additionalConfigurations?: any): any;
}

declare class ThumbnailGenerationExtension extends ExtensionsDataSource {
    addExtension(): void;
    getExtensionId(): string;
}

declare class ThumbnailGenerationExtensionDecorator extends DataSourceDecorator {
    getId(): string;
    getImageMessageBubble(imageUrl: string, placeholderImage: string, message: CometChat.MediaMessage, theme: CometChatTheme, onClick?: Function, style?: ImageBubbleStyle): any;
    getVideoMessageBubble(videoUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, thumbnailUrl?: string, onClick?: Function, style?: BaseStyle): any;
}

declare class CallingExtension extends ExtensionsDataSource {
    enable(): void;
    addExtension(): void;
    getExtensionId(): string;
}

declare class CallingExtensionDecorator extends DataSourceDecorator {
    theme: CometChatTheme;
    loggedInUser: CometChat.User | null;
    constructor(dataSource: DataSource);
    addLoginListener(): void;
    getLoggedInUser(): Promise<void>;
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateTypeExist(template: CometChatMessageTemplate[], type: string): boolean;
    checkIfTemplateCategoryExist(template: CometChatMessageTemplate[], category: string): boolean;
    getAllMessageTemplates(_theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getDirectCallTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getDefaultCallTemplate(_theme: CometChatTheme): CometChatMessageTemplate[];
    getCallBubbleStyle(_alignment: MessageBubbleAlignment, _theme: CometChatTheme): {
        titleFont: string;
        titleColor: string | undefined;
        iconTint: string | undefined;
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        buttonBackground: string | undefined;
        width: string;
        background: string | undefined;
        borderRadius: string;
    } | {
        titleFont: string;
        titleColor: string | undefined;
        iconTint: string | undefined;
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        buttonBackground: string | undefined;
        width: string;
        borderRadius: string;
        background?: undefined;
    };
    getSessionId(_message: CometChat.CustomMessage): any;
    getCallBubbleTitle(_message: CometChat.CustomMessage): any;
    getDirectCallMessageBubble(_message: CometChat.CustomMessage, _alignment: MessageBubbleAlignment, _theme: CometChatTheme): react_jsx_runtime.JSX.Element;
    startDirectCall(sessionId: string, theme: CometChatTheme): void;
    callStatusStyle(_message: CometChat.Call, theme: CometChatTheme): {
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        borderRadius: string;
        border: string;
        buttonIconTint: string | undefined;
        background: string;
        iconBackground: string;
        padding: string;
        gap: string;
        height: string;
        justifyContent: string;
    } | {
        buttonTextFont?: undefined;
        buttonTextColor?: undefined;
        borderRadius?: undefined;
        border?: undefined;
        buttonIconTint?: undefined;
        background?: undefined;
        iconBackground?: undefined;
        padding?: undefined;
        gap?: undefined;
        height?: undefined;
        justifyContent?: undefined;
    };
    getCallActionMessage(_message: CometChat.Call): string;
    getDefaultAudioCallMessageBubble(_message: CometChat.Call, _alignment: MessageBubbleAlignment, _theme: CometChatTheme): react_jsx_runtime.JSX.Element;
    getDefaultVideoCallMessageBubble(_message: CometChat.Call, _alignment: MessageBubbleAlignment, _theme: CometChatTheme): react_jsx_runtime.JSX.Element;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalParams?: any): string;
    getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group): any[];
}

interface ICallButtonsBaseProps {
    voiceCallIconURL?: string;
    voiceCallIconText?: string;
    voiceCallIconHoverText?: string;
    videoCallIconURL?: string;
    videoCallIconText?: string;
    videoCallIconHoverText?: string;
    callButtonsStyle?: CallButtonsStyle;
    onVoiceCallClick?: () => void;
    onVideoCallClick?: () => void;
    onError?: (error: CometChat$1.CometChatException) => void;
}
interface ICallButtonsUserProps extends ICallButtonsBaseProps {
    user: CometChat$1.User;
    group?: CometChat$1.Group | null;
}
interface ICallButtonsGroupProps extends ICallButtonsBaseProps {
    user?: CometChat$1.User | null;
    group: CometChat$1.Group;
}
type ICallButtonsProps = ICallButtonsUserProps | ICallButtonsGroupProps;
declare const CometChatCallButtons: {
    (props: ICallButtonsProps): react_jsx_runtime.JSX.Element;
    defaultProps: {
        voiceCallIconURL: string;
        voiceCallIconText: any;
        voiceCallIconHoverText: any;
        videoCallIconURL: string;
        videoCallIconText: any;
        videoCallIconHoverText: any;
        callButtonsStyle: {
            width: string;
            height: string;
            border: string;
            borderRadius: string;
            background: string;
        };
        onVoiceCallClick: undefined;
        onVideoCallClick: undefined;
        onError: (error: CometChat$1.CometChatException) => void;
    };
};

interface IIncomingCallProps {
    call?: any;
    disableSoundForCalls?: boolean;
    customSoundForCalls?: string;
    onAccept?: Function;
    onDecline?: Function;
    acceptButtonText?: string;
    declineButtonText?: string;
    subtitleView?: any;
    onError?: Function;
    listItemStyle?: ListItemStyle;
    avatarStyle?: AvatarStyle;
    incomingCallStyle?: IncomingCallStyle;
}
declare const CometChatIncomingCall: (props: IIncomingCallProps) => react_jsx_runtime.JSX.Element;

interface IOngoingCallProps {
    callSettingsBuilder?: typeof CometChatUIKitCalls.CallSettings;
    sessionID: string;
    ongoingCallStyle?: CallscreenStyle;
    resizeIconHoverText?: string;
    minimizeIconURL?: string;
    maximizeIconURL?: string;
    onError?: Function;
    callWorkflow?: CallWorkflow;
}
declare const CometChatOngoingCall: {
    (props: IOngoingCallProps): react_jsx_runtime.JSX.Element;
    defaultProps: IOngoingCallProps;
};

interface IOutgoingCallProps {
    call: CometChat.Call;
    disableSoundForCalls?: boolean;
    customSoundForCalls?: string;
    declineButtonText?: string;
    declineButtonIconURL?: string;
    customView?: any;
    onError?: Function;
    avatarStyle?: AvatarStyle;
    outgoingCallStyle?: OutgoingCallStyle;
    onCloseClicked?: Function;
}
declare const CometChatOutgoingCall: (props: IOutgoingCallProps) => react_jsx_runtime.JSX.Element;

interface ICallLogsProps {
    title?: string;
    titleAlignment?: TitleAlignment;
    listItemView?: any;
    subtitleView?: any;
    tailView?: any;
    emptyStateView?: any;
    errorStateView?: any;
    loadingStateView?: any;
    emptyStateText?: string;
    errorStateText?: string;
    loadingIconURL?: string;
    incomingAudioCallIconUrl?: string;
    incomingVideoCallIconUrl?: string;
    outgoingAudioCallIconUrl?: string;
    outgoingVideoCallIconUrl?: string;
    missedAudioCallIconUrl?: string;
    missedVideoCallIconUrl?: string;
    infoIconUrl?: string;
    activeCall?: any;
    callLogRequestBuilder?: any;
    onItemClick?: Function;
    onInfoClick?: Function;
    onError?: Function;
    hideSeparator?: boolean;
    datePattern?: DatePatterns;
    dateSeparatorPattern?: DatePatterns;
    callLogsStyle?: CallLogsStyle;
    avatarStyle?: AvatarStyle;
    listItemStyle?: ListItemStyle;
    outgoingCallConfiguration?: OutgoingCallConfiguration;
}
declare const CometChatCallLogs: {
    (props: ICallLogsProps): react_jsx_runtime.JSX.Element;
    defaultProps: ICallLogsProps;
};

interface ICallLogDetailsProps {
    title?: string;
    backIconUrl?: string;
    call: CometChat$1.Call;
    onBackClick?: Function;
    avatarStyle?: AvatarStyle;
    data?: (callLog: any, loggedInUser: CometChat$1.User, theme: CometChatTheme) => CometChatDetailsTemplate[];
    callLogHistoryConfiguration?: CallLogHistoryConfiguration;
    callLogParticipantsConfiguration?: CallLogParticipantsConfiguration;
    callLogRecordingsConfiguration?: CallLogRecordingsConfiguration;
    callLogDetailsStyle?: CallLogDetailsStyle;
}
declare const CometChatCallLogDetails: {
    (props: ICallLogDetailsProps): react_jsx_runtime.JSX.Element;
    defaultProps: {
        title: any;
        backIconUrl: string;
        onBackClick: undefined;
        avatarStyle: AvatarStyle;
        data: (callLog: any, loggedInUser: CometChat$1.User, theme: CometChatTheme) => CometChatDetailsTemplate[];
        callLogHistoryConfiguration: CallLogHistoryConfiguration;
        callLogParticipantsConfiguration: CallLogParticipantsConfiguration;
        callLogRecordingsConfiguration: CallLogRecordingsConfiguration;
        callLogDetailsStyle: CallLogDetailsStyle;
    };
};

interface ICallLogHistoryProps {
    title?: string;
    emptyStateText?: string;
    errorStateText?: string;
    backIconUrl?: string;
    loadingIconURL?: string;
    emptyStateView?: any;
    loadingStateView?: any;
    errorStateView?: any;
    subtitleView?: any;
    tailView?: any;
    callLogRequestBuilder?: any;
    callUser?: any;
    callGroup?: any;
    onItemClick?: Function;
    onBackClick?: Function;
    onError?: Function;
    datePattern?: DatePatterns;
    dateSeparatorPattern?: DatePatterns;
    listItemStyle?: ListItemStyle;
    callLogHistoryStyle?: CallLogHistoryStyle;
}
declare const CometChatCallLogHistory: {
    (props: ICallLogHistoryProps): react_jsx_runtime.JSX.Element;
    defaultProps: ICallLogHistoryProps;
};

interface ICallLogParticipantsProps {
    title?: string;
    backIconUrl?: string;
    call: any;
    datePattern?: DatePatterns;
    avatarStyle?: AvatarStyle;
    listItemStyle?: ListItemStyle;
    callLogParticipantsStyle?: CallLogParticipantsStyle;
    listItemView?: any;
    subtitleView?: any;
    tailView?: any;
    onBackClick?: Function;
    onItemClick?: Function;
}
declare const CometChatCallLogParticipants: {
    (props: ICallLogParticipantsProps): react_jsx_runtime.JSX.Element;
    defaultProps: ICallLogParticipantsProps;
};

interface ICallLogRecordingsProps {
    title?: string;
    backIconUrl?: string;
    downloadIconUrl?: string;
    hideDownloadButton?: boolean;
    call: any;
    datePattern?: DatePatterns;
    listItemStyle?: ListItemStyle;
    callLogRecordingsStyle?: CallLogRecordingsStyle;
    onBackClick?: Function;
    onItemClick?: Function;
    onDownloadClick?: Function;
    listItemView?: any;
    subtitleView?: any;
    tailView?: any;
}
declare const CometChatCallLogRecordings: {
    (props: ICallLogRecordingsProps): react_jsx_runtime.JSX.Element;
    defaultProps: ICallLogRecordingsProps;
};

interface ICallLogWithDetailsProps {
    isMobileView?: boolean;
    messageText?: string;
    withDetailsStyle?: WithDetailsStyle;
    callLogDetailsConfiguration?: CallLogDetailsConfiguration;
    callLogsConfiguration?: CallLogsConfiguration;
}
declare const CometChatCallLogsWithDetails: {
    (props: ICallLogWithDetailsProps): react_jsx_runtime.JSX.Element;
    defaultProps: ICallLogWithDetailsProps;
};

interface IAddMembersProps {
    /**
     * Image URL for the back button
     *
     * @remarks
     * This prop will also be used if `backButton` prop is not provided
     *
     * @defaultValue `./assets/backbutton.svg`
     */
    backButtonIconURL?: string;
    /**
     * Show back button
     *
     * @defaultValue `true`
     */
    showBackButton?: boolean;
    /**
     * Function to call when the back button is clicked
     */
    onBack?: () => void;
    /**
     * Title of the component
     *
     * @defaultValue `localize("ADD_MEMBERS")`
    */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder?: string;
    /**
     * Show alphabetical header
     *
     * @defaultValue `false`
     */
    showSectionHeader?: boolean;
    /**
     * Property on the user object
     *
     * @remarks
     * This property will be used to extract the section header character from the user object
     *
     * @defaultValue `getName`
     */
    sectionHeaderField?: keyof CometChat.User;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX$1.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX$1.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX$1.Element;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX$1.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (user: CometChat.User) => CometChatOption[];
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.multiple`
     */
    selectionMode?: SelectionMode;
    /**
     * Function to call when a user from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (user: CometChat.User, selected: boolean) => void;
    /**
     * Request builder to fetch users
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    usersRequestBuilder?: CometChat.UsersRequestBuilder;
    /**
     * Request builder with search parameters to fetch users
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.UsersRequestBuilder;
    /**
     * Custom list item view to be rendered for each user in the fetched list
     */
    listItemView?: (user: CometChat.User) => JSX$1.Element;
    /**
     * Custom subtitle view to be rendered for each user in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (user: CometChat.User) => JSX$1.Element;
    /**
     * Group to add members to
     */
    group: CometChat.Group;
    /**
     * Function to call when add button of the component is clicked
     *
     * @remarks
     * This function won't be call if no users are selected
     */
    onAddMembersButtonClick?: (guid: string, membersToAdd: CometChat.GroupMember[]) => void;
    /**
     * Text to display for the default add button
     *
     * @defaultValue `localize("ADD_MEMBERS")`
     */
    buttonText?: string;
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string;
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to this component
     */
    addMembersStyle?: AddMembersStyle;
}
/**
 * Renders a scrollable list of users to add to a group of a CometChat App
 */
declare function CometChatAddMembers(props: IAddMembersProps): react_jsx_runtime.JSX.Element;

interface IBannedMembersProps {
    /**
     * Image URL for the back button
     *
     * @defaultValue `./assets/backbutton.svg`
     */
    backButtonIconURL?: string;
    /**
     * Show back button
     *
     * @defaultValue `true`
     */
    showBackButton?: boolean;
    /**
     * Function to call when the back button is clicked
     */
    onBack?: () => void;
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX$1.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("BANNED_MEMBERS")`
    */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder?: string;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Hide the search bar
     *
     * @defaulValue `true`
     */
    hideSearch?: boolean;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX$1.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("")`
     */
    emptyStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX$1.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX$1.Element;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Group to ban members from
     */
    group: CometChat.Group;
    /**
     * Request builder to fetch banned members
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    bannedMembersRequestBuilder?: CometChat.BannedMembersRequestBuilder;
    /**
     * Request builder with search parameters to fetch banned members
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.BannedMembersRequestBuilder;
    /**
     * Custom list item view to be rendered for each banned member in the fetched list
     */
    listItemView?: (bannedMember: CometChat.GroupMember) => JSX$1.Element;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `true`
     */
    disableUsersPresence?: boolean;
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string;
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void;
    /**
     * Custom subtitle view to be rendered for each banned member in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (bannedMember: CometChat.GroupMember) => JSX$1.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (bannedMember: CometChat.GroupMember) => CometChatOption[];
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     *
     */
    unbanIconURL?: string;
    /**
     * Function to call on click of the default list item view of a banned member
     */
    onItemClick?: (bannedMember: CometChat.GroupMember) => void;
    /**
     * Function to call when a banned member from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (bannedMember: CometChat.GroupMember, selected: boolean) => void;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to this component
     */
    bannedMemberStyle?: BannedMembersStyle;
}
/**
 * Renders a scrollable list of banned members related to a group of a CometChat App
 */
declare function CometChatBannedMembers(props: IBannedMembersProps): react_jsx_runtime.JSX.Element;

interface IConversationsProps {
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX$1.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("CHATS")`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Request builder to fetch conversations
     * @defaultValue Default request builder having the limit set to 30
     */
    conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: (error: CometChat.CometChatException) => void;
    /**
     * Custom list item view to be rendered for each conversation in the fetched list
     */
    listItemView?: (conversation: CometChat.Conversation) => JSX$1.Element;
    /**
     * Custom subtitle view to be rendered for each conversation in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (conversation: CometChat.Conversation) => JSX$1.Element;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed for conversation objects related to users
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Conversation to highlight
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeConversation?: CometChat.Conversation;
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     * Disable receipt status
     *
     * @remarks
     * If set to true, the receipt status of the sent message won't be displayed, and received messages won't be marked as delivered
     *
     * @defaultValue `false`
     */
    disableReceipt?: boolean;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: ((conversation: CometChat.Conversation) => CometChatOption[]) | null;
    /**
     * Date format for the date component
     *
     * @remarks
     * The date component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    datePattern?: DatePatterns;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.8 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
     */
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a password-protected group
     *
     * @defaultValue `./assets/locked.svg`
     */
    protectedGroupIcon?: string;
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a password-protected group
     *
     * @defaultValue {undefined}
     */
    passwordGroupIcon?: string;
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a private group
     *
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon?: string;
    /**
     * Image URL for the read status of the sent message
     *
     * @defaultValue `./assets/message-read.svg`
     */
    readIcon?: string;
    /**
     * Image URL for the delivered status of the sent message
     *
     * @defaultValue `./assets/message-delivered.svg`
     */
    deliveredIcon?: string;
    /**
     * Image URL for the wait status of the sent message
     *
     * @defaultValue `./assets/wait.svg`
     */
    waitIcon?: string;
    /**
     * Image URL for the error status of the sent message
     *
     * @defaultValue `./assets/warning-small.svg`
     */
    errorIcon?: string;
    /**
     * Image URL for the sent status of the sent message
     *
     * @defaultValue `./assets/message-sent.svg`
     */
    sentIcon?: string;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX$1.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_CHATS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX$1.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX$1.Element;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Function to call on click of the default list item view of a conversation
     */
    onItemClick?: (conversation: CometChat.Conversation) => void;
    /**
     * Function to call when a conversation from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (conversation: CometChat.Conversation, selected: boolean) => void;
    /**
     * Disable sound for incoming messages
     *
     * @defaulValue `false`
     */
    disableSoundForMessages?: boolean;
    /**
     * Disable typing indicator display
     *
     * @defaultValue `false`
     */
    disableTyping?: boolean;
    /**
     * Custom audio sound for incoming messages
     */
    customSoundForMessages?: string;
    /**
     * Styles to apply to this component
     */
    conversationsStyle?: ConversationsStyle;
    /**
     * Styles to apply to the delete conversation dialog component
     */
    deleteConversationDialogStyle?: ConfirmDialogStyle;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to the badge component
     *
     * @remarks
     * The badge component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    badgeStyle?: BadgeStyle;
    /**
     * Styles to apply to the receipt component
     *
     * @remarks
     * The receipt component is rendered conditionally inside the subtitle view of the default list item view
     */
    receiptStyle?: ReceiptStyle;
    /**
     * Styles to apply to the date component
     *
     * @remarks
     * The date component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    dateStyle?: DateStyle;
    /**
     * Styles to apply to the backdrop component
     */
    backdropStyle?: BaseStyle;
    confirmDialogTitle?: string;
    confirmDialogMessage?: string;
    cancelButtonText?: string;
    confirmButtonText?: string;
    disableMentions?: boolean;
    textFormatters?: CometChatTextFormatter[];
}
/**
 * Renders a scrollable list of conversations that has been created in a CometChat app
 */
declare function CometChatConversations(props: IConversationsProps): react_jsx_runtime.JSX.Element;

interface IConversationsWithMessagesProps {
    user?: CometChat.User;
    group?: CometChat.Group;
    isMobileView?: boolean;
    messageText?: string;
    conversationsWithMessagesStyle?: WithMessagesStyle;
    messagesConfiguration?: MessagesConfiguration;
    conversationsConfiguration?: ConversationsConfiguration;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    startConversationConfiguration?: ContactsConfiguration;
    startConversationIconURL?: string;
}
declare const CometChatConversationsWithMessages: {
    (props: IConversationsWithMessagesProps): react_jsx_runtime.JSX.Element;
    defaultProps: IConversationsWithMessagesProps;
};

interface IDetailsProps {
    /**
     * User to display details of
     */
    user?: CometChat.User;
    /**
     * Group to display details of
     *
     * @remarks
     * This prop is used if `user` prop is not provided
     */
    group?: CometChat.Group;
    /**
     * Custom profile view
     *
     * @remarks
     * This prop is used only if `hideProfile` is set to `false`
     */
    customProfileView?: (user?: CometChat.User, group?: CometChat.Group) => JSX$1.Element;
    /**
     * Custom subtitle view for the `user` or `group` prop
     *
     * @remarks
     * This prop is used only if `hideProfile` is set `false` & `customProfileView` prop is not provided
     */
    subtitleView?: (user?: CometChat.User, group?: CometChat.Group) => JSX$1.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("DETAILS")`
    */
    title?: string;
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string;
    /**
     * Text to display for the cancel button
     */
    cancelButtonText?: string;
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default profile view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Hide profile
     *
     * @defaultValue `false`
     */
    hideProfile?: boolean;
    /**
     * Image URL for the status indicator icon of a private group
     *
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon?: string;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.8 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
     */
    /**
     * Image URL for the status indicator icon of a password-protected group
     *
     * @defaultValue `./assets/locked.svg`
     */
    protectedGroupIcon?: string;
    /**
       * Image URL for the status indicator icon of a password-protected group
       *
       * @defaultValue {undefined}
       */
    passwordGroupIcon?: string;
    /**
     * Function to create a list of `CometChatTemplate` instances from the `user` or `group` prop
     */
    data?: CometChatDetailsTemplate[];
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: (error: CometChat.CometChatException) => void;
    /**
     * Text to display for the confirm button of the leave confirm modal
     *
     * @defaultValue `localize("LEAVE_GROUP")`
     */
    leaveButtonText?: string;
    /**
     * Message to display for the leave confirm modal
     *
     * @defaultValue `localize("LEAVE_CONFIRM")`
     */
    leaveConfirmDialogMessage?: string;
    /**
     * Text to display for the confirm button of the transfer ownership confirm modal
     *
     * @defaultValue `localize("TRANSFER_OWNERSHIP")`
     */
    transferButtonText?: string;
    /**
     * Message to display for the transfer onwership confirm modal
     *
     * @defaultValue `localize("LEAVE_CONFIRM")`
     */
    transferConfirmDialogMessage?: string;
    /**
     * Text to display for the confirm button of the delete confirm modal
     *
     * @defaultValue `localize("DELETE")`
     */
    deleteButtonText?: string;
    /**
     * Message to display for the delete confirm modal
     *
     * @defaultValue `localize("DELETE_CONFIRM")`
     */
    deleteConfirmDialogMessage?: string;
    /**
     * `CometChatAddMembers` configuration
     */
    addMembersConfiguration?: AddMembersConfiguration;
    /**
     * `CometChatBannedMembers` configuration
     */
    bannedMembersConfiguration?: BannedMembersConfiguration;
    /**
     * `CometChatGroupMembers` configuration
     */
    groupMembersConfiguration?: GroupMembersConfiguration;
    /**
     * `CometChatTransferOwnership` configuration
     */
    transferOwnershipConfiguration?: TransferOwnershipConfiguration;
    /**
     * Styles to apply to the default profile view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to the status indicator component of the default profile view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default profile view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the leave group confirm dialog component
     */
    leaveDialogStyle?: ConfirmDialogStyle;
    deleteDialogStyle?: ConfirmDialogStyle;
    /**
     * Styles to apply to the backdrop component
     */
    backdropStyle?: BaseStyle;
    /**
     * Styles to apply to this component
     */
    detailsStyle?: DetailsStyle;
}
/**
 * Renders details view of a user or group of a CometChat App
 */
declare function CometChatDetails(props: IDetailsProps): react_jsx_runtime.JSX.Element | null;

interface IGroupMembersProps {
    /**
     * Image URL for the back button
     *
     * @defaultValue `./assets/backbutton.svg`
     */
    backButtonIconURL?: string;
    /**
     * Show back button
     *
     * @defaultValue `true`
     */
    showBackButton?: boolean;
    /**
     * Function to call when the default back button is clicked
     */
    onBack?: () => void;
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX$1.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("MEMBERS")`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder?: string;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Request builder to fetch group members
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    /**
     * Request builder with search parameters to fetch group members
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    /**
     * Group the fetched groupMembers belong to
     */
    group: CometChat.Group;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX$1.Element;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX$1.Element;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX$1.Element;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.8 due to newer property 'errorStateView'. It will be removed in subsequent versions.
     */
    errorSateView?: JSX$1.Element;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `true`
     */
    hideSeparator?: boolean;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Custom subtitle view to be rendered for each group member in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (groupMember: CometChat.GroupMember) => JSX$1.Element;
    /**
     * Custom list item view to be rendered for each group member in the fetched list
     */
    listItemView?: (groupMember: CometChat.GroupMember) => JSX$1.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (group: CometChat.Group, groupMember: CometChat.GroupMember) => CometChatOption[];
    /**
     * Image URL for the change scope component's `arrowIconURL` prop
     *
     * @defaultValue `./assets/down-arrow.svg`
     */
    dropDownIconURL?: string;
    /**
     * View to be placed in the tail view
     *
     * @remarks
     * This prop will be used if `listItemView` is not provided
     */
    tailView?: (groupMember: CometChat.GroupMember) => JSX$1.Element;
    /**
     * Selection mode to use for the default list item view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     * Function to call on click of the default list item view of a group member
     */
    onItemClick?: (groupMember: CometChat.GroupMember) => void;
    /**
     * Function to call when a group member from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (groupMember: CometChat.GroupMember, selected: boolean) => void;
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string;
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to the change scope component
     */
    groupScopeStyle?: ChangeScopeStyle;
    /**
     * Styles to apply to this component
     */
    groupMembersStyle?: GroupMembersStyle;
    /**
     * Search keyword to filter the list of users.
     *
     * @defaultValue `""`
     */
    searchKeyword?: string;
    /**
     * Callback function to be executed when the user list is empty.
     */
    onEmpty?: () => void;
    /**
     * Timeout reference for fetching users.
     */
    fetchTimeOut?: any;
    /**
     * Placement of user presence information within the user interface.
     * @defaultValue `bottom`
     */
    userPresencePlacement?: UserPresencePlacement;
    /**
     * Flag to indicate whether to disable loading state while fetching users.
     * @defaultValue `false`
     */
    disableLoadingState?: boolean;
}
declare function CometChatGroupMembers(props: IGroupMembersProps): react_jsx_runtime.JSX.Element;

interface IGroupsProps {
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX$1.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("GROUPS")`
    */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholderText?: string;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Request builder to fetch groups
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
    /**
     * Request builder with search parameters to fetch groups
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.GroupsRequestBuilder;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Custom list item view to be rendered for each group in the fetched list
     */
    listItemView?: (group: CometChat.Group) => JSX$1.Element;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Custom subtitle view to be rendered for each group in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (group: CometChat.Group) => JSX$1.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (group: CometChat.Group) => CometChatOption[];
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     * Function to call when a group from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (group: CometChat.Group, selected: boolean) => void;
    /**
     * Function to call on click of the default list item view of a group
     */
    onItemClick?: (group: CometChat.Group) => void;
    /**
     * Group to highlight
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeGroup?: CometChat.Group;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX$1.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_GROUPS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX$1.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX$1.Element;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Image URL for the status indicator icon in the default list item view of a password-protected group
     *
     * @defaultValue `./assets/locked.svg`
     */
    passwordGroupIcon?: string;
    /**
     * Image URL for the status indicator icon in the default list item view of a private group
     *
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon?: string;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to this component
     */
    groupsStyle?: GroupsStyle;
}
/**
 * Renders a scrollable list of groups that has been created in a CometChat app
 */
declare function CometChatGroups(props: IGroupsProps): react_jsx_runtime.JSX.Element;

interface IGroupsWithMessagesProps {
    group?: CometChat.Group;
    isMobileView?: boolean;
    messageText?: string;
    groupsWithMessagesStyle?: WithMessagesStyle;
    messagesConfiguration?: MessagesConfiguration;
    groupsConfiguration?: GroupsConfiguration;
    createGroupConfiguration?: CreateGroupConfiguration;
    joinGroupConfiguration?: JoinGroupConfiguration;
    onError?: ((error: CometChat.CometChatException) => void) | null;
}
declare const CometChatGroupsWithMessages: {
    (props: IGroupsWithMessagesProps): react_jsx_runtime.JSX.Element;
    defaultProps: IGroupsWithMessagesProps;
};

interface IMessageBubbleProps {
    id: any;
    setRef?: (ref: any) => void;
    leadingView: any;
    headerView: any;
    replyView: any;
    contentView: any;
    bottomView: any;
    threadView: any;
    footerView: any;
    statusInfoView?: any;
    options: (CometChatActionsIcon | CometChatActionsView)[];
    alignment: MessageBubbleAlignment;
    messageBubbleStyle: BaseStyle$1;
    moreIconURL?: string;
    topMenuSize?: number;
}
declare const CometChatMessageBubble: (props: IMessageBubbleProps) => react_jsx_runtime.JSX.Element;

type ComposerId = {
    parentMessageId: number | null;
    user: string | null;
    group: string | null;
};
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
    sendButtonView?: (userOrGroup: CometChat.User | CometChat.Group, composerId: ComposerId) => JSX$1.Element;
    /**
     * Function to call whenever a new text message is sent
     */
    onSendButtonClick?: (message: CometChat.BaseMessage, previewMessageMode?: PreviewMessageMode) => void;
    /**
     * Custom secondary button view
     */
    secondaryButtonView?: (userOrGroup: CometChat.User | CometChat.Group, composerId: ComposerId) => JSX$1.Element;
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
    auxiliaryButtonView?: (userOrGroup: CometChat.User | CometChat.Group, composerId: ComposerId) => JSX$1.Element;
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
    headerView?: JSX$1.Element;
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
    mentionsWarningStyle?: React__default.CSSProperties;
}
/**
 * Renders a message composer to send messages to a user or group of a CometChat App
 */
declare function CometChatMessageComposer(props: IMessageComposerProps): react_jsx_runtime.JSX.Element;

interface IMessageHeaderProps {
    avatarStyle?: AvatarStyle;
    statusIndicatorStyle?: BaseStyle;
    messageHeaderStyle?: MessageHeaderStyle;
    listItemStyle?: ListItemStyle;
    subtitleView?: any;
    disableUsersPresence?: boolean;
    disableTyping?: boolean;
    /**
  * @deprecated
  *
  * This property is deprecated as of version 4.3.8 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
  */
    protectedGroupIcon?: string;
    passwordGroupIcon?: string | undefined;
    privateGroupIcon?: string;
    menu?: any;
    user?: CometChat.User;
    group?: CometChat.Group;
    backButtonIconURL?: string;
    hideBackButton?: boolean;
    listItemView?: any;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    onBack?: () => void;
}
declare const CometChatMessageHeader: (props: IMessageHeaderProps) => react_jsx_runtime.JSX.Element;

interface IMessageListProps {
    parentMessageId?: number;
    user?: CometChat.User;
    group?: CometChat.Group;
    emptyStateText?: string;
    errorStateText?: string;
    emptyStateView?: any;
    errorStateView?: any;
    loadingStateView?: any;
    disableReceipt?: boolean;
    disableSoundForMessages?: boolean;
    customSoundForMessages?: string;
    readIcon?: string;
    deliveredIcon?: string;
    sentIcon?: string;
    waitIcon?: string;
    errorIcon?: string;
    loadingIconURL?: string;
    alignment?: MessageListAlignment;
    showAvatar?: boolean;
    datePattern?: DatePatterns;
    timestampAlignment?: TimestampAlignment;
    DateSeparatorPattern?: DatePatterns;
    hideDateSeparator?: boolean;
    templates?: CometChatMessageTemplate[];
    messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
    newMessageIndicatorText?: string;
    scrollToBottomOnNewMessages?: boolean;
    thresholdValue?: number;
    onThreadRepliesClick?: Function;
    headerView?: any;
    footerView?: any;
    avatarStyle?: AvatarStyle;
    dateSeparatorStyle?: DateStyle;
    messageListStyle?: MessageListStyle;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    hideError?: boolean;
    messageInformationConfiguration?: MessageInformationConfiguration;
    reactionsConfiguration?: ReactionsConfiguration;
    disableReactions?: boolean;
    emojiKeyboardStyle?: EmojiKeyboardStyle;
    threadIndicatorIcon?: string;
    disableMentions?: boolean;
    textFormatters?: CometChatTextFormatter[];
    backdropStyle?: BackdropStyle;
}
declare const CometChatMessageList: {
    (props: IMessageListProps): react_jsx_runtime.JSX.Element;
    defaultProps: IMessageListProps;
};

interface IMessagesProps {
    user?: CometChat.User;
    group?: CometChat.Group;
    hideMessageComposer?: boolean;
    disableTyping?: boolean;
    messageHeaderConfiguration?: MessageHeaderConfiguration;
    messageListConfiguration?: MessageListConfiguration;
    messageComposerConfiguration?: MessageComposerConfiguration;
    threadedMessagesConfiguration?: ThreadedMessagesConfiguration;
    detailsConfiguration?: DetailsConfiguration;
    customSoundForIncomingMessages?: string;
    customSoundForOutgoingMessages?: string;
    disableSoundForMessages?: boolean;
    messagesStyle?: MessagesStyle;
    messageHeaderView?: any;
    messageComposerView?: any;
    messageListView?: any;
    hideMessageHeader?: boolean;
    hideDetails?: boolean;
    auxiliaryMenu?: any;
}
declare const CometChatMessages: {
    (props: IMessagesProps): react_jsx_runtime.JSX.Element | null;
    defaultProps: IMessagesProps;
};

interface IThreadedMessagesProps {
    parentMessage: CometChat.BaseMessage;
    title?: string;
    closeIconURL?: string;
    bubbleView: any;
    messageActionView?: any;
    onClose?: any;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    threadedMessagesStyle?: any;
    messageListConfiguration?: any;
    messageComposerConfiguration?: any;
    hideMessageComposer?: boolean;
    messageComposerView?: (user?: CometChat.User, group?: CometChat.Group, parentMessage?: CometChat.BaseMessage) => JSX.Element;
    messageListView?: (user?: CometChat.User, group?: CometChat.Group, parentMessage?: CometChat.BaseMessage) => JSX.Element;
}
declare const CometChatThreadedMessages: (props: IThreadedMessagesProps) => react_jsx_runtime.JSX.Element;

interface ITransferOwnershipProps {
    /**
     * Group to transfer ownership of
     */
    group: CometChat.Group;
    /**
     * Title of the component
     *
     * @defaultValue `localize("TRANSFER_OWNERSHIP")`
    */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder?: string;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Request builder to fetch group members
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    /**
     * Request builder with search parameters to fetch group members
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX.Element;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string;
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void;
    /**
     * Custom list item view to be rendered for each group member in the fetched list
     */
    listItemView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    /**
     * Custom subtitle view to be rendered for each group member in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    transferButtonText?: string;
    onTransferOwnership?: (groupMember: CometChat.GroupMember) => void;
    /**
     * Text to display for the cancel button
     */
    cancelButtonText?: string;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (group: CometChat.Group, groupMember: CometChat.GroupMember) => CometChatOption[];
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to the `CometChatGroupMembers` component
     */
    groupMemberStyle?: GroupMembersStyle;
    /**
     * Styles to apply to this component
     */
    transferOwnershipStyle?: TransferOwnershipStyle;
}
/**
 * Renders transfer ownership view related to a group of a CometChat App
 */
declare function CometChatTransferOwnership(props: ITransferOwnershipProps): react_jsx_runtime.JSX.Element;

interface IUsersProps {
    /**
     * Title of the component
     *
     * @defaultValue `localize("USERS")`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    tileAlignment?: TitleAlignment;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholderText?: string;
    /**
     * Custom list item view to be rendered for each user in the fetched list
     */
    listItemView?: (user: CometChat.User) => JSX$1.Element;
    /**
     * Show alphabetical header
     *
     * @defaultValue `true`
     */
    showSectionHeader?: boolean;
    /**
     * Property on the user object
     *
     * @remarks
     * This property will be used to extract the section header character from the user object
     *
     * @defaultValue `getName`
     */
    sectionHeaderKey?: keyof CometChat.User;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX$1.Element;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX$1.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX$1.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom subtitle view to be rendered for each user in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (user: CometChat.User) => JSX$1.Element;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX$1.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (user: CometChat.User) => CometChatOption[];
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     * Function to call when a user from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (users: CometChat.User, selected: boolean) => void;
    /**
     * Request builder to fetch users
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    usersRequestBuilder?: CometChat.UsersRequestBuilder;
    /**
     * Request builder with search parameters to fetch users
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.UsersRequestBuilder;
    /**
     * Function to call on click of the default list item view of a user
     */
    onItemClick?: (user: CometChat.User) => void;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to this component
     */
    usersStyle?: UsersStyle;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * User to highlight
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeUser?: CometChat.User;
    /**
     * Search keyword to filter the list of users.
     *
     * @defaultValue `""`
     */
    searchKeyword?: string;
    /**
     * Callback function to be executed when the user list is empty.
     */
    onEmpty?: () => void;
    /**
     * Flag to indicate whether users are currently being fetched.
     *
     * @defaultValue `false`
     */
    fetchingUsers?: boolean;
    /**
     * Timeout reference for fetching users.
     */
    fetchTimeOut?: any;
    /**
     * Placement of user presence information within the user interface.
     * @defaultValue `bottom`
     */
    userPresencePlacement?: UserPresencePlacement;
    /**
     * Flag to indicate whether to disable loading state while fetching users.
     * @defaultValue `false`
     */
    disableLoadingState?: boolean;
    /**
     * URL of the icon to be used for the close button.
     */
    closeButtonIconURL?: string;
}
/**
 * Renders a scrollable list of users that has been created in a CometChat app
 */
declare function CometChatUsers(props: IUsersProps): react_jsx_runtime.JSX.Element;

interface IUsersWithMessagesProps {
    user?: CometChat.User;
    isMobileView?: boolean;
    messageText?: string;
    usersWithMessagesStyle?: WithMessagesStyle;
    messagesConfiguration?: MessagesConfiguration;
    usersConfiguration?: UsersConfiguration;
    onError?: Function;
}
declare const CometChatUsersWithMessages: {
    (props: IUsersWithMessagesProps): react_jsx_runtime.JSX.Element;
    defaultProps: IUsersWithMessagesProps;
};

interface ContactsProps {
    title?: string;
    usersTabTitle?: string;
    groupsTabTitle?: string;
    usersConfiguration?: UsersConfiguration;
    groupsConfiguration?: GroupsConfiguration;
    onSubmitButtonClick?: (users?: CometChat.User[], groups?: CometChat.Group[]) => void;
    closeIconURL?: string;
    onClose?: () => void;
    onItemClick?: (user?: CometChat.User, group?: CometChat.Group) => void;
    onError: ((error: CometChat.CometChatException) => void) | null;
    submitButtonText?: string;
    hideSubmitButton?: boolean;
    selectionLimit?: number;
    tabVisibility?: TabsVisibility;
    contactsStyle: ContactsStyle;
    selectionMode?: SelectionMode;
}
declare const CometChatContacts: {
    (props: ContactsProps): react_jsx_runtime.JSX.Element;
    defaultProps: ContactsProps;
};

interface MessageInformationProps {
    title?: string;
    message: CometChat.BaseMessage;
    template?: CometChatMessageTemplate;
    closeIconURL?: string;
    bubbleView?: (messageObject: CometChat.BaseMessage) => void | JSX.Element;
    listItemView?: (messageObject: CometChat.BaseMessage, messageReceipt?: CometChat.MessageReceipt) => JSX.Element;
    subtitleView?: (messageObject: CometChat.BaseMessage, messageReceipt?: CometChat.MessageReceipt) => void | JSX.Element;
    receiptDatePattern?: (timestamp: number) => string;
    onClose?: () => void;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    messageInformationStyle?: MessageInformationStyle;
    readIcon?: string;
    deliveredIcon?: string;
    listItemStyle?: ListItemStyle;
    emptyStateText?: any;
    emptyStateView?: any;
    loadingIconURL?: string;
    loadingStateView?: any;
    errorStateText?: any;
    errorStateView?: any;
    backdropStyle?: BackdropStyle;
}
declare const CometChatMessageInformation: (props: MessageInformationProps) => react_jsx_runtime.JSX.Element;

declare class AIAssistBotExtension extends AIExtensionDataSource {
    private configuration?;
    constructor(configuration?: AIAssistBotConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class AIAssistBotDecorator extends DataSourceDecorator {
    configuration?: AIAssistBotConfiguration;
    newDataSource: DataSource;
    loggedInUser: CometChat$1.User | null;
    user: CometChat$1.User;
    group: CometChat$1.Group;
    bots: CometChat$1.User[] | [];
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: AIAssistBotConfiguration);
    getId(): string;
    getAIOptions(user: CometChat$1.User | null, group: CometChat$1.Group | null, theme: CometChatTheme, id?: any, aiOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    onMessageSent: (message: string, bot: CometChat$1.User) => Promise<string>;
    closeChat: () => void;
    onOptionClick: (bot: CometChat$1.User) => void;
    private getAllBots;
    private addMessageListener;
}

declare class AIConversationStarterExtension extends AIExtensionDataSource {
    private configuration?;
    constructor(configuration?: AIConversationStarterConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class AIConversationStarterDecorator extends DataSourceDecorator {
    configuration?: AIConversationStarterConfiguration;
    newDataSource: DataSource;
    currentMessage: CometChat.BaseMessage | null;
    loggedInUser: CometChat.User | null;
    user: CometChat.User;
    group: CometChat.Group;
    theme: CometChatTheme;
    constructor(dataSource: DataSource, configuration?: AIConversationStarterConfiguration);
    getId(): string;
    editReply(reply: string): void;
    closeIfMessageReceived(message: CometChat.BaseMessage): void;
    getConversationStarter: (theme?: CometChatTheme) => Promise<string[]>;
    private loadConversationStarter;
    private addMessageListener;
}

declare class AISmartRepliesExtension extends AIExtensionDataSource {
    private configuration?;
    constructor(configuration?: AISmartRepliesConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

type ButtonStyle = {
    buttonTextFont?: string;
    buttonTextColor?: string;
    buttonIconTint?: string;
} & CSSProperties;
interface ICometChatButtonProps {
    text?: string;
    hoverText?: string;
    iconURL?: string;
    disabled?: boolean;
    buttonStyle?: ButtonStyle;
    onClick?: (customEvent: CustomEvent<{
        event: PointerEvent;
    }>) => void;
    childRefCallback?: (ref: React.RefObject<typeof CometChatButton>) => void;
}
declare function CometChatButton(props: ICometChatButtonProps): react_jsx_runtime.JSX.Element;

declare class AISmartRepliesDecorator extends DataSourceDecorator {
    configuration?: AISmartRepliesConfiguration;
    newDataSource: DataSource;
    loggedInUser: CometChat.User | null;
    user: CometChat.User;
    group: CometChat.Group;
    theme: CometChatTheme;
    buttonRef: any;
    isModalClosed: boolean;
    private closeCallback?;
    constructor(dataSource: DataSource, configuration?: AISmartRepliesConfiguration);
    childRefCallback: (childRef: React__default.RefObject<typeof CometChatButton>) => void;
    getId(): string;
    editReply(reply: string): void;
    closeIfMessageReceived(message: CometChat.BaseMessage): void;
    getSmartReplies: (theme?: CometChatTheme) => Promise<string[]>;
    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, aiOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    private addMessageListener;
}

declare class AIConversationSummaryExtension extends AIExtensionDataSource {
    private configuration?;
    constructor(configuration?: AIConversationSummaryConfiguration);
    addExtension(): void;
    getExtensionId(): string;
}

declare class AIConversationSummaryDecorator extends DataSourceDecorator {
    configuration?: AIConversationSummaryConfiguration;
    newDataSource: DataSource;
    currentMessage: CometChat.BaseMessage | null;
    unreadMessageCount: number;
    loggedInUser: CometChat.User | null;
    user: CometChat.User;
    group: CometChat.Group;
    theme: CometChatTheme;
    private LISTENER_ID;
    constructor(dataSource: DataSource, configuration?: AIConversationSummaryConfiguration);
    getId(): string;
    closePanel: () => void;
    getConversationSummary: (theme?: CometChatTheme) => Promise<string>;
    private loadConversationSummary;
    getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, aiOptionsStyle?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
    private addMessageListener;
}

/**
 * Converts Lit web components into React components using the createComponent function from lit labs. This conversion allows these components to be seamlessly integrated and used within a React application while preserving their original functionalities and event handling capabilities.
 **/
/**
 * Converts CometChatReactions Lit web component to a React component using createComponent from lit labs. This can be used to show a list of reactions for a particular message. It can be customized using the style class of this component.For more details, go to [CometChatReactions](https://www.cometchat.com/docs-beta/ui-kit/react/reaction)
 *
 */
declare const CometChatReactionsView: _lit_labs_react.ReactWebComponent<CometChatReactions, {}>;
/**
 * Converts CometChatEmojiKeyboard Lit web component to a React component using createComponent from lit labs. This can be used to show a list of emojis, which returns a particular emoji on click. It can be customized using the style class of this component.For more details, go to [CometChatEmojiKeyboard](https://www.cometchat.com/docs-beta/ui-kit/react/emoji-keyboard)
 *
 */
declare const CometChatEmojiKeyboardView: _lit_labs_react.ReactWebComponent<CometChatEmojiKeyboard, {
    onEmojiClick: string;
}>;
/**
 * Converts CometChatIconButton Lit web component to a React component using createComponent from lit labs. This can be used to display a button which has an icon, a button, or both. It can be customized using the style class of this component.For more details, go to [CometChatIconButton](https://www.cometchat.com/docs-beta/ui-kit/react/icon-button)
 */
declare const CometChatIconButtonView: _lit_labs_react.ReactWebComponent<CometChatIconButton, {
    buttonClick: string;
}>;
/**
 * Converts CometChatButton Lit web component to a React component using createComponent from lit labs. It can be used to display a button with customizable text. It can be customized using the style class of this component.
 */
declare const CometChatButtonView: _lit_labs_react.ReactWebComponent<CometChatButton$1, {
    buttonClick: string;
}>;
/**
 * Converts CometChatDate Lit web component to a React component using createComponent from lit labs. It can be used to display a date in different time formats by providing the enum and timestamp. It can be customized using the style class of this component.For more details, go to [CometChatDate](https://www.cometchat.com/docs-beta/ui-kit/react/date)
 */
declare const CometChatDateView: _lit_labs_react.ReactWebComponent<CometChatDate, {}>;
/**
 * Converts CometChatLabel Lit web component to a React component using createComponent from lit labs. It can be used to display normal text or a title with customizable text. It can be customized using the style class of this component.For more details, go to [CometChatLabel](https://www.cometchat.com/docs-beta/ui-kit/react/label)
 */
declare const CometChatLabelView: _lit_labs_react.ReactWebComponent<CometChatLabel, {}>;
/**
 * Converts CometChatLoader Lit web component to a React component using createComponent from lit labs. It can be used to display a loading icon which is customizable. By default, it has a loading icon inside the component. It can be customized using the style class of this component.For more details, go to [CometChatLoader](https://www.cometchat.com/docs-beta/ui-kit/react/loader)
 */
declare const CometChatLoaderView: _lit_labs_react.ReactWebComponent<CometChatLoader, {}>;
/**
 * Converts CometChatAvatar Lit web component to a React component using createComponent from lit labs. It can be used to display a user/group image with a fallback name if the URL is not present. It can be customized using the style class of this component. For more details, go to [CometChatAvatar](https://www.cometchat.com/docs-beta/ui-kit/react/avatar)
 */
declare const CometChatAvatarView: _lit_labs_react.ReactWebComponent<CometChatAvatar, {}>;
/**
 * Converts CometChatReceipt Lit web component to a React component using createComponent from lit labs. It can be used to display various types of receipt statuses for a message (like sent, delivered, etc.) which can be customized by sending the enum for which state to be shown. It can be customized using the style class of this component.For more details, go to [CometChatReceipt](https://www.cometchat.com/docs-beta/ui-kit/react/receipt)
 */
declare const CometChatReceiptView: _lit_labs_react.ReactWebComponent<CometChatReceipt, {}>;

export { AIAssistBotDecorator, AIAssistBotExtension, AIConversationStarterDecorator, AIConversationStarterExtension, AIConversationSummaryDecorator, AIConversationSummaryExtension, AIExtensionDataSource, AISmartRepliesDecorator, AISmartRepliesExtension, CallingExtension, CallingExtensionDecorator, ChatConfigurator, CollaborativeDocumentConfiguration, CollaborativeDocumentExtension, CollaborativeDocumentExtensionDecorator, CollaborativeWhiteBoardExtensionDecorator, CollaborativeWhiteboardConfiguration, CollaborativeWhiteboardExtension, CometChatAddMembers, CometChatAvatarView, CometChatBannedMembers, CometChatButtonView, CometChatCallButtons, CometChatCallLogDetails, CometChatCallLogHistory, CometChatCallLogParticipants, CometChatCallLogRecordings, CometChatCallLogs, CometChatCallLogsWithDetails, CometChatContacts, CometChatConversations, CometChatConversationsWithMessages, CometChatDateView, CometChatDetails, CometChatEmojiKeyboardView, CometChatGroupMembers, CometChatGroups, CometChatGroupsWithMessages, CometChatIconButtonView, CometChatIncomingCall, CometChatLabelView, CometChatList, CometChatLoaderView, CometChatMessageBubble, CometChatMessageComposer, CometChatMessageHeader, CometChatMessageInformation, CometChatMessageList, CometChatMessages, CometChatOngoingCall, CometChatOutgoingCall, CometChatReactionsView, CometChatReceiptView, CometChatTabs, CometChatThemeContext, CometChatThreadedMessages, CometChatTransferOwnership, CometChatUIKit, CometChatUserMemberWrapper, CometChatUsers, CometChatUsersWithMessages, DataSource, DataSourceDecorator, ExtensionsDataSource, ImageModerationConfiguration, ImageModerationExtension, ImageModerationExtensionDecorator, LinkPreviewConfiguration, LinkPreviewExtension, LinkPreviewExtensionDecorator, MessageTranslationConfiguration, MessageTranslationExtension, MessageTranslationExtensionDecorator, MessagesDataSource, PollsConfiguration, PollsExtension, PollsExtensionDecorator, SmartRepliesConfiguration, SmartReplyExtension, SmartReplyExtensionDecorator, StickersConfiguration, StickersExtension, StickersExtensionDecorator, TabsStyle, TextModeratorExtension, TextModeratorExtensionDecorator, ThumbnailGenerationExtension, ThumbnailGenerationExtensionDecorator };
