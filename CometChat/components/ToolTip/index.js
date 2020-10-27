import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import {
  messageActionStyle,
  actionGroupStyle,
  groupButtonStyle
} from "./style";

import replyIcon from "./resources/reply.svg";
import deleteIcon from "./resources/delete-message.svg";
import editIcon from "./resources/edit.svg";

class Tooltip extends React.Component {

  constructor(props) {
    super(props);

    this.state = {

    }
  }

  toggleTooltip = (event, flag) => {

    const elem = event.target;

    if (flag) {
      elem.setAttribute("title", elem.dataset.title);
    } else {
      elem.removeAttribute("title");
    }
  }

  render() {
    
    let threadedChats = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
        type="button"
        onMouseEnter={event => this.toggleTooltip(event, true)}
        onMouseLeave={event => this.toggleTooltip(event, false)}
        css={groupButtonStyle(replyIcon)}
        className="group__button button__threadedchats" 
        data-title={(this.props.message.replyCount) ? "Reply to thread" : "Reply in thread"}
        onClick={() => this.props.actionGenerated("viewMessageThread", this.props.message)}></button>
      </li>
    );

    if ((this.props.hasOwnProperty("widgetconfig")
    && this.props.widgetconfig
    && this.props.widgetconfig.hasOwnProperty("threaded-chats")
    && this.props.widgetconfig["threaded-chats"] === false)
    || this.props.message.category === "custom") {
      threadedChats = null;
    }

    if ((this.props.hasOwnProperty("widgetsettings")
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("main")
    && this.props.widgetsettings.main.hasOwnProperty("enable_threaded_replies")
    && this.props.widgetsettings.main["enable_threaded_replies"] === false)
    || this.props.message.category === "custom") {
      threadedChats = null;
    }

    if (this.props.message.parentMessageId) {
      threadedChats = null;
    }

    let deleteMessage = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
        type="button"
        onMouseEnter={event => this.toggleTooltip(event, true)}
        onMouseLeave={event => this.toggleTooltip(event, false)}
        css={groupButtonStyle(deleteIcon)}
        className="group__button button__delete" 
        data-title="Delete message"
        onClick={() => this.props.actionGenerated("deleteMessage", this.props.message)}></button>
      </li>
    );

    if ((this.props.hasOwnProperty("widgetsettings")
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("main")
    && this.props.widgetsettings.main.hasOwnProperty("enable_deleting_messages")
    && this.props.widgetsettings.main["enable_deleting_messages"] === false)) {
      deleteMessage = null;
    }

    if (this.props.message.messageFrom === "receiver") {
      deleteMessage = null;
    }

    let editMessage = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
          type="button"
          onMouseEnter={event => this.toggleTooltip(event, true)}
          onMouseLeave={event => this.toggleTooltip(event, false)}
          css={groupButtonStyle(editIcon)}
          className="group__button button__edit" 
          data-title="Edit message"
          onClick={() => this.props.actionGenerated("editMessage", this.props.message)}></button>
      </li>
    );

    if ((this.props.hasOwnProperty("widgetsettings")
      && this.props.widgetsettings
      && this.props.widgetsettings.hasOwnProperty("main")
      && this.props.widgetsettings.main.hasOwnProperty("enable_editing_messages")
      && this.props.widgetsettings.main["enable_editing_messages"] === false)
      || this.props.message.messageFrom === "receiver"
      || this.props.message.type !== CometChat.MESSAGE_TYPE.TEXT) {
      editMessage = null;
    }

    let tooltip = (
      <ul css={messageActionStyle(this.props)} className="message__actions">
        {threadedChats}
        {editMessage}
        {deleteMessage}
      </ul>
    );

    if (threadedChats === null && deleteMessage === null && editMessage === null) {
      tooltip = null;
    }

    return tooltip;
  }
}

export default Tooltip;