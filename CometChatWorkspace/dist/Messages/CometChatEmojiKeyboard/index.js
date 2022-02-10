"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatEmojiKeyboard = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _emojiMart = require("emoji-mart");

var _ = require("../../");

var _style = require("./style");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var CometChatEmojiKeyboard = /*#__PURE__*/function (_React$Component) {
  (0, _inherits2.default)(CometChatEmojiKeyboard, _React$Component);

  var _super = _createSuper(CometChatEmojiKeyboard);

  function CometChatEmojiKeyboard(props) {
    var _this;

    (0, _classCallCheck2.default)(this, CometChatEmojiKeyboard);
    _this = _super.call(this, props);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "categories", {});
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "title", "");
    var categories = {
      people: (0, _.localize)("SMILEY_PEOPLE"),
      nature: (0, _.localize)("ANIMALES_NATURE"),
      foods: (0, _.localize)("FOOD_DRINK"),
      activity: (0, _.localize)("ACTIVITY"),
      places: (0, _.localize)("TRAVEL_PLACES"),
      objects: (0, _.localize)("OBJECTS"),
      symbols: (0, _.localize)("SYMBOLS"),
      flags: (0, _.localize)("FLAGS")
    };
    var title = (0, _.localize)("PICK_YOUR_EMOJI");
    _this.state = {
      categories: categories,
      title: title
    };
    return _this;
  }

  (0, _createClass2.default)(CometChatEmojiKeyboard, [{
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (prevProps.lang !== this.props.lang) {
        var categories = {
          search: (0, _.localize)("SEARCH"),
          people: (0, _.localize)("SMILEY_PEOPLE"),
          nature: (0, _.localize)("ANIMALES_NATURE"),
          foods: (0, _.localize)("FOOD_DRINK"),
          activity: (0, _.localize)("ACTIVITY"),
          places: (0, _.localize)("TRAVEL_PLACES"),
          objects: (0, _.localize)("OBJECTS"),
          symbols: (0, _.localize)("SYMBOLS"),
          flags: (0, _.localize)("FLAGS")
        };
        var title = (0, _.localize)("PICK_YOUR_EMOJI");
        this.setState({
          categories: _objectSpread({}, categories),
          title: title
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var exclude = ["search", "recent"];
      return /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.pickerStyle)()
      }, /*#__PURE__*/_react.default.createElement(_emojiMart.Picker, {
        title: this.state.title,
        emoji: "point_up",
        native: true,
        onClick: this.props.emojiClicked,
        showPreview: false,
        exclude: exclude,
        i18n: {
          categories: this.state.categories
        },
        style: {
          bottom: "100px",
          "zIndex": "2",
          "width": "100%",
          height: "230px"
        }
      }));
    }
  }]);
  return CometChatEmojiKeyboard;
}(_react.default.Component); // Specifies the default values for props:


exports.CometChatEmojiKeyboard = CometChatEmojiKeyboard;
CometChatEmojiKeyboard.defaultProps = {};
CometChatEmojiKeyboard.propTypes = {};