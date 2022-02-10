"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatListBase = void 0;

var React = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../");

var _style = require("./style");

var _search = _interopRequireDefault(require("./resources/search.svg"));

var _back = _interopRequireDefault(require("./resources/back.svg"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * 
 * CometChatListBase is a component useful when presenting a list of items.
 * This component displays list of items, title, and supports style along with back button, and search and filtering of list items.
 * 
 * @version 1.0.0
 * @author CometChat
 * 
 */
var CometChatListBase = function CometChatListBase(props) {
  var getBackButtonElem = function getBackButtonElem() {
    if (props.showBackButton) {
      return /*#__PURE__*/React.createElement("div", {
        style: (0, _style.backButtonStyle)(props)
      });
    }

    return null;
  };

  var onSearch = function onSearch() {};

  var getSearchElem = function getSearchElem() {
    if (!props.hideSearch) {
      return /*#__PURE__*/React.createElement("div", {
        style: (0, _style.listBaseSearchStyle)(props),
        className: "listbase__search"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "listbase__search__button",
        style: (0, _style.listBaseSearchButtonStyle)(_search.default, props)
      }), /*#__PURE__*/React.createElement("input", {
        type: "text",
        autoComplete: "off",
        style: (0, _style.listBaseSearchInputStyle)(props),
        className: "listbase__search__input",
        placeholder: props.searchPlaceholder,
        dir: _.CometChatLocalize.getDir(),
        onChange: onSearch
      }));
    }

    return null;
  };

  return /*#__PURE__*/React.createElement("div", {
    style: (0, _style.listBaseStyle)(props),
    className: "cometchat__listbase",
    dir: _.CometChatLocalize.getDir()
  }, /*#__PURE__*/React.createElement("div", {
    style: (0, _style.listBaseHeadStyle)(props),
    className: "listbase__header"
  }, /*#__PURE__*/React.createElement("div", {
    style: (0, _style.listBaseNavStyle)(props),
    className: "listbase__nav"
  }, getBackButtonElem(), /*#__PURE__*/React.createElement("div", {
    style: (0, _style.listBaseTitleStyle)(props),
    className: "listbase__title"
  }, props.title)), getSearchElem()), /*#__PURE__*/React.createElement("div", {
    style: (0, _style.listBaseContainerStyle)(props),
    className: "listbase__container"
  }, props.children));
};

exports.CometChatListBase = CometChatListBase;
CometChatListBase.propTypes = {
  /**  Width of the component  */
  width: _propTypes.default.string,

  /**  Height of the component  */
  height: _propTypes.default.string,

  /** Background of the component, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
  background: _propTypes.default.string,

  /** This property sets the component's border. It sets the values of border-width, border-style, and border-color. */
  border: _propTypes.default.string,

  /** This property rounds the corners of an component's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
  cornerRadius: _propTypes.default.string,

  /** Title of the list */
  title: _propTypes.default.string,

  /** This property sets all the different properties of the component's font */
  titleFont: _propTypes.default.string,

  /** This property sets the foreground color value of the component's title text  */
  titleColor: _propTypes.default.string,

  /** Enable search */
  hideSearch: _propTypes.default.bool,

  /** This property sets the border of the search element. It sets the values of border-width, border-style, and border-color. */
  searchBorder: _propTypes.default.string,

  /** This property sets the background color of the search element  */
  searchBackground: _propTypes.default.string,

  /** This property rounds the corners of the search element's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
  searchCornerRadius: _propTypes.default.string,

  /** This property sets the placeholder text of the search element. The placeholder is text shown when the input is empty  */
  searchPlaceholder: _propTypes.default.string,

  /** This property sets all the different properties of the search element's font */
  searchTextFont: _propTypes.default.string,

  /** This property sets the foreground color value of the search text  */
  searchTextColor: _propTypes.default.string,

  /** Enable back button */
  showBackButton: _propTypes.default.bool,

  /** URL for the back button icon */
  backIcon: _propTypes.default.string,

  /** Color of the back button icon */
  backIconTint: _propTypes.default.string,

  /** Callback function when a search text is entered */
  onSearch: _propTypes.default.func
};
CometChatListBase.defaultProps = {
  width: "100%",
  height: "100%",
  background: "white",
  border: "1px solid #808080",
  cornerRadius: "0",
  title: "Title",
  titleFont: "700 22px Inter, sans-serif",
  titleColor: "#141414",
  hideSearch: false,
  searchBackground: "rgba(#141414, 40%)",
  searchBorder: "none",
  searchCornerRadius: "8px",
  searchPlaceholder: "Search",
  searchTextFont: "400 15px Inter, sans-serif",
  searchTextColor: "#141414",
  showBackButton: false,
  backIcon: _back.default,
  backIconTint: "#3399FF",
  onSearch: function onSearch() {}
};