"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageHoverItem = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _style = require("./style");

var CometChatMessageHoverItem = function CometChatMessageHoverItem(props) {
  var showToolTip = function showToolTip(event) {
    return event.target.setAttribute("title", props.title);
  };

  var hideToolTip = function hideToolTip(event) {
    return event.target.removeAttribute("title");
  };

  var handleClick = function handleClick() {
    props.onHoverItemClick(props);
  };

  return /*#__PURE__*/_react.default.createElement("li", {
    style: (0, _style.hoverItemStyle)(props),
    className: "action__group"
  }, /*#__PURE__*/_react.default.createElement("button", {
    type: "button",
    onMouseEnter: showToolTip,
    onMouseLeave: hideToolTip,
    style: (0, _style.hoverItemButtonStyle)(props),
    className: "group__button button__".concat(props.id),
    onClick: handleClick
  }));
};

exports.CometChatMessageHoverItem = CometChatMessageHoverItem;
CometChatMessageHoverItem.defaultProps = {
  id: _propTypes.default.string,
  iconURL: _propTypes.default.string,
  iconTint: _propTypes.default.string,
  title: _propTypes.default.string,
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  onHoverItemClick: _propTypes.default.func
};
CometChatMessageHoverItem.propTypes = {
  id: "",
  iconURL: "",
  iconTint: "#808080",
  title: "Hover me",
  width: "24px",
  height: "24px",
  onHoverItemClick: function onHoverItemClick() {}
};