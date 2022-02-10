"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageHeader = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _dateformat = _interopRequireDefault(require("dateformat"));

var _chat = require("@cometchat-pro/chat");

var _controller = require("./controller");

var _ = require("../../");

var _CometChatContext = require("../../../util/CometChatContext");

var enums = _interopRequireWildcard(require("../../../util/enums.js"));

var _style = require("./style");

var _menu = _interopRequireDefault(require("./resources/menu.svg"));

var _audioCall = _interopRequireDefault(require("./resources/audio-call.svg"));

var _videoCall = _interopRequireDefault(require("./resources/video-call.svg"));

var _info = _interopRequireDefault(require("./resources/info.svg"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var CometChatMessageHeader = /*#__PURE__*/function (_React$Component) {
  (0, _inherits2.default)(CometChatMessageHeader, _React$Component);

  var _super = _createSuper(CometChatMessageHeader);

  function CometChatMessageHeader(props) {
    var _this;

    (0, _classCallCheck2.default)(this, CometChatMessageHeader);
    _this = _super.call(this, props);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "item", void 0);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "setStatusForUser", function () {
      var status = "";
      var presence = _this.context.item.status === _chat.CometChat.USER_STATUS.ONLINE ? _chat.CometChat.USER_STATUS.ONLINE : _chat.CometChat.USER_STATUS.OFFLINE;

      if (_this.context.item.status === _chat.CometChat.USER_STATUS.OFFLINE && _this.context.item.lastActiveAt) {
        var lastActive = _this.context.item.lastActiveAt * 1000;
        var messageDate = (0, _dateformat.default)(lastActive, "dS mmm yyyy, h:MM TT");
        status = "".concat((0, _.localize)("LAST_ACTIVE_AT"), ": ").concat(messageDate);
      } else if (_this.context.item.status === _chat.CometChat.USER_STATUS.OFFLINE) {
        status = (0, _.localize)("OFFLINE");
      } else if (_this.context.item.status === _chat.CometChat.USER_STATUS.ONLINE) {
        status = (0, _.localize)("ONLINE");
      }

      _this.setState({
        status: status,
        presence: presence
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "setStatusForGroup", function () {
      var membersText = (0, _.localize)("MEMBERS");
      var status = "".concat(_this.context.item.membersCount, " ").concat(membersText);

      _this.setState({
        status: status
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "updateHeader", function (key, item, groupUser) {
      var _this$loggedInUser;

      switch (key) {
        case enums.USER_ONLINE:
        case enums.USER_OFFLINE:
          {
            if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER && _this.context.item.uid === item.uid) {
              //if user presence feature is disabled
              if (_this.state.enableUserPresence === false) {
                return false;
              }

              var status = "";

              if (item.status === _chat.CometChat.USER_STATUS.OFFLINE) {
                status = (0, _.localize)("OFFLINE");
              } else if (item.status === _chat.CometChat.USER_STATUS.ONLINE) {
                status = (0, _.localize)("ONLINE");
              }

              _this.setState({
                status: status,
                presence: item.status
              });
            }

            break;
          }

        case enums.GROUP_MEMBER_KICKED:
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_LEFT:
          if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && _this.context.item.guid === item.guid && ((_this$loggedInUser = _this.loggedInUser) === null || _this$loggedInUser === void 0 ? void 0 : _this$loggedInUser.uid) !== (groupUser === null || groupUser === void 0 ? void 0 : groupUser.uid)) {
            var membersCount = parseInt(item.membersCount);

            var _status = "".concat(membersCount, " ").concat((0, _.localize)("MEMBERS"));

            _this.setState({
              status: _status
            });
          }

          break;

        case enums.GROUP_MEMBER_JOINED:
          if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && _this.context.item.guid === item.guid) {
            var _membersCount = parseInt(item.membersCount);

            var _status2 = "".concat(_membersCount, " ").concat((0, _.localize)("MEMBERS"));

            _this.setState({
              status: _status2
            });
          }

          break;

        case enums.GROUP_MEMBER_ADDED:
          if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && _this.context.item.guid === item.guid) {
            var _membersCount2 = parseInt(item.membersCount);

            var _status3 = "".concat(_membersCount2, " ").concat((0, _.localize)("MEMBERS"));

            _this.setState({
              status: _status3
            });
          }

          break;

        case enums.TYPING_STARTED:
          _this.onTypingStarted(item);

          break;

        case enums.TYPING_ENDED:
          _this.onTypingEnded(item);

          break;

        default:
          break;
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onTypingStarted", function (item) {
      var showTyping = function showTyping(typingText) {
        /**
         * if metadata is available, show live reactions else show typing
         */
        if (item.hasOwnProperty("metadata") && item.metadata && item.metadata.hasOwnProperty("type") && item.metadata.type === enums.CONSTANTS["METADATA_TYPE_LIVEREACTION"]) {
          _this.props.actionGenerated(enums.ACTIONS["SHOW_LIVE_REACTION"], item);
        } else {
          if (_this.state.enableTypingIndicator === true) {
            _this.setState({
              typing: typingText
            });
          }
        }
      };

      if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && _this.context.type === item.receiverType && _this.context.item.guid === item.receiverId) {
        var typingText = "".concat(item.sender.name, " ").concat((0, _.localize)("IS_TYPING"));
        showTyping(typingText);
      } else if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER && _this.context.type === item.receiverType && _this.context.item.uid === item.sender.uid) {
        var _typingText = "".concat((0, _.localize)("TYPING"));

        showTyping(_typingText);
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onTypingEnded", function (item) {
      var endTyping = function endTyping() {
        /**
         * if metadata is available, end live reactions else end typing
         */
        if (item.hasOwnProperty("metadata") && item.metadata && item.metadata.hasOwnProperty("type") && item.metadata.type === enums.CONSTANTS["METADATA_TYPE_LIVEREACTION"]) {
          _this.props.actionGenerated(enums.ACTIONS["STOP_LIVE_REACTION"], item);
        } else {
          if (_this.state.enableTypingIndicator === true) {
            _this.setState({
              typing: null
            });
          }
        }
      };

      if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && _this.context.type === item.receiverType && _this.context.item.guid === item.receiverId) {
        _this.setStatusForGroup();

        endTyping();
      } else if (_this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER && _this.context.type === item.receiverType && _this.context.item.uid === item.sender.uid) {
        if (_this.state.presence === _chat.CometChat.USER_STATUS.ONLINE) {
          _this.setState({
            status: (0, _.localize)("ONLINE"),
            presence: _chat.CometChat.USER_STATUS.ONLINE
          });
        } else {
          _this.setStatusForUser();
        }

        endTyping();
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "toggleTooltip", function (event, flag) {
      var elem = event.target;
      var scrollWidth = elem.scrollWidth;
      var clientWidth = elem.clientWidth;

      if (scrollWidth <= clientWidth) {
        return false;
      }

      if (flag) {
        elem.setAttribute("title", elem.textContent);
      } else {
        elem.removeAttribute("title");
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "resetChat", function () {
      _this.context.setItem({});

      _this.props.actionGenerated(enums.ACTIONS["TOGGLE_SIDEBAR"]);
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableTypingIndicator", function () {
      _this.context.FeatureRestriction.isTypingIndicatorsEnabled().then(function (response) {
        if (response !== _this.state.enableTypingIndicator) {
          _this.setState({
            enableTypingIndicator: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableTypingIndicator !== false) {
          _this.setState({
            enableTypingIndicator: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableGroupVoiceCall", function () {});
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableGroupVideoCall", function () {
      _this.context.FeatureRestriction.isGroupVideoCallEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableGroupVideoCall) {
          _this.setState({
            enableGroupVideoCall: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableGroupVideoCall !== false) {
          _this.setState({
            enableGroupVideoCall: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableOneOnOneVoiceCall", function () {
      _this.context.FeatureRestriction.isOneOnOneAudioCallEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        var combinedResponse = response && !_this.context.item.blockedByMe;

        if (combinedResponse !== _this.state.enableOneOnOneVoiceCall) {
          _this.setState({
            enableOneOnOneVoiceCall: combinedResponse
          });
        }
      }).catch(function (error) {
        if (_this.state.enableOneOnOneVoiceCall !== false) {
          _this.setState({
            enableOneOnOneVoiceCall: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableOneOnOneVideoCall", function () {
      _this.context.FeatureRestriction.isOneOnOneVideoCallEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        var combinedResponse = response && !_this.context.item.blockedByMe;

        if (combinedResponse !== _this.state.enableOneOnOneVideoCall) {
          _this.setState({
            enableOneOnOneVideoCall: combinedResponse
          });
        }
      }).catch(function (error) {
        if (_this.state.enableOneOnOneVideoCall !== false) {
          _this.setState({
            enableOneOnOneVideoCall: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableUserPresence", function () {
      _this.context.FeatureRestriction.isUserPresenceEnabled().then(function (response) {
        if (response !== _this.state.enableUserPresence) {
          _this.setState({
            enableUserPresence: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableUserPresence !== false) {
          _this.setState({
            enableUserPresence: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableAddGroupMembers", function () {
      _this.context.FeatureRestriction.isAddingGroupMembersEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableAddGroupMembers) {
          _this.setState({
            enableAddGroupMembers: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableAddGroupMembers !== false) {
          _this.setState({
            enableAddGroupMembers: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableChangeScope", function () {
      _this.context.FeatureRestriction.isChangingGroupMemberScopeEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableChangeScope) {
          _this.setState({
            enableChangeScope: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableChangeScope !== false) {
          _this.setState({
            enableChangeScope: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableKickGroupMembers", function () {
      _this.context.FeatureRestriction.isKickingGroupMembersEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableKickGroupMembers) {
          _this.setState({
            enableKickGroupMembers: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableKickGroupMembers !== false) {
          _this.setState({
            enableKickGroupMembers: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableBanGroupMembers", function () {
      _this.context.FeatureRestriction.isBanningGroupMembersEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableBanGroupMembers) {
          _this.setState({
            enableBanGroupMembers: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableBanGroupMembers !== false) {
          _this.setState({
            enableBanGroupMembers: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableDeleteGroup", function () {
      _this.context.FeatureRestriction.isGroupDeletionEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableDeleteGroup) {
          _this.setState({
            enableDeleteGroup: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableDeleteGroup !== false) {
          _this.setState({
            enableDeleteGroup: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableViewGroupMembers", function () {
      _this.context.FeatureRestriction.isViewingGroupMembersEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableViewGroupMembers) {
          _this.setState({
            enableViewGroupMembers: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableViewGroupMembers !== false) {
          _this.setState({
            enableViewGroupMembers: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableLeaveGroup", function () {
      _this.context.FeatureRestriction.isJoinLeaveGroupsEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableLeaveGroup) {
          _this.setState({
            enableLeaveGroup: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableLeaveGroup !== false) {
          _this.setState({
            enableLeaveGroup: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableSharedMedia", function () {
      _this.context.FeatureRestriction.isSharedMediaEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableSharedMedia) {
          _this.setState({
            enableSharedMedia: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableSharedMedia !== false) {
          _this.setState({
            enableSharedMedia: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "enableBlockUser", function () {
      _this.context.FeatureRestriction.isBlockUserEnabled().then(function (response) {
        /**
         * Don't update state if the response has the same value
         */
        if (response !== _this.state.enableBlockUser) {
          _this.setState({
            enableBlockUser: response
          });
        }
      }).catch(function (error) {
        if (_this.state.enableBlockUser !== false) {
          _this.setState({
            enableBlockUser: false
          });
        }
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "initiateAudioCall", function () {
      _this.props.actionGenerated(enums.ACTIONS["INITIATE_AUDIO_CALL"]);
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "initiateVideoCall", function () {
      _this.props.actionGenerated(enums.ACTIONS["INITIATE_VIDEO_CALL"]);
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "viewDetail", function () {
      _this.props.actionGenerated(enums.ACTIONS["VIEW_DETAIL"]);
    });
    _this.state = {
      status: "",
      presence: "offline",
      typing: null,
      enableGroupVoiceCall: false,
      enableGroupVideoCall: false,
      enableOneOnOneVoiceCall: false,
      enableOneOnOneVideoCall: false,
      enableUserPresence: false,
      enableAddGroupMembers: false,
      enableChangeScope: false,
      enableKickGroupMembers: false,
      enableBanGroupMembers: false,
      enableDeleteGroup: false,
      enableViewGroupMembers: false,
      enableLeaveGroup: false,
      enableSharedMedia: false,
      enableBlockUser: false,
      enableTypingIndicator: false
    };
    return _this;
  }

  (0, _createClass2.default)(CometChatMessageHeader, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      _chat.CometChat.getLoggedinUser().then(function (user) {
        return _this2.loggedInUser = user;
      }).catch(function (error) {
        return _this2.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG");
      });

      this.MessageHeaderManager = new _controller.MessageHeaderManager();
      this.MessageHeaderManager.attachListeners(this.updateHeader);

      if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER) {
        this.setStatusForUser();
      } else if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP) {
        this.setStatusForGroup();
      }

      this.item = this.context.item;
      this.enableGroupVoiceCall();
      this.enableGroupVideoCall();
      this.enableOneOnOneVoiceCall();
      this.enableOneOnOneVideoCall();
      this.enableUserPresence();
      this.enableAddGroupMembers();
      this.enableChangeScope();
      this.enableKickGroupMembers();
      this.enableBanGroupMembers();
      this.enableViewGroupMembers();
      this.enableDeleteGroup();
      this.enableLeaveGroup();
      this.enableSharedMedia();
      this.enableBlockUser();
      this.enableTypingIndicator();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER && (this.item !== this.context.item || prevProps.lang !== this.props.lang)) {
        this.setStatusForUser();
      } else if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && (this.item !== this.context.item || prevProps.lang !== this.props.lang)) {
        this.setStatusForGroup();
      }

      this.item = this.context.item;
      this.enableGroupVoiceCall();
      this.enableGroupVideoCall();
      this.enableOneOnOneVoiceCall();
      this.enableOneOnOneVideoCall();
      this.enableUserPresence();
      this.enableAddGroupMembers();
      this.enableChangeScope();
      this.enableKickGroupMembers();
      this.enableBanGroupMembers();
      this.enableViewGroupMembers();
      this.enableDeleteGroup();
      this.enableLeaveGroup();
      this.enableSharedMedia();
      this.enableBlockUser();
      this.enableTypingIndicator();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.MessageHeaderManager.removeListeners();
      this.MessageHeaderManager = null;
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      var avatar, presence;
      var videoCallClassName = "option__videocall-user";
      var audioCallClassName = "option__audiocall-user";
      var viewDetailClassName = "option__viewdetail-user";
      var chatWithClassName = "chat__user";
      var chatNameClassName = "user__name";
      var chatStatusClassName = "user__status";

      if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER) {
        avatar = /*#__PURE__*/_react.default.createElement(_.CometChatAvatar, {
          user: this.context.item
        });
        presence = /*#__PURE__*/_react.default.createElement(_.CometChatStatusIndicator, {
          status: this.state.presence
        });
      } else if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP) {
        chatWithClassName = "chat__group";
        chatNameClassName = "group__name";
        chatStatusClassName = "group__members";
        videoCallClassName = "option__videocall-group";
        audioCallClassName = "option__audiocall-group";
        viewDetailClassName = "option__viewdetail-group";
        avatar = /*#__PURE__*/_react.default.createElement(_.CometChatAvatar, {
          group: this.context.item
        });
      }

      var typing = null;

      if (this.state.typing) {
        typing = /*#__PURE__*/_react.default.createElement("span", {
          css: (0, _style.chatStatusStyle)(this.state, this.context),
          className: chatStatusClassName
        }, this.state.typing);
      }

      var status = /*#__PURE__*/_react.default.createElement("span", {
        css: (0, _style.chatStatusStyle)(this.state, this.context),
        className: chatStatusClassName
      }, this.state.status);

      var audioCallText = (0, _.localize)("AUDIO_CALL", this.props.lang);

      var audioCallBtn = /*#__PURE__*/_react.default.createElement("div", {
        className: audioCallClassName,
        css: (0, _style.chatOptionStyle)(_audioCall.default, this.context, 0),
        title: audioCallText,
        onClick: this.initiateAudioCall
      }, /*#__PURE__*/_react.default.createElement("i", null));

      if (this.context.checkIfCallIsOngoing()) {
        var _audioCallText = (0, _.localize)("YOU_ALREADY_ONGOING_CALL", this.props.lang);

        audioCallBtn = /*#__PURE__*/_react.default.createElement("div", {
          className: audioCallClassName,
          css: (0, _style.chatOptionStyle)(_audioCall.default, this.context, 1),
          title: _audioCallText
        }, /*#__PURE__*/_react.default.createElement("i", null));
      }

      var videoCallText = (0, _.localize)("VIDEO_CALL", this.props.lang);

      var videoCallBtn = /*#__PURE__*/_react.default.createElement("div", {
        className: videoCallClassName,
        css: (0, _style.chatOptionStyle)(_videoCall.default, this.context, 0),
        title: videoCallText,
        onClick: this.initiateVideoCall
      }, /*#__PURE__*/_react.default.createElement("i", null));

      if (this.context.checkIfCallIsOngoing()) {
        var _videoCallText = (0, _.localize)("YOU_ALREADY_ONGOING_CALL", this.props.lang);

        videoCallBtn = /*#__PURE__*/_react.default.createElement("div", {
          className: videoCallClassName,
          css: (0, _style.chatOptionStyle)(_videoCall.default, this.context, 1),
          title: _videoCallText
        }, /*#__PURE__*/_react.default.createElement("i", null));
      }

      var viewDetailText = (0, _.localize)("VIEW_DETAIL", this.props.lang);

      var viewDetailBtn = /*#__PURE__*/_react.default.createElement("div", {
        className: viewDetailClassName,
        css: (0, _style.chatOptionStyle)(_info.default, this.context, 0),
        title: viewDetailText,
        onClick: this.viewDetail
      }, /*#__PURE__*/_react.default.createElement("i", null));
      /**
       * If the chat window open is of users and block user and shared media feature is disabled, hide view detail button
       */


      if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER) {
        if (this.state.enableBlockUser === false && this.state.enableSharedMedia === false) {
          viewDetailBtn = null;
        }
      } else if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP) {
        var _this$context$item, _this$context$item2, _this$context$item3;

        /**
         * If the chat window open is of group
         */
        if (((_this$context$item = this.context.item) === null || _this$context$item === void 0 ? void 0 : _this$context$item.scope) === _chat.CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
          /**
           * If the loggedin user scope is participant, leave group, view group members, and shared media feature is disabled, hide view detail button
           */
          if (this.state.enableLeaveGroup === false && this.state.enableSharedMedia === false && this.state.enableViewGroupMembers === false) {
            viewDetailBtn = null;
          }
        } else if (((_this$context$item2 = this.context.item) === null || _this$context$item2 === void 0 ? void 0 : _this$context$item2.scope) === _chat.CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
          /**
           * If the loggedin user scope is moderator, leave group, view group members, kick & ban group members, changing scope of group members and shared media feature is disabled, hide view detail button
           */
          if (this.state.enableLeaveGroup === false && this.state.enableSharedMedia === false && this.state.enableViewGroupMembers === false && this.state.enableKickGroupMembers === false && this.state.enableBanGroupMembers === false && this.state.enableChangeScope === false) {
            viewDetailBtn = null;
          }
        } else if (((_this$context$item3 = this.context.item) === null || _this$context$item3 === void 0 ? void 0 : _this$context$item3.scope) === _chat.CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
          /**
           * If the loggedin user scope is admin, add group members, view group members, kick & ban group members, changing scope of group members, leave and delete group and shared media feature is disabled, hide view detail button
           */
          if (this.state.enableLeaveGroup === false && this.state.enableSharedMedia === false && this.state.enableViewGroupMembers === false && this.state.enableKickGroupMembers === false && this.state.enableBanGroupMembers === false && this.state.enableChangeScope === false && this.state.enableDeleteGroup === false && this.state.enableAddGroupMembers === false) {
            viewDetailBtn = null;
          }
        }
      } //if audiocall feature is disabled


      if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER && this.state.enableOneOnOneVoiceCall === false || this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && this.state.enableGroupVoiceCall === false) {
        audioCallBtn = null;
      } //if videocall feature is disabled


      if (this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER && this.state.enableOneOnOneVideoCall === false || this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP && this.state.enableGroupVideoCall === false) {
        videoCallBtn = null;
      } //if user presence is disabled in chat widget


      if (this.state.enableUserPresence === false && this.context.type === _chat.CometChat.ACTION_TYPE.TYPE_USER) {
        status = null;
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        css: (0, _style.chatHeaderStyle)(this.context),
        className: "chat__header"
      }, /*#__PURE__*/_react.default.createElement("div", {
        css: (0, _style.chatDetailStyle)(),
        className: "chat__details"
      }, /*#__PURE__*/_react.default.createElement("div", {
        css: (0, _style.chatSideBarBtnStyle)(_menu.default, this.props, this.context),
        className: "chat__sidebar-menu",
        onClick: this.resetChat
      }), /*#__PURE__*/_react.default.createElement("div", {
        css: (0, _style.chatThumbnailStyle)(),
        className: "chat__thumbnail"
      }, avatar, presence), /*#__PURE__*/_react.default.createElement("div", {
        css: (0, _style.chatUserStyle)(this.context),
        className: chatWithClassName
      }, /*#__PURE__*/_react.default.createElement("h6", {
        css: (0, _style.chatNameStyle)(),
        className: chatNameClassName,
        onMouseEnter: function onMouseEnter(event) {
          return _this3.toggleTooltip(event, true);
        },
        onMouseLeave: function onMouseLeave(event) {
          return _this3.toggleTooltip(event, false);
        }
      }, this.context.item.name), typing ? typing : status)), /*#__PURE__*/_react.default.createElement("div", {
        css: (0, _style.chatOptionWrapStyle)(),
        className: "chat__options"
      }, videoCallBtn, audioCallBtn, viewDetailBtn));
    }
  }]);
  return CometChatMessageHeader;
}(_react.default.Component); // Specifies the default values for props:


exports.CometChatMessageHeader = CometChatMessageHeader;
(0, _defineProperty2.default)(CometChatMessageHeader, "contextType", _CometChatContext.CometChatContext);
CometChatMessageHeader.defaultProps = {
  item: {},
  type: ""
};
CometChatMessageHeader.propTypes = {
  item: _propTypes.default.object,
  type: _propTypes.default.string
};