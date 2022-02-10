"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatDate = void 0;

var React = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _dateformat = _interopRequireDefault(require("dateformat"));

var _style = require("./style");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var CometChatDate = function CometChatDate(props) {
  var setDate = function setDate() {
    var messageDate = null;

    switch (props.timeFormat) {
      case "CONVERSATION_LIST":
        messageDate = getMessageTime(props.time);
        break;

      case "MESSAGE_LIST":
        messageDate = getMessageTime(props.time);
        break;

      case "MESSAGE_BUBBLE":
        messageDate = getMessageTime(props.time);
        break;

      case "CALL_LIST":
        break;

      default:
        break;
    }

    return messageDate;
  };

  var getMessageTime = function getMessageTime(messageDate) {
    //const messageTimestamp = new Date(messageDate) * 1000;
    return (0, _dateformat.default)(new Date(messageDate) * 1000, "shortTime");
  };

  return /*#__PURE__*/React.createElement("span", {
    style: (0, _style.timeStyle)(props)
  }, setDate());
};

exports.CometChatDate = CometChatDate;
CometChatDate.defaultProps = {
  time: 0,
  timeFont: "500 11px Inter",
  timeColor: "rgba(20, 20, 20, 40%)",
  timeFormat: "MESSAGE_BUBBLE",
  backgroundColor: "transparent",
  cornerRadius: null
};
CometChatDate.propTypes = {
  time: _propTypes.default.number.isRequired,
  timeFont: _propTypes.default.string.isRequired,
  timeColor: _propTypes.default.string.isRequired,
  timeFormat: _propTypes.default.oneOf(["CONVERSATION_LIST", "MESSAGE_LIST", "MESSAGE_BUBBLE", "CALL_LIST"]).isRequired,
  backgroundColor: _propTypes.default.string.isRequired,
  cornerRadius: _propTypes.default.string
};