import React from "react";
import PropTypes from "prop-types";

import {
  listItem,
  listTitle,
  iconBackgroundStyle,
  listItemIconStyle,
} from "./style";

const CometChatListItem = (props) => {
  const getIcon = () => {
    return props.iconURL ? (
      <div className="item__background" style={iconBackgroundStyle(props)}>
        <span
          title={props?.hoverText}
          className="item__icon"
          style={listItemIconStyle(props)}
        ></span>
      </div>
    ) : null;
  };

  const getText = () => {
    return props.text ? (
      <div
        style={listTitle(props)}
        title={props?.hoverText}
        className="item__text"
      >
        {props.text}
      </div>
    ) : null;
  };

  return (
    <div
      id={props.id}
      style={listItem(props)}
      className="list__item"
      onClick={props.onItemClick}
    >
      {getIcon()}
      {getText()}
      {props.tail}
    </div>
  );
};

export { CometChatListItem };

CometChatListItem.defaultProps = {
  id: "123",
  text: "",
  tail: null,
  iconURL: "",
  hoverText: "",
  onItemClick: () => {},
  style: {
    width: "",
    height: "",
    iconWidth: "",
    iconHeight: "",
    iconTint: "",
    borderRadius: "8px",
    iconBackground: "white",
    textColor: "rgb(51,153,255)",
    border: "",
    background: "rgba(255,255,255, 0.6)",
    textFont: "600 15px Inter, sans-serif",
  },
};

CometChatListItem.propTypes = {
  id: PropTypes.string,
  text: PropTypes.string,
  tail: PropTypes.object,
  iconURL: PropTypes.string,
  hoverText: PropTypes.string,
  style: PropTypes.object,
  onItemClick: PropTypes.func,
};
