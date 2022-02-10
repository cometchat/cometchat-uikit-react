"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatLiveReactions = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _style = require("./style");

var _heart = _interopRequireDefault(require("./resources/heart.png"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var CometChatLiveReactions = /*#__PURE__*/function (_React$PureComponent) {
  (0, _inherits2.default)(CometChatLiveReactions, _React$PureComponent);

  var _super = _createSuper(CometChatLiveReactions);

  function CometChatLiveReactions(props) {
    var _this;

    (0, _classCallCheck2.default)(this, CometChatLiveReactions);
    _this = _super.call(this, props);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "setItems", function () {
      var width = _this.parentElement.offsetWidth;
      var height = _this.parentElement.offsetHeight;

      var elements = _this.parentElement.querySelectorAll(".emoji");

      var _loop = function _loop(i) {
        var element = elements[i],
            elementWidth = element.offsetWidth,
            elementHeight = element.offsetHeight;
        var item = {
          element: element,
          elementHeight: elementHeight,
          elementWidth: elementWidth,
          ySpeed: -_this.verticalSpeed,
          omega: 2 * Math.PI * _this.horizontalSpeed / (width * 60),
          //omega= 2Pi*frequency
          random: (Math.random() / 2 + 0.5) * i * 10000,
          //random time offset
          x: function x(time) {
            return (Math.sin(this.omega * (time + this.random)) + 1) / 2 * (width - elementWidth);
          },
          y: height + (Math.random() + 1) * i * elementHeight
        };

        _this.items.push(item);
      };

      for (var i = 0; i < elements.length; i++) {
        _loop(i);
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "requestAnimation", function () {
      _this.timer = setTimeout(_this.animate, 1000 / 60);
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "animate", function () {
      if (!_this.parentElement) {
        return false;
      }

      var height = _this.parentElement.offsetHeight;
      var time = +new Date(); //little trick, gives unix time in ms

      for (var i = 0; i < _this.items.length; i++) {
        var item = _this.items[i];
        var transformString = "translate3d(" + item.x(time) + "px, " + item.y + "px, 0px)";
        item.element.style.transform = transformString;
        item.element.style.visibility = "visible";

        if (item.y <= height) {
          item.element.classList.add("fade");
        }

        item.y += item.ySpeed;
      }

      _this.requestAnimation();
    });
    _this.parentElement = /*#__PURE__*/_react.default.createRef();
    _this.counter = 0;
    _this.verticalSpeed = 5;
    _this.horizontalSpeed = 2;
    _this.items = [];
    _this.before = Date.now();

    var reactionImg = /*#__PURE__*/_react.default.createElement("img", {
      src: _heart.default,
      alt: props.reaction
    });

    _this.emojis = Array(6).fill(reactionImg);
    return _this;
  }

  (0, _createClass2.default)(CometChatLiveReactions, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.setItems();
      this.requestAnimation();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.timer = null;
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var emojis = this.emojis.map(function (emoji, index) {
        return /*#__PURE__*/_react.default.createElement("span", {
          className: "emoji",
          style: (0, _style.reactionEmojiStyle)(),
          key: index
        }, emoji);
      });
      return /*#__PURE__*/_react.default.createElement("div", {
        ref: function ref(el) {
          return _this2.parentElement = el;
        },
        style: (0, _style.reactionContainerStyle)()
      }, emojis);
    }
  }]);
  return CometChatLiveReactions;
}(_react.default.PureComponent);

exports.CometChatLiveReactions = CometChatLiveReactions;
CometChatLiveReactions.defaultProps = {
  reaction: "❤️"
};
CometChatLiveReactions.propTypes = {
  reaction: "string"
};