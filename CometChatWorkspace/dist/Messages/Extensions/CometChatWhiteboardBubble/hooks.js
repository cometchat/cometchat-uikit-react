"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var _ = require("../../");

var Hooks = function Hooks(props, setName, setAvatar, setWhiteboardURL) {
  _react.default.useEffect(function () {
    if (props.userName && props.userName.length) {
      setName(props.userName);
    } else if (props.messageObject && props.messageObject.sender && props.messageObject.sender.name) {
      setName(props.messageObject.sender.name);
    }
  }, [props.userName, props.messageObject, setName]);

  _react.default.useEffect(function () {
    if (props.avatar && props.avatar.length) {
      setAvatar(props.avatar);
    } else if (props.messageObject && props.messageObject.sender) {
      setAvatar(props.messageObject.sender);
    }
  }, [props.avatar, props.messageObject, setAvatar]);

  _react.default.useEffect(function () {
    if (props.whiteboardURL && props.whiteboardURL.length) {
      setWhiteboardURL(props.whiteboardURL);
    } else if (props.messageObject) {
      var whiteboardData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.whiteboard);

      if (whiteboardData && whiteboardData.board_url && whiteboardData.board_url.trim().length) {
        var _props$loggedInUser;

        // Appending the username to the board_url
        var username = (_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.name.split(" ").join("_");
        setWhiteboardURL(whiteboardData.board_url + "&username=" + username);
      }
    }
  }, [props.whiteboardURL, props.messageObject, props.loggedInUser, setWhiteboardURL]);
};

exports.Hooks = Hooks;