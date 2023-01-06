import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import * as styles from "./style";
import { CometChatUsers } from "../CometChatUsers";
import { UsersWithMessagesStyles } from "../../Users";
import {
  UsersConfiguration,
  MessagesConfiguration,
  CometChatMessages,
  CometChatTheme,
  CometChatDecoratorMessage,
  localize,
  fontHelper,
} from "../../../";
import { Hooks } from "./hooks";
import { CometChat } from "@cometchat-pro/chat";
import { UsersStyle } from "../CometChatUsers/UsersStyle";

/**
 *
 * @version 1.0.0
 * @author CometChat
 * @description CometChatUsersWithMessages is a container component that wraps and
 * formats CometChatUsers and CometChatMessages component, with no behavior of its own.
 *
 */
const CometChatUsersWithMessages = (props) => {
  /**
   * Props destructuring
   */
  const {
    user,
    messageText,
    style,
    isMobileView,
    usersConfiguration,
    messagesConfiguration,
    theme,
  } = props;
  /**
   * Component internal state
   */
  const [activeUser, setActiveUser] = useState(null);
  const userRef = useRef();

  /**
   * Component private scoping
   */
  const _usersConfiguration = new UsersConfiguration(usersConfiguration ?? {});
  const _messagesConfiguration = new MessagesConfiguration(
    messagesConfiguration ?? {}
  );
  const _theme = new CometChatTheme(theme ?? {});

  /**
   * Component internal handlers/methods
   */
  const onUserClickHandler = (data) => {
    setActiveUser(data);
  };

  const backButtonClickHandler = () => {
    setActiveUser(null);
  };

  /**
   * Component hooks
   */
  Hooks(onUserClickHandler, backButtonClickHandler, userRef);

  /**
   * Component template scoping
   */
  const UsersBar = (
    <CometChatUsers
      ref={userRef}
      title={localize("USERS")}
      searchPlaceholder={localize("SEARCH")}
      style={
        new UsersStyle({
          ..._usersConfiguration?.style,
          width: isMobileView
            ? "100%"
            : _usersConfiguration?.style?.width ?? "280px",
        })
      }
      backButtonIconURL={_usersConfiguration?.backButtonIconURL}
      searchIconURL={_usersConfiguration?.searchIconURL}
      showBackButton={_usersConfiguration?.showBackButton}
      hideSearch={_usersConfiguration?.hideSearch}
      activeUser={activeUser}
      userListConfiguration={_usersConfiguration?.userListConfiguration}
      theme={_theme}
    />
  );

  /**
   * If User or Group changes then prioritize it as props to CometChatMessages
   */
  let _user = activeUser?.uid ? activeUser : null;

  if (user) _user = user;

  const MessagesBar = (
    <CometChatMessages
      user={_user}
      parentMessage={_messagesConfiguration?.parentMessage}
      hideDeletedMessage={_messagesConfiguration?.hideDeletedMessage}
      hideCallActionMessage={_messagesConfiguration?.hideCallActionMessage}
      hideGroupActionMessage={_messagesConfiguration?.hideGroupActionMessage}
      hideEmoji={_messagesConfiguration?.hideEmoji}
      emojiIconURL={_messagesConfiguration?.emojiIconURL}
      emojiIconTint={_messagesConfiguration?.emojiIconTint}
      hideLiveReaction={_messagesConfiguration?.hideLiveReaction}
      liveReaction={_messagesConfiguration?.liveReaction}
      liveReactionFont={_messagesConfiguration?.liveReactionFont}
      liveReactionColor={_messagesConfiguration?.liveReactionColor}
      hideAttachment={_messagesConfiguration?.hideAttachment}
      messageAlignment={_messagesConfiguration?.messageAlignment}
      messageFilterList={_messagesConfiguration?.messageFilterList}
      messageHeaderConfiguration={
        _messagesConfiguration?.messageHeaderConfiguration
      }
      messageListConfiguration={
        _messagesConfiguration?.messageListConfiguration
      }
      messageComposerConfiguration={
        _messagesConfiguration?.messageComposerConfiguration
      }
      liveReactionConfiguration={
        _messagesConfiguration?.liveReactionConfiguration
      }
      theme={_theme}
    />
  );
  const getTemplate = () => {
    if (isMobileView && (activeUser || _user)) {
      return MessagesBar;
    } else if (isMobileView && !(activeUser || _user)) {
      return UsersBar;
    } else if (!isMobileView && !(activeUser || _user)) {
      return (
        <>
          {UsersBar}
          <CometChatDecoratorMessage
            text={messageText || localize("SELECT_USER_TO_START")}
            textColor={_theme?.palette?.getAccent400()}
            textFont={fontHelper(_theme?.typography?.heading)}
            background={_theme?.palette?.getAccent900()}
          />
        </>
      );
    } else if (!isMobileView && (activeUser || _user)) {
      return (
        <>
          {UsersBar}
          {MessagesBar}
        </>
      );
    }
  };

  /**
   * Component template
   */
  return (
    <div
      style={styles.chatScreenStyle(style)}
      className="cometchat__users__with__messages"
    >
      {getTemplate()}
    </div>
  );
};

/**
 * Component default props types values
 */
CometChatUsersWithMessages.defaultProps = {
  messageText: "",
};

/**
 * Component default props types
 */
CometChatUsersWithMessages.propTypes = {
  user: PropTypes.object,
  isMobileView: PropTypes.bool,
  messageText: PropTypes.string,
  usersConfiguration: PropTypes.object,
  messagesConfiguration: PropTypes.object,
  theme: PropTypes.object,
  style: PropTypes.object,
};

export { CometChatUsersWithMessages };
