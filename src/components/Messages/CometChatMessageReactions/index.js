import React from "react";
import PropTypes from "prop-types";
import { Hooks } from "./hooks";

import { localize, CometChatListItem, CometChatTheme } from "../..";

import {
  messageReactionListStyle,
  messageAddReactionStyle,
  emojiButtonStyle,
  messageReactionsStyle,
  reactionCountStyle,
  reactionListStyle,
} from "./style";

const CometChatMessageReactions = (props) => {
  const {
    messageObject,
    loggedInUser,
    updateReaction,
    addReactionIconURL,
    style,
    theme,
  } = props;
  const _theme = theme || new CometChatTheme({});
  const [reactionList, setReactionList] = React.useState([]);
  const reactionRef = React.useRef([]);

  const getAddReactionButton = () => {
    return (
      <div
        key="-1"
        style={messageAddReactionStyle(
          messageObject,
          loggedInUser,
          style,
          _theme
        )}
        className="reaction__add"
        title={localize("ADD_REACTION")}
      >
        <CometChatListItem
          style={emojiButtonStyle(style, loggedInUser, messageObject, _theme)}
          className="button__reacttomessage"
          iconURL={addReactionIconURL}
          onItemClick={updateReaction.bind(this, messageObject)}
        />
      </div>
    );
  };

  const reactionView = (reactionObject, reactionData) => {
    let reactionName = "";
    const userList = [];
    let count;

    for (const reaction in reactionObject) {
      reactionName = reaction.replaceAll(":", "");
      const reactionData = reactionObject[reaction];
      count = Object.keys(reactionData).length;
      for (const user in reactionData) {
        userList.push(reactionData[user]["name"]);
      }
    }

    let reactionTitle = "";
    if (userList.length) {
      reactionTitle = userList.join(",");
      reactionTitle = reactionTitle.concat(" ", localize("REACTED"));
    }

    let Emoji = Object.keys(reactionObject)[0];
    const reactionClassName = `reaction reaction__${reactionName}`;

    let Count = (
      <span
        style={reactionCountStyle(
          loggedInUser,
          messageObject,
          reactionData,
          _theme
        )}
        className="reaction__count"
      >
        {count}
      </span>
    );

    return count >= 1 ? (
      <div
        key={Math.random()}
        style={messageReactionsStyle(
          messageObject,
          loggedInUser,
          style,
          reactionData,
          _theme
        )}
        className={reactionClassName}
        title={reactionTitle}
      >
        <CometChatListItem
          style={reactionListStyle()}
          text={Emoji}
          onItemClick={updateReaction.bind(this, messageObject, null, Emoji)}
          tail={Count}
        />
      </div>
    ) : null;
  };

  Hooks(messageObject, reactionRef, reactionView, setReactionList);

  return reactionList.length !== null ? (
    <div
      className="message_kit__reaction_bar"
      style={messageReactionListStyle()}
    >
      {getAddReactionButton()}
      {reactionList}
    </div>
  ) : null;
};

// Specifies the default values for props:
CometChatMessageReactions.defaultProps = {
  messageObject: null,
  loggedInUser: null,
  addReactionIconURL: "",
  style: {
    width: "",
    height: "",
    border: "1px solid rgba(20, 20, 20, 8%)",
    borderRadius: "",
    background: "#F0F0F0",
    textColor: "",
    textFont: "",
    addReactionIconTint: "",
    addReactionIconBackground: "",
  },
};

CometChatMessageReactions.propTypes = {
  messageObject: PropTypes.object.isRequired,
  loggedInUser: PropTypes.object.isRequired,
  addReactionIconURL: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatMessageReactions };
