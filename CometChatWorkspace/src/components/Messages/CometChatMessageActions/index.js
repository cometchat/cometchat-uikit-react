import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { validateWidgetSettings } from "../../../util/common";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  messageActionStyle,
  actionGroupStyle,
  groupButtonStyle
} from "./style";

import replyIcon from "./resources/startthread.png";
import deleteIcon from "./resources/deletemessage.png";
import editIcon from "./resources/edit.png";
import reactIcon from "./resources/add-reaction.png";
import translateIcon from "./resources/translate.png";

class CometChatMessageActions extends React.PureComponent {

  toggleTooltip = (event, flag) => {

    const elem = event.target;

    if (flag) {
      elem.setAttribute("title", elem.dataset.title);
    } else {
      elem.removeAttribute("title");
    }
  }

  render() {

    //don't show the tooltip while the message is being sent
    if (this.props.message.hasOwnProperty("sentAt") === false) {
      return false;
    }

    let reactToMessage = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
          type="button"
          onMouseEnter={event => this.toggleTooltip(event, true)}
          onMouseLeave={event => this.toggleTooltip(event, false)}
          css={groupButtonStyle(this.props, reactIcon)}
          className="group__button button__reacttomessage"
          data-title={Translator.translate("ADD_REACTION", this.props.lang)}
          onClick={() => this.props.actionGenerated("reactToMessage", this.props.message)}></button>
      </li>
    );

    //if message reactions are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "allow_message_reactions") === false) {
      reactToMessage = null;
    }
    
    let threadedChats = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
        type="button"
        onMouseEnter={event => this.toggleTooltip(event, true)}
        onMouseLeave={event => this.toggleTooltip(event, false)}
        css={groupButtonStyle(this.props, replyIcon)}
        className="group__button button__threadedchats" 
        data-title={(this.props.message.replyCount) ? Translator.translate("REPLY_TO_THREAD", this.props.lang) : Translator.translate("REPLY_IN_THREAD", this.props.lang) }
        onClick={() => this.props.actionGenerated("viewMessageThread", this.props.message)}></button>
      </li>
    );

    //if threaded messages are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetconfig, "threaded-chats") === false 
      || validateWidgetSettings(this.props.widgetsettings, "enable_threaded_replies") === false
      || this.props.message.parentMessageId) {
      threadedChats = null;
    }

    let deleteMessage = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
        type="button"
        onMouseEnter={event => this.toggleTooltip(event, true)}
        onMouseLeave={event => this.toggleTooltip(event, false)}
        css={groupButtonStyle(this.props, deleteIcon)}
        className="group__button button__delete" 
        data-title={Translator.translate("DELETE_MESSAGE", this.props.lang)}
        onClick={() => this.props.actionGenerated("deleteMessage", this.props.message)}></button>
      </li>
    );

    //if deleting messages are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_deleting_messages") === false
      || this.props.message.messageFrom === "receiver") {
      deleteMessage = null;
    }

    let editMessage = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
        type="button"
        onMouseEnter={event => this.toggleTooltip(event, true)}
        onMouseLeave={event => this.toggleTooltip(event, false)}
        css={groupButtonStyle(this.props, editIcon)}
        className="group__button button__edit" 
        data-title={Translator.translate("EDIT_MESSAGE", this.props.lang)}
        onClick={() => this.props.actionGenerated("editMessage", this.props.message)}></button>
      </li>
    );

    //if editing messages are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_editing_messages") === false
    || this.props.message.messageFrom === "receiver"
    || this.props.message.type !== CometChat.MESSAGE_TYPE.TEXT) {
      editMessage = null;
    }

    let translateMessage = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
        type="button"
        onMouseEnter={event => this.toggleTooltip(event, true)}
        onMouseLeave={event => this.toggleTooltip(event, false)}
        css={groupButtonStyle(this.props, translateIcon)}
        className="group__button button__translate"
        data-title={Translator.translate("TRANSLATE_MESSAGE", this.props.lang)}
        onClick={() => this.props.translateMessage(this.props.message)}></button>
      </li>
    );

    if (validateWidgetSettings(this.props.widgetsettings, "enable_message_translation") === false
    || this.props.message.type !== CometChat.MESSAGE_TYPE.TEXT) {
      translateMessage = null;
    }

    let tooltip = (
      <ul css={messageActionStyle(this.props)} className="message__actions">
        {reactToMessage}
        {threadedChats}
        {editMessage}
        {deleteMessage}
        {translateMessage}
      </ul>
    );

    if (threadedChats === null && deleteMessage === null && editMessage === null && reactToMessage === null && translateMessage === null) {
      tooltip = null;
    }

    return tooltip;
  }
}

// Specifies the default values for props:
CometChatMessageActions.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatMessageActions.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatMessageActions;