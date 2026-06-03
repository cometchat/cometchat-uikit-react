/**
 * It is used for specifying the position of the auxiliary buttons.
 * It is used in CometChatMessageComposer component.
 */
export enum AuxiliaryButtonAlignment {
  left,
  right,
}
/**
 * It is used for specifying the function of enter button
 * It is used in CometChatMessageComposer component.
 */
export enum EnterKeyBehavior {
  SendMessage = 'sendMessage',
  NewLine = 'newLine',
  None = 'none',
}

/**
 * It is used for describing the position of the element on the UI.
 * It is used in CometChatContextualMenu, CometChatMessageBubble, CometChatUsers and CometChatGroupMembers components.
 */
export enum Placement {
  top = 'top',
  right = 'right',
  bottom = 'bottom',
  left = 'left',
}

/**
 * It is used for specifying the alignment of the message list.
 * It is used in CometChatMessageList component.
 */
export enum MessageListAlignment {
  left,
  standard,
}

/**
 * This is used for specifying the position of the message bubble.
 * It is used in various components where the message bubbles are used.
 */
export enum MessageBubbleAlignment {
  left,
  right,
  center,
}

/**
 * This is used for specifying the position of the document icon.
 * It is used in Decorators like CallingExtension, CollaborativeDocument, CollaborativeWhiteboard.
 */
export enum DocumentIconAlignment {
  left,
  right,
}

/**
 * This is used to specify the alignment of the tabs.
 * It is used in CometChatTabs and CometChatContacts components.
 */
export enum TabAlignment {
  top,
  bottom,
  left,
  right,
}

/**
 * This is used to specify the status of the message delivery.
 * It is used in components related to messages.
 */
export enum MessageStatus {
  inprogress,
  success,
  error,
  cancelled,
}

/**
 * This is used to specify the types of the read receipts for the message.
 * It is used in Bubbles, CometChatMessageInformation components.
 */
export enum Receipts {
  wait,
  sent,
  delivered,
  read,
  error,
}

/**
 * This is used for specifying the position of the title.
 */
export enum TitleAlignment {
  left,
  center,
}

/**
 * It is used to specify the mode of selection for the list of items.
 * It is used in components where there is a list of items involed, like users/groups etc.
 */
export enum SelectionMode {
  single,
  multiple,
  none,
}

/**
 * This is used to specify the states of the operation on the UI.
 * It has options like:
 * loading: to be used while waiting for a particular operation,
 * empty: when there is nothing to be displayed,
 * error: when an error occurs in the operation, and
 * loaded: when the operation is completed.
 */
export enum States {
  loading,
  empty,
  error,
  loaded,
}

/**
 * This is used to specify the position for the time-stamp.
 * It is used in CometChatMessageList component.
 */
export enum TimestampAlignment {
  top,
  bottom,
}

/**
 * This is used to specify the alignment for the icon button.
 * It is used in CometChatTabs, CometChatOutgoingCall components.
 */
export enum IconButtonAlignment {
  top = 'column',
  bottom = 'column-reverse',
  left = 'row',
  right = 'row-reverse',
}

/**
 * It is used to specify the type for the recording.
 * It is used in CometChatMessageComposer component.
 */
export enum RecordingType {
  audio,
  video,
}

/**
 * It is used to specify which tabs should be visible amongst user and group.
 * It is used in CometChatContacts component.
 */
export enum TabsVisibility {
  usersAndGroups,
  users,
  groups,
}

/**
 * This is used to specify the type of the call.
 * It is used in CometChatCallLogs, CometChatOngoingCall components.
 */
export enum CallWorkflow {
  defaultCalling,
  directCalling,
}

/**
 * This is used to provide the alignment for the panel.
 * It is used in CometChatMessageList component and AI module components.
 */
export enum PanelAlignment {
  composerHeader,
  messageListHeader,
  messageListFooter,
  messages,
}

/**
 * It is used to provide the alignment for the labels.
 */
export enum LabelAlignment {
  top = 'column',
  bottom = 'column-reverse',
  left = 'row',
  right = 'row-reverse',
}

/**
 * It is used to specify the type of the UI element.
 * It is used in modal components.
 */
export enum ElementType {
  label = 'label',
  text = 'textInput',
  dropdown = 'dropdown',
  checkbox = 'checkbox',
  radio = 'radio',
  button = 'button',
  singleSelect = 'singleSelect',
  dateTime = 'dateTime',
}

/**
 * It is used to specify what action a button should perform.
 * It is used in InteractiveMessageUtils function and in modal components.
 */
export enum ButtonAction {
  apiAction = 'apiAction',
  urlNavigation = 'urlNavigation',
  custom = 'custom',
}

/**
 * It is used to specify the type of the http request call.
 * It is used in InteractiveMessageUtils function and APIAction inside modals.
 */
export enum HTTPSRequestMethods {
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * It is used to select the mode for date time picker component.
 * It is used in DateTimePickerElement component.
 */
export enum DateTimePickerMode {
  date = 'date',
  dateTime = 'dateTime',
  time = 'time',
}

/**
 * It is used for specifying the type of user/members list.
 * It is used in CometChatMessageComposer and CometChatUserMemberWrapper components.
 */
export enum UserMemberListType {
  users,
  groupmembers,
}

/**
 * This is used to specify the source for mouse event with mentions information.
 * It is used in CometChatMentionsFormatter util.
 */
export enum MouseEventSource {
  mentions,
}

/**
 * It is used to describe the mode for previewing message.
 * It is used in CometChatMessageComposer component.
 */
export enum PreviewMessageMode {
  edit,
  none,
}
/**
 * It is generally used for formatting the text by providing the required data.
 * It is used in CometChatConversations, CometChatTextFormatter and CometChatMentionsFormatter.
 */
export enum MentionsTargetElement {
  textinput,
  textbubble,
  conversation,
}

/**
 * It is used for providing the value for the mentions visibility.
 * It is used in CometChatMentionsFormatter component.
 */
export enum MentionsVisibility {
  usersConversationOnly,
  groupConversationOnly,
  both,
}

/**
 * Specifies the scope of the search functionality.
 *
 * @remarks
 * - `Conversations`: Limits the search to conversations only.
 * - `Messages`: Limits the search to messages only.
 *
 */
export enum CometChatSearchScope {
  Conversations = 'conversations',
  Messages = 'messages',
}
/**
 * Specifies the filters available for the search functionality.
 *
 * @remarks
 * - `Messages`: Filters to search within messages.
 * - `Conversations`: Filters to search within conversations.
 * - `Unread`: Filters to search for unread messages.
 * - `Groups`: Filters to search within groups.
 * - `Photos`: Filters to search for photo messages.
 * - `Videos`: Filters to search for video messages.
 * - `Links`: Filters to search for links shared in messages.
 * - `Documents`: Filters to search for document files.
 * - `Audio`: Filters to search for audio messages.
 */
export enum CometChatSearchFilter {
  Messages = 'messages',
  Conversations = 'conversations',
  Unread = 'unread',
  Groups = 'groups',
  Photos = 'photos',
  Videos = 'videos',
  Links = 'links',
  Documents = 'files',
  Audio = 'audio',
}
