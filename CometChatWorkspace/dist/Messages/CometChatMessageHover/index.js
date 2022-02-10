"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageHover = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../");

var _style = require("./style");

var CometChatMessageHover = function CometChatMessageHover(props) {
  var renderItems = function renderItems() {
    if (!props.options.length) {
      return null;
    }

    var hoverOptions = props.options.map(function (option, key) {
      return /*#__PURE__*/_react.default.createElement(_.CometChatMessageHoverItem, {
        key: option.id,
        id: option.id,
        iconURL: option.iconURL,
        iconTint: option.iconTint,
        title: option.title,
        width: option.width,
        height: option.height,
        style: option.style,
        onHoverItemClick: option.onHoverItemClick
      });
    });
    return /*#__PURE__*/_react.default.createElement("ul", {
      style: (0, _style.messageHoverStyle)(props),
      className: "message__actions"
    }, hoverOptions);
  };

  return renderItems();
};

exports.CometChatMessageHover = CometChatMessageHover;
CometChatMessageHover.defaultProps = {
  options: _propTypes.default.array
};
CometChatMessageHover.propTypes = {
  options: []
};