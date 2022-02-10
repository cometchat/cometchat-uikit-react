"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var Hooks = function Hooks(props, setIcon) {
  _react.default.useEffect(function () {
    if (props.messageObject.error) {
      setIcon(props.messageErrorIcon);
    } else {
      if (props.messageObject.readAt) {
        setIcon(props.messageReadIcon);
      } else if (props.messageObject.deliveredAt) {
        setIcon(props.messageDeliveredIcon);
      } else if (props.messageObject.sentAt) {
        setIcon(props.messageSentIcon);
      } else {
        setIcon(props.messageWaitIcon);
      }
    }
  }, [props.messageObject, props.messageErrorIcon, props.messageReadIcon, props.messageDeliveredIcon, props.messageSentIcon, props.messageWaitIcon, setIcon]);
};

exports.Hooks = Hooks;