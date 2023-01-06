import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import * as styles from "./style";
import { CometChatGroups } from "../CometChatGroups";
import { JoinProtectedGroupConfiguration } from "../CometChatJoinProtectedGroup/JoinProtectedGroupConfiguration";
import { CometChatJoinProtectedGroup } from "../CometChatJoinProtectedGroup";
import { CometChatGroupEvents } from "../../../";

import {
  GroupsConfiguration,
  MessagesConfiguration,
  CometChatMessages,
  CometChatTheme,
  CometChatDecoratorMessage,
  localize,
  fontHelper,
  GroupTypeConstants,
} from "../../../";
import { Hooks } from "./hooks";
import { CometChat } from "@cometchat-pro/chat";

/**
 *
 * @version 1.0.0
 * @author CometChat
 * @description CometChatGroupsWithMessages is a container component that wraps and
 * formats CometChatGroups and CometChatMessages component, with no behavior of its own.
 *
 */
const CometChatGroupsWithMessages = (props) => {
  /**
   * Props destructuring
   */
  const {
    group,
    messageText,
    style,
    isMobileView,
    groupsConfiguration,
    messagesConfiguration,
    joinProtectedGroupConfiguration,
    theme,
  } = props;

  /**
   * Component internal state
   */
  const [activeGroup, setActiveGroup] = useState(null);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const groupRef = useRef();
  let _group;

  /**
   * Component private scoping
   */
  const _groupsConfiguration = new GroupsConfiguration(
    groupsConfiguration ?? {}
  );
  const _messagesConfiguration = new MessagesConfiguration(
    messagesConfiguration ?? {}
  );
  const _joinProtectedGroupConfiguration = new JoinProtectedGroupConfiguration(
    joinProtectedGroupConfiguration ?? {}
  );
  const _theme = new CometChatTheme(theme ?? {});

  /**
   * Component internal handlers/methods
   */
  const onGroupClickHandler = (data) => {
    setActiveGroup(data);
    setShowJoinGroup(false);
    checkHasJoined(data);
  };

  const backButtonClickHandler = () => {
    setActiveGroup(null);
  };

  const onGroupJoinedHandler = (groupData) => {
    setShowJoinGroup(false);
    _group = groupData;
  };

  /**
   * Component hooks
   */
  Hooks(
    onGroupClickHandler,
    backButtonClickHandler,
    groupRef,
    onGroupJoinedHandler
  );

  /**
   *Checks if the loggedInUser is part of the group or not
   */
  const checkHasJoined = (groupData) => {
    if (groupData?.hasJoined) {
      _group = groupData;
    } else {
      if (groupData?.type === GroupTypeConstants.public) {
        joinGroup(groupData);
      } else if (groupData?.type === GroupTypeConstants.password) {
        setShowJoinGroup(true);
      }
    }
  };

  /**
   * JoinGroup Method
   */
  const joinGroup = (group) => {
    let guid = group.guid;
    let type = group.type;

    CometChat.joinGroup(guid, type)
      .then((response) => {
        CometChatGroupEvents.emit(
          CometChatGroupEvents.onGroupMemberJoin,
          response
        );
      })
      .catch((error) => {
        CometChatGroupEvents.emit(CometChatGroupEvents.onGroupError, error);
      });
  };

  /**
   * If protected Group launch joinGroup
   *
   */
  const joinGroupComponent = (
    <CometChatJoinProtectedGroup
      title={localize("ENTER_GROUP_PASSWORD")}
      joinGroupButtonText={localize("CONTINUE")}
      passwordPlaceholderText={localize("GROUP_PASSWORD")}
      group={activeGroup}
      showBackButton={isMobileView}
      style={styles.joinProtectedGroupStyles(
        _theme,
        _joinProtectedGroupConfiguration
      )}
    />
  );

  /**
   * Component template scoping
   */
  const GroupsBar = (
    <CometChatGroups
      ref={groupRef}
      title={localize("GROUPS")}
      searchPlaceholder={localize("SEARCH")}
      style={{
        ..._groupsConfiguration?.style,
        width: isMobileView
          ? "100%"
          : _groupsConfiguration?.style?.width ?? "280px",
      }}
      backButtonIconURL={_groupsConfiguration?.backButtonIconURL}
      searchIconURL={_groupsConfiguration?.searchIconURL}
      showBackButton={_groupsConfiguration?.showBackButton}
      hideSearch={_groupsConfiguration?.hideSearch}
      hideCreateGroup={_groupsConfiguration?.hideCreateGroup}
      createGroupIconURL={_groupsConfiguration?.createGroupIconURL}
      activeGroup={activeGroup}
      groupListConfiguration={_groupsConfiguration?.groupListConfiguration}
      theme={_theme}
    />
  );

  /**
   * If Group changes then prioritize it as props to CometChatMessages
   */
  _group = activeGroup?.guid ? activeGroup : null;

  if (group) _group = group;
  const MessagesBar = (
    <CometChatMessages
      group={_group}
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
    if (isMobileView && (activeGroup || _group)) {
      return showJoinGroup ? joinGroupComponent : MessagesBar;
    } else if (isMobileView && !(activeGroup || _group)) {
      return GroupsBar;
    } else if (!isMobileView && !(activeGroup || _group)) {
      return (
        <>
          {GroupsBar}
          <CometChatDecoratorMessage
            text={messageText || localize("SELECT_GROUP_TO_START")}
            textColor={_theme?.palette?.getAccent400()}
            textFont={fontHelper(_theme?.typography?.heading)}
            background={_theme?.palette?.getAccent900()}
          />
        </>
      );
    } else if (!isMobileView && (activeGroup || _group)) {
      return (
        <>
          {GroupsBar}
          {showJoinGroup ? joinGroupComponent : MessagesBar}
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
      className="cometchat__groups__with__messages"
    >
      {getTemplate()}
    </div>
  );
};

/**
 * Component default props types values
 */
CometChatGroupsWithMessages.defaultProps = {
  messageText: "",
};

/**
 * Component default props types
 */
CometChatGroupsWithMessages.propTypes = {
  group: PropTypes.object,
  isMobileView: PropTypes.bool,
  messageText: PropTypes.string,
  groupsConfiguration: PropTypes.object,
  messagesConfiguration: PropTypes.object,
  joinProtectedGroupConfiguration: PropTypes.object,
  theme: PropTypes.object,
  style: PropTypes.object,
};

export { CometChatGroupsWithMessages };
