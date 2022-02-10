"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConversations = exports.Hooks = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _react = _interopRequireDefault(require("react"));

var _ = require("../../");

var getConversations = function getConversations(conversationListManager) {
  return new Promise(function (resolve, reject) {
    conversationListManager.fetchNextConversation().then(function (conversations) {
      return resolve(conversations);
    }).catch(function (error) {
      return reject(error);
    });
  });
};

exports.getConversations = getConversations;

var Hooks = function Hooks(props, setBackground, setMessage, conversationList, setConversationList, conversationCallback, conversationListManager, handlers, callbackData) {
  _react.default.useEffect(function () {
    if (props.configurations && props.configurations.background) {
      setBackground(props.configurations.background);
    } else if (props.background) {
      setBackground(props.background);
    }
  }, [props]);

  _react.default.useEffect(function () {
    var handler = handlers[callbackData === null || callbackData === void 0 ? void 0 : callbackData.name];

    if (!handler) {
      return false;
    }

    return handler.apply(void 0, (0, _toConsumableArray2.default)(callbackData === null || callbackData === void 0 ? void 0 : callbackData.args));
  }, [callbackData]);

  _react.default.useEffect(function () {
    conversationListManager.attachListeners(conversationCallback);
    getConversations(conversationListManager).then(function (conversations) {
      if (conversationList.length === 0 && conversations.length === 0) {
        setMessage((0, _.localize)("NO_CHATS_FOUND"));
      } else {
        setMessage("");
      }

      setConversationList(function (conversationList) {
        return [].concat((0, _toConsumableArray2.default)(conversationList), (0, _toConsumableArray2.default)(conversations));
      });
    }).catch(function (error) {
      setMessage((0, _.localize)("SOMETHING_WRONG"));
    });
  }, []);
};

exports.Hooks = Hooks;