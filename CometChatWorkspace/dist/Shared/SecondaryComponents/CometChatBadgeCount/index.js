"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatBadgeCount = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var CometChatBadgeCount = function CometChatBadgeCount(props) {
  if (props.count) {
    var getStyle = function getStyle() {
      return {
        border: props.border,
        borderRadius: props.cornerRadius,
        backgroundColor: props.background,
        color: props.textColor,
        font: props.textFont,
        minWidth: props.width,
        height: props.height,
        textAlign: "center",
        display: "inline-block",
        padding: "2px 6px"
      };
    };

    return /*#__PURE__*/_react.default.createElement("div", {
      style: getStyle()
    }, props.count);
  }

  return null;
}; // Specifies the default values for props


exports.CometChatBadgeCount = CometChatBadgeCount;
CometChatBadgeCount.defaultProps = {
  count: 0,
  border: "1px solid transparent",
  cornerRadius: "11px",
  background: "rgba(51, 153, 255, 1)",
  textColor: "white",
  textFont: "600 12px Inter",
  width: "24px",
  height: "20px"
};
CometChatBadgeCount.propTypes = {
  count: _propTypes.default.number,
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  border: _propTypes.default.string,
  cornerRadius: _propTypes.default.string,
  background: _propTypes.default.string,
  textColor: _propTypes.default.string,
  textFont: _propTypes.default.string
};