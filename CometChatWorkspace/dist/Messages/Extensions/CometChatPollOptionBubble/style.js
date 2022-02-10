"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pollPercentStyle = exports.pollAnswerStyle = exports.checkIconStyle = exports.answerWrapperStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var pollAnswerStyle = function pollAnswerStyle(props) {
  return {
    backgroundColor: "".concat(props.pollOptionsBackgroundColor),
    margin: "10px 0",
    borderRadius: "8px",
    display: "flex",
    width: "100%",
    cursor: "pointer",
    position: "relative"
  };
};

exports.pollAnswerStyle = pollAnswerStyle;

var checkIconStyle = function checkIconStyle(img) {
  return {
    width: "24px",
    height: "24px",
    mask: "url(".concat(img, ") center center no-repeat"),
    backgroundColor: "#141414"
  };
};

exports.checkIconStyle = checkIconStyle;

var pollPercentStyle = function pollPercentStyle(width) {
  var curvedBorders = width === "100%" ? {
    borderRadius: "8px"
  } : {
    borderRadius: "8px 0 0 8px"
  };
  return _objectSpread(_objectSpread({
    maxWidth: "100%",
    width: width
  }, curvedBorders), {}, {
    backgroundColor: "rgb(230, 230, 230)",
    minHeight: "35px",
    height: "100%",
    position: "absolute",
    zIndex: "1"
  });
};

exports.pollPercentStyle = pollPercentStyle;

var answerWrapperStyle = function answerWrapperStyle(props) {
  var _props$loggedInUser;

  var widthProp = "calc(100% - 40px)";

  if (props.pollOption.hasOwnProperty("voters") && props.pollOption.voters.hasOwnProperty((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid)) {
    widthProp = "calc(100% - 80px)";
  }

  return {
    width: "100%",
    color: "rgb(20, 20, 20)",
    display: "flex",
    alignItems: "center",
    minHeight: "35px",
    padding: "0 16px",
    height: "100%",
    zIndex: "2",
    p: {
      margin: "0",
      width: widthProp,
      minWidth: "75px",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      font: "".concat(props.pollOptionsFont)
    },
    span: {
      maxWidth: "40px",
      padding: "0px 16px 0px 0px",
      display: "inline-block",
      font: "".concat(props.pollOptionsFont)
    }
  };
};

exports.answerWrapperStyle = answerWrapperStyle;