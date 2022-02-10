"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatStickerKeyboard = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../../..");

var _style = require("./style");

var _close = _interopRequireDefault(require("./resources/close.svg"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var CometChatStickerKeyboard = /*#__PURE__*/function (_React$PureComponent) {
  (0, _inherits2.default)(CometChatStickerKeyboard, _React$PureComponent);

  var _super = _createSuper(CometChatStickerKeyboard);

  function CometChatStickerKeyboard(props) {
    var _this;

    (0, _classCallCheck2.default)(this, CometChatStickerKeyboard);
    _this = _super.call(this, props);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "getStickers", function () {
      _chat.CometChat.callExtension('stickers', 'GET', 'v1/fetch', null).then(function (stickers) {
        // Stickers received
        var activeStickerSet = null;
        var customStickers = stickers.hasOwnProperty("customStickers") ? stickers["customStickers"] : [];
        var defaultStickers = stickers.hasOwnProperty("defaultStickers") ? stickers["defaultStickers"] : [];
        defaultStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });
        customStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });
        var stickerList = [].concat((0, _toConsumableArray2.default)(defaultStickers), (0, _toConsumableArray2.default)(customStickers));

        if (stickerList.length === 0) {
          _this.decoratorMessage = (0, _.localize)("NO_STICKERS_FOUND");
        }

        var stickerSet = stickerList.reduce(function (r, sticker, index) {
          var stickerSetName = sticker.stickerSetName;

          if (index === 0) {
            activeStickerSet = stickerSetName;
          }

          r[stickerSetName] = [].concat((0, _toConsumableArray2.default)(r[stickerSetName] || []), [_objectSpread({}, sticker)]);
          return r;
        }, {});
        var activeStickerList = [];

        if (Object.keys(stickerSet).length) {
          Object.keys(stickerSet).forEach(function (key) {
            stickerSet[key].sort(function (a, b) {
              return a.stickerOrder - b.stickerOrder;
            });
          });
          activeStickerList = stickerSet[activeStickerSet];
        }

        _this.setState({
          "stickerlist": stickerList,
          "stickerset": stickerSet,
          "activestickerlist": activeStickerList,
          "activestickerset": activeStickerSet
        });
      }).catch(function (error) {
        _this.decoratorMessage = (0, _.localize)("SOMETHING_WRONG");

        _this.setState({
          "activestickerlist": [],
          "stickerset": {}
        });
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "sendStickerMessage", function (stickerItem) {
      _this.props.onClick(stickerItem); //this.props.actionGenerated(enums.ACTIONS["SEND_STICKER"], stickerItem);

    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "onStickerSetClicked", function (sectionItem) {
      _this.setState({
        activestickerlist: []
      }, function () {
        var stickerSet = _objectSpread({}, _this.state.stickerset);

        var activeStickerList = stickerSet[sectionItem];

        _this.setState({
          "activestickerset": sectionItem,
          "activestickerlist": activeStickerList
        });
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "closeStickerKeyboard", function () {
      _this.props.onClose(); //this.props.actionGenerated(enums.ACTIONS["CLOSE_STICKER_KEYBOARD"]);

    });
    _this.decoratorMessage = (0, _.localize)("LOADING");
    _this.state = {
      stickerlist: [],
      stickerset: {},
      activestickerlist: [],
      activestickerset: null
    };
    return _this;
  }

  (0, _createClass2.default)(CometChatStickerKeyboard, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.getStickers();
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var messageContainer = null;

      if (this.state.activestickerlist.length === 0) {
        messageContainer = /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.stickerMsgStyle)(),
          className: "stickers__decorator-message"
        }, /*#__PURE__*/_react.default.createElement("p", {
          style: (0, _style.stickerMsgTxtStyle)(),
          className: "decorator-message"
        }, this.decoratorMessage));
      }

      var stickers = null;

      if (Object.keys(this.state.stickerset).length) {
        var sectionItems = Object.keys(this.state.stickerset).map(function (sectionItem, key) {
          var stickerSetThumbnail = _this2.state.stickerset[sectionItem][0]["stickerUrl"];
          return /*#__PURE__*/_react.default.createElement("div", {
            key: key,
            className: "stickers__sectionitem",
            style: (0, _style.sectionListItemStyle)(),
            onClick: function onClick() {
              return _this2.onStickerSetClicked(sectionItem);
            }
          }, /*#__PURE__*/_react.default.createElement("img", {
            src: stickerSetThumbnail,
            alt: sectionItem
          }));
        });
        var activeStickerList = [];

        if (this.state.activestickerlist.length) {
          var stickerList = (0, _toConsumableArray2.default)(this.state.activestickerlist);
          activeStickerList = stickerList.map(function (stickerItem, key) {
            return /*#__PURE__*/_react.default.createElement("div", {
              key: key,
              style: (0, _style.stickerItemStyle)(_this2.context),
              onClick: function onClick() {
                return _this2.sendStickerMessage(stickerItem);
              },
              className: "stickers__listitem"
            }, /*#__PURE__*/_react.default.createElement("img", {
              src: stickerItem.stickerUrl,
              alt: stickerItem.stickerName
            }));
          });
        }

        stickers = /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.stickerCloseStyle)(_close.default),
          className: "stickers__close",
          onClick: this.closeStickerKeyboard
        }), /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.stickerListStyle)(this.props),
          className: "stickers__list"
        }, activeStickerList), /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.stickerSectionListStyle)(this.context),
          className: "stickers__sections"
        }, sectionItems));
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.stickerWrapperStyle)(this.context),
        className: "stickers"
      }, messageContainer, stickers);
    }
  }]);
  return CometChatStickerKeyboard;
}(_react.default.PureComponent); // Specifies the default values for props:


exports.CometChatStickerKeyboard = CometChatStickerKeyboard;
CometChatStickerKeyboard.defaultProps = {};
CometChatStickerKeyboard.propTypes = {};