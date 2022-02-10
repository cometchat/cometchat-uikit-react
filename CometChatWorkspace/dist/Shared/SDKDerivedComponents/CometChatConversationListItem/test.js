"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _testUtils = require("react-dom/test-utils");

require("jest-canvas-mock");

var _CometChatContext = require("../../../util/CometChatContext");

var _ = require("./");

describe("CometChatConversationListItem", function () {
  var container = null;
  it("renders without crashing", function () {
    container = document.createElement("div");

    _reactDom.default.render( /*#__PURE__*/_react.default.createElement(_CometChatContext.CometChatContextProvider, {
      user: ""
    }, /*#__PURE__*/_react.default.createElement(_.CometChatConversationListItem, null)), container);
  });
});