"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatSoundManager = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var CometChatSoundManager = /*#__PURE__*/function () {
  function CometChatSoundManager() {
    (0, _classCallCheck2.default)(this, CometChatSoundManager);
  }

  (0, _createClass2.default)(CometChatSoundManager, null, [{
    key: "play",
    value: function play(sound) {
      var customSound = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var resource = CometChatSoundManager.Sound[sound];
      var handler = CometChatSoundManager.handlers[resource];

      if (!handler) {
        return false;
      }

      return handler(customSound);
    }
  }, {
    key: "pause",
    value: function pause() {
      if (CometChatSoundManager.audio) {
        CometChatSoundManager.audio.pause();
      }
    }
  }]);
  return CometChatSoundManager;
}();

exports.CometChatSoundManager = CometChatSoundManager;
(0, _defineProperty2.default)(CometChatSoundManager, "Sound", Object.freeze({
  incomingCall: "incomingCall",
  incomingMessage: "incomingMessage",
  incomingMessageFromOther: "incomingMessageFromOther",
  outgoingCall: "outgoingCall",
  outgoingMessage: "outgoingMessage"
}));
(0, _defineProperty2.default)(CometChatSoundManager, "audio", null);
(0, _defineProperty2.default)(CometChatSoundManager, "onIncomingMessage", function () {
  var customSound = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  if (customSound) {
    CometChatSoundManager.audio = new Audio(customSound);
    CometChatSoundManager.audio.currentTime = 0;
    CometChatSoundManager.audio.play();
  } else {
    Promise.resolve().then(function () {
      return _interopRequireWildcard(require("./resources/audio/incomingmessage.wav"));
    }).then(function (response) {
      CometChatSoundManager.audio = new Audio(response.default);
      CometChatSoundManager.audio.currentTime = 0;
      CometChatSoundManager.audio.play();
    });
  }
});
(0, _defineProperty2.default)(CometChatSoundManager, "onIncomingOtherMessage", function () {
  var customSound = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  if (customSound) {
    CometChatSoundManager.audio = new Audio(customSound);
    CometChatSoundManager.audio.currentTime = 0;
    CometChatSoundManager.audio.play();
  } else {
    Promise.resolve().then(function () {
      return _interopRequireWildcard(require("./resources/audio/incomingothermessage.wav"));
    }).then(function (response) {
      CometChatSoundManager.audio = new Audio(response.default);
      CometChatSoundManager.audio.currentTime = 0;
      CometChatSoundManager.audio.play();
    });
  }
});
(0, _defineProperty2.default)(CometChatSoundManager, "onOutgoingMessage", function () {
  var customSound = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  if (customSound) {
    CometChatSoundManager.audio = new Audio(customSound);
    CometChatSoundManager.audio.currentTime = 0;
    CometChatSoundManager.audio.play();
  } else {
    Promise.resolve().then(function () {
      return _interopRequireWildcard(require("./resources/audio/outgoingmessage.wav"));
    }).then(function (response) {
      CometChatSoundManager.audio = new Audio(response.default);
      CometChatSoundManager.audio.currentTime = 0;
      CometChatSoundManager.audio.play();
    });
  }
});
(0, _defineProperty2.default)(CometChatSoundManager, "onIncomingCall", function () {
  var customSound = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  if (customSound) {
    try {
      CometChatSoundManager.audio = new Audio(customSound);
      CometChatSoundManager.audio.currentTime = 0;

      if (typeof CometChatSoundManager.audio.loop == "boolean") {
        CometChatSoundManager.audio.loop = true;
      } else {
        CometChatSoundManager.audio.addEventListener("ended", function () {
          this.currentTime = 0;
          this.play();
        }, false);
      }

      CometChatSoundManager.audio.play();
    } catch (error) {}
  } else {
    try {
      Promise.resolve().then(function () {
        return _interopRequireWildcard(require("./resources/audio/incomingcall.wav"));
      }).then(function (response) {
        CometChatSoundManager.audio = new Audio(response.default);
        CometChatSoundManager.audio.currentTime = 0;

        if (typeof CometChatSoundManager.audio.loop == "boolean") {
          CometChatSoundManager.audio.loop = true;
        } else {
          CometChatSoundManager.audio.addEventListener("ended", function () {
            this.currentTime = 0;
            this.play();
          }, false);
        }

        CometChatSoundManager.audio.play();
      });
    } catch (error) {}
  }
});
(0, _defineProperty2.default)(CometChatSoundManager, "onOutgoingCall", function () {
  var customSound = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  if (customSound) {
    try {
      CometChatSoundManager.audio = new Audio(customSound);
      CometChatSoundManager.audio.currentTime = 0;

      if (typeof CometChatSoundManager.audio.loop == "boolean") {
        CometChatSoundManager.audio.loop = true;
      } else {
        CometChatSoundManager.audio.addEventListener("ended", function () {
          this.currentTime = 0;
          this.play();
        }, false);
      }

      CometChatSoundManager.audio.play();
    } catch (error) {}
  } else {
    try {
      Promise.resolve().then(function () {
        return _interopRequireWildcard(require("./resources/audio/outgoingcall.wav"));
      }).then(function (response) {
        CometChatSoundManager.audio = new Audio(response.default);
        CometChatSoundManager.audio.currentTime = 0;

        if (typeof CometChatSoundManager.audio.loop == "boolean") {
          CometChatSoundManager.audio.loop = true;
        } else {
          CometChatSoundManager.audio.addEventListener("ended", function () {
            this.currentTime = 0;
            this.play();
          }, false);
        }

        CometChatSoundManager.audio.play();
      });
    } catch (error) {}
  }
});
(0, _defineProperty2.default)(CometChatSoundManager, "handlers", {
  incomingCall: CometChatSoundManager.onIncomingCall,
  outgoingCall: CometChatSoundManager.onOutgoingCall,
  incomingMessage: CometChatSoundManager.onIncomingMessage,
  incomingMessageFromOther: CometChatSoundManager.onIncomingOtherMessage,
  outgoingMessage: CometChatSoundManager.onOutgoingMessage
});