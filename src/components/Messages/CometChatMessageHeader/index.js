import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { MessageHeaderManager } from "./controller";
import { Hooks } from "./hooks";

import { CometChatMessageReceiverType, CometChatMessageEvents } from "..";

import {
  CometChatDataItem,
  CometChatTheme,
  DataItemConfiguration,
} from "../../Shared";

import { localize, UserStatusConstants } from "../..";

import {
  iconStyle,
  menuActionStyle,
  chatHeaderStyle,
  chatDetailStyle,
  chatThumbnailStyle,
  backButtonStyle,
  listStyle,
  dataItemStyle,
} from "./style";

const CometChatMessageHeader = (props) => {
  /**
   * Destructuring prop
   */
  const { theme, user, group, showBackButton } = props;

  const loggedInUser = React.useRef(null);
  const messageHeaderManager = React.useRef(new MessageHeaderManager());
  const callbackData = React.useRef(null);

  const [chatWith, setChatWith] = React.useState(null);
  const [chatWithType, setChatWithType] = React.useState(null);

  const [messageHeaderStatus, setMessageHeaderStatus] = React.useState("");
  const [userPresence, setUserPresence] = React.useState("offline");
  const [typingText, setTypingText] = React.useState(null);

  const _theme = new CometChatTheme(theme ?? {});

  const messageHeaderCallback = (listenerName, ...args) => {
    callbackData.current = { name: listenerName, args: [...args] };
  };

  /**
   *
   * When a user goes online/ offline
   */
  const handleUsers = (user) => {
    if (
      chatWithType === CometChatMessageReceiverType.user &&
      chatWith?.uid === user.uid
    ) {
      if (user.status === UserStatusConstants.offline) {
        setMessageHeaderStatus(localize("OFFLINE"));
        setUserPresence(user.status);
      } else if (user.status === UserStatusConstants.online) {
        setMessageHeaderStatus(localize("ONLINE"));
        setUserPresence(user.status);
      }
    }
  };

  const handleGroups = (group) => {
    if (
      chatWithType === CometChatMessageReceiverType.group &&
      chatWith?.guid === group.guid
    ) {
      const membersCount = parseInt(group.membersCount);
      const status = `${membersCount} ${localize("MEMBERS")}`;
      setMessageHeaderStatus(status);
    }
  };

  const getBackButtonElem = () => {
    if (showBackButton) {
      return (
        <div className="chat__backbutton" style={backButtonStyle(props)}></div>
      );
    }
    return null;
  };

  const handleStartTyping = (typingIndicator) => {
    if (
      chatWithType === CometChatMessageReceiverType.group &&
      chatWithType === typingIndicator.receiverType &&
      chatWith?.guid === typingIndicator.receiverId
    ) {
      const typingText = `${typingIndicator.sender.name} ${localize(
        "IS_TYPING"
      )}`;
      setTypingText(typingText);
    } else if (
      chatWithType === CometChatMessageReceiverType.user &&
      chatWithType === typingIndicator.receiverType &&
      chatWith?.uid === typingIndicator.sender.uid
    ) {
      const typingText = localize("TYPING");
      setTypingText(typingText);
    }
  };

  const handleEndTyping = (typingIndicator) => {
    if (
      chatWithType === CometChatMessageReceiverType.group &&
      chatWithType === typingIndicator.receiverType &&
      chatWith?.guid === typingIndicator.receiverId
    ) {
      const status = `${chatWith?.membersCount} ${localize("MEMBERS")}`;
      setMessageHeaderStatus(status);
      setTypingText(null);
    } else if (
      chatWithType === CometChatMessageReceiverType.user &&
      chatWithType === typingIndicator.receiverType &&
      chatWith?.uid === typingIndicator.sender.uid
    ) {
      if (userPresence === UserStatusConstants.online) {
        setMessageHeaderStatus(localize("ONLINE"));
        setUserPresence(UserStatusConstants.online);
        setTypingText(null);
      } else {
        setMessageHeaderStatus(localize("OFFLINE"));
        setUserPresence(UserStatusConstants.offline);
        setTypingText(null);
      }
    }
  };

  const handlers = {
    onUserOnline: handleUsers,
    onUserOffline: handleUsers,
    onMemberAddedToGroup: handleGroups,
    onGroupMemberJoined: handleGroups,
    onGroupMemberKicked: handleGroups,
    onGroupMemberLeft: handleGroups,
    onGroupMemberBanned: handleGroups,
    onTypingStarted: handleStartTyping,
    onTypingEnded: handleEndTyping,
  };

  const errorHandler = (errorCode) => {
    CometChatMessageEvents.emit(
      CometChatMessageEvents.onMessageError,
      errorCode
    );
  };

  /** data item configuration */
  const dataItemConfig = new DataItemConfiguration({});
  const _inputData = dataItemConfig.inputData;
  const _isActive = false;
  //const _options = dataItemConfig.options;
  //const _tail = dataItemConfig.tail;

  Hooks(
    props,
    loggedInUser,
    setChatWith,
    setChatWithType,
    setMessageHeaderStatus,
    setUserPresence,
    messageHeaderManager,
    messageHeaderCallback,
    handlers,
    callbackData,
    errorHandler
  );

  return (
    <div style={chatHeaderStyle(props, _theme)} className="chat__header">
      <div style={chatDetailStyle(props)} className="chat__details">
        {getBackButtonElem()}
        <div style={chatThumbnailStyle(props)}>
          <CometChatDataItem
            inputData={_inputData}
            style={dataItemStyle(props, _theme)}
            user={user}
            group={group}
            theme={_theme}
            // options={props.options || _options}
            isActive={_isActive}
          />
        </div>
      </div>
    </div>
  );
};

CometChatMessageHeader.defaultProps = {
  user: null,
  group: null,
  style: {
    width: "",
    height: "",
    border: "",
    borderRadius: "",
    background: "",
    backButtonIconTint: "",
  },
  showBackButton: false,
  backButtonIconURL: "",
  //options: [],
  enableTypingIndicator: false,
  dataItemConfiguration: null,
};

CometChatMessageHeader.propTypes = {
  user: PropTypes.instanceOf(CometChat.User),
  group: PropTypes.instanceOf(CometChat.Group),
  showBackButton: PropTypes.bool,
  style: PropTypes.object,
  //options: PropTypes.array,
  enableTypingIndicator: PropTypes.bool,
  dataItemConfiguration: PropTypes.object,
};

export { CometChatMessageHeader };
