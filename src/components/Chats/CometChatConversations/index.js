import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import * as styles from "./style";
import { CometChatConversationList } from "../";
import {
  CometChatListBase,
  ConversationListConfiguration,
  CometChatTheme,
  CometChatConversationEvents,
  CometChatMessageEvents,
} from "../../../";
import { ConversationsStyles, ConversationListStyle } from "../../Chats";
import { ListBaseStyle } from "../../Shared/PrimaryComponents/CometChatListBase/ListBaseStyle";
import backIcon from "./resources/back.svg";
import startConversationIcon from "./resources/new.svg";
import seachIcon from "./resources/search.svg";
import { messageStatus } from "../../Messages/CometChatMessageConstants";

/**
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @description CometChatConversations is a container component that wraps and
 * formats CometChatListBase and CometChatConversationList component, with no behavior of its own.
 *
 */

const CometChatConversations = forwardRef((props, ref) => {
  /**
   * Props destructuring
   */
  const {
    activeConversation,
    title,
    searchPlaceholder,

    backButtonIconURL,
    startConversationIconURL,
    searchIconURL,
    showBackButton,
    hideStartConversation,
    hideSearch,
    style,
    conversationListConfiguration,
    theme,
  } = props;

  const updateLastMessage = (payload) => {
    if (
      conversationListRef?.current &&
      payload.status === messageStatus.success
    ) {
      if (payload?.message?.deletedAt || payload?.message?.editedAt) {
        conversationListRef.current.updateConversationonEditOrDeleteMessage(
          payload?.message
        );
      } else {
        conversationListRef.current.updateLastMessage(payload?.message);
      }
    }
  };

  CometChatMessageEvents.addListener(
    CometChatMessageEvents.onMessageSent,
    "onMessageSent",
    updateLastMessage
  );

  CometChatMessageEvents.addListener(
    CometChatMessageEvents.onMessageDelete,
    "onMessageDelete",
    updateLastMessage
  );
  /**
   * Component internal state
   */
  const conversationListRef = React.useRef(null);

  /**
   * Component private scoping
   */
  const _conversationListConfiguration = new ConversationListConfiguration(
    conversationListConfiguration ?? {}
  );
  const _theme = new CometChatTheme(theme ?? {});

  React.useImperativeHandle(ref, () => ({
    conversationListRef: conversationListRef.current,
  }));

  React.useImperativeHandle(ref, () => ({
    conversationListRef: conversationListRef.current,
  }));

  /**
   * Component internal handlers/methods
   */

  const searchHandler = (searchText) => {
    //TODO: search is not implemented
    return false;
  };

  /**
   * Component template scoping
   */
  const getStartConversationButtonElem = () => {
    if (hideStartConversation) {
      return (
        <div
          style={styles.startConversationBtnStyle(
            style,
            _theme,
            startConversationIconURL
          )}
        ></div>
      );
    }
    return null;
  };

  /**
   * Component template
   */
  return (
    <div
      style={styles.containerStyle(style, _theme)}
      className="cometchat__conversations"
    >
      {/* {getStartConversationButtonElem()} */}
      <CometChatListBase
        style={
          new ListBaseStyle({
            ...styles.getListBaseStyle(style, _theme),
          })
        }
        title={title}
        searchPlaceholder={searchPlaceholder}
        hideSearch={hideSearch}
        showBackButton={showBackButton}
        backButtonIconURL={backButtonIconURL}
        onSearch={searchHandler}
        searchIconURL={searchIconURL}
        searchText={""}
        theme={_theme}
      >
        <CometChatConversationList
          ref={conversationListRef}
          style={
            new ConversationListStyle({
              ...styles.getConversationListStyle(style, _theme),
              ..._conversationListConfiguration?.style,
            })
          }
          limit={_conversationListConfiguration?.limit}
          userAndGroupTags={_conversationListConfiguration?.userAndGroupTags}
          tags={_conversationListConfiguration?.tags}
          loadingIconURL={_conversationListConfiguration?.loadingIconURL}
          customView={_conversationListConfiguration?.customView}
          hideError={_conversationListConfiguration?.hideError}
          emptyText={_conversationListConfiguration?.emptyText}
          errorText={_conversationListConfiguration?.errorText}
          activeConversation={activeConversation}
          enableSoundForMessages={
            _conversationListConfiguration?.enableSoundForMessages
          }
          conversationListItemConfiguration={
            _conversationListConfiguration?.conversationListItemConfiguration
          }
          theme={_theme}
        />
      </CometChatListBase>
    </div>
  );
});

/**
 * Component default props
 */
CometChatConversations.defaultProps = {
  backButtonIconURL: backIcon, //TODO: This default props will be moved to configuration class when we move configurations in component folder only.
  startConversationIconURL: startConversationIcon,
  searchIconURL: seachIcon,
};

/**
 * Component default props types
 */
CometChatConversations.propTypes = {
  title: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  style: PropTypes.object,
  backButtonIconURL: PropTypes.string,
  searchIconURL: PropTypes.string,
  showBackButton: PropTypes.bool,
  hideSearch: PropTypes.bool,
  startConversationIconURL: PropTypes.string,
  hideStartConversation: PropTypes.bool,
  activeConversation: PropTypes.object, //TODO: Figure out way to use PropTypes.objectOf(CometChat.Conversation)
  conversationListConfiguration: PropTypes.object,
  theme: PropTypes.object,
};

export { CometChatConversations };
