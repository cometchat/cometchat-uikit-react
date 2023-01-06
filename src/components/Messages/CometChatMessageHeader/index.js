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
  //const callbackData = React.useRef(null);
  const callbackDataRef = React.useRef(null);
  const chatWithRef = React.useRef(null);
  const chatWithTypeRef = React.useRef(null);
  const [messageHeaderStatus, setMessageHeaderStatus] = React.useState("");
  const [userPresence, setUserPresence] = React.useState(false);
 
  const _theme = new CometChatTheme(theme ?? {});

  const messageHeaderCallback = (listenerName, ...args) => {
    callbackDataRef.current = { name: listenerName, args: [...args] };
   try {
    const handler = handlers[callbackDataRef.current?.name];

    if (handler) return handler(...callbackDataRef.current?.args);
  } catch (e) {
    throw e;
  }
  };

  /**
   *
   * When a user goes online/ offline
   */
  const handleUsers = (user) => {
    if (
      chatWithTypeRef?.current === CometChatMessageReceiverType.user &&
      chatWithRef?.current?.uid === user.uid
    ) {
      if (user.status === UserStatusConstants.offline) {
        setMessageHeaderStatus(localize("OFFLINE"));
        setUserPresence(false);
      } else if (user.status === UserStatusConstants.online) {
        setMessageHeaderStatus(localize("ONLINE"));
        setUserPresence(true);
      }
    }
  };

  const handleGroups = (group) => {
    if (
      chatWithTypeRef?.current === CometChatMessageReceiverType.group &&
      chatWithRef?.current?.guid === group.guid
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
      chatWithTypeRef?.current === CometChatMessageReceiverType.group &&
      chatWithTypeRef?.current === typingIndicator.receiverType &&
      chatWithRef?.current?.guid === typingIndicator.receiverId
    ) {
      const typingText = `${typingIndicator.sender.name} ${localize(
        "IS_TYPING"
      )}`;
      setMessageHeaderStatus(typingText);
    } else if (
      chatWithTypeRef?.current === CometChatMessageReceiverType.user &&
      chatWithTypeRef?.current === typingIndicator.receiverType &&
      chatWithRef?.current?.uid === typingIndicator.sender.uid
    ) {
      const typingText = localize("TYPING");
      setMessageHeaderStatus(typingText);
    }
  };

  const handleEndTyping = (typingIndicator) => {
    if (
      chatWithTypeRef?.current === CometChatMessageReceiverType.group &&
      chatWithTypeRef?.current === typingIndicator.receiverType &&
      chatWithRef?.current?.guid === typingIndicator.receiverId
    ) {
      const status = `${chatWithRef?.current?.membersCount} ${localize("MEMBERS")}`;
      setMessageHeaderStatus(status);
    } else if (
      chatWithTypeRef?.current === CometChatMessageReceiverType.user &&
      chatWithTypeRef?.current === typingIndicator.receiverType &&
      chatWithRef?.current?.uid === typingIndicator.sender.uid
    ) {
      if (userPresence) {
        setMessageHeaderStatus(localize("ONLINE"));
        setUserPresence(true);
      } else {
        setMessageHeaderStatus(localize("OFFLINE"));
        setUserPresence(false);
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
  chatWithRef,
  chatWithTypeRef,
  setMessageHeaderStatus,
  setUserPresence,
  messageHeaderManager,
  messageHeaderCallback,
  errorHandler
  );

  return (
    <div style={chatHeaderStyle(props, _theme)} className="chat__header">
      <div style={chatDetailStyle(props)} className="chat__details">
        {getBackButtonElem()}
        <div style={chatThumbnailStyle(props)}>
          <CometChatDataItem
            inputData={
              {
                id: "",
                thumbnail: true,
                status: userPresence,
                title: true,
                subtitle: () => messageHeaderStatus,
              } || _inputData
            }
            style={dataItemStyle(props, _theme)}
            user={user}
            group={group}
            theme={_theme}
            // options={props.options || _options}
            // isActive={_isActive}
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
  user: PropTypes.object,
  group: PropTypes.object,
  showBackButton: PropTypes.bool,
  style: PropTypes.object,
  //options: PropTypes.array,
  enableTypingIndicator: PropTypes.bool,
  dataItemConfiguration: PropTypes.object,
};

export { CometChatMessageHeader };
