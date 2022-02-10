"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatLinkPreview = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../../");

var _2 = require("../");

var _style = require("./style");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var CometChatLinkPreview = /*#__PURE__*/function (_React$PureComponent) {
  (0, _inherits2.default)(CometChatLinkPreview, _React$PureComponent);

  var _super = _createSuper(CometChatLinkPreview);

  function CometChatLinkPreview() {
    (0, _classCallCheck2.default)(this, CometChatLinkPreview);
    return _super.apply(this, arguments);
  }

  (0, _createClass2.default)(CometChatLinkPreview, [{
    key: "render",
    value: function render() {
      var linkPreviewData = (0, _2.getExtensionsData)(this.props.message, _2.metadataKey.extensions.linkpreview);
      var linkObject = linkPreviewData["links"][0];
      var pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
      var linkText = linkObject["url"].match(pattern) ? (0, _.localize)("VIEW_ON_YOUTUBE", this.props.lang) : (0, _.localize)("VISIT", this.props.lang);
      return /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messagePreviewContainerStyle)(),
        className: "message__preview"
      }, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messagePreviewWrapperStyle)(),
        className: "preview__card"
      }, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.previewImageStyle)(linkObject["image"]),
        className: "card__image"
      }), /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.previewDataStyle)(),
        className: "card__info"
      }, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.previewTitleStyle)(),
        className: "card__title"
      }, /*#__PURE__*/_react.default.createElement("span", null, linkObject["title"])), /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.previewDescStyle)(),
        className: "card__desc"
      }, /*#__PURE__*/_react.default.createElement("span", null, linkObject["description"])), /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.previewTextStyle)(),
        className: "card__text"
      }, this.props.messageText)), /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.previewLinkStyle)(),
        className: "card__link"
      }, /*#__PURE__*/_react.default.createElement("a", {
        href: linkObject["url"],
        target: "_blank",
        rel: "noopener noreferrer"
      }, linkText))));
    }
  }]);
  return CometChatLinkPreview;
}(_react.default.PureComponent); // Specifies the default values for props:


exports.CometChatLinkPreview = CometChatLinkPreview;
CometChatLinkPreview.defaultProps = {
  language: "en"
};
CometChatLinkPreview.propTypes = {
  language: _propTypes.default.string,
  message: _propTypes.default.object.isRequired
};