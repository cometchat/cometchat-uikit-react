import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";
import { actionMessageStyle, actionMessageTxtStyle } from "./style";
import { localize } from "../..";

const CometChatGroupActionBubble = (props) => {
  const getActionMessage = (props) => {
    let actionMessage = null;
    const byUser = props.messageObject?.actionBy?.name;
    const onUser = props.messageObject?.actionOn?.name;

    switch (props.messageObject.action) {
      case CometChat.ACTION_TYPE.MEMBER_JOINED:
        actionMessage = `${byUser} ${localize("JOINED")} `;
        break;
      case CometChat.ACTION_TYPE.MEMBER_LEFT:
        actionMessage = `${byUser}  ${localize("LEFT")}`;
        break;
      case CometChat.ACTION_TYPE.MEMBER_ADDED:
        actionMessage = `${byUser} ${localize("ADDED")} ${onUser}`;
        break;
      case CometChat.ACTION_TYPE.MEMBER_KICKED:
        actionMessage = `${byUser}  ${localize("KICKED")}  ${onUser}`;
        break;
      case CometChat.ACTION_TYPE.MEMBER_BANNED:
        actionMessage = `${byUser}  ${localize("BANNED")}  ${onUser}`;
        break;
      case CometChat.ACTION_TYPE.MEMBER_UNBANNED:
        actionMessage = `${byUser}  ${localize("UNBANNED")}  ${onUser}`;
        break;
      case CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED: {
        const newScope = props.messageObject?.newScope;
        actionMessage = `${byUser} ${localize("MADE")} ${onUser} ${newScope}`;
        break;
      }
      default:
        break;
    }

    return actionMessage;
  };

  const message = () => {
    return (
      <React.Fragment>
        <div style={actionMessageStyle(props)} className="action__message">
          <p style={actionMessageTxtStyle(props)} className="message__text">
            {props.text ? props.text : getActionMessage(props)}
          </p>
        </div>
      </React.Fragment>
    );
  };

  return message();
};

// Specifies the default values for props:
CometChatGroupActionBubble.defaultProps = {
  messagObject: {},
  text: "",
  style: {
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: "",
    textFont: "",
    textColor: "",
  },
};

CometChatGroupActionBubble.propTypes = {
  messagObject: PropTypes.object,
  text: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatGroupActionBubble };
