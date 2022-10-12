import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import {
  CometChatMessageEvents,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  CometChatLiveReactions,
  messageConstants,
  MessagesStyles,
  CometChatMessageTemplate,
} from "..";

import {
  MessageHeaderConfiguration,
  CometChatTheme,
  MetadataConstants,
  GroupOptionConstants,
  UserOptionConstants,
  localize,
} from "../..";

import { MessageComposerConfiguration } from "../CometChatMessageComposer/MessageComposerConfiguration";

import { MessageListConfiguration } from "../CometChatMessageList/MessageListConfiguration";

import { messageStatus } from "../CometChatMessageConstants";

import { Hooks } from "./hooks";

import { DetailsConfiguration } from "../../Shared";

import {
  chatWrapperStyle,
  liveReactionWrapperStyle,
  messageComposerStyle,
  messageHeaderStyle,
  liveReactionStyle,
  messageListStyle,
} from "./style";

import { MessageInputData } from "../..";

import insertEmoticon from "./resources/emoji.svg";
import infoIcon from "./resources/info.svg";
import voicecallIcon from "./resources/voicecall.svg";
import videocallIcon from "./resources/videocall.svg";
import heart from "./resources/heart.png";

const CometChatMessages = (props) => {
  let messageListRef = React.useRef(null);
  let messageComposerRef = React.useRef(null);

  const [loggedInUser, setLoggedInUser] = React.useState(null);
  const [viewLiveReaction, setViewLiveReaction] = React.useState(false);
  const [liveReactionTemplate, setLiveReactionTemplate] = React.useState(null);

  const {
    user,
    group,
    liveReactionIconURL,
    messageTypes,
    hideMessageComposer,
    enableSoundForMessages,
    enableSoundForCalls,
    customIncomingMessageSound,
    customOutgoingMessageSound,
    enableTypingIndicator,
    style,
    theme,
    messageHeaderConfiguration,
    messageListConfiguration,
    messageComposerConfiguration,
    detailsConfiguration,
  } = props;

  const _messageListConfiguration =
    messageListConfiguration || new MessageListConfiguration({});
  const _theme = new CometChatTheme(theme ?? {});

  let liveReactionTimeout = 0;

  const getSentMessageInputData = () => {
    if (user) {
      let timestamp =
          _messageListConfiguration?.sentMessageInputData?.timestamp || true,
        readReceipt =
          _messageListConfiguration?.sentMessageInputData?.readReceipt || true,
        thumbnail =
          _messageListConfiguration?.sentMessageInputData?.thumbnail || false,
        title = _messageListConfiguration?.sentMessageInputData?.title || false;

      return new MessageInputData({
        timestamp: timestamp,
        readReceipt: readReceipt,
        thumbnail: thumbnail,
        title: title,
      });
    } else if (group) {
      let timestamp =
          _messageListConfiguration?.sentMessageInputData?.timestamp || true,
        readReceipt =
          _messageListConfiguration?.sentMessageInputData?.readReceipt || true,
        thumbnail =
          _messageListConfiguration?.sentMessageInputData?.thumbnail || true,
        title = _messageListConfiguration?.sentMessageInputData?.title || true;

      return new MessageInputData({
        timestamp: timestamp,
        readReceipt: readReceipt,
        thumbnail: thumbnail,
        title: title,
      });
    }
  };

  const getReceivedMessageInputData = () => {
    if (user) {
      let timestamp =
          _messageListConfiguration.receivedMessageInputData.timestamp || true,
        readReceipt =
          _messageListConfiguration.receivedMessageInputData.readReceipt ||
          true,
        thumbnail =
          _messageListConfiguration.receivedMessageInputData.thumbnail || false,
        title =
          _messageListConfiguration.receivedMessageInputData.title || false;

      return new MessageInputData({
        timestamp: timestamp,
        readReceipt: readReceipt,
        thumbnail: thumbnail,
        title: title,
      });
    } else if (group) {
      let timestamp =
          _messageListConfiguration.receivedMessageInputData.timestamp || true,
        readReceipt =
          _messageListConfiguration.receivedMessageInputData.readReceipt ||
          false,
        thumbnail =
          _messageListConfiguration.receivedMessageInputData.thumbnail || true,
        title =
          _messageListConfiguration.receivedMessageInputData.title || true;

      return new MessageInputData({
        timestamp: timestamp,
        readReceipt: readReceipt,
        thumbnail: thumbnail,
        title: title,
      });
    }
  };

  /**
   * Preview message before edit
   */
  const previewMessageForEdit = (payload) => {
    if (payload.status === messageStatus.inprogress) {
      if (messageComposerRef && messageComposerRef.current) {
        messageComposerRef.current.previewMessageForEdit(payload.message);
      }
    } else if (messageListRef && messageListRef.current) {
      if (payload.status === messageStatus.success) {
        messageListRef.current.updateMessage(payload.message, true);
      }
    }
  };

  /**
   * Draft a message before sending
   */
  const draftMessage = (message) => {
    if (messageComposerRef && messageComposerRef.current) {
      messageComposerRef.current.draftMessage(message);
    }
  };

  const addNewMessage = (payload) => {
    if (messageListRef && messageListRef.current) {
      if (payload.status === messageStatus.inprogress) {
        messageListRef.current.addMessage(payload.message);
        messageListRef.current.scrollToBottom();
      } else if (payload.status === messageStatus.success) {
        messageListRef.current.updateMessage(payload.message, true);
      }
    }
  };

  const messagesCallback = (listener, message) => {
    switch (listener) {
      case "onTransientMessageReceived":
        onTransientMessageReceived(message);
        break;
      default:
        break;
    }
  };

  const onTransientMessageReceived = (message) => {
    if (message.data.type === MetadataConstants.liveReaction) {
      const payload = {
        reaction: heart,
        style: {
          width: "20px",
          height: "20px",
          border: "none",
          borderRadius: "none",
          background: "red",
        },
      };
      shareLiveReaction(payload);
    }
  };

  const clearLiveReaction = () => {
    clearTimeout(liveReactionTimeout);
    setViewLiveReaction(false);
  };

  const infoHandle = () => {};
  const voiceCallHandle = () => {};
  const videoCallHandle = () => {};

  const shareLiveReaction = (payload) => {
    //if already live reaction in progress
    if (liveReactionTimeout) {
      return false;
    }

    setViewLiveReaction(true);
    setLiveReactionTemplate(payload);

    //set timeout till the next share
    liveReactionTimeout = setTimeout(
      clearLiveReaction,
      messageConstants.liveReactionTimeout
    );
  };

  const menuInputData = [];

  if (user && user.uid) {
    menuInputData.push(
      {
        id: UserOptionConstants.voiceCall,
        iconURL: voicecallIcon,
        title: "Voicecall",
        onClick: voiceCallHandle,
      },

      {
        id: UserOptionConstants.videoCall,
        iconURL: videocallIcon,
        title: "VideoCall",
        onClick: videoCallHandle,
      },
      {
        id: UserOptionConstants.viewInformation,
        iconURL: infoIcon,
        title: "Info",
        onClick: infoHandle,
      }
    );
  } else if (group && group.guid) {
    menuInputData.push(
      {
        id: GroupOptionConstants.voiceCall,
        iconURL: voicecallIcon,
        title: "Voicecall",
        onClick: voiceCallHandle,
      },
      {
        id: GroupOptionConstants.videoCall,
        iconURL: videocallIcon,
        title: "VideoCall",
        onClick: videoCallHandle,
      },
      {
        id: GroupOptionConstants.viewInformation,
        iconURL: infoIcon,
        title: "Info",
        onClick: infoHandle,
      }
    );
  }

  CometChatMessageEvents.addListener(
    CometChatMessageEvents.onMessageEdit,
    "onMessageEdit",
    previewMessageForEdit
  );

  CometChatMessageEvents.addListener(
    CometChatMessageEvents.onMessageSent,
    "messageSent",
    addNewMessage
  );

  CometChatMessageEvents.addListener(
    CometChatMessageEvents.onLiveReaction,
    "liveReactionId",
    shareLiveReaction
  );

  /** message composer configurations */
  const messageComposerConfig =
    messageComposerConfiguration || new MessageComposerConfiguration({});

  const _placeholderText = localize("ENTER_YOUR_MESSAGE_HERE");
  const _sendButtonIconURL = messageComposerConfig.sendButtonIconURL;
  const _attachmentIconURL = messageComposerConfig.attachmentIconURL;
  const _stickerCloseIconURL = messageComposerConfig.stickerCloseIconURL;
  const _hideAttachment = messageComposerConfig.hideAttachment;
  const _hideLiveReaction = messageComposerConfig.hideLiveReaction;
  const _hideEmoji = messageComposerConfig.hideEmoji;
  const _emojiIconURL = messageComposerConfig.emojiIconURL;
  const _showSendButton = messageComposerConfig.showSendButton;
  const _onSendButtonClick = messageComposerConfig.onSendButtonClick;
  const _messageTypes = messageComposerConfig.messageTypes;
  const _customOutgoingMessageSound =
    messageComposerConfig.customOutgoingMessageSound;
  const _enableSoundForMessages = messageComposerConfig.enableSoundForMessages;
  const _excludeMessageTypes = messageComposerConfig.excludeMessageTypes;
  const _enableTypingIndicator = messageComposerConfig.enableTypingIndicator;
  /**configurations of composer child components */
  const _messagePreviewConfiguration =
    messageComposerConfig.messagePreviewConfiguration;
  const _emojiKeyboardConfiguration =
    messageComposerConfig.emojiKeyboardConfiguration;
  const _stickerKeyboardConfiguration =
    messageComposerConfig.stickerKeyboardConfiguration;
  const _createPollConfiguration =
    messageComposerConfig.createPollConfiguration;
  const _actionSheetConfiguration =
    messageComposerConfig.actionSheetConfiguration;

  /**message header configuration */
  const messageHeaderConfig =
    messageHeaderConfiguration || new MessageHeaderConfiguration({});

  const _showBackButton = messageHeaderConfig.showBackButton;
  const _backButtonIconURL = messageHeaderConfig.backButtonIconURL;
  const _options = messageHeaderConfig.options;
  const _enableIndicator = messageHeaderConfig.enableTypingIndicator;
  const _isMobileView = messageHeaderConfig.isMobile;
  const _dataItemConfiguration = messageHeaderConfig.dataItemConfiguration;

  /**message list configuuration */
  const messageListConfig =
    messageListConfiguration || new MessageListConfiguration({});
  const _alignment = messageListConfig.alignment;
  const _limit = messageListConfig.limit;
  const _messageTypesForList = messageListConfig.messageTypes;
  const _customMessageTypes = messageListConfig.customMessageTypes;
  const _excludeMessageTypesForList = messageListConfig.excludeMessageTypes;
  const _excludeMessageListOptions = messageListConfig.excludeMessageOptions;
  const _customOptions = messageListConfig.customOptions;
  const _onlyUnread = messageListConfig.onlyUnread;
  const _hideMessagesFromBlockedUsers =
    messageListConfig.hideMessagesFromBlockedUsers;
  const _hideDeletedMessages = messageListConfig.hideDeletedMessages;
  const _tags = messageListConfig.tags;
  const _sentMessageInputData = messageListConfig.sentMessageInputData;
  const _receivedMessageInputData = messageListConfig.receivedMessageInputData;
  const _loadingIconURL = messageListConfig.loadingIconURL;
  const _customView = messageListConfig.customView;
  const _emptyText = messageListConfig.emptyText;
  const _errorText = messageListConfig.errorText;
  const _hideError = messageListConfig.hideError;
  const _onErrorCallback = messageListConfig.onErrorCallback;
  const _enableSoundForMessagesList = messageListConfig.enableSoundForMessages;
  const _customIncomingMessageListSound =
    messageListConfig.customIncomingMessageSound;
  const _customOutgoingMessageListSound =
    messageListConfig.customOutgoingMessageSound;
  const _enableGroupActionMessages =
    messageListConfig.enableGroupActionMessages;
  Hooks(props, setLoggedInUser);

  let liveReactionView = viewLiveReaction ? (
    <div style={liveReactionWrapperStyle()}>
      <CometChatLiveReactions
        reaction={liveReactionTemplate.reaction}
        style={liveReactionStyle()}
      />
    </div>
  ) : null;

  return (
    <div className="main__chat" style={chatWrapperStyle(style)}>
      <CometChatMessageHeader
        user={user}
        group={group}
        theme={_theme}
        style={messageHeaderStyle(_theme)}
        backButtonIconURL={_backButtonIconURL}
        showBackButton={_isMobileView && _showBackButton ? true : false}
        options={_options || menuInputData}
        enableTypingIndicator={_enableIndicator}
        dataItemConfiguration={_dataItemConfiguration}
      />
      <CometChatMessageList
        ref={messageListRef}
        user={user}
        group={group}
        loggedInUser={loggedInUser}
        limit={_messageListConfiguration.limit}
        onlyUnread={_messageListConfiguration.onlyUnread}
        emptyText={_messageListConfiguration.emptyText}
        errorText={_messageListConfiguration.errorText}
        customView={_messageListConfiguration.customView}
        loadingIconURL={_messageListConfiguration.loadingIconURL}
        alignment={_messageListConfiguration.alignment}
        timeAlignment={_messageListConfiguration.timeAlignment}
        tags={_messageListConfiguration.tags}
        messageTypes={_messageListConfiguration.messageTypes}
        receivedMessageInputData={getReceivedMessageInputData()}
        sentMessageInputData={getSentMessageInputData()}
        // customOptions={[]}
        // excludeMessageTypes={[]}
        // excludeMessageOptions={[]}
        // sentMessageInputData={null}
        // receivedMessageInputData={null}
        // onErrorCallback={() => {}}
        // customIncomingMessageSound="" //url
        // onlyUnread={false}
        // hodeError={false}
        // hideDeletedMessages={false}
        // enableSoundForMessages={true}
        // showEmojiInLargerSize={false}
        // hideMessagesFromBlockedUsers={true}
        theme={_theme}
        style={messageListStyle(props, _theme)}
      />
      {liveReactionView}
      <CometChatMessageComposer
        ref={messageComposerRef}
        group={group}
        user={user}
        hideAttachment={_hideAttachment}
        attachmentIconURL={_attachmentIconURL}
        stickerCloseIconURL={_stickerCloseIconURL}
        hideLiveReaction={_hideLiveReaction}
        hideEmoji={_hideEmoji}
        liveReactionIconURL={liveReactionIconURL}
        sendButtonIconURL={_sendButtonIconURL}
        onSendButtonClick={_onSendButtonClick}
        messageTypes={_messageTypes}
        excludeMessageTypes={_excludeMessageTypes}
        enableTypingIndicator={_enableTypingIndicator}
        enableSoundForMessage={_enableSoundForMessages}
        customOutgoingMessageSound={_customOutgoingMessageSound}
        showSendButton={_showSendButton}
        placeholderText={_placeholderText}
        emojiIconURL={_emojiIconURL}
        messagePreviewConfiguration={_messagePreviewConfiguration}
        emojiKeyboardConfiguration={_emojiKeyboardConfiguration}
        stickerKeyboardConfiguration={_stickerKeyboardConfiguration}
        createPollConfiguration={_createPollConfiguration}
        actionSheetConfiguration={_actionSheetConfiguration}
        theme={_theme}
        style={messageComposerStyle(props, _theme)}
      />
    </div>
  );
};

CometChatMessages.propTypes = {
  user: PropTypes.object,
  group: PropTypes.object,
  hideLiveReaction: PropTypes.bool,
  liveReactionIconURL: PropTypes.string,
  messageTypes: PropTypes.array,
  hideMessageComposer: PropTypes.bool,
  liveReactionIconURL: PropTypes.string,
  enableSoundForMessages: PropTypes.bool,
  enableSoundForCalls: PropTypes.bool,
  customIncomingMessageSound: PropTypes.string,
  customOutgoingMessageSound: PropTypes.string,
  enableTypingIndicator: PropTypes.bool,
  style: PropTypes.object,
  messageHeaderConfiguration: PropTypes.object,
  messageListConfiguration: PropTypes.object,
  messageComposerConfiguration: PropTypes.object,
  detailsConfiguration: PropTypes.object,
};

CometChatMessages.defaultProps = {
  user: null,
  group: null,
  liveReactionIconURL: heart,
  messageTypes: null,
  hideMessageComposer: null,
  enableSoundForMessages: null,
  enableSoundForCalls: null,
  customIncomingMessageSound: null,
  customOutgoingMessageSound: null,
  enableTypingIndicator: null,
  style: {
    width: "100%",
    height: "auto",
    border: "none",
    borderRadius: "none",
    background: "rgb(255,255,255)",
  },
  messageHeaderConfiguration: null,
  messageListConfiguration: null,
  messageComposerConfiguration: null,
  detailsConfiguration: null,
};

export { CometChatMessages };
