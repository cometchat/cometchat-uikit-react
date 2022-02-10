"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageTemplate = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var CometChatMessageTemplate = /*#__PURE__*/(0, _createClass2.default)(function CometChatMessageTemplate() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  (0, _classCallCheck2.default)(this, CometChatMessageTemplate);
  (0, _defineProperty2.default)(this, "category", "");
  (0, _defineProperty2.default)(this, "type", "");
  (0, _defineProperty2.default)(this, "icon", "");
  (0, _defineProperty2.default)(this, "name", "");
  (0, _defineProperty2.default)(this, "title", "");
  (0, _defineProperty2.default)(this, "description", "");
  (0, _defineProperty2.default)(this, "actionCallback", null);
  (0, _defineProperty2.default)(this, "customView", null);
  (0, _defineProperty2.default)(this, "options", []);

  if ((0, _typeof2.default)(args) !== "object") {
    return false;
  }

  this.category = args[0].category;
  this.type = args[0].type;
  this.icon = args[0].icon;
  this.name = args[0].name;
  this.title = args[0].title;
  this.description = args[0].description;
  this.actionCallback = args[0].actionCallback;
  this.customView = args[0].customView;
  this.options = args[0].options;
});
exports.CometChatMessageTemplate = CometChatMessageTemplate;