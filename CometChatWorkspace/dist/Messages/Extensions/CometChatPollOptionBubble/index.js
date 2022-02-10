"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatPollOptionBubble = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _style = require("./style");

var _checkmark = _interopRequireDefault(require("./resources/checkmark.svg"));

var CometChatPollOptionBubble = function CometChatPollOptionBubble(props) {
  var _props$loggedInUser;

  var width = "0%";

  if (props.voteCount) {
    var fraction = props.pollOption.count / props.voteCount;
    width = fraction.toLocaleString("en", {
      style: "percent"
    });
  }

  var checkIcon = null;

  if (props.pollOption.voters && props.pollOption.voters[(_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid]) {
    checkIcon = /*#__PURE__*/_react.default.createElement("i", {
      style: (0, _style.checkIconStyle)(_checkmark.default)
    });
  }

  return /*#__PURE__*/_react.default.createElement("li", {
    style: (0, _style.pollAnswerStyle)(props)
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.pollPercentStyle)(width)
  }, " "), /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.answerWrapperStyle)(props)
  }, checkIcon, /*#__PURE__*/_react.default.createElement("span", null, width), /*#__PURE__*/_react.default.createElement("p", null, props.pollOption.text)));
};

exports.CometChatPollOptionBubble = CometChatPollOptionBubble;
CometChatPollOptionBubble.defaultProps = {
  pollOption: {},
  voteCount: 0,
  pollOptionsFont: "",
  pollOptionsColor: "rgb(230, 230, 230)",
  pollOptionsBackgroundColor: "#fff",
  loggedInUser: {}
};
CometChatPollOptionBubble.propTypes = {
  pollOption: _propTypes.default.object,
  voteCount: _propTypes.default.number,
  pollOptionsFont: _propTypes.default.string,
  pollOptionsColor: _propTypes.default.string,
  pollOptionsBackgroundColor: _propTypes.default.string,
  loggedInUser: _propTypes.default.object
};