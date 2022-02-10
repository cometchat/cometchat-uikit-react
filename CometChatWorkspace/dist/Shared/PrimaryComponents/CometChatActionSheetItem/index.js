"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatActionSheetItem = void 0;

var React = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _style = require("./style");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var CometChatActionSheetItem = function CometChatActionSheetItem(props) {
  var clickHandler = function clickHandler(event) {
    props.onActionItemClick(props.id, props.title);
  };

  return /*#__PURE__*/React.createElement("div", {
    style: (0, _style.actionSheetItemWrapperStyle)(props),
    onClick: clickHandler
  }, /*#__PURE__*/React.createElement("span", {
    style: (0, _style.actionSheetItemIconStyle)(props),
    title: props.title
  }), /*#__PURE__*/React.createElement("span", {
    style: (0, _style.actionsheetItemTitleStyle)(props)
  }, props.title));
};

exports.CometChatActionSheetItem = CometChatActionSheetItem;
CometChatActionSheetItem.defaultProps = {
  id: "uploadphoto",
  width: "50px",
  height: "70px",
  cornerRadius: "10px",
  background: "#eee",
  border: "0 none",
  title: "Upload photo",
  titleFont: "13px 400 Inter",
  titleColor: "#141414",
  iconURL: "",
  iconTint: "grey",
  iconBackground: "rgba(0,0,0, 50%)",
  iconCornerRadius: "10px",
  onActionItemClick: function onActionItemClick() {}
};
CometChatActionSheetItem.propTypes = {
  id: _propTypes.default.string,
  background: _propTypes.default.string,
  cornerRadius: _propTypes.default.string,
  border: _propTypes.default.string,
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  title: _propTypes.default.string,
  titleFont: _propTypes.default.string,
  titleColor: _propTypes.default.string,
  iconURL: _propTypes.default.string,
  iconTint: _propTypes.default.string,
  iconBackground: _propTypes.default.string,
  iconCornerRadius: _propTypes.default.string,
  onActionItemClick: _propTypes.default.func
};