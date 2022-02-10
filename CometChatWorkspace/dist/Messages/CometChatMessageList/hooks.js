"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePrevious = exports.fetchMessages = exports.Hooks = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../../");

var fetchMessages = function fetchMessages(MessageListManager) {
  var promise = new Promise(function (resolve, reject) {
    MessageListManager.fetchPreviousMessages().then(function (messageList) {
      resolve(messageList);
    }).catch(function (error) {
      return reject(error);
    });
  });
  return promise;
};

exports.fetchMessages = fetchMessages;

var usePrevious = function usePrevious(value) {
  var ref = _react.default.useRef();

  _react.default.useEffect(function () {
    ref.current = value;
  });

  return ref.current;
};

exports.usePrevious = usePrevious;

var Hooks = function Hooks(props, setLoggedInUser, messageList, setMessageList, setScrollToBottom, prevChatWithIdRef, chatWithId, setDecoratorMessage, setChatWith, setChatWithId, messageHandler, messageListManager, messageListCallback, handlers, callbackData) {
  _react.default.useEffect(function () {
    //fetching logged in user
    _chat.CometChat.getLoggedinUser().then(function (user) {
      return setLoggedInUser(user);
    }); //set receiver and receiver type


    if (props.user && props.user.uid) {
      setChatWith(_chat.CometChat.RECEIVER_TYPE.USER);
      setChatWithId(props.user.uid);
    } else if (props.group && props.group.guid) {
      setChatWith(_chat.CometChat.RECEIVER_TYPE.GROUP);
      setChatWithId(props.group.guid);
    } //prevChatWithIdRef = chatWithId;


    messageListManager.attachListeners(messageListCallback);
    fetchMessages(messageListManager).then(function (messages) {
      if (messageList.length === 0 && messages.length === 0) {
        setDecoratorMessage((0, _.localize)("NO_MESSAGES_FOUND"));
      } else {
        setDecoratorMessage("");
      } // setMessageList(messageList => {
      // 	return [...messageList, ...messages];
      // });
      // setScrollToBottom(true);


      messageHandler(messages, true);
    }).catch(function (error) {
      setDecoratorMessage((0, _.localize)("SOMETHING_WRONG"));
    });
  }, []);

  _react.default.useEffect(function () {
    var handler = handlers[callbackData === null || callbackData === void 0 ? void 0 : callbackData.name];

    if (!handler) {
      return false;
    }

    return handler.apply(void 0, (0, _toConsumableArray2.default)(callbackData === null || callbackData === void 0 ? void 0 : callbackData.args));
  }, [callbackData]);
};

exports.Hooks = Hooks;