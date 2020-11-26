import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import { validateWidgetSettings } from "../../util/common";

import {
  messageActionStyle,
  actionGroupStyle,
  groupButtonStyle
} from "./style";

import replyIcon from "./resources/reply.svg";
import deleteIcon from "./resources/delete-message.svg";
import editIcon from "./resources/edit.svg";
import reactIcon from "./resources/add-reaction.png";

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

    let reactToMessage = (
      <li css={actionGroupStyle(this.props)} className="action__group">
        <button
          type="button"
          onMouseEnter={event => this.toggleTooltip(event, true)}
          onMouseLeave={event => this.toggleTooltip(event, false)}
          css={groupButtonStyle(reactIcon)}
          className="group__button button__reacttomessage"
          data-title="Add reaction"
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
        css={groupButtonStyle(replyIcon)}
        className="group__button button__threadedchats" 
        data-title={(this.props.message.replyCount) ? "Reply to thread" : "Reply in thread"}
        onClick={() => this.props.actionGenerated("viewMessageThread", this.props.message)}></button>
      </li>
    );

    //if threaded messages are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetconfig, "threaded-chats") === false 
      || validateWidgetSettings(this.props.widgetsettings, "enable_threaded_replies") === false
      || this.props.message.category === "custom"
      || this.props.message.parentMessageId) {
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
          css={groupButtonStyle(editIcon)}
          className="group__button button__edit" 
          data-title="Edit message"
          onClick={() => this.props.actionGenerated("editMessage", this.props.message)}></button>
      </li>
    );

    //if editing messages are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_editing_messages") === false
    || this.props.message.messageFrom === "receiver"
    || this.props.message.type !== CometChat.MESSAGE_TYPE.TEXT) {
      editMessage = null;
    }

    let tooltip = (
      <ul css={messageActionStyle(this.props)} className="message__actions">
        {reactToMessage}
        {threadedChats}
        {editMessage}
        {deleteMessage}
      </ul>
    );

    if (threadedChats === null && deleteMessage === null && editMessage === null && reactToMessage === null) {
      tooltip = null;
    }

    return tooltip;
  }
}

export default Tooltip;