import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

import {
  reactionContainerStyle,
  reactionStyle,
  liveReactionStyle,
} from "./style";

import heart from "./resources/heart.png";
import { BaseStyles } from "../../Shared";

/**
 *
 * CometChatLiveReaction component allows user to show animated images as a reaction in real-time.
 * @version 1.0.0
 * @author CometChatTeam
 *
 */

const CometChatLiveReactions = (props) => {
  const [verticalSpeed] = React.useState(5);
  const [horizontalSpeed] = React.useState(2);
  let parentElement = React.createRef(null);
  const timer = React.useRef(null);
  const items = [];

  const setItemsHandler = () => {
    const width = parentElement?.offsetWidth;
    const height = parentElement?.offsetHeight;

    let elements = parentElement?.querySelectorAll(".live__reaction");

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i],
        elementWidth = element?.offsetWidth,
        elementHeight = element?.offsetHeight;

      const item = {
        element: element,
        elementHeight: elementHeight,
        elementWidth: elementWidth,
        ySpeed: -verticalSpeed,
        omega: (2 * Math.PI * horizontalSpeed) / (width * 60), //omega= 2Pi*frequency
        random: (Math.random() / 2 + 0.5) * i * 10000, //random time offset
        x: function (time) {
          return (
            ((Math.sin(this.omega * (time + this.random)) + 1) / 2) *
            (width - elementWidth)
          );
        },
        y: height + (Math.random() + 1) * i * elementHeight,
      };
      items.push(item);
    }
  };

  let reactionImg = (
    <img
      src={props.reaction}
      alt={props.reaction}
      style={liveReactionStyle(props)}
    />
  );

  let emojis = Array(6).fill(reactionImg);

  const renderItems = emojis?.map((emoji, index) => (
    <span className="live__reaction" style={reactionStyle()} key={index}>
      {emoji}
    </span>
  ));

  Hooks(props, setItemsHandler, parentElement, timer, items);

  return (
    <div
      ref={(el) => {
        parentElement = el;
      }}
      style={reactionContainerStyle()}
    >
      {renderItems}
    </div>
  );
};

CometChatLiveReactions.defaultProps = {
  reaction: heart,
  style: new BaseStyles("20px", "20px", "transparent", "none", "none", ""),
};

CometChatLiveReactions.propTypes = {
  reaction: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatLiveReactions };
