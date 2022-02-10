"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatActionSheet = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var React = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _CometChatActionSheetItem = require("../CometChatActionSheetItem");

var _layoutType = require("./layoutType");

var _hooks = require("./hooks");

var _style = require("./style");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var CometChatActionSheet = function CometChatActionSheet(props) {
  var _React$useState = React.useState([]),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      actionList = _React$useState2[0],
      setActionList = _React$useState2[1];

  var onActionItemClick = function onActionItemClick() {};

  (0, _hooks.Hooks)(props, setActionList);
  var height = "54px",
      width = "248px";

  if (props.layoutMode === _layoutType.layoutType["grid"]) {
    width = "120px";
    height = "100px";
  }

  var actionItemFont = "15px 400 Inter";
  var actionItemColor = "#141414";
  var actionItemIconTint = "#6929CA";
  var renderItems = actionList.map(function (action) {
    return /*#__PURE__*/React.createElement(_CometChatActionSheetItem.CometChatActionSheetItem, {
      key: action.id,
      iconURL: action.iconURL,
      iconTint: actionItemIconTint,
      title: action.title,
      titleFont: actionItemFont,
      titleColor: actionItemColor,
      width: width,
      height: height,
      onActionItemClick: onActionItemClick
    });
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "action__sheet",
    style: (0, _style.actionSheetWrapperStyle)(props)
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet__header",
    style: (0, _style.actionSheetHeaderStyle)(props)
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet__title",
    style: (0, _style.actionSheetTitleStyle)(props)
  }, props.title), /*#__PURE__*/React.createElement("div", {
    className: "sheet__layout",
    style: (0, _style.actionSheetLayoutIconStyle)(props)
  })), /*#__PURE__*/React.createElement("div", {
    className: "sheet__items"
  }, renderItems));
};

exports.CometChatActionSheet = CometChatActionSheet;
CometChatActionSheet.defaultProps = {
  layoutMode: _layoutType.layoutType["grid"],
  cornerRadius: "24px",
  background: "#F0F0F0",
  border: "0 none",
  width: "272px",
  height: "408px",
  title: "",
  titleFont: "15px 600 Inter, sans-serif",
  titleColor: "#141414",
  style: {},
  actions: []
};
CometChatActionSheet.propTypes = {
  layoutMode: _propTypes.default.oneOf(["list", "grid"]),
  hideLayoutMode: _propTypes.default.bool,
  layoutModeIconURL: _propTypes.default.string,
  layoutModeIconTint: _propTypes.default.string,
  cornerRadius: _propTypes.default.string,
  background: _propTypes.default.string,
  border: _propTypes.default.string,
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  title: _propTypes.default.string,
  titleFont: _propTypes.default.string,
  titleColor: _propTypes.default.string,
  style: _propTypes.default.object,
  actions: _propTypes.default.array
};