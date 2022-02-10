"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatCreatePollOptions = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _style = require("../CometChatCreatePoll/style");

var _translator = _interopRequireDefault(require("../../../../resources/localization/translator"));

var _style2 = require("./style");

var _remove = _interopRequireDefault(require("./resources/remove.svg"));

var CometChatCreatePollOptions = function CometChatCreatePollOptions(props) {
  //const context = useContext(CometChatContext);
  return /*#__PURE__*/_react.default.createElement("tr", {
    className: "poll__options"
  }, /*#__PURE__*/_react.default.createElement("td", null, "\xA0"), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("input", {
    autoFocus: true,
    tabIndex: props.tabIndex,
    type: "text",
    autoComplete: "off",
    placeholder: _translator.default.translate("ENTER_YOUR_OPTION", props.lang),
    value: props.value,
    onChange: function onChange(event) {
      return props.optionChangeHandler(event, props.option);
    }
  })), /*#__PURE__*/_react.default.createElement("td", {
    style: (0, _style.iconWrapperStyle)(),
    className: "option__remove"
  }, /*#__PURE__*/_react.default.createElement("span", {
    style: (0, _style2.removeOptionIconStyle)(_remove.default),
    onClick: function onClick() {
      return props.removePollOption(props.option);
    }
  })));
}; // Specifies the default values for props:


exports.CometChatCreatePollOptions = CometChatCreatePollOptions;
CometChatCreatePollOptions.defaultProps = {
  lang: _translator.default.getDefaultLanguage()
};
CometChatCreatePollOptions.propTypes = {
  lang: _propTypes.default.string
};