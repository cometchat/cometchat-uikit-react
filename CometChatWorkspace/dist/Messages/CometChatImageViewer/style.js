"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.imgStyle = exports.imageWrapperStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _ = require("../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var imageWrapperStyle = function imageWrapperStyle(closeIcon, img) {
  var heightProps = img ? {
    height: "auto"
  } : {
    height: "100%"
  };
  var mq = (0, _toConsumableArray2.default)(_.BREAKPOINTS);
  return _objectSpread(_objectSpread({
    position: "absolute",
    top: "0",
    left: "0",
    bottom: "0",
    right: "0",
    width: "100%",
    padding: "1.8% 2.3%",
    zIndex: "9999",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "url(".concat(closeIcon, ") no-repeat 99% 0.8% #fff"),
    cursor: "pointer"
  }, heightProps), {}, (0, _defineProperty2.default)({}, "@media ".concat(mq[1], ", ").concat(mq[2]), {
    height: "100%"
  }));
};

exports.imageWrapperStyle = imageWrapperStyle;

var imgStyle = function imgStyle(image) {
  var sizeProps = !image ? {
    width: "24px",
    height: "24px"
  } : {
    maxHeight: "100%"
  };
  return _objectSpread({
    objectFit: "contain"
  }, sizeProps);
};

exports.imgStyle = imgStyle;