"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatAvatar = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _hooks = require("./hooks");

var _default = _interopRequireDefault(require("./resources/default.jpg"));

var CometChatAvatar = function CometChatAvatar(props) {
  var _React$useState = _react.default.useState(props.image),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      imageURL = _React$useState2[0],
      setImageURL = _React$useState2[1];

  var getImageStyle = function getImageStyle() {
    return {
      display: "flex",
      width: "100%",
      height: "100%",
      flex: "1 1 100%",
      backgroundColor: props.background,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: props.backgroundSize,
      backgroundImage: "url(".concat(imageURL, ")"),
      border: props.border,
      borderRadius: props.cornerRadius
    };
  };

  var getContainerStyle = function getContainerStyle() {
    return {
      height: props.height,
      width: props.width,
      borderRadius: props.cornerRadius,
      margin: props.outerViewSpacing,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "stretch",
      backgroundColor: "#ffffff",
      boxSizing: "content-box",
      cursor: "inherit",
      outline: "none",
      overflow: "hidden",
      position: "static",
      padding: "0"
    };
  };

  var getOuterViewStyle = function getOuterViewStyle() {
    return {
      display: "inline-block",
      borderRadius: props.cornerRadius,
      border: props.outerView,
      margin: "0",
      padding: "0"
    };
  };

  (0, _hooks.Hooks)(setImageURL, props);
  return /*#__PURE__*/_react.default.createElement("div", {
    style: getOuterViewStyle()
  }, /*#__PURE__*/_react.default.createElement("span", {
    style: getContainerStyle()
  }, /*#__PURE__*/_react.default.createElement("span", {
    style: getImageStyle()
  })));
}; // Specifies the default values for props


exports.CometChatAvatar = CometChatAvatar;
CometChatAvatar.defaultProps = {
  cornerRadius: "50%",
  border: "1px solid rgba(20, 20, 20, 8%)",
  background: "#3399FF",
  backgroundSize: "cover",
  textColor: "#ffffff",
  textFont: "bold 80px Inter",
  outerView: "2px solid #39f",
  outerViewSpacing: "4px",
  width: "40px",
  height: "40px",
  image: _default.default,
  user: {},
  group: {}
};
CometChatAvatar.propTypes = {
  cornerRadius: _propTypes.default.string,
  border: _propTypes.default.string,
  background: _propTypes.default.string,
  backgroundSize: _propTypes.default.string,
  textColor: _propTypes.default.string,
  textFont: _propTypes.default.string,
  outerView: _propTypes.default.string,
  outerViewSpacing: _propTypes.default.string,
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  image: _propTypes.default.string,
  user: _propTypes.default.object,
  group: _propTypes.default.object
};