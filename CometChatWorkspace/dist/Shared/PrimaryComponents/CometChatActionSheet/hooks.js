"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _react = _interopRequireDefault(require("react"));

var Hooks = function Hooks(props, setActionList) {
  _react.default.useEffect(function () {
    if (props.actions.length) {
      setActionList.apply(void 0, (0, _toConsumableArray2.default)(props.actions));
    }
  }, []);
};

exports.Hooks = Hooks;