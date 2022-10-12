import React from "react";
import PropTypes from "prop-types";

import { localize } from "../../Shared";
import { replyCountStyle } from "./style";
import { CometChatListItem } from "../..";

const CometChatThreadReplies = (props) => {
  const [reply, setReply] = React.useState(false);

  // const toggleReply = () => {
  //   context.FeatureRestriction.isThreadedMessagesEnabled()
  //     .then((response) => {
  //       if (response !== reply) {
  //         setReply(response);
  //       }
  //     })
  //     .catch((error) => {
  //       if (reply !== false) {
  //         setReply(false);
  //       }
  //     });
  // };

  //React.useEffect(toggleReply);

  const viewThread = () => {
    setReply(!reply);
  };

  const replyCount = props.messageObject.replyCount;
  const replyText =
    replyCount === 1
      ? `View ${replyCount} ${localize("REPLY")}`
      : `View ${replyCount} ${localize("REPLIES")}`;

  let replies = (
    <span
      style={replyCountStyle(props)}
      className="replycount"
      onClick={viewThread}
    >
      {replyText}
    </span>
  );

  if (props.messageObject.hasOwnProperty("replyCount") === false) {
    replies = null;
  }

  //if threadedchats feature is disabled
  // if (reply === false) {
  //   replies = null;
  // }

  const listItem = () => {
    const listItemStyle = {
      width: "100%",
      height: "auto",
      background: "transparent",
      iconTransform: "rotate(270deg)",
      borderRadius: "8px",
      textFont: "400 15px Inter, sans-serif",
      textColor: "rgba(20,20,20, 0.8)",
      iconTint: "rgba(20,20,20,0.46)",
      iconBackground: "rgba(20,20,20, 0.46)",
    };
    return (
      <CometChatListItem
        iconURL={props.iconURL}
        tail={props.tail}
        text={replies}
        style={listItemStyle}
      />
    );
  };

  return listItem();
};

CometChatThreadReplies.defaultProps = {
  messageObject: {},
  text: "",
  tail: "",
  iconURL: "",
  style: {
    width: "",
    height: "",
    border: "0 none",
    borderRadius: "8px",
    background: "transparent",
    textFont: "400 15px Inter,sans-serif",
    textColor: "rgba(20,20,20, .8)",
    iconTint: "rgba(20,20,20,0.6)",
    iconBackground: "rgb(255,255,255)",
    iconBorder: "0 none",
    iconBorderRadius: "8px",
  },
  divider: "",
  onItemClick: () => {},
};

CometChatThreadReplies.propTypes = {
  messageObject: PropTypes.object,
  text: PropTypes.string,
  tail: PropTypes.string,
  iconURL: PropTypes.object,
  style: PropTypes.object,
  divider: PropTypes.string,
  onItemClick: PropTypes.func,
};

export { CometChatThreadReplies };
